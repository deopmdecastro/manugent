import 'dotenv/config'

import { existsSync, readFileSync, writeFileSync, mkdirSync, createReadStream, statSync, unlinkSync } from 'node:fs'
import { join, resolve, extname, basename } from 'node:path'
import { randomUUID, randomBytes } from 'node:crypto'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { fuzzySearch, disambiguate, processWithCorrections, buildNLPContextPrefix } from './lib/fuzzy-search.js'
import { createPgClient } from './lib/pg-adapter.js'

// ── Configuration ───────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET must be set via environment variable in production.')
  process.exit(1)
}

const JWT_SECRET = process.env.JWT_SECRET || 'manugent-dev-secret-change-me-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

const port = Number(process.env.PORT ?? 3000)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const openaiApiKey = process.env.OPENAI_API_KEY || ''
const groqApiKey = process.env.GROQ_API_KEY || ''
const aiProvider = (process.env.AI_PROVIDER || 'groq').toLowerCase()
const aiModel = process.env.AI_MODEL || (aiProvider === 'openai' ? 'gpt-4o-mini' : 'llama3-8b-8192')

// ── Database ─────────────────────────────────────────────────────────────────
// Priority: Supabase (cloud) → pg direct (Docker / DATABASE_URL)

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : undefined

const pgClient = !supabase ? createPgClient(process.env.DATABASE_URL) : undefined

// Unified DB accessor — returns Supabase client or pg-adapter (same interface)
type DbClient = NonNullable<typeof supabase> | NonNullable<typeof pgClient>

// ── Upload directory ──────────────────────────────────────────────────────────

const uploadsDir = resolve(process.cwd(), 'uploads')
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const allowedMimeTypes = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav',
])

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

// ── App Setup ─────────────────────────────────────────────────────────────────

const app = new Hono()
const publicDir = resolve(process.cwd(), 'public')

app.use('*', logger())

app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  }
})

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.use('/app/*', serveStatic({ root: './public' }))
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/react/*', serveStatic({ root: './public' }))

function serveHtmlShell(c: Context, relativePath: string) {
  const filePath = join(publicDir, relativePath)
  if (!existsSync(filePath)) {
    return c.text(`Missing static shell: ${relativePath}`, 503)
  }
  return c.html(readFileSync(filePath, 'utf8'))
}

const serveReactShell = (c: Context) => serveHtmlShell(c, 'react/index.html')
const serveLegacyShell = (c: Context) => serveHtmlShell(c, 'app/index.html')

app.get('/react', (c) => c.redirect('/landing'))
app.get('/app', (c) => c.redirect('/app/'))
app.get('/app/login', (c) => c.redirect('/login'))
app.get('/app/landing', (c) => c.redirect('/landing'))

// Favicon (evita 404 no browser; usa o ícone já existente do produto)
app.get('/favicon.ico', serveStatic({ path: './public/app/assets/icon_manugent.png' }))

// ── Domain Constants ──────────────────────────────────────────────────────────

const workOrderTypes = ['preventive', 'inspection', 'round', 'checklist', 'corrective', 'breakdown', 'emergency', 'customer_request']
const scheduledTypes = ['preventive', 'inspection', 'round', 'checklist']
const workOrderStatuses = ['open', 'scheduled', 'in_progress', 'paused', 'waiting_material', 'waiting_customer', 'completed', 'cancelled']
const triggeringFindingTypes = ['nok', 'defect', 'measurement_out_of_limits', 'failure']

// ── SuperAdmin API ─────────────────────────────────────────────────────────

const superadminDataDir = resolve(process.cwd(), 'data', 'superadmin')

app.get('/api/admin/:section', (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)

  const section = c.req.param('section')
  const path = join(superadminDataDir, section + '.json')
  if (!existsSync(path)) return c.json({ error: 'Section not found' }, 404)
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'))
    return c.json(data)
  } catch {
    return c.json({ error: 'Invalid data' }, 500)
  }
})

app.put('/api/admin/:section', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)

  const section = c.req.param('section')
  const path = join(superadminDataDir, section + '.json')
  try {
    const body = await c.req.json()
    writeFileSync(path, JSON.stringify(body, null, 2), 'utf-8')
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Invalid data' }, 400)
  }
})

app.delete('/api/admin/:section/:itemId', (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)

  const section = c.req.param('section')
  const itemId = c.req.param('itemId')
  const path = join(superadminDataDir, section + '.json')
  if (!existsSync(path)) return c.json({ error: 'Section not found' }, 404)

  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'))
    let removed = false

    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        data[key] = data[key].filter((item: unknown) => {
          const isMatch = !!item && typeof item === 'object' &&
            ((item as Record<string, unknown>).id === itemId || (item as Record<string, unknown>).slug === itemId)
          if (isMatch) removed = true
          return !isMatch
        })
      }
    }

    if (!removed) return c.json({ error: 'Item não encontrado.' }, 404)

    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'Não foi possível remover o item.' }, 500)
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

class DatabaseNotConfiguredError extends Error {
  constructor() { super('Base de dados não configurada. Defina SUPABASE_URL+SUPABASE_ANON_KEY (Supabase) ou DATABASE_URL (Docker/PostgreSQL local) no .env') }
}

function requireDb(): DbClient {
  if (supabase) return supabase
  if (pgClient) return pgClient
  throw new DatabaseNotConfiguredError()
}

function jsonError(c: Context, message: string, status = 400) {
  return c.json({ error: message }, status as 400)
}

function assertOption(value: unknown, options: string[], field: string) {
  if (typeof value !== 'string' || !options.includes(value)) {
    throw new Error(`${field} must be one of: ${options.join(', ')}`)
  }
  return value
}

function originForType(type: string) {
  return scheduledTypes.includes(type) ? 'scheduled' : 'request'
}

function mapWorkOrder(row: Record<string, unknown>) {
  return {
    id: row.id,
    parentWorkOrderId: row.parent_work_order_id,
    clientId: row.client_id,
    equipmentId: row.equipment_id,
    buildingId: row.building_id,
    teamId: row.team_id,
    supervisorId: row.supervisor_id,
    type: row.type,
    origin: row.origin,
    status: row.status,
    priority: row.priority,
    title: row.title,
    description: row.description,
    scheduledFor: row.scheduled_for,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    clientName: row.client_name,
    equipmentName: row.equipment_name,
    buildingName: row.building_name,
    teamName: row.team_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function escapePdfText(value: unknown) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ')
}

function buildSimplePdf(lines: string[]) {
  const content = [
    'BT',
    '/F1 12 Tf',
    '50 790 Td',
    ...lines.flatMap((line, index) => {
      const escaped = escapePdfText(line).slice(0, 95)
      return index === 0 ? [`(${escaped}) Tj`] : ['0 -18 Td', `(${escaped}) Tj`]
    }),
    'ET',
  ].join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`,
  ]

  let body = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(body))
    body += object
  }

  const xrefOffset = Buffer.byteLength(body)
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  body += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(body)
}

// ── AI Integration ────────────────────────────────────────────────────────────

const MANUGENT_SYSTEM_PROMPT = `Você é ManuGent, um agente inteligente especializado em manutenção industrial.
Você é o assistente técnico sénior digital da plataforma ManuGent — um CMMS (Computerized Maintenance Management System).

ESPECIALIDADES:
- Diagnóstico e resolução de falhas em equipamentos industriais
- Planejamento e otimização de manutenção preventiva e preditiva
- Criação e gestão de Ordens de Trabalho (OTs)
- Análise de indicadores de manutenção (MTBF, MTTR, OEE, disponibilidade)
- Procedimentos técnicos: AVAC, elétrica, automação, mecânica, instrumentação
- Gestão de stock de materiais e peças de reposição
- Análise de root cause e FMEA
- Conformidade com normas (ISO 55000, EN 13306, OSHA)

COMPORTAMENTO GERAL:
- Responda sempre em português europeu (pt-PT)
- Seja preciso, técnico e objetivo
- Quando identificar um problema crítico, destaque-o claramente
- Se o contexto incluir dados de OTs, equipamentos ou clientes, use-os para enriquecer a resposta
- Sugira ações concretas e mensuráveis
- Mantenha o histórico da conversa como memória de contexto

FORMATO:
- Use markdown quando apropriado (listas, negrito, headers)
- Para procedimentos técnicos, use numeração passo a passo
- Mantenha respostas concisas mas completas (máx. 500 palavras por resposta por defeito)
- Prefira frases curtas e diretas
`

const MANUGENT_PUBLIC_SUPPORT_PROMPT = `Você é o Assistente ManuGent, um agente de apoio ao cliente que responde no site público (landing page) da ManuGent.

QUEM É A MANUGENT:
ManuGent é uma plataforma CMMS (Computerized Maintenance Management System) com um agente de IA integrado, que ajuda equipas de manutenção industrial a gerir Ordens de Trabalho (OTs), equipamentos, manutenção preventiva/preditiva, stock de materiais, checklists, orçamentos, relatórios e indicadores (MTBF, MTTR, OEE).

O SEU ÂMBITO (MUITO IMPORTANTE):
- Você fala apenas com visitantes do site público, que ainda não têm sessão iniciada nem acesso à aplicação.
- Responda apenas a perguntas sobre o que é a ManuGent, as suas funcionalidades, planos/preços em termos gerais, como começar a experimentar, requisitos, segurança/privacidade dos dados a alto nível, e como contactar a equipa.
- NUNCA finja ter acesso a dados de conta, OTs, equipamentos, clientes, faturas ou qualquer informação interna.

COMPORTAMENTO:
- Responda sempre em português europeu (pt-PT), exceto se o visitante escrever claramente em inglês.
- Seja simpático, claro e direto. Respostas curtas (idealmente até ~120 palavras).
- Se não souber responder com confiança, diga isso com honestidade e sugira o contacto humano.
`

const MANUGENT_PUBLIC_AI_DEMO_PROMPT = `Você é o agente técnico sénior digital da ManuGent, numa demonstração PÚBLICA na página /ia do site (visitante sem conta nem sessão iniciada).

OBJETIVO DESTA CONVERSA:
Mostrar, a sério, a qualidade do raciocínio técnico do agente — o mesmo que os clientes usam depois de entrarem na plataforma — para convencer um visitante a criar conta.

ESPECIALIDADES A DEMONSTRAR:
- Diagnóstico de avarias em equipamentos industriais (AVAC, elétrica, mecânica, refrigeração, hidráulica, elevadores)
- Planeamento de manutenção preventiva/preditiva (periodicidades, checklists típicos)
- Indicadores de manutenção: MTBF, MTTR, OEE, disponibilidade — explicar e ajudar a calcular
- Normas e boas práticas: ISO 55000, EN 13306, segurança no trabalho

LIMITES (MUITO IMPORTANTE):
- Isto é uma demonstração pública, sem sessão iniciada. NUNCA finja ter acesso a dados reais de conta, OTs, equipamentos, clientes, stock ou histórico de nenhuma empresa.
- Responde a perguntas técnicas genéricas com o mesmo rigor que usarias dentro da plataforma, mas deixa claro quando uma resposta precisaria de dados reais do equipamento (ex: manual do fabricante, histórico de sensores) para ser definitiva.
- Não inventes números específicos de KPIs de uma empresa; explica antes como se calculam e o que significam.
- Se o visitante pedir para gerir a conta, criar uma OT real ou aceder a dados, explica que isso só é possível depois de criar conta, e sugere-o.

COMPORTAMENTO:
- Responde sempre em português europeu (pt-PT), exceto se o visitante escrever claramente em inglês.
- Sê tecnicamente preciso, mas conversacional — está a ser avaliado por um potencial cliente.
- Estrutura diagnósticos como uma lista curta de hipóteses, da mais para a menos provável.
- Respostas concisas: idealmente até ~180 palavras, usando markdown quando ajuda (listas, negrito).
`

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

class AIProviderError extends Error {
  provider: string
  status: number
  code: string
  userMessage: string

  constructor(provider: string, status: number, code: string, userMessage: string, technicalMessage?: string) {
    super(technicalMessage || userMessage)
    this.name = 'AIProviderError'
    this.provider = provider
    this.status = status
    this.code = code
    this.userMessage = userMessage
  }
}

function classifyAIProviderError(provider: string, status: number, error: Record<string, unknown>, fallback: string): AIProviderError {
  const payload = (error?.error || {}) as Record<string, unknown>
  const message = String(payload.message || fallback)
  const providerCode = String(payload.code || payload.type || '').toLowerCase()
  const normalized = `${message} ${providerCode}`.toLowerCase()
  const providerName = provider === 'openai' ? 'OpenAI' : 'Groq'

  if (normalized.includes('quota') || normalized.includes('insufficient_quota') || status === 402 || status === 429) {
    return new AIProviderError(provider, status, 'provider_quota', `A quota da ${providerName} está esgotada ou indisponível. O Assistente IA ManuGent continua em modo local.`, message)
  }

  if (status === 401 || status === 403 || normalized.includes('invalid_api_key') || normalized.includes('unauthorized')) {
    return new AIProviderError(provider, status, 'provider_auth', `A chave da ${providerName} não foi aceite. Confirme a chave nas configurações do servidor.`, message)
  }

  return new AIProviderError(provider, status, 'provider_unavailable', `A API da ${providerName} não respondeu corretamente. O Assistente IA ManuGent continua em modo local.`, message)
}

async function callOpenAI(messages: AIMessage[], model: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as Record<string, unknown>
    throw classifyAIProviderError('openai', response.status, error, `OpenAI error ${response.status}`)
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content || ''
}

async function callGroq(messages: AIMessage[], model: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as Record<string, unknown>
    throw classifyAIProviderError('groq', response.status, error, `Groq error ${response.status}`)
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content || ''
}

async function callAI(messages: AIMessage[]): Promise<{ text: string; provider: string; model: string }> {
  const effectiveProvider = aiProvider

  if (effectiveProvider === 'openai' && openaiApiKey) {
    const text = await callOpenAI(messages, aiModel, openaiApiKey)
    return { text, provider: 'openai', model: aiModel }
  }

  if (effectiveProvider === 'groq' && groqApiKey) {
    const text = await callGroq(messages, aiModel, groqApiKey)
    return { text, provider: 'groq', model: aiModel }
  }

  if (groqApiKey) {
    const text = await callGroq(messages, 'llama3-8b-8192', groqApiKey)
    return { text, provider: 'groq', model: 'llama3-8b-8192' }
  }

  if (openaiApiKey) {
    const text = await callOpenAI(messages, 'gpt-4o-mini', openaiApiKey)
    return { text, provider: 'openai', model: 'gpt-4o-mini' }
  }

  throw new Error('Nenhum provedor de IA configurado. Configure OPENAI_API_KEY ou GROQ_API_KEY no ficheiro .env')
}

function buildContextMessage(context: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) return ''

  const lines: string[] = ['[CONTEXTO DO SISTEMA]']

  if (context.currentPage) lines.push(`Página atual: ${context.currentPage}`)
  if (context.userRole) lines.push(`Perfil do utilizador: ${context.userRole}`)

  if (context.stats && typeof context.stats === 'object') {
    const stats = context.stats as Record<string, unknown>
    lines.push('\nEstatísticas atuais:')
    if (stats.openOTs !== undefined) lines.push(`- OTs abertas: ${stats.openOTs}`)
    if (stats.inProgressOTs !== undefined) lines.push(`- OTs em progresso: ${stats.inProgressOTs}`)
    if (stats.urgentOTs !== undefined) lines.push(`- OTs urgentes: ${stats.urgentOTs}`)
    if (stats.equipment !== undefined) lines.push(`- Equipamentos: ${stats.equipment}`)
    if (stats.lowStock !== undefined) lines.push(`- Materiais em stock baixo: ${stats.lowStock}`)
  }

  if (context.currentEquipment && typeof context.currentEquipment === 'object') {
    const eq = context.currentEquipment as Record<string, unknown>
    lines.push(`\nEquipamento em contexto: ${eq.name} (${eq.code || 'sem código'}) — ${eq.status || 'estado desconhecido'} — Local: ${eq.location || 'sem local'}`)
    if (eq.brand) lines.push(`  Marca: ${eq.brand} | Modelo: ${eq.model || '—'}`)
  }

  if (context.currentOT && typeof context.currentOT === 'object') {
    const ot = context.currentOT as Record<string, unknown>
    lines.push(`\nOT em contexto: [${ot.id}] ${ot.title} — Tipo: ${ot.type} — Estado: ${ot.status} — Prioridade: ${ot.priority}`)
    if (ot.description) lines.push(`  Descrição: ${ot.description}`)
    if (ot.equipmentName) lines.push(`  Equipamento: ${ot.equipmentName}`)
    if (ot.clientName) lines.push(`  Cliente: ${ot.clientName}`)
  }

  if (Array.isArray(context.recentOTs) && context.recentOTs.length > 0) {
    lines.push('\nOTs recentes:')
    ;(context.recentOTs as Array<Record<string, unknown>>).slice(0, 5).forEach((ot) => {
      lines.push(`  - [${ot.id}] ${ot.title} | ${ot.type} | ${ot.status} | ${ot.priority}`)
    })
  }

  lines.push('\nDICA: Use GET /api/fuzzy/:entity?q=QUERY para pesquisar equipamentos, tecnicos, clientes ou OTs com tolerancia a erros ortograficos.')
  return lines.join('\n')
}

// ── Routes: Health ────────────────────────────────────────────────────────────

const SERVER_START_TIME = Date.now()

app.get('/api/health', (c) => {
  const hasAI = Boolean(openaiApiKey || groqApiKey)
  return c.json({
    ok: true,
    service: 'manugent-api',
    version: '2.2.0',
    uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ai: { enabled: hasAI, provider: hasAI ? aiProvider : 'none', model: hasAI ? aiModel : null },
    database: Boolean(supabase || pgClient),
  })
})

app.get('/api/db/health', async (c) => {
  const start = Date.now()
  try {
    const db = requireDb()
    let tableCount = '—'
    const knownTables = ['users','work_orders','equipment','clients','teams','notifications','quotes','time_entries','intervention_reports','ai_conversations','attachments']
    let found = 0
    for (const t of knownTables) {
      try { const r = await db.from(t as string).select('id').limit(1); if (!r.error) found++ } catch { /* skip */ }
    }
    if (found > 0) tableCount = String(found) + ' (verificadas)'
    const latencyMs = Date.now() - start
    return c.json({ ok: true, connected: true, tables: tableCount, schema: 'public', latencyMs })
  } catch (error) {
    return c.json({ ok: false, connected: false, error: error instanceof Error ? error.message : 'Database connection failed', latencyMs: Date.now() - start }, 500)
  }
})

// ── Routes: Auth ─────────────────────────────────────────────────────────────

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_ATTEMPTS = 8
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function getClientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('x-real-ip')
    || 'unknown'
}

function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const entry = loginAttempts.get(key)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of loginAttempts) {
    if (now > entry.resetAt) loginAttempts.delete(key)
  }
}, LOGIN_WINDOW_MS)

app.post('/api/auth/login', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json().catch(() => ({})) as { email?: string; password?: string }
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    if (!email || !password) {
      return c.json({ error: 'Email e password são obrigatórios.' }, 400)
    }

    const rateLimitKey = `${getClientIp(c)}:${email}`
    const rateLimit = checkLoginRateLimit(rateLimitKey)
    if (!rateLimit.allowed) {
      c.header('Retry-After', String(rateLimit.retryAfterSeconds))
      return c.json({ error: 'Demasiadas tentativas. Tente novamente mais tarde.' }, 429)
    }

    const { data: user, error } = await db.rpc('verify_user_password', {
      p_email: email,
      p_password: password,
    })

    if (error || !user || (Array.isArray(user) && user.length === 0)) {
      return c.json({ error: 'Credenciais inválidas.' }, 401)
    }

    const userData = user[0]

    if (userData.status === 'blocked') {
      return c.json({ error: 'Esta conta está bloqueada. Contacte o administrador da plataforma.', status: 'blocked' }, 403)
    }
    if (userData.status === 'banned') {
      return c.json({ error: 'Esta conta foi banida da plataforma.', status: 'banned' }, 403)
    }

    loginAttempts.delete(rateLimitKey)

    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role, empresa_id: userData.empresa_id || null, permissions: userData.permissions || [] },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    )

    return c.json({ user: userData, token })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Não foi possível iniciar sessão')
  }
})

type AuthUser = { id: string; email: string; role: string; empresa_id?: string | null; permissions?: string[] }

function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

function requireAuth(c: Context): AuthUser | null {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (!token) return null
  return verifyToken(token)
}

type SuperAdminAuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; status: 401 | 403; message: string }

function requireSuperAdminUser(c: Context): SuperAdminAuthResult {
  const user = requireAuth(c)
  if (!user) return { ok: false, status: 401, message: 'Autenticação necessária.' }
  if (user.role !== 'superadmin') return { ok: false, status: 403, message: 'Acesso restrito a SuperAdmin.' }
  return { ok: true, user }
}

type ScopedAuthResult =
  | { ok: true; user: AuthUser; empresaId: string | null }
  | { ok: false; status: 401 | 403; message: string }

function requireEmpresaAdminOrHigher(c: Context): ScopedAuthResult {
  const user = requireAuth(c)
  if (!user) return { ok: false, status: 401, message: 'Autenticação necessária.' }
  if (user.role !== 'superadmin' && user.role !== 'admin') {
    return { ok: false, status: 403, message: 'Acesso restrito a Admin ou SuperAdmin.' }
  }
  const empresaId = user.role === 'superadmin' ? null : (user.empresa_id ?? null)
  return { ok: true, user, empresaId }
}

function requireGestorOrHigher(c: Context): ScopedAuthResult {
  const user = requireAuth(c)
  if (!user) return { ok: false, status: 401, message: 'Autenticação necessária.' }
  if (!['superadmin', 'admin', 'gestor'].includes(user.role)) {
    return { ok: false, status: 403, message: 'Acesso restrito a Gestor, Admin ou SuperAdmin.' }
  }
  const empresaId = user.role === 'superadmin' ? null : (user.empresa_id ?? null)
  return { ok: true, user, empresaId }
}

app.post('/api/auth/validate', (c) => {
  const user = requireAuth(c)
  if (!user) return c.json({ valid: false }, 401)
  return c.json({ valid: true, user })
})

// ── Routes: AI Chat ───────────────────────────────────────────────────────────

app.post('/api/ai/chat', async (c) => {
  try {
    const body = await c.req.json() as {
      message: string
      history?: Array<{ role: string; content: string }>
      context?: Record<string, unknown>
      sessionId?: string
    }

    if (!body.message || typeof body.message !== 'string') {
      return jsonError(c, 'message é obrigatório')
    }

    const isPublicSupport = body.context?.scope === 'public_support'
    const isPublicAiDemo = body.context?.scope === 'landing_ai_demo'
    const isPublicScope = isPublicSupport || isPublicAiDemo

    const nlp = isPublicScope ? null : processWithCorrections(body.message)
    const nlpPrefix = nlp ? buildNLPContextPrefix(nlp) : ''
    const contextMessage = isPublicScope ? '' : buildContextMessage(body.context || {})

    const systemPrompt = isPublicAiDemo
      ? MANUGENT_PUBLIC_AI_DEMO_PROMPT
      : isPublicSupport
        ? MANUGENT_PUBLIC_SUPPORT_PROMPT
        : MANUGENT_SYSTEM_PROMPT

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
    ]

    if (nlpPrefix) messages.push({ role: 'system', content: nlpPrefix })
    if (contextMessage) messages.push({ role: 'system', content: contextMessage })

    const history = Array.isArray(body.history) ? body.history.slice(-10) : []
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    messages.push({ role: 'user', content: body.message })

    const result = await callAI(messages)

    if (supabase && body.sessionId) {
      await supabase.from('ai_conversations').insert({
        session_id: body.sessionId,
        user_role: (body.context?.userRole as string) || 'unknown',
        messages: JSON.stringify([...history, { role: 'user', content: body.message }, { role: 'assistant', content: result.text }]),
        context_data: JSON.stringify(body.context || {}),
      }).then(() => {}, () => {})
    }

    return c.json({
      text: result.text,
      provider: result.provider,
      model: result.model,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro no agente de IA'
    console.error('[AI Chat Error]', msg)
    if (error instanceof AIProviderError) {
      return c.json({
        error: error.userMessage,
        code: error.code,
        provider: error.provider,
        fallback: true,
      }, error.code === 'provider_quota' ? 402 : 503)
    }
    return jsonError(c, msg, 500)
  }
})

// ── Routes: Fuzzy Search ────────────────────────────────────────────────────

app.get('/api/fuzzy/:entity', async (c) => {
  try {
    const db = requireDb()
    const entity = c.req.param('entity')
    const query = c.req.query('q') || ''
    const limit = Math.min(Number(c.req.query('limit') || '10'), 20)

    if (!query) return jsonError(c, 'Query string ?q= is required')

    let rows: Array<{ id: string; name: string; extra?: string }> = []

    switch (entity) {
      case 'equipment': {
        const { data } = await db.rpc('search_equipment')
        rows = (data || []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: r.name as string,
          extra: `${r.code || ''} — ${r.brand || ''} ${r.model || ''} — ${r.location || ''} — ${r.client_name}`,
        }))
        break
      }
      case 'technicians':
      case 'users': {
        const { data } = await db.rpc('search_users_staff')
        rows = (data || []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: r.name as string,
          extra: `${r.role}${r.team_name ? ' — ' + r.team_name : ''}${r.email ? ' — ' + r.email : ''}`,
        }))
        break
      }
      case 'clients': {
        const { data } = await db.from('clients').select('id, name, email, phone').order('name', { ascending: true })
        rows = ((data ?? []) as Record<string, unknown>[]).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: r.name as string,
          extra: `${r.email || ''}${r.phone ? ' — ' + r.phone : ''}`,
        }))
        break
      }
      case 'work-orders': {
        const { data } = await db.rpc('search_work_orders_active')
        rows = (data || []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: r.title as string,
          extra: `${r.status} | ${r.priority} | ${r.equipment_name} | ${r.client_name}`,
        }))
        break
      }
      case 'materials':
        return c.json({ entity, query, matches: [], suggestion: 'Pesquisa de materiais indisponível na BD.' })
      default:
        return jsonError(c, `Entidade "${entity}" nao suportada. Use: equipment, technicians, users, clients, work-orders, materials`)
    }

    const matches = fuzzySearch(query, rows, (r) => r.name + ' ' + (r.extra || ''), 0.4, limit)
    const result = disambiguate(query, rows, (r) => r.name + ' ' + (r.extra || ''), 0.4)

    return c.json({
      entity, query,
      matches: matches.map(m => ({ id: m.item.id, name: m.item.name, extra: m.item.extra, score: Math.round(m.score * 100) / 100 })),
      exactMatch: result.exact ? { id: result.exact.id, name: result.exact.name, extra: result.exact.extra } : null,
      suggestion: result.needsConfirmation ? result.suggestion : '',
      needsConfirmation: result.needsConfirmation,
    })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Fuzzy search failed')
  }
})

app.get('/api/ai/status', (c) => {
  const hasOpenAI = Boolean(openaiApiKey)
  const hasGroq = Boolean(groqApiKey)
  const configured = hasOpenAI || hasGroq

  return c.json({
    configured,
    provider: configured ? aiProvider : 'none',
    model: configured ? aiModel : null,
    providers: { openai: hasOpenAI, groq: hasGroq },
    message: configured ? `IA ativa: ${aiProvider} (${aiModel})` : 'Configure OPENAI_API_KEY ou GROQ_API_KEY para ativar a IA',
  })
})

// ── Routes: Work Orders ───────────────────────────────────────────────────────

app.get('/api/work-orders', async (c) => {
  try {
    const db = requireDb()
    const tab = c.req.query('tab')
    const status = c.req.query('status')
    const origin = tab === 'agendadas' || tab === 'scheduled'
      ? 'scheduled'
      : tab === 'pedidos' || tab === 'requests'
      ? 'request'
      : undefined

    const { data, error } = await db.rpc('get_work_orders_list', {
      p_origin: origin ?? null,
      p_status: status ?? null,
    })

    if (error) throw error
    return c.json({ workOrders: (data || []).map(mapWorkOrder) })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch work orders')
  }
})

app.get('/api/work-orders/:id', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_work_order_by_id', { p_id: c.req.param('id') })

    if (error) throw error
    if (!data || data.length === 0) return jsonError(c, 'Work order not found', 404)
    return c.json({ workOrder: mapWorkOrder(data[0]) })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch work order')
  }
})

app.get('/api/notifications', async (c) => {
  try {
    const db = requireDb()
    const workOrderId = c.req.query('workOrderId')
    const unread = c.req.query('unread') === 'true'

    let query = db.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
    if (workOrderId) query = query.eq('work_order_id', workOrderId)
    if (unread) query = query.is('read_at', null)

    const { data, error } = await query
    if (error) throw error
    return c.json({ notifications: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch notifications')
  }
})

app.post('/api/notifications/:id/read', async (c) => {
  try {
    const db = requireDb()
    const { error } = await db.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', c.req.param('id'))
    if (error) throw error
    return c.json({ ok: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not mark notification as read')
  }
})

app.post('/api/notifications/read-all', async (c) => {
  try {
    const db = requireDb()
    const { error } = await db.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
    if (error) throw error
    return c.json({ ok: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not mark all notifications as read')
  }
})

// ── Routes: Dashboard Stats ───────────────────────────────────────────────────

app.get('/api/stats', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_dashboard_stats')
    if (error) throw error

    const row = data?.[0] || {}
    return c.json({
      workOrders: {
        open: Number(row.open_total ?? 0),
        inProgress: Number(row.in_progress ?? 0),
        urgent: Number(row.urgent ?? 0),
        completed: Number(row.completed ?? 0),
        total: Number(row.total ?? 0),
      },
      equipment: {
        total: Number(row.equip_total ?? 0),
        active: Number(row.equip_active ?? 0),
      },
      notifications: {
        unread: Number(row.unread ?? 0),
      },
    })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch stats')
  }
})

// ── Routes: Public Testimonials (landing page) ────────────────────────────────

app.get('/api/testimonials', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false })
    if (error) throw error
    // Map DB column names (author_name, author_role, etc.) to the frontend
    // interface expected by RealTestimonial (name, role, company, text, createdAt)
    const items = ((data ?? []) as Record<string, unknown>[]).map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.author_name,
      role: row.author_role,
      company: row.company_name,
      text: row.content,
      rating: row.rating,
      approved: row.approved,
      featured: row.featured,
      photoUrl: row.photo_url,
      createdAt: row.created_at || row.date,
    }))
    return c.json({ items })
  } catch (error) {
    // Fallback para o ficheiro JSON legado (ex: ambientes sem migração aplicada ainda)
    const data = readTestimonials()
    const approved = data.items.filter((i) => (i as Record<string, unknown>).approved === true)
    return c.json({ items: approved })
  }
})

// ── Routes: Clients & Equipment ───────────────────────────────────────────────

app.get('/api/clients', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('clients').select('*').order('name', { ascending: true })
    if (error) throw error
    return c.json({ clients: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch clients')
  }
})

app.post('/api/clients', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.name) return jsonError(c, 'name é obrigatório')
    if (!body.empresaId) return jsonError(c, 'empresaId é obrigatório')

    const { data, error } = await db.from('clients').insert({
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      tax_id: body.taxId ?? null,
      sector: body.sector ?? null,
      empresa_id: body.empresaId,
    }).select().single()

    if (error) throw error
    // Auto-create folder structure for this client
    await db.rpc('create_client_folder_structure', { p_client_id: data.id, p_empresa_id: body.empresaId }).then(() => {}, () => {})
    return c.json({ client: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create client')
  }
})

app.get('/api/equipment', async (c) => {
  try {
    const db = requireDb()
    const clientId = c.req.query('clientId')

    const { data, error } = await db.rpc('get_equipment_with_clients', {
      p_client_id: clientId ?? null,
    })

    if (error) throw error
    return c.json({ equipment: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch equipment')
  }
})

app.post('/api/equipment', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.clientId) return jsonError(c, 'clientId é obrigatório')
    if (!body.name) return jsonError(c, 'name é obrigatório')
    if (!body.code) return jsonError(c, 'code é obrigatório')

    const { data, error } = await db.from('equipment').insert({
      client_id: body.clientId,
      code: body.code,
      name: body.name,
      brand: body.brand ?? null,
      model: body.model ?? null,
      serial: body.serial ?? null,
      location: body.location ?? null,
      criticality: body.criticality ?? 'normal',
      status: body.status ?? 'active',
    }).select().single()

    if (error) throw error
    return c.json({ equipment: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create equipment')
  }
})

// ── Routes: Buildings ──────────────────────────────────────────────────────────

app.get('/api/buildings', async (c) => {
  try {
    const db = requireDb()
    const clientId = c.req.query('clientId')
    let query = db.from('buildings').select('*').order('name', { ascending: true })
    if (clientId) query = query.eq('client_id', clientId)
    const { data, error } = await query
    if (error) throw error
    return c.json({ buildings: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch buildings')
  }
})

app.post('/api/buildings', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.name) return jsonError(c, 'name é obrigatório')
    if (!body.clientId) return jsonError(c, 'clientId é obrigatório')

    const { data, error } = await db.from('buildings').insert({
      client_id: body.clientId,
      name: body.name,
      address: body.address ?? null,
      city: body.city ?? null,
      type: body.type ?? 'industrial',
      area_m2: body.areaM2 ?? null,
      zones: body.zones ?? null,
    }).select().single()

    if (error) throw error
    return c.json({ building: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create building')
  }
})

app.put('/api/buildings/:id', async (c) => {
  try {
    const db = requireDb()
    const id = c.req.param('id')
    const body = await c.req.json()
    const patch: Record<string, unknown> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.address !== undefined) patch.address = body.address
    if (body.city !== undefined) patch.city = body.city
    if (body.type !== undefined) patch.type = body.type
    if (body.areaM2 !== undefined) patch.area_m2 = body.areaM2
    if (body.clientId !== undefined) patch.client_id = body.clientId
    if (body.zones !== undefined) patch.zones = body.zones

    const { data, error } = await db.from('buildings').update(patch).eq('id', id).select().single()
    if (error) throw error
    if (!data) return jsonError(c, 'Edifício não encontrado', 404)
    return c.json({ building: data })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update building')
  }
})

app.delete('/api/buildings/:id', async (c) => {
  try {
    const db = requireDb()
    const id = c.req.param('id')
    const { error } = await db.from('buildings').delete().eq('id', id)
    if (error) throw error
    return c.json({ success: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not delete building')
  }
})

// ── Routes: Suppliers, Parts & Inventory ────────────────────────────────────────

app.get('/api/suppliers', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('suppliers').select('*').order('name', { ascending: true })
    if (error) throw error
    return c.json({ suppliers: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch suppliers')
  }
})

app.get('/api/parts', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('parts').select('*').order('name', { ascending: true })
    if (error) throw error
    return c.json({ parts: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch parts')
  }
})

app.get('/api/inventory', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('inventory_items').select('*')
    if (error) throw error
    return c.json({ inventory: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch inventory')
  }
})

// ── Routes: Maintenance Requests ─────────────────────────────────────────────────

app.get('/api/maintenance-requests', async (c) => {
  try {
    const db = requireDb()
    const clientId = c.req.query('clientId')
    let query = db.from('maintenance_requests').select('*').order('created_at', { ascending: false })
    if (clientId) query = query.eq('client_id', clientId)
    const { data, error } = await query
    if (error) throw error
    return c.json({ requests: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch maintenance requests')
  }
})

app.post('/api/maintenance-requests', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.clientId) return jsonError(c, 'clientId é obrigatório')
    if (!body.title) return jsonError(c, 'title é obrigatório')

    const { data, error } = await db.from('maintenance_requests').insert({
      client_id: body.clientId,
      building_id: body.buildingId ?? null,
      equipment_id: body.equipmentId ?? null,
      requested_by: body.requestedBy ?? null,
      priority: body.priority ?? 'media',
      title: body.title,
      description: body.description ?? null,
      due_at: body.dueAt ?? null,
    }).select().single()

    if (error) throw error
    return c.json({ request: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create maintenance request')
  }
})

// ── Routes: Preventive Plans & Checklists ───────────────────────────────────────

app.get('/api/preventive-plans', async (c) => {
  try {
    const db = requireDb()
    const equipmentId = c.req.query('equipmentId')
    let query = db.from('preventive_plans').select('*').order('next_due_at', { ascending: true })
    if (equipmentId) query = query.eq('equipment_id', equipmentId)
    const { data, error } = await query
    if (error) throw error
    return c.json({ plans: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch preventive plans')
  }
})

app.get('/api/checklists', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('checklists').select('*').order('name', { ascending: true })
    if (error) throw error
    const rows = (data || []) as Array<Record<string, unknown>>
    const equipIds = [...new Set(rows.map((r) => r.equipment_id).filter(Boolean))] as string[]
    let equipMap: Record<string, string> = {}
    if (equipIds.length) {
      const { data: equipRows } = await db.from('equipment').select('id,name')
      equipMap = Object.fromEntries(((equipRows || []) as Array<Record<string, unknown>>).map((e) => [e.id as string, e.name as string]))
    }
    const checklists = rows.map((r) => ({ ...r, equipment_name: r.equipment_id ? equipMap[r.equipment_id as string] || null : null }))
    return c.json({ checklists })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch checklists')
  }
})

app.post('/api/checklists', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.title && !body.name) return jsonError(c, 'title é obrigatório')
    const { data, error } = await db.from('checklists').insert({
      name: body.title ?? body.name,
      description: body.description ?? null,
      frequency: body.frequency ?? null,
      category: body.category ?? null,
      equipment_id: body.equipmentId ?? null,
      items: body.tasks ?? body.items ?? [],
      equipment_category: body.equipmentCategory ?? null,
    }).select().single()
    if (error) throw error
    return c.json({ checklist: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create checklist')
  }
})

app.put('/api/checklists/:id', async (c) => {
  try {
    const db = requireDb()
    const id = c.req.param('id')
    const body = await c.req.json()
    const patch: Record<string, unknown> = {}
    if (body.title !== undefined) patch.name = body.title
    if (body.name !== undefined) patch.name = body.name
    if (body.description !== undefined) patch.description = body.description
    if (body.frequency !== undefined) patch.frequency = body.frequency
    if (body.category !== undefined) patch.category = body.category
    if (body.equipmentId !== undefined) patch.equipment_id = body.equipmentId
    if (body.tasks !== undefined) patch.items = body.tasks
    if (body.items !== undefined) patch.items = body.items
    const { data, error } = await db.from('checklists').update(patch).eq('id', id).select().single()
    if (error) throw error
    if (!data) return jsonError(c, 'Checklist não encontrada', 404)
    return c.json({ checklist: data })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update checklist')
  }
})

app.delete('/api/checklists/:id', async (c) => {
  try {
    const db = requireDb()
    const id = c.req.param('id')
    const { error } = await db.from('checklists').delete().eq('id', id)
    if (error) throw error
    return c.json({ success: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not delete checklist')
  }
})

// ── Routes: Documents & Folders ────────────────────────────────────────────────

app.get('/api/documents', async (c) => {
  try {
    const db = requireDb()
    const entityType = c.req.query('entityType')
    const entityId = c.req.query('entityId')
    let query = db.from('documents').select('*').order('uploaded_at', { ascending: false })
    if (entityType) query = query.eq('entity_type', entityType)
    if (entityId) query = query.eq('entity_id', entityId)
    const { data, error } = await query
    if (error) throw error
    return c.json({ documents: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch documents')
  }
})

app.get('/api/folders', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('folders').select('*').order('name', { ascending: true })
    if (error) throw error
    return c.json({ folders: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch folders')
  }
})

// ── Routes: Contracts ──────────────────────────────────────────────────────────

app.get('/api/contracts', async (c) => {
  try {
    const db = requireDb()
    const clientId = c.req.query('clientId')
    let query = db.from('contracts').select('*').order('start_date', { ascending: false })
    if (clientId) query = query.eq('client_id', clientId)
    const { data, error } = await query
    if (error) throw error
    const rows = (data || []) as Array<Record<string, unknown>>
    const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[]
    let clientMap: Record<string, string> = {}
    if (clientIds.length) {
      const { data: clientRows } = await db.from('clients').select('id,name')
      clientMap = Object.fromEntries(((clientRows || []) as Array<Record<string, unknown>>).map((cl) => [cl.id as string, cl.name as string]))
    }
    const contracts = rows.map((r) => ({ ...r, client_name: clientMap[r.client_id as string] || null }))
    return c.json({ contracts })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch contracts')
  }
})

// ── Routes: Audits & Reports ────────────────────────────────────────────────────

app.get('/api/audits', async (c) => {
  try {
    const db = requireDb()
    const buildingId = c.req.query('buildingId')
    let query = db.from('audits').select('*').order('date', { ascending: false })
    if (buildingId) query = query.eq('building_id', buildingId)
    const { data, error } = await query
    if (error) throw error
    return c.json({ audits: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch audits')
  }
})

app.get('/api/reports', async (c) => {
  try {
    const db = requireDb()
    const clientId = c.req.query('clientId')
    let query = db.from('reports').select('*').order('generated_at', { ascending: false })
    if (clientId) query = query.eq('client_id', clientId)
    const { data, error } = await query
    if (error) throw error
    return c.json({ reports: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch reports')
  }
})

// ── Routes: Comments (work orders, requests, blog, audits) ─────────────────────

app.get('/api/comments', async (c) => {
  try {
    const db = requireDb()
    const entityType = c.req.query('entityType')
    const entityId = c.req.query('entityId')
    if (!entityType || !entityId) return jsonError(c, 'entityType e entityId são obrigatórios')
    const { data, error } = await db.from('comments').select('*').eq('entity_type', entityType).eq('entity_id', entityId).order('created_at', { ascending: true })
    if (error) throw error
    return c.json({ comments: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch comments')
  }
})

app.post('/api/comments', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.entityType || !body.entityId) return jsonError(c, 'entityType e entityId são obrigatórios')
    if (!body.content) return jsonError(c, 'content é obrigatório')

    const { data, error } = await db.from('comments').insert({
      entity_type: body.entityType,
      entity_id: body.entityId,
      author_id: body.authorId ?? null,
      content: body.content,
      parent_id: body.parentId ?? null,
    }).select().single()

    if (error) throw error
    return c.json({ comment: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create comment')
  }
})

// ── Routes: Activity Log ────────────────────────────────────────────────────────

app.get('/api/activity-log', async (c) => {
  try {
    const db = requireDb()
    const limit = Math.min(Number(c.req.query('limit') ?? 100), 500)
    const { data, error } = await db.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return c.json({ activity: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch activity log')
  }
})

// ── Routes: Calendar ────────────────────────────────────────────────────────────

app.get('/api/calendar-events', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('calendar_events').select('*').order('start_at', { ascending: true })
    if (error) throw error
    return c.json({ events: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch calendar events')
  }
})

// ── Routes: Blog (público — substitui data/blogPosts.ts estático) ──────────────

app.get('/api/blog', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('blog_posts').select('*').eq('published', true).order('published_at', { ascending: false })
    if (error) throw error
    return c.json({ posts: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch blog posts')
  }
})

app.get('/api/blog/:slug', async (c) => {
  try {
    const db = requireDb()
    const slug = c.req.param('slug')
    const { data, error } = await db.from('blog_posts').select('*').eq('slug', slug).single()
    if (error) throw error
    if (!data) return jsonError(c, 'Post não encontrado', 404)
    return c.json({ post: data })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch blog post')
  }
})

app.post('/api/blog/:slug/view', async (c) => {
  try {
    const db = requireDb()
    const slug = c.req.param('slug')
    const { data: post, error: findError } = await db.from('blog_posts').select('id, views').eq('slug', slug).single()
    if (findError) throw findError
    if (!post) return jsonError(c, 'Post não encontrado', 404)
    const postRow = post as { id: string; views: number | null }
    const { error } = await db.from('blog_posts').update({ views: (postRow.views ?? 0) + 1 }).eq('id', postRow.id)
    if (error) throw error
    return c.json({ ok: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not register view')
  }
})

// ── Routes: Ratings ──────────────────────────────────────────────────────────────

app.get('/api/ratings', async (c) => {
  try {
    const db = requireDb()
    const entityType = c.req.query('entityType')
    const entityId = c.req.query('entityId')
    let query = db.from('ratings').select('*').order('created_at', { ascending: false })
    if (entityType) query = query.eq('entity_type', entityType)
    if (entityId) query = query.eq('entity_id', entityId)
    const { data, error } = await query
    if (error) throw error
    return c.json({ ratings: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch ratings')
  }
})

app.post('/api/ratings', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.entityType || !body.entityId) return jsonError(c, 'entityType e entityId são obrigatórios')
    if (!body.score) return jsonError(c, 'score é obrigatório')

    const { data, error } = await db.from('ratings').insert({
      entity_type: body.entityType,
      entity_id: body.entityId,
      author_id: body.authorId ?? null,
      score: body.score,
      comment: body.comment ?? null,
    }).select().single()

    if (error) throw error
    return c.json({ rating: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create rating')
  }
})

// ── Routes: Incidents ──────────────────────────────────────────────────────────

app.get('/api/incidents', async (c) => {
  try {
    const db = requireDb()
    const buildingId = c.req.query('buildingId')
    const clientId = c.req.query('clientId')
    let query = db.from('incidents').select('*').order('occurred_at', { ascending: false })
    if (buildingId) query = query.eq('building_id', buildingId)
    if (clientId) query = query.eq('client_id', clientId)
    const { data, error } = await query
    if (error) throw error
    return c.json({ incidents: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch incidents')
  }
})

app.post('/api/incidents', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.title && !body.description) return jsonError(c, 'title/description é obrigatório')
    if (!body.clientId) return jsonError(c, 'clientId é obrigatório')
    if (!body.buildingId) return jsonError(c, 'buildingId é obrigatório')

    const { data, error } = await db.from('incidents').insert({
      client_id: body.clientId,
      building_id: body.buildingId,
      equipment_id: body.equipmentId ?? null,
      type: body.type ?? 'outro',
      title: body.title || (body.description || '').slice(0, 120),
      description: body.description ?? null,
      status: body.status ?? 'aberto',
      priority: body.priority ?? 'media',
      reported_by: body.reportedBy ?? null,
      assigned_to: body.assignedTo ?? null,
      photos: body.photos ?? [],
    }).select().single()

    if (error) throw error
    return c.json({ incident: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create incident')
  }
})

app.patch('/api/incidents/:id', async (c) => {
  try {
    const db = requireDb()
    const id = c.req.param('id')
    const body = await c.req.json()
    const patch: Record<string, unknown> = {}
    if (body.title !== undefined) patch.title = body.title
    if (body.description !== undefined) patch.description = body.description
    if (body.status !== undefined) patch.status = body.status
    if (body.priority !== undefined) patch.priority = body.priority
    if (body.type !== undefined) patch.type = body.type
    if (body.clientId !== undefined) patch.client_id = body.clientId
    if (body.buildingId !== undefined) patch.building_id = body.buildingId
    if (body.equipmentId !== undefined) patch.equipment_id = body.equipmentId
    if (body.assignedTo !== undefined) patch.assigned_to = body.assignedTo
    if (body.photos !== undefined) patch.photos = body.photos
    if (body.resolutionNotes !== undefined) patch.resolution_notes = body.resolutionNotes
    if (body.resolvedBy !== undefined) patch.resolved_by = body.resolvedBy
    // Marcar como resolvido regista automaticamente a data de resolução;
    // sair do estado resolvido/fechado limpa a data.
    if (body.status === 'resolvido' || body.status === 'fechado') {
      patch.resolved_at = new Date().toISOString()
    } else if (body.status !== undefined) {
      patch.resolved_at = null
    }

    const { data, error } = await db.from('incidents').update(patch).eq('id', id).select().single()
    if (error) throw error
    if (!data) return jsonError(c, 'Incidente não encontrado', 404)
    return c.json({ incident: data })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update incident')
  }
})

app.delete('/api/incidents/:id', async (c) => {
  try {
    const db = requireDb()
    const id = c.req.param('id')
    const { error } = await db.from('incidents').delete().eq('id', id)
    if (error) throw error
    return c.json({ success: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not delete incident')
  }
})

// ── Routes: Knowledge Articles ─────────────────────────────────────────────────

app.get('/api/knowledge', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('knowledge_articles')
      .select('*, category:knowledge_categories(name,slug)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return c.json({ articles: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch knowledge articles')
  }
})

// ── Routes: Purchase Orders ────────────────────────────────────────────────────

app.get('/api/purchase-orders', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('purchase_orders')
      .select('*, supplier:suppliers(name), items:purchase_order_items(part_id,quantity,unit_price)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return c.json({ purchaseOrders: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch purchase orders')
  }
})

// ── Routes: Quotes ─────────────────────────────────────────────────────────────

app.get('/api/quotes', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('quotes')
      .select('*, items:quote_items(id,type,description,quantity,unit_price)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return c.json({ quotes: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch quotes')
  }
})

// ── Routes: Teams & Users ─────────────────────────────────────────────────────

app.get('/api/teams', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('teams').select('*').order('name', { ascending: true })
    if (error) throw error
    return c.json({ teams: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch teams')
  }
})

app.get('/api/users', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_users_with_teams')
    if (error) throw error
    return c.json({ users: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch users')
  }
})

// ── Routes: Technicians (Colaboradores) ────────────────────────────────────────

app.get('/api/technicians', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_technicians')
    if (error) throw error
    return c.json({ technicians: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch technicians')
  }
})

app.post('/api/technicians', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    if (!body.name) return jsonError(c, 'name é obrigatório')
    const { data, error } = await db.rpc('create_technician', {
      p_name: body.name,
      p_email: body.email ?? '',
      p_role: body.role ?? 'tecnico',
      p_phone: body.phone ?? '',
      p_specialty: body.specialty ?? '',
      p_availability: body.availability ?? '',
      p_empresa_id: body.empresaId ?? null,
      p_team_id: body.teamId ?? null,
      p_avatar_url: body.avatarUrl ?? '',
    })
    if (error) throw error
    const newId = (data as Array<{ create_technician: string }>)?.[0]?.create_technician
    const { data: created, error: fetchError } = await db.rpc('get_technicians')
    if (fetchError) throw fetchError
    const technician = (created || []).find((t: { id: string }) => t.id === newId)
    return c.json({ technician }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create technician')
  }
})

app.put('/api/technicians/:id', async (c) => {
  try {
    const db = requireDb()
    const id = c.req.param('id')
    const body = await c.req.json()
    const { error } = await db.rpc('update_technician', {
      p_user_id: id,
      p_name: body.name,
      p_email: body.email ?? '',
      p_role: body.role ?? 'tecnico',
      p_phone: body.phone ?? '',
      p_specialty: body.specialty ?? '',
      p_availability: body.availability ?? '',
      p_empresa_id: body.empresaId ?? null,
      p_team_id: body.teamId ?? null,
      p_avatar_url: body.avatarUrl ?? '',
    })
    if (error) throw error
    const { data: all, error: fetchError } = await db.rpc('get_technicians')
    if (fetchError) throw fetchError
    const technician = (all || []).find((t: { id: string }) => t.id === id)
    if (!technician) return jsonError(c, 'Colaborador não encontrado', 404)
    return c.json({ technician })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update technician')
  }
})

app.delete('/api/technicians/:id', async (c) => {
  try {
    const db = requireDb()
    const id = c.req.param('id')
    const { error } = await db.from('users').delete().eq('id', id)
    if (error) throw error
    return c.json({ success: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not delete technician')
  }
})

// ── Routes: Empresas (provider companies) ─────────────────────────────────────

app.get('/api/empresas', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('empresas').select('*').order('name', { ascending: true })
    if (error) throw error
    return c.json({ empresas: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch empresas')
  }
})

app.post('/api/empresas', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json() as { name?: string; tax_id?: string; email?: string; phone?: string; address?: string; city?: string; domain?: string; category?: string; active?: boolean }
    if (!body.name || !body.name.trim()) return jsonError(c, 'Nome da empresa é obrigatório.', 400)
    const { data, error } = await db.from('empresas').insert({
      name: body.name.trim(),
      tax_id: body.tax_id || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      domain: body.domain || null,
      category: body.category || 'prestador',
      active: body.active !== false,
    }).select().single()
    if (error) throw error
    // Auto-create folder structure for this empresa
    await db.rpc('create_empresa_folder_structure', { p_empresa_id: data.id }).then(() => {}, () => {})
    return c.json({ empresa: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create empresa')
  }
})

app.put('/api/empresas/:id', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json() as Record<string, unknown>
    const update: Record<string, unknown> = {}
    for (const key of ['name','tax_id','email','phone','address','city','domain','category','active']) {
      if (key in body) update[key] = body[key]
    }
    const { data, error } = await db.from('empresas').update(update).eq('id', c.req.param('id')).select().single()
    if (error) throw error
    if (!data) return jsonError(c, 'Empresa não encontrada.', 404)
    return c.json({ empresa: data })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update empresa')
  }
})

app.delete('/api/empresas/:id', async (c) => {
  try {
    const db = requireDb()
    const { error } = await db.from('empresas').delete().eq('id', c.req.param('id'))
    if (error) throw error
    return c.json({ ok: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not delete empresa')
  }
})

app.post('/api/empresas/:id/collaborators/:userId', async (c) => {
  try {
    const db = requireDb()
    const { error } = await db.rpc('set_user_empresa', {
      p_user_id: c.req.param('userId'),
      p_empresa_id: c.req.param('id'),
    })
    if (error) throw error
    return c.json({ ok: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not associate collaborator with empresa')
  }
})

app.delete('/api/empresas/:id/collaborators/:userId', async (c) => {
  try {
    const db = requireDb()
    const { error } = await db.rpc('set_user_empresa', {
      p_user_id: c.req.param('userId'),
      p_empresa_id: null,
    })
    if (error) throw error
    return c.json({ ok: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not remove collaborator from empresa')
  }
})

app.get('/api/empresas/:id/collaborators', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_collaborators_by_empresa', { p_empresa_id: c.req.param('id') })
    if (error) throw error
    return c.json({ collaborators: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch empresa collaborators')
  }
})

// ── Routes: Multi-tenant scoped data ──────────────────────────────────────────

app.get('/api/empresas/:id/clients', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_clients_by_empresa', { p_empresa_id: c.req.param('id') })
    if (error) throw error
    return c.json({ clients: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch empresa clients')
  }
})

app.get('/api/empresas/:id/folders', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_empresa_folder_tree', { p_empresa_id: c.req.param('id') })
    if (error) throw error
    return c.json({ folders: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch empresa folder tree')
  }
})

app.get('/api/empresas/:id/documents', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('documents')
      .select('*')
      .eq('empresa_id', c.req.param('id'))
      .order('uploaded_at', { ascending: false })
    if (error) throw error
    return c.json({ documents: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch empresa documents')
  }
})

app.post('/api/empresas/:id/folders', async (c) => {
  const auth = requireGestorOrHigher(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)

  try {
    const db = requireDb()
    const body = await c.req.json() as { name?: string; parentId?: string; folderType?: string }
    if (!body.name?.trim()) return jsonError(c, 'name é obrigatório', 400)

    const { data, error } = await db.from('folders').insert({
      name: body.name.trim(),
      parent_id: body.parentId ?? null,
      empresa_id: c.req.param('id'),
      folder_type: body.folderType ?? 'generic',
      owner_id: auth.user.id,
    }).select().single()
    if (error) throw error
    return c.json({ folder: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create folder')
  }
})

// ── Routes: Clients — scoped to empresa ───────────────────────────────────────

app.get('/api/clients/:id/folders', async (c) => {
  try {
    const db = requireDb()
    const { data: client } = await db.from('clients').select('empresa_id').eq('id', c.req.param('id')).maybeSingle() as { data: { empresa_id: string | null } | null }
    if (!client) return jsonError(c, 'Cliente não encontrado.', 404)

    const { data, error } = await db.from('folders')
      .select('*')
      .or(`client_id.eq.${c.req.param('id')},and(empresa_id.eq.${client.empresa_id ?? ''},folder_type.eq.clientes)`)
      .order('name', { ascending: true })
    if (error) throw error
    return c.json({ folders: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch client folders')
  }
})

app.get('/api/clients/:id/documents', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('documents')
      .select('*')
      .eq('client_id', c.req.param('id'))
      .order('uploaded_at', { ascending: false })
    if (error) throw error
    return c.json({ documents: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch client documents')
  }
})

// ── Routes: SuperAdmin — account status & password recovery ────────────────
// Only a SuperAdmin can block, ban, reactivate, or force-reset another
// account's password. All routes require requireSuperAdminUser.

function generateTemporaryPassword(): string {
  // Unambiguous alphabet (no 0/O/1/l/I) so a support agent can read it aloud.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(14)
  let pwd = ''
  for (let i = 0; i < bytes.length; i++) {
    pwd += alphabet[bytes[i] % alphabet.length]
  }
  return pwd + '!' // guarantee a symbol so it always meets typical policies
}

app.post('/api/superadmin/users/:id/status', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)

  const userId = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as { status?: string; reason?: string }
  const status = body.status

  if (status !== 'active' && status !== 'blocked' && status !== 'banned') {
    return jsonError(c, "status deve ser 'active', 'blocked' ou 'banned'.")
  }
  if (userId === auth.user.id) {
    return c.json({ error: 'Não pode alterar o estado da sua própria conta.' }, 400)
  }

  try {
    const db = requireDb()
    const { data, error } = await db.rpc('admin_set_user_status', {
      p_actor_id: auth.user.id,
      p_user_id: userId,
      p_status: status,
      p_reason: body.reason || null,
    })
    if (error) throw error
    const updated = Array.isArray(data) ? data[0] : data
    if (!updated) return c.json({ error: 'Utilizador não encontrado.' }, 404)
    return c.json({ user: updated })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Não foi possível atualizar o estado da conta.')
  }
})

app.post('/api/superadmin/users/:id/reset-password', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)

  const userId = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as { newPassword?: string }

  const providedPassword = (body.newPassword || '').trim()
  if (providedPassword && providedPassword.length < 8) {
    return jsonError(c, 'A nova password deve ter pelo menos 8 caracteres.')
  }
  const generated = !providedPassword
  const newPassword = providedPassword || generateTemporaryPassword()

  try {
    const db = requireDb()
    const { data, error } = await db.rpc('admin_reset_user_password', {
      p_actor_id: auth.user.id,
      p_user_id: userId,
      p_new_password: newPassword,
    })
    if (error) throw error
    const updated = Array.isArray(data) ? data[0] : data
    if (!updated) return c.json({ error: 'Utilizador não encontrado.' }, 404)
    // The plaintext password is only ever returned once, right here, to the
    // SuperAdmin who requested the reset — it is never stored or logged.
    return c.json({ user: updated, temporaryPassword: generated ? newPassword : undefined })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Não foi possível repor a password.')
  }
})

// ── Routes: Work Order CRUD ───────────────────────────────────────────────────

app.post('/api/work-orders/demo/bootstrap', async (c) => {
  try {
    const db = requireDb()

    const { data: team } = await db.from('teams').insert({ name: 'Equipa Manutencao' }).select().single()
    const { data: client } = await db.from('clients').insert({ name: 'Cliente Demo', email: 'demo@manugent.pt' }).select().single()
    const { data: equipment } = await db.from('equipment').insert({
      client_id: client.id, code: 'EQ-001', name: 'Bomba Principal',
      location: 'Linha 1', criticality: 'critical', status: 'active',
    }).select().single()
    const { data: supervisor } = await db.from('users').insert({
      team_id: team.id, name: 'Supervisor Demo', email: 'supervisor@manugent.pt', role: 'supervisor',
    }).select().single()
    const { data: technician } = await db.from('users').insert({
      team_id: team.id, name: 'Tecnico Demo', email: 'tecnico@manugent.pt', role: 'technician',
    }).select().single()
    const { data: workOrder } = await db.from('work_orders').insert({
      client_id: client.id, equipment_id: equipment.id, team_id: team.id, supervisor_id: supervisor.id,
      type: 'preventive', origin: 'scheduled', status: 'scheduled', priority: 'high',
      title: 'Preventiva mensal - Bomba Principal',
      description: 'Inspecao programada com medicao de vibracao no rolamento.',
      scheduled_for: new Date(Date.now() + 86400000).toISOString(),
    }).select().single()

    return c.json({ client, equipment, team, supervisor, technician, workOrder: mapWorkOrder(workOrder) }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not bootstrap demo flow')
  }
})

app.post('/api/work-orders', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    const type = assertOption(body.type, workOrderTypes, 'type')
    const status = body.status
      ? assertOption(body.status, workOrderStatuses, 'status')
      : originForType(type) === 'scheduled' ? 'scheduled' : 'open'

    const { data, error } = await db.from('work_orders').insert({
      client_id: body.clientId,
      equipment_id: body.equipmentId,
      team_id: body.teamId ?? null,
      supervisor_id: body.supervisorId ?? null,
      type,
      origin: originForType(type),
      status,
      priority: body.priority ?? 'normal',
      title: body.title,
      description: body.description ?? null,
      scheduled_for: body.scheduledFor ?? null,
    }).select().single()

    if (error) throw error
    return c.json({ workOrder: mapWorkOrder(data) }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create work order')
  }
})

app.post('/api/work-orders/:id/status', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    const status = assertOption(body.status, workOrderStatuses, 'status')

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'in_progress') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }

    const { data, error } = await db.from('work_orders').update(updateData).eq('id', c.req.param('id')).select().single()

    if (error) throw error
    if (!data) return jsonError(c, 'Work order not found', 404)
    return c.json({ workOrder: mapWorkOrder(data) })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update status')
  }
})

app.post('/api/work-orders/:id/findings', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()
    const findings = Array.isArray(body.findings) ? body.findings : [body]

    const { data, error } = await db.rpc('create_work_order_findings', {
      p_work_order_id: c.req.param('id'),
      p_findings: findings,
      p_created_by: body.createdBy ?? null,
    })

    if (error) throw error
    return c.json(data, (data as Record<string, unknown>)?.interventionRequest ? 201 : 200)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not register findings')
  }
})

// ── Routes: Time Tracking ─────────────────────────────────────────────────────

app.post('/api/work-orders/:id/time/join', (c) => upsertTimeEntry(c, 'joined'))
app.post('/api/work-orders/:id/time/start', (c) => upsertTimeEntry(c, 'running'))
app.post('/api/work-orders/:id/time/pause', (c) => updateTimeEntry(c, 'pause'))
app.post('/api/work-orders/:id/time/resume', (c) => updateTimeEntry(c, 'resume'))
app.post('/api/work-orders/:id/time/exit', (c) => updateTimeEntry(c, 'exit'))

app.get('/api/work-orders/:id/time', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_time_entries', { p_work_order_id: c.req.param('id') })
    if (error) throw error

    const totalSeconds = (data || []).reduce((sum: number, row: Record<string, unknown>) => {
      return sum + (Number(row.effective_seconds) || 0)
    }, 0)

    return c.json({ timeEntries: data || [], totalSeconds })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch time entries')
  }
})

// ── Routes: Client Portal ─────────────────────────────────────────────────────

app.post('/api/client-portal/requests', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()

    const { data, error } = await db.from('work_orders').insert({
      client_id: body.clientId,
      equipment_id: body.equipmentId,
      type: 'customer_request',
      origin: 'request',
      status: 'open',
      priority: body.priority ?? 'normal',
      title: body.title,
      description: body.description ?? null,
    }).select().single()

    if (error) throw error

    await db.from('notifications').insert({
      work_order_id: data.id,
      recipient_role: 'supervisor',
      title: 'Novo pedido do cliente',
      message: `Cliente abriu pedido: ${body.title}`,
    })

    return c.json({ request: mapWorkOrder(data) }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create customer request')
  }
})

app.get('/api/client-portal/clients/:clientId/work-orders', async (c) => {
  try {
    const db = requireDb()
    const buildingId = c.req.query('buildingId')
    const { data, error } = await db.rpc('get_client_work_orders', {
      p_client_id: c.req.param('clientId'),
      p_building_id: buildingId ?? null,
    })
    if (error) throw error
    return c.json({ workOrders: (data || []).map(mapWorkOrder) })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch client work orders')
  }
})

// ── Routes: Client Portal — Building/Sucursal scoping ─────────────────────────
// Cada cliente só vê dados do seu edifício (sucursal).

app.get('/api/client-portal/clients/:clientId/buildings', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_client_buildings', { p_client_id: c.req.param('clientId') })
    if (error) throw error
    return c.json({ buildings: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch client buildings')
  }
})

app.get('/api/client-portal/buildings/:buildingId/work-orders', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_building_work_orders', { p_building_id: c.req.param('buildingId') })
    if (error) throw error
    return c.json({ workOrders: (data || []).map(mapWorkOrder) })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch building work orders')
  }
})

app.get('/api/client-portal/buildings/:buildingId/documents', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_building_documents', { p_building_id: c.req.param('buildingId') })
    if (error) throw error
    return c.json({ documents: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch building documents')
  }
})

app.get('/api/client-portal/buildings/:buildingId/quotes', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_building_quotes', { p_building_id: c.req.param('buildingId') })
    if (error) throw error
    return c.json({ quotes: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch building quotes')
  }
})

app.get('/api/client-portal/buildings/:buildingId/incidents', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_building_incidents', { p_building_id: c.req.param('buildingId') })
    if (error) throw error
    return c.json({ incidents: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch building incidents')
  }
})

app.get('/api/client-portal/buildings/:buildingId/calendar-events', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_building_calendar_events', { p_building_id: c.req.param('buildingId') })
    if (error) throw error
    return c.json({ events: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch building calendar events')
  }
})

app.get('/api/client-portal/buildings/:buildingId/reports', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_building_reports', { p_building_id: c.req.param('buildingId') })
    if (error) throw error
    return c.json({ reports: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch building reports')
  }
})

app.get('/api/client-portal/buildings/:buildingId/checklists', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_building_checklists', { p_building_id: c.req.param('buildingId') })
    if (error) throw error
    return c.json({ checklists: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch building checklists')
  }
})

app.get('/api/client-portal/clients/:clientId/equipment/:equipmentId/history', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('work_orders')
      .select('*, client:clients(name), equipment:equipment(name), team:teams(name)')
      .eq('client_id', c.req.param('clientId'))
      .eq('equipment_id', c.req.param('equipmentId'))
      .order('created_at', { ascending: false })

    if (error) throw error

    const mapped = ((data ?? []) as Record<string, unknown>[]).map((row: Record<string, unknown>) => ({
      ...mapWorkOrder(row),
      clientName: (row.client as Record<string, unknown>)?.name,
      equipmentName: (row.equipment as Record<string, unknown>)?.name,
      teamName: (row.team as Record<string, unknown>)?.name,
    }))

    return c.json({ history: mapped })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch equipment history')
  }
})

app.get('/api/client-portal/clients/:clientId/reports', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_client_reports', { p_client_id: c.req.param('clientId') })
    if (error) throw error
    return c.json({ reports: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch client reports')
  }
})

// ── Routes: Reports ───────────────────────────────────────────────────────────

app.post('/api/work-orders/:id/reports', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()

    const { data: workOrder, error: woError } = await db.from('work_orders').select('*').eq('id', c.req.param('id')).single()
    if (woError || !workOrder) return jsonError(c, 'Work order not found', 404)

    const { data, error } = await db.from('intervention_reports').insert({
      work_order_id: workOrder.id,
      client_id: workOrder.client_id,
      equipment_id: workOrder.equipment_id,
      title: body.title ?? `Relatorio - ${workOrder.title}`,
      summary: body.summary,
      actions_performed: body.actionsPerformed ?? null,
      recommendations: body.recommendations ?? null,
      created_by: body.createdBy ?? null,
    }).select().single()

    if (error) throw error
    return c.json({ report: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create intervention report')
  }
})

app.get('/api/client-portal/reports/:reportId/pdf', async (c) => {
  try {
    const db = requireDb()
    const { data: report, error } = await db.rpc('get_report_for_pdf', { p_report_id: c.req.param('reportId') })

    if (error) throw error
    if (!report || report.length === 0) return jsonError(c, 'Report not found', 404)

    const r = report[0] as Record<string, unknown>
    const pdf = buildSimplePdf([
      'ManuGent - Relatorio de Intervencao',
      `Cliente: ${r.client_name}`,
      `Equipamento: ${r.equipment_code} - ${r.equipment_name}`,
      `OT: ${r.work_order_title}`,
      `Estado: ${r.work_order_status}`,
      `Resumo: ${r.summary}`,
      `Acoes: ${r.actions_performed ?? '-'}`,
      `Recomendacoes: ${r.recommendations ?? '-'}`,
      `Data: ${r.created_at}`,
    ])

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-${r.id}.pdf"`,
      },
    })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not generate PDF')
  }
})

// ── Routes: Quotes ────────────────────────────────────────────────────────────

app.post('/api/work-orders/:id/quotes', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json()

    const { data: workOrder, error: woError } = await db.from('work_orders').select('*').eq('id', c.req.param('id')).single()
    if (woError || !workOrder) return jsonError(c, 'Work order not found', 404)

    const { data, error } = await db.from('quotes').insert({
      work_order_id: workOrder.id,
      client_id: workOrder.client_id,
      reference: body.reference,
      description: body.description,
      amount: body.amount,
      currency: body.currency ?? 'EUR',
    }).select().single()

    if (error) throw error
    return c.json({ quote: data }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create quote')
  }
})

app.get('/api/client-portal/clients/:clientId/quotes', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.rpc('get_client_quotes', { p_client_id: c.req.param('clientId') })
    if (error) throw error
    return c.json({ quotes: data || [] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch client quotes')
  }
})

app.post('/api/client-portal/quotes/:quoteId/approve', async (c) => {
  try {
    const db = requireDb()
    const body = await c.req.json().catch(() => ({}))

    const { data, error } = await db.from('quotes')
      .update({
        status: 'approved',
        approved_by: (body as Record<string, unknown>).approvedBy ?? 'client',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', c.req.param('quoteId'))
      .eq('status', 'pending')
      .select()
      .single()

    if (error || !data) return jsonError(c, 'Pending quote not found', 404)

    await db.from('notifications').insert({
      work_order_id: data.work_order_id,
      recipient_role: 'supervisor',
      title: 'Orcamento aprovado',
      message: `Orcamento ${data.reference} aprovado pelo cliente.`,
    })

    return c.json({ quote: data })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not approve quote')
  }
})

// ── Routes: Attachments ───────────────────────────────────────────────────────

const VALID_ENTITY_TYPES = ['work_order', 'equipment', 'client', 'installation'] as const
type EntityType = typeof VALID_ENTITY_TYPES[number]

function isValidEntityType(v: string): v is EntityType {
  return VALID_ENTITY_TYPES.includes(v as EntityType)
}

// GET /api/attachments/:entityType/:entityId — listar anexos
app.get('/api/attachments/:entityType/:entityId', async (c) => {
  try {
    const db = requireDb()
    const entityType = c.req.param('entityType')
    const entityId = c.req.param('entityId')

    if (!isValidEntityType(entityType)) {
      return jsonError(c, `Tipo de entidade inválido. Use: ${VALID_ENTITY_TYPES.join(', ')}`)
    }

    const { data, error } = await db.rpc('get_attachments', {
      p_entity_type: entityType,
      p_entity_id: entityId,
    })

    if (error) throw error

    return c.json({
      attachments: (data || []).map((a: Record<string, unknown>) => ({
        id: a.id,
        entityType: a.entity_type,
        entityId: a.entity_id,
        filename: a.filename,
        originalName: a.original_name,
        mimeType: a.mime_type,
        fileSize: a.file_size,
        uploadedBy: a.uploaded_by,
        uploaderName: a.uploader_name,
        createdAt: a.created_at,
        downloadUrl: `/api/attachments/${a.id}/download`,
      })),
    })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not fetch attachments')
  }
})

// POST /api/attachments/:entityType/:entityId — upload automático de ficheiro(s)
app.post('/api/attachments/:entityType/:entityId', async (c) => {
  try {
    const db = requireDb()
    const entityType = c.req.param('entityType')
    const entityId = c.req.param('entityId')

    if (!isValidEntityType(entityType)) {
      return jsonError(c, `Tipo de entidade inválido. Use: ${VALID_ENTITY_TYPES.join(', ')}`)
    }

    // Obter user autenticado (opcional — uploads sem login são permitidos)
    const authUser = requireAuth(c)

    const formData = await c.req.formData()
    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File | null

    const allFiles: File[] = singleFile ? [singleFile] : files.filter(Boolean)

    if (allFiles.length === 0) {
      return jsonError(c, 'Nenhum ficheiro recebido. Envie via multipart/form-data com o campo "file" ou "files".')
    }

    const saved: Record<string, unknown>[] = []

    for (const file of allFiles) {
      if (!file || typeof file === 'string') continue

      const fileSize = file.size
      if (fileSize > MAX_FILE_SIZE) {
        return jsonError(c, `Ficheiro "${file.name}" excede o tamanho máximo de 50 MB.`)
      }

      const mimeType = file.type || 'application/octet-stream'
      if (!allowedMimeTypes.has(mimeType)) {
        return jsonError(c, `Tipo de ficheiro não permitido: ${mimeType}`)
      }

      // Gerar nome único para evitar colisões no disco
      const ext = extname(file.name) || ''
      const filename = `${randomUUID()}${ext}`
      const storagePath = join(uploadsDir, filename)

      // Guardar ficheiro em disco
      const arrayBuffer = await file.arrayBuffer()
      writeFileSync(storagePath, Buffer.from(arrayBuffer))

      // Guardar metadados na BD
      const { data, error } = await db.from('attachments').insert({
        entity_type: entityType,
        entity_id: entityId,
        filename,
        original_name: file.name,
        mime_type: mimeType,
        file_size: fileSize,
        storage_path: storagePath,
        uploaded_by: authUser?.id ?? null,
      }).select().single()

      if (error) {
        // Limpar ficheiro do disco se falhou a BD
        if (existsSync(storagePath)) unlinkSync(storagePath)
        throw error
      }

      const row = data as Record<string, unknown>
      saved.push({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        filename: row.filename,
        originalName: row.original_name,
        mimeType: row.mime_type,
        fileSize: row.file_size,
        uploadedBy: row.uploaded_by,
        createdAt: row.created_at,
        downloadUrl: `/api/attachments/${row.id}/download`,
      })
    }

    return c.json({ attachments: saved }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not upload attachment')
  }
})

// GET /api/attachments/:id/download — download de ficheiro
app.get('/api/attachments/:id/download', async (c) => {
  try {
    const db = requireDb()
    const { data, error } = await db.from('attachments').select('*').eq('id', c.req.param('id')).single()

    if (error || !data) return jsonError(c, 'Attachment not found', 404)

    const row = data as Record<string, unknown>
    const storagePath = row.storage_path as string

    if (!existsSync(storagePath)) {
      return jsonError(c, 'Ficheiro não encontrado em disco', 404)
    }

    const stat = statSync(storagePath)
    const mimeType = (row.mime_type as string) || 'application/octet-stream'
    const originalName = row.original_name as string

    c.header('Content-Type', mimeType)
    c.header('Content-Length', String(stat.size))
    c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`)
    c.header('Cache-Control', 'private, max-age=3600')

    const stream = createReadStream(storagePath)
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(stat.size),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not download attachment')
  }
})

// DELETE /api/attachments/:id — eliminar anexo
app.delete('/api/attachments/:id', async (c) => {
  try {
    const db = requireDb()

    const { data, error: fetchErr } = await db.from('attachments').select('*').eq('id', c.req.param('id')).single()
    if (fetchErr || !data) return jsonError(c, 'Attachment not found', 404)

    const row = data as Record<string, unknown>

    // Eliminar da BD primeiro
    const { error } = await db.from('attachments').update({
      storage_path: '__deleted__',
    }).eq('id', c.req.param('id'))

    if (error) throw error

    // Eliminar ficheiro do disco
    const storagePath = row.storage_path as string
    if (storagePath && storagePath !== '__deleted__' && existsSync(storagePath)) {
      unlinkSync(storagePath)
    }

    // Remover registo da BD
    await db.from('attachments').update({ storage_path: '__deleted__' }).eq('id', c.req.param('id'))

    return c.json({ ok: true })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not delete attachment')
  }
})

// ── Catch-all ─────────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: 'Not found' }, 404))

// React SPA fallback routes
app.get('/', serveReactShell)
app.get('/landing', serveReactShell)
app.get('/login', serveReactShell)
app.get('/react/index.html', serveReactShell)
app.get('/esqueci-password', serveReactShell)
app.get('/contactar-administrador', serveReactShell)
app.get('/documentacao', serveReactShell)
app.get('/documentacao/*', serveReactShell)
app.get('/api-docs', serveReactShell)
app.get('/changelog', serveReactShell)
app.get('/sobre', serveReactShell)
app.get('/funcionalidades', serveReactShell)
app.get('/blog', serveReactShell)
app.get('/blog/*', serveReactShell)
app.get('/carreiras', serveReactShell)
app.get('/contacto', serveReactShell)
app.get('/parceiros', serveReactShell)
app.get('/casos-de-sucesso', serveReactShell)
app.get('/central-de-ajuda', serveReactShell)
app.get('/privacidade', serveReactShell)
app.get('/termos', serveReactShell)
app.get('/gdpr', serveReactShell)
app.get('/cookies', serveReactShell)

// /superadmin é um atalho: o painel SuperAdmin vive no dashboard legado
// (public/app), não na SPA React nova — por isso redireciona em vez de
// servir a shell React (que não tem esta rota e faz bounce para a landing)
app.get('/superadmin', (c) => c.redirect('/app/?page=superadmin'))
app.get('/superadmin/*', (c) => c.redirect('/app/?page=superadmin'))

// Legacy dashboard shell aliases
app.get('/dashboard', serveLegacyShell)
app.get('/dashboard/*', serveLegacyShell)
app.get('/settings', serveLegacyShell)
app.get('/settings/*', serveLegacyShell)

app.onError((error, c) => {
  console.error('[Unhandled Error]', error)
  if (error instanceof DatabaseNotConfiguredError) {
    return c.json({ error: 'Base de dados não configurada. Verifique as variáveis Supabase no .env.' }, 503)
  }
  return c.json({ error: error.message }, 500)
})

// ── Time Entry Helpers ────────────────────────────────────────────────────────

async function upsertTimeEntry(c: Context, status: 'joined' | 'running') {
  try {
    const db = requireDb()
    const body = await c.req.json()
    const technicianId = body.technicianId
    if (!technicianId) return jsonError(c, 'technicianId is required')

    const { data, error } = await db.rpc('upsert_time_entry', {
      p_work_order_id: c.req.param('id'),
      p_technician_id: technicianId,
      p_status: status,
    })

    if (error) throw error
    return c.json({ timeEntry: data })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update time entry')
  }
}

async function updateTimeEntry(c: Context, action: 'pause' | 'resume' | 'exit') {
  try {
    const db = requireDb()
    const body = await c.req.json()
    const technicianId = body.technicianId
    if (!technicianId) return jsonError(c, 'technicianId is required')

    const { data, error } = await db.rpc('update_time_entry', {
      p_work_order_id: c.req.param('id'),
      p_technician_id: technicianId,
      p_action: action,
    })

    if (error) throw error
    if (error || !data) return jsonError(c, 'Active time entry not found', 404)
    return c.json({ timeEntry: data })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update time entry')
  }
}


// ── Admin: Blog Management ────────────────────────────────────────────────────

const blogDataPath = resolve(process.cwd(), 'data', 'superadmin', 'blog.json')

function readBlog(): { posts: Record<string, unknown>[] } {
  if (!existsSync(blogDataPath)) return { posts: [] }
  try { return JSON.parse(readFileSync(blogDataPath, 'utf-8')) } catch { return { posts: [] } }
}

function writeBlog(data: { posts: Record<string, unknown>[] }) {
  const dir = resolve(process.cwd(), 'data', 'superadmin')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(blogDataPath, JSON.stringify(data, null, 2), 'utf-8')
}

app.get('/api/admin/blog', (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  return c.json(readBlog())
})

app.post('/api/admin/blog', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const body = await c.req.json()
  const data = readBlog()
  const slug = (body.slug || body.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || randomUUID()
  const post = {
    id: randomUUID(), title: body.title || 'Sem título', slug,
    excerpt: body.excerpt || '', content: body.content || '',
    author: body.author || 'SuperAdmin', category: body.category || 'Geral',
    tags: body.tags || [], status: body.status || 'draft',
    featured: body.featured || false, imageUrl: body.imageUrl || '',
    publishedAt: body.status === 'published' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    views: 0, comments: [],
  }
  data.posts.unshift(post)
  writeBlog(data)
  return c.json({ ok: true, post }, 201)
})

app.put('/api/admin/blog/:postId', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const id = c.req.param('postId')
  const body = await c.req.json()
  const data = readBlog()
  const idx = data.posts.findIndex((p) => p.id === id)
  if (idx === -1) return c.json({ error: 'Post não encontrado' }, 404)
  const existing = data.posts[idx] as Record<string, unknown>
  data.posts[idx] = {
    ...existing, ...body, id, updatedAt: new Date().toISOString(),
    publishedAt: body.status === 'published' && !existing.publishedAt ? new Date().toISOString() : (existing.publishedAt || null),
  }
  writeBlog(data)
  return c.json({ ok: true, post: data.posts[idx] })
})

app.delete('/api/admin/blog/:postId', (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const id = c.req.param('postId')
  const data = readBlog()
  data.posts = data.posts.filter((p) => p.id !== id)
  writeBlog(data)
  return c.json({ ok: true })
})

app.put('/api/admin/blog/:postId/comments/:commentId', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const id = c.req.param('postId')
  const commentId = c.req.param('commentId')
  const body = await c.req.json()
  const data = readBlog()
  const post = data.posts.find((p) => p.id === id) as Record<string, unknown> | undefined
  if (!post) return c.json({ error: 'Post não encontrado' }, 404)
  const comments = (post.comments as Record<string, unknown>[]) || []
  const cIdx = comments.findIndex((cm) => cm.id === commentId)
  if (cIdx === -1) {
    comments.push({ id: commentId, ...body, createdAt: new Date().toISOString() })
  } else {
    comments[cIdx] = { ...comments[cIdx], ...body, updatedAt: new Date().toISOString() }
  }
  post.comments = comments
  writeBlog(data)
  return c.json({ ok: true })
})

// ── Admin: Testimonials ───────────────────────────────────────────────────────

const testimonialsDataPath = resolve(process.cwd(), 'data', 'superadmin', 'testimonials.json')

function readTestimonials(): { items: Record<string, unknown>[] } {
  if (!existsSync(testimonialsDataPath)) return { items: [] }
  try { return JSON.parse(readFileSync(testimonialsDataPath, 'utf-8')) } catch { return { items: [] } }
}

function writeTestimonials(data: { items: Record<string, unknown>[] }) {
  const dir = resolve(process.cwd(), 'data', 'superadmin')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(testimonialsDataPath, JSON.stringify(data, null, 2), 'utf-8')
}

app.get('/api/admin/testimonials', (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  return c.json(readTestimonials())
})

app.post('/api/admin/testimonials', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const body = await c.req.json()
  const data = readTestimonials()
  const item = {
    id: randomUUID(), name: body.name || 'Anónimo', role: body.role || '',
    company: body.company || '', text: body.text || '', rating: body.rating || 5,
    photoUrl: body.photoUrl || '', approved: body.approved ?? false,
    featured: body.featured ?? false, createdAt: new Date().toISOString(),
  }
  data.items.unshift(item)
  writeTestimonials(data)
  return c.json({ ok: true, item }, 201)
})

app.put('/api/admin/testimonials/:tId', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const id = c.req.param('tId')
  const body = await c.req.json()
  const data = readTestimonials()
  const idx = data.items.findIndex((i) => i.id === id)
  if (idx === -1) return c.json({ error: 'Testemunho não encontrado' }, 404)
  data.items[idx] = { ...data.items[idx], ...body, id, updatedAt: new Date().toISOString() }
  writeTestimonials(data)
  return c.json({ ok: true, item: data.items[idx] })
})

app.delete('/api/admin/testimonials/:tId', (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const id = c.req.param('tId')
  const data = readTestimonials()
  data.items = data.items.filter((i) => i.id !== id)
  writeTestimonials(data)
  return c.json({ ok: true })
})

// ── Admin: AI Key Quick Test ──────────────────────────────────────────────────

app.post('/api/admin/test-ai', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const body = await c.req.json()
  const provider = (body.provider || 'openai').toLowerCase()
  const key = body.apiKey || ''
  const model = body.model || (provider === 'openai' ? 'gpt-4o-mini' : 'llama3-8b-8192')
  if (!key) return c.json({ ok: false, error: 'API Key não fornecida' }, 400)
  const start = Date.now()
  try {
    const testMsg = [{ role: 'user' as const, content: 'Reply with exactly the word: OK' }]
    let result = ''
    if (provider === 'openai') result = await callOpenAI(testMsg, model, key)
    else if (provider === 'groq') result = await callGroq(testMsg, model, key)
    else return c.json({ ok: false, error: 'Provider desconhecido. Use: openai ou groq' }, 400)
    return c.json({ ok: true, provider, model, latencyMs: Date.now() - start, response: result.slice(0, 200) })
  } catch (error) {
    if (error instanceof AIProviderError) {
      return c.json({ ok: false, provider, model, latencyMs: Date.now() - start, error: error.userMessage, code: error.code })
    }
    return c.json({ ok: false, provider, model, latencyMs: Date.now() - start, error: error instanceof Error ? error.message : 'Erro desconhecido' })
  }
})

// ── Admin: System Logs ────────────────────────────────────────────────────────

const logsBuffer: Array<{ ts: string; level: string; source: string; msg: string }> = []

app.get('/api/admin/logs', (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const level = c.req.query('level') || ''
  const source = c.req.query('source') || ''
  const limit = Math.min(Number(c.req.query('limit') || '100'), 500)
  const systemLogs = [
    { ts: new Date().toISOString(), level: 'info', source: 'system', msg: 'Servidor ativo — ' + Math.floor((Date.now() - SERVER_START_TIME) / 1000) + 's de uptime · v2.2.0' },
    { ts: new Date().toISOString(), level: 'info', source: 'db', msg: supabase ? 'Supabase conectado e operacional' : pgClient ? 'PostgreSQL local conectado (DATABASE_URL)' : 'Sem base de dados — configure SUPABASE_URL ou DATABASE_URL' },
    { ts: new Date().toISOString(), level: Boolean(openaiApiKey || groqApiKey) ? 'info' : 'warn', source: 'ai', msg: Boolean(openaiApiKey || groqApiKey) ? 'IA ativa: ' + aiProvider + ' (' + aiModel + ')' : 'IA não configurada — defina OPENAI_API_KEY ou GROQ_API_KEY' },
    { ts: new Date().toISOString(), level: 'info', source: 'auth', msg: 'JWT sessões ativas · Rate limiting no login ativo · Headers OWASP configurados' },
    { ts: new Date().toISOString(), level: 'info', source: 'storage', msg: 'Uploads em /uploads · Limite: 50MB por ficheiro' },
  ]
  let logs = [...systemLogs, ...logsBuffer].reverse()
  if (level) logs = logs.filter(l => l.level === level)
  if (source) logs = logs.filter(l => l.source === source)
  return c.json({ logs: logs.slice(0, limit), total: logs.length })
})

// ── Admin: Backup & Restore ───────────────────────────────────────────────────

app.get('/api/admin/backup', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const backup: Record<string, unknown> = {
    version: '2.2.0', createdAt: new Date().toISOString(), type: 'full', data: {},
  }
  const sections = ['ai-config', 'landing', 'support', 'blog', 'testimonials']
  const dataDir = resolve(process.cwd(), 'data', 'superadmin')
  for (const section of sections) {
    const filePath = join(dataDir, section + '.json')
    if (existsSync(filePath)) {
      try { (backup.data as Record<string, unknown>)[section] = JSON.parse(readFileSync(filePath, 'utf-8')) } catch { /* skip */ }
    }
  }
  try {
    const db = requireDb()
    const stats: Record<string, unknown> = {}
    const tables = ['users','work_orders','equipment','clients','teams','quotes','notifications','attachments']
    for (const t of tables) {
      try {
        const { count } = await db.from(t as string).select('*', { count: 'exact', head: true }) as { count: number | null }
        stats[t] = count ?? 0
      } catch { stats[t] = 'N/A' }
    }
    backup.dbStats = stats
  } catch { /* no db */ }
  return c.json(backup)
})

app.post('/api/admin/backup/restore', async (c) => {
  const auth = requireSuperAdminUser(c)
  if (!auth.ok) return c.json({ error: auth.message }, auth.status)
  const body = await c.req.json()
  if (!body.data) return c.json({ error: 'Backup inválido: campo "data" em falta' }, 400)
  const restored: string[] = []
  const errors: string[] = []
  const dataDir = resolve(process.cwd(), 'data', 'superadmin')
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  const allowed = ['ai-config', 'landing', 'support', 'blog', 'testimonials']
  for (const section of allowed) {
    if (body.data[section]) {
      try {
        writeFileSync(join(dataDir, section + '.json'), JSON.stringify(body.data[section], null, 2), 'utf-8')
        restored.push(section)
      } catch (e) { errors.push(section + ': ' + (e instanceof Error ? e.message : 'erro')) }
    }
  }
  return c.json({ ok: errors.length === 0, restored, errors, restoredAt: new Date().toISOString() })
})

// ── Server Bootstrap ──────────────────────────────────────────────────────────

const hasAI = Boolean(openaiApiKey || groqApiKey)
const dbStatus = supabase
  ? '✅ Supabase conectado'
  : pgClient
    ? '✅ PostgreSQL local (DATABASE_URL)'
    : '⚠️  Sem base de dados (configure SUPABASE_URL ou DATABASE_URL no .env)'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  ManuGent API v2.2.0')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
if (hasAI) {
  console.log(`  IA: ✅ ${aiProvider.toUpperCase()} (${aiModel})`)
} else {
  console.log('  IA: ⚠️  Sem configuração (defina OPENAI_API_KEY ou GROQ_API_KEY)')
}
console.log(`  DB: ${dbStatus}`)
console.log(`  Uploads: ${uploadsDir}`)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`  URL: http://localhost:${info.port}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})
