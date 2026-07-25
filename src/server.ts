import 'dotenv/config'

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Pool } from 'pg'

// ── Configuration ───────────────────────────────────────────────────────────

const port = Number(process.env.PORT ?? 3000)
const databaseUrl = process.env.DATABASE_URL
const openaiApiKey = process.env.OPENAI_API_KEY || ''
const groqApiKey = process.env.GROQ_API_KEY || ''
const aiProvider = (process.env.AI_PROVIDER || 'groq').toLowerCase() // 'openai' | 'groq' | 'none'
const aiModel = process.env.AI_MODEL || (aiProvider === 'openai' ? 'gpt-4o-mini' : 'llama3-8b-8192')

// ── Database ─────────────────────────────────────────────────────────────────

const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : undefined

// ── App Setup ─────────────────────────────────────────────────────────────────

const app = new Hono()
const publicDir = resolve(process.cwd(), 'public')

app.use('*', logger())
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

// ── Domain Constants ──────────────────────────────────────────────────────────

const workOrderTypes = ['preventive', 'inspection', 'round', 'checklist', 'corrective', 'breakdown', 'emergency', 'customer_request']
const scheduledTypes = ['preventive', 'inspection', 'round', 'checklist']
const workOrderStatuses = ['open', 'scheduled', 'in_progress', 'paused', 'waiting_material', 'waiting_customer', 'completed', 'cancelled']
const triggeringFindingTypes = ['nok', 'defect', 'measurement_out_of_limits', 'failure']

// ── Schema Setup ──────────────────────────────────────────────────────────────

async function ensureSchema() {
  if (!pool) return

  await pool.query(`
    create extension if not exists pgcrypto;

    create table if not exists clients (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      email text,
      phone text,
      created_at timestamptz not null default now()
    );

    create table if not exists equipment (
      id uuid primary key default gen_random_uuid(),
      client_id uuid not null references clients(id),
      code text not null,
      name text not null,
      brand text,
      model text,
      serial text,
      location text,
      criticality text default 'normal',
      status text default 'active',
      created_at timestamptz not null default now()
    );

    create table if not exists teams (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      team_id uuid references teams(id),
      name text not null,
      email text,
      role text not null default 'technician',
      created_at timestamptz not null default now()
    );

    create table if not exists work_orders (
      id uuid primary key default gen_random_uuid(),
      parent_work_order_id uuid references work_orders(id),
      client_id uuid not null references clients(id),
      equipment_id uuid not null references equipment(id),
      team_id uuid references teams(id),
      supervisor_id uuid references users(id),
      type text not null check (type in ('preventive', 'inspection', 'round', 'checklist', 'corrective', 'breakdown', 'emergency', 'customer_request')),
      origin text not null check (origin in ('scheduled', 'request')),
      status text not null default 'open' check (status in ('open', 'scheduled', 'in_progress', 'paused', 'waiting_material', 'waiting_customer', 'completed', 'cancelled')),
      priority text not null default 'normal',
      title text not null,
      description text,
      scheduled_for timestamptz,
      started_at timestamptz,
      completed_at timestamptz,
      cancelled_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists work_order_findings (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      type text not null check (type in ('ok', 'nok', 'defect', 'measurement_out_of_limits', 'failure', 'note')),
      description text not null,
      measurement_value numeric,
      limit_min numeric,
      limit_max numeric,
      created_by uuid references users(id),
      created_at timestamptz not null default now()
    );

    create table if not exists work_order_links (
      id uuid primary key default gen_random_uuid(),
      source_work_order_id uuid not null references work_orders(id) on delete cascade,
      target_work_order_id uuid not null references work_orders(id) on delete cascade,
      reason text not null,
      created_at timestamptz not null default now(),
      unique (source_work_order_id, target_work_order_id, reason)
    );

    create table if not exists notifications (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      recipient_user_id uuid references users(id),
      recipient_team_id uuid references teams(id),
      recipient_role text,
      channel text not null default 'in_app',
      title text not null,
      message text not null,
      read_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists work_order_time_entries (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      technician_id uuid not null references users(id),
      status text not null default 'joined' check (status in ('joined', 'running', 'paused', 'finished')),
      started_at timestamptz,
      paused_at timestamptz,
      resumed_at timestamptz,
      ended_at timestamptz,
      effective_seconds integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create unique index if not exists active_work_order_technician
      on work_order_time_entries (work_order_id, technician_id)
      where status in ('joined', 'running', 'paused');

    create table if not exists intervention_reports (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      client_id uuid not null references clients(id),
      equipment_id uuid not null references equipment(id),
      title text not null,
      summary text not null,
      actions_performed text,
      recommendations text,
      created_by uuid references users(id),
      created_at timestamptz not null default now()
    );

    create table if not exists quotes (
      id uuid primary key default gen_random_uuid(),
      work_order_id uuid not null references work_orders(id) on delete cascade,
      client_id uuid not null references clients(id),
      reference text not null,
      description text not null,
      amount numeric(12, 2) not null,
      currency text not null default 'EUR',
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
      approved_by text,
      approved_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists ai_conversations (
      id uuid primary key default gen_random_uuid(),
      session_id text not null,
      user_role text not null default 'admin',
      messages jsonb not null default '[]',
      context_data jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists idx_ai_conversations_session on ai_conversations(session_id);
  `)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class DatabaseNotConfiguredError extends Error {
  constructor() { super('DATABASE_URL is not configured') }
}

function requirePool() {
  if (!pool) throw new DatabaseNotConfiguredError()
  return pool
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

COMPORTAMENTO:
- Responda sempre em português europeu (pt-PT)
- Seja preciso, técnico e objetivo
- Quando identificar um problema crítico, destaque-o claramente
- Se o contexto incluir dados de OTs, equipamentos ou clientes, use-os para enriquecer a resposta
- Para diagnósticos, peça sempre informações adicionais se necessário
- Sugira ações concretas e mensuráveis
- Mantenha histórico da conversa para contexto contínuo

FORMATO:
- Use markdown quando apropriado (listas, negrito, headers)
- Para procedimentos técnicos, use numeração passo a passo
- Mantenha respostas concisas mas completas (máx. 500 palavras por resposta por defeito)
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
    return new AIProviderError(
      provider,
      status,
      'provider_quota',
      `A quota da ${providerName} está esgotada ou indisponível. O Assistente IA ManuGent continua em modo local.`,
      message
    )
  }

  if (status === 401 || status === 403 || normalized.includes('invalid_api_key') || normalized.includes('unauthorized')) {
    return new AIProviderError(
      provider,
      status,
      'provider_auth',
      `A chave da ${providerName} não foi aceite. Confirme a chave nas configurações do servidor.`,
      message
    )
  }

  return new AIProviderError(
    provider,
    status,
    'provider_unavailable',
    `A API da ${providerName} não respondeu corretamente. O Assistente IA ManuGent continua em modo local.`,
    message
  )
}

async function callOpenAI(messages: AIMessage[], model: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as Record<string, unknown>
    throw classifyAIProviderError('openai', response.status, error, `OpenAI error ${response.status}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0]?.message?.content || ''
}

async function callGroq(messages: AIMessage[], model: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as Record<string, unknown>
    throw classifyAIProviderError('groq', response.status, error, `Groq error ${response.status}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
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

  // Fallback: try any available provider
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

  return lines.join('\n')
}

// ── Routes: Health ────────────────────────────────────────────────────────────

app.get('/api/health', (c) => {
  const hasAI = Boolean(openaiApiKey || groqApiKey)
  return c.json({
    ok: true,
    service: 'manugent-api',
    version: '2.0.0',
    ai: {
      enabled: hasAI,
      provider: hasAI ? aiProvider : 'none',
      model: hasAI ? aiModel : null,
    },
    database: Boolean(pool),
  })
})

app.get('/api/db/health', async (c) => {
  if (!pool) {
    return c.json({ ok: false, error: 'DATABASE_URL is not configured' }, 500)
  }

  try {
    const result = await pool.query<{ now: Date }>('select now() as now')
    return c.json({ ok: true, now: result.rows[0]?.now })
  } catch (error) {
    return c.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
    }, 500)
  }
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

    const contextMessage = buildContextMessage(body.context || {})

    // Build messages array for the AI
    const messages: AIMessage[] = [
      { role: 'system', content: MANUGENT_SYSTEM_PROMPT },
    ]

    // Add context as system message if available
    if (contextMessage) {
      messages.push({ role: 'system', content: contextMessage })
    }

    // Add conversation history (last 10 messages)
    const history = Array.isArray(body.history) ? body.history.slice(-10) : []
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: body.message })

    const result = await callAI(messages)

    // Persist conversation to DB if available
    if (pool && body.sessionId) {
      await pool.query(
        `insert into ai_conversations (session_id, user_role, messages, context_data, updated_at)
         values ($1, $2, $3::jsonb, $4::jsonb, now())
         on conflict (id) do nothing`,
        [
          body.sessionId,
          body.context?.userRole || 'unknown',
          JSON.stringify([...history, { role: 'user', content: body.message }, { role: 'assistant', content: result.text }]),
          JSON.stringify(body.context || {}),
        ]
      ).catch(() => {/* ignore DB errors for conversation persistence */})
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

app.get('/api/ai/status', (c) => {
  const hasOpenAI = Boolean(openaiApiKey)
  const hasGroq = Boolean(groqApiKey)
  const configured = hasOpenAI || hasGroq

  return c.json({
    configured,
    provider: configured ? aiProvider : 'none',
    model: configured ? aiModel : null,
    providers: {
      openai: hasOpenAI,
      groq: hasGroq,
    },
    message: configured
      ? `IA ativa: ${aiProvider} (${aiModel})`
      : 'Configure OPENAI_API_KEY ou GROQ_API_KEY para ativar a IA',
  })
})

// ── Routes: Work Orders ───────────────────────────────────────────────────────

app.get('/api/work-orders', async (c) => {
  const db = requirePool()
  const tab = c.req.query('tab')
  const status = c.req.query('status')
  const origin = tab === 'agendadas' || tab === 'scheduled'
    ? 'scheduled'
    : tab === 'pedidos' || tab === 'requests'
    ? 'request'
    : undefined

  const result = await db.query(
    `select
       wo.*,
       c.name as client_name,
       e.name as equipment_name,
       t.name as team_name
     from work_orders wo
     join clients c on c.id = wo.client_id
     join equipment e on e.id = wo.equipment_id
     left join teams t on t.id = wo.team_id
     where ($1::text is null or wo.origin = $1)
       and ($2::text is null or wo.status = $2)
     order by wo.created_at desc`,
    [origin ?? null, status ?? null]
  )

  return c.json({ workOrders: result.rows.map(mapWorkOrder) })
})

app.get('/api/work-orders/:id', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `select
       wo.*,
       c.name as client_name,
       e.name as equipment_name,
       t.name as team_name
     from work_orders wo
     join clients c on c.id = wo.client_id
     join equipment e on e.id = wo.equipment_id
     left join teams t on t.id = wo.team_id
     where wo.id = $1`,
    [c.req.param('id')]
  )

  if (result.rowCount === 0) return jsonError(c, 'Work order not found', 404)
  return c.json({ workOrder: mapWorkOrder(result.rows[0]) })
})

app.get('/api/notifications', async (c) => {
  const db = requirePool()
  const workOrderId = c.req.query('workOrderId')
  const unread = c.req.query('unread') === 'true'

  const result = await db.query(
    `select *
     from notifications
     where ($1::uuid is null or work_order_id = $1)
       and ($2::boolean is false or read_at is null)
     order by created_at desc
     limit 50`,
    [workOrderId ?? null, unread]
  )

  return c.json({ notifications: result.rows })
})

app.post('/api/notifications/:id/read', async (c) => {
  const db = requirePool()

  await db.query(
    `update notifications set read_at = now() where id = $1`,
    [c.req.param('id')]
  )

  return c.json({ ok: true })
})

app.post('/api/notifications/read-all', async (c) => {
  const db = requirePool()

  await db.query(`update notifications set read_at = now() where read_at is null`)

  return c.json({ ok: true })
})

// ── Routes: Dashboard Stats ───────────────────────────────────────────────────

app.get('/api/stats', async (c) => {
  const db = requirePool()

  const [otStats, equipStats, notifStats] = await Promise.all([
    db.query(`
      select
        count(*) filter (where status not in ('completed', 'cancelled')) as open_total,
        count(*) filter (where status = 'in_progress') as in_progress,
        count(*) filter (where priority in ('high', 'urgent') and status not in ('completed', 'cancelled')) as urgent,
        count(*) filter (where status = 'completed') as completed,
        count(*) as total
      from work_orders
    `),
    db.query(`
      select
        count(*) as total,
        count(*) as active
      from equipment
    `),
    db.query(`
      select count(*) filter (where read_at is null) as unread from notifications
    `),
  ])

  return c.json({
    workOrders: {
      open: Number(otStats.rows[0]?.open_total ?? 0),
      inProgress: Number(otStats.rows[0]?.in_progress ?? 0),
      urgent: Number(otStats.rows[0]?.urgent ?? 0),
      completed: Number(otStats.rows[0]?.completed ?? 0),
      total: Number(otStats.rows[0]?.total ?? 0),
    },
    equipment: {
      total: Number(equipStats.rows[0]?.total ?? 0),
      active: Number(equipStats.rows[0]?.active ?? 0),
    },
    notifications: {
      unread: Number(notifStats.rows[0]?.unread ?? 0),
    },
  })
})

// ── Routes: Clients & Equipment ───────────────────────────────────────────────

app.get('/api/clients', async (c) => {
  const db = requirePool()
  const result = await db.query('select * from clients order by name asc')
  return c.json({ clients: result.rows })
})

app.post('/api/clients', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()
    if (!body.name) return jsonError(c, 'name é obrigatório')

    const result = await db.query(
      'insert into clients (name, email, phone) values ($1, $2, $3) returning *',
      [body.name, body.email ?? null, body.phone ?? null]
    )
    return c.json({ client: result.rows[0] }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create client')
  }
})

app.get('/api/equipment', async (c) => {
  const db = requirePool()
  const clientId = c.req.query('clientId')

  const result = await db.query(
    `select e.*, c.name as client_name
     from equipment e
     join clients c on c.id = e.client_id
     where ($1::uuid is null or e.client_id = $1)
     order by e.name asc`,
    [clientId ?? null]
  )
  return c.json({ equipment: result.rows })
})

app.post('/api/equipment', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()
    if (!body.clientId) return jsonError(c, 'clientId é obrigatório')
    if (!body.name) return jsonError(c, 'name é obrigatório')
    if (!body.code) return jsonError(c, 'code é obrigatório')

    const result = await db.query(
      `insert into equipment (client_id, code, name, brand, model, serial, location, criticality, status)
       values ($1, $2, $3, $4, $5, $6, $7, coalesce($8, 'normal'), coalesce($9, 'active'))
       returning *`,
      [body.clientId, body.code, body.name, body.brand ?? null, body.model ?? null,
       body.serial ?? null, body.location ?? null, body.criticality ?? null, body.status ?? null]
    )
    return c.json({ equipment: result.rows[0] }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create equipment')
  }
})

// ── Routes: Teams & Users ─────────────────────────────────────────────────────

app.get('/api/teams', async (c) => {
  const db = requirePool()
  const result = await db.query('select * from teams order by name asc')
  return c.json({ teams: result.rows })
})

app.get('/api/users', async (c) => {
  const db = requirePool()
  const result = await db.query(
    `select u.*, t.name as team_name
     from users u
     left join teams t on t.id = u.team_id
     order by u.name asc`
  )
  return c.json({ users: result.rows })
})

// ── Routes: Work Order CRUD ───────────────────────────────────────────────────

app.post('/api/work-orders/demo/bootstrap', async (c) => {
  const db = requirePool()
  const tx = await db.connect()

  try {
    await tx.query('begin')

    const team = await tx.query(
      `insert into teams (name) values ('Equipa Manutencao') returning id`
    )

    const client = await tx.query(
      `insert into clients (name, email) values ('Cliente Demo', 'demo@manugent.pt') returning id, name`
    )

    const equipment = await tx.query(
      `insert into equipment (client_id, code, name, location, criticality, status)
       values ($1, 'EQ-001', 'Bomba Principal', 'Linha 1', 'critical', 'active')
       returning id, code, name, location`,
      [client.rows[0].id]
    )

    const supervisor = await tx.query(
      `insert into users (team_id, name, email, role)
       values ($1, 'Supervisor Demo', 'supervisor@manugent.pt', 'supervisor')
       returning id, name, role`,
      [team.rows[0].id]
    )

    const technician = await tx.query(
      `insert into users (team_id, name, email, role)
       values ($1, 'Tecnico Demo', 'tecnico@manugent.pt', 'technician')
       returning id, name, role`,
      [team.rows[0].id]
    )

    const workOrder = await tx.query(
      `insert into work_orders (
         client_id, equipment_id, team_id, supervisor_id, type, origin, status,
         priority, title, description, scheduled_for
       )
       values (
         $1, $2, $3, $4, 'preventive', 'scheduled', 'scheduled',
         'high', 'Preventiva mensal - Bomba Principal',
         'Inspecao programada com medicao de vibracao no rolamento.',
         now() + interval '1 day'
       )
       returning *`,
      [client.rows[0].id, equipment.rows[0].id, team.rows[0].id, supervisor.rows[0].id]
    )

    await tx.query('commit')

    return c.json({
      client: client.rows[0],
      equipment: equipment.rows[0],
      team: team.rows[0],
      supervisor: supervisor.rows[0],
      technician: technician.rows[0],
      workOrder: mapWorkOrder(workOrder.rows[0]),
    }, 201)
  } catch (error) {
    await tx.query('rollback')
    return jsonError(c, error instanceof Error ? error.message : 'Could not bootstrap demo flow')
  } finally {
    tx.release()
  }
})

app.post('/api/work-orders', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()
    const type = assertOption(body.type, workOrderTypes, 'type')
    const status = body.status
      ? assertOption(body.status, workOrderStatuses, 'status')
      : originForType(type) === 'scheduled' ? 'scheduled' : 'open'

    const result = await db.query(
      `insert into work_orders (
         client_id, equipment_id, team_id, supervisor_id, type, origin, status,
         priority, title, description, scheduled_for
       )
       values ($1, $2, $3, $4, $5, $6, $7, coalesce($8, 'normal'), $9, $10, $11)
       returning *`,
      [
        body.clientId, body.equipmentId, body.teamId ?? null,
        body.supervisorId ?? null, type, originForType(type), status,
        body.priority ?? null, body.title, body.description ?? null,
        body.scheduledFor ?? null,
      ]
    )

    return c.json({ workOrder: mapWorkOrder(result.rows[0]) }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create work order')
  }
})

app.post('/api/work-orders/:id/status', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()
    const status = assertOption(body.status, workOrderStatuses, 'status')

    const result = await db.query(
      `update work_orders
       set status = $2,
           started_at = case when $2 = 'in_progress' and started_at is null then now() else started_at end,
           completed_at = case when $2 = 'completed' then now() else completed_at end,
           cancelled_at = case when $2 = 'cancelled' then now() else cancelled_at end,
           updated_at = now()
       where id = $1
       returning *`,
      [c.req.param('id'), status]
    )

    if (result.rowCount === 0) return jsonError(c, 'Work order not found', 404)
    return c.json({ workOrder: mapWorkOrder(result.rows[0]) })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update status')
  }
})

app.post('/api/work-orders/:id/findings', async (c) => {
  const db = requirePool()
  const body = await c.req.json()
  const findings = Array.isArray(body.findings) ? body.findings : [body]
  const tx = await db.connect()

  try {
    await tx.query('begin')

    const workOrderResult = await tx.query(
      'select * from work_orders where id = $1 for update',
      [c.req.param('id')]
    )
    const workOrder = workOrderResult.rows[0]
    if (!workOrder) throw new Error('Work order not found')

    const createdFindings = []
    let shouldCreateRequest = false

    for (const finding of findings) {
      const type = assertOption(
        finding.type,
        ['ok', 'nok', 'defect', 'measurement_out_of_limits', 'failure', 'note'],
        'finding.type'
      )

      const measurementOutOfLimits =
        typeof finding.measurementValue === 'number' &&
        ((typeof finding.limitMin === 'number' && finding.measurementValue < finding.limitMin) ||
          (typeof finding.limitMax === 'number' && finding.measurementValue > finding.limitMax))

      shouldCreateRequest = shouldCreateRequest || triggeringFindingTypes.includes(type) || measurementOutOfLimits

      const result = await tx.query(
        `insert into work_order_findings (
           work_order_id, type, description, measurement_value, limit_min, limit_max, created_by
         )
         values ($1, $2, $3, $4, $5, $6, $7)
         returning *`,
        [
          workOrder.id,
          measurementOutOfLimits ? 'measurement_out_of_limits' : type,
          finding.description,
          finding.measurementValue ?? null,
          finding.limitMin ?? null,
          finding.limitMax ?? null,
          finding.createdBy ?? null,
        ]
      )
      createdFindings.push(result.rows[0])
    }

    let interventionRequest = null

    if (workOrder.origin === 'scheduled' && shouldCreateRequest) {
      const requestResult = await tx.query(
        `insert into work_orders (
           parent_work_order_id, client_id, equipment_id, team_id, supervisor_id,
           type, origin, status, priority, title, description
         )
         values ($1, $2, $3, $4, $5, 'corrective', 'request', 'open', 'high', $6, $7)
         returning *`,
        [
          workOrder.id,
          workOrder.client_id,
          workOrder.equipment_id,
          workOrder.team_id,
          workOrder.supervisor_id,
          `Pedido de intervencao - ${workOrder.title}`,
          'Criado automaticamente por resultado NOK, defeito, medicao fora dos limites ou falha identificada.',
        ]
      )

      interventionRequest = requestResult.rows[0]

      await tx.query(
        `insert into work_order_links (source_work_order_id, target_work_order_id, reason)
         values ($1, $2, 'scheduled_finding')
         on conflict do nothing`,
        [workOrder.id, interventionRequest.id]
      )

      await tx.query(
        `insert into notifications (work_order_id, recipient_user_id, recipient_team_id, recipient_role, title, message)
         values
           ($1, $2, null, 'supervisor', 'Pedido de intervencao criado', $3),
           ($1, null, $4, 'team', 'Pedido de intervencao criado', $3)`,
        [
          interventionRequest.id,
          workOrder.supervisor_id,
          `Criado automaticamente a partir da OT agendada ${workOrder.title}.`,
          workOrder.team_id,
        ]
      )
    }

    await tx.query('commit')

    return c.json({
      findings: createdFindings,
      interventionRequest: interventionRequest ? mapWorkOrder(interventionRequest) : null,
    }, interventionRequest ? 201 : 200)
  } catch (error) {
    await tx.query('rollback')
    return jsonError(c, error instanceof Error ? error.message : 'Could not register findings')
  } finally {
    tx.release()
  }
})

// ── Routes: Time Tracking ─────────────────────────────────────────────────────

app.post('/api/work-orders/:id/time/join', (c) => upsertTimeEntry(c, 'joined'))
app.post('/api/work-orders/:id/time/start', (c) => upsertTimeEntry(c, 'running'))
app.post('/api/work-orders/:id/time/pause', (c) => updateTimeEntry(c, 'pause'))
app.post('/api/work-orders/:id/time/resume', (c) => updateTimeEntry(c, 'resume'))
app.post('/api/work-orders/:id/time/exit', (c) => updateTimeEntry(c, 'exit'))

app.get('/api/work-orders/:id/time', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `select te.*, u.name as technician_name
     from work_order_time_entries te
     join users u on u.id = te.technician_id
     where te.work_order_id = $1
     order by te.created_at asc`,
    [c.req.param('id')]
  )

  const totalSeconds = result.rows.reduce((sum: number, row: Record<string, unknown>) => {
    return sum + (Number(row.effective_seconds) || 0)
  }, 0)

  return c.json({ timeEntries: result.rows, totalSeconds })
})

// ── Routes: Client Portal ─────────────────────────────────────────────────────

app.post('/api/client-portal/requests', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()

    const result = await db.query(
      `insert into work_orders (
         client_id, equipment_id, type, origin, status, priority, title, description
       )
       values ($1, $2, 'customer_request', 'request', 'open', coalesce($3, 'normal'), $4, $5)
       returning *`,
      [body.clientId, body.equipmentId, body.priority ?? null, body.title, body.description ?? null]
    )

    await db.query(
      `insert into notifications (work_order_id, recipient_role, title, message)
       values ($1, 'supervisor', 'Novo pedido do cliente', $2)`,
      [result.rows[0].id, `Cliente abriu pedido: ${body.title}`]
    )

    return c.json({ request: mapWorkOrder(result.rows[0]) }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create customer request')
  }
})

app.get('/api/client-portal/clients/:clientId/work-orders', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `select wo.*, cl.name as client_name, e.name as equipment_name, t.name as team_name
     from work_orders wo
     join clients cl on cl.id = wo.client_id
     join equipment e on e.id = wo.equipment_id
     left join teams t on t.id = wo.team_id
     where wo.client_id = $1
     order by wo.created_at desc`,
    [c.req.param('clientId')]
  )

  return c.json({ workOrders: result.rows.map(mapWorkOrder) })
})

app.get('/api/client-portal/clients/:clientId/equipment/:equipmentId/history', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `select wo.*, cl.name as client_name, e.name as equipment_name, t.name as team_name
     from work_orders wo
     join clients cl on cl.id = wo.client_id
     join equipment e on e.id = wo.equipment_id
     left join teams t on t.id = wo.team_id
     where wo.client_id = $1 and wo.equipment_id = $2
     order by wo.created_at desc`,
    [c.req.param('clientId'), c.req.param('equipmentId')]
  )

  return c.json({ history: result.rows.map(mapWorkOrder) })
})

app.get('/api/client-portal/clients/:clientId/reports', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `select ir.*, wo.status as work_order_status, wo.title as work_order_title, e.name as equipment_name
     from intervention_reports ir
     join work_orders wo on wo.id = ir.work_order_id
     join equipment e on e.id = ir.equipment_id
     where ir.client_id = $1
     order by ir.created_at desc`,
    [c.req.param('clientId')]
  )

  return c.json({ reports: result.rows })
})

// ── Routes: Reports ───────────────────────────────────────────────────────────

app.post('/api/work-orders/:id/reports', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()

    const workOrderResult = await db.query('select * from work_orders where id = $1', [c.req.param('id')])
    const workOrder = workOrderResult.rows[0]
    if (!workOrder) return jsonError(c, 'Work order not found', 404)

    const result = await db.query(
      `insert into intervention_reports (
         work_order_id, client_id, equipment_id, title, summary,
         actions_performed, recommendations, created_by
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        workOrder.id, workOrder.client_id, workOrder.equipment_id,
        body.title ?? `Relatorio - ${workOrder.title}`,
        body.summary,
        body.actionsPerformed ?? null,
        body.recommendations ?? null,
        body.createdBy ?? null,
      ]
    )

    return c.json({ report: result.rows[0] }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create intervention report')
  }
})

app.get('/api/client-portal/reports/:reportId/pdf', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `select ir.*, cl.name as client_name, e.name as equipment_name, e.code as equipment_code,
            wo.title as work_order_title, wo.status as work_order_status
     from intervention_reports ir
     join clients cl on cl.id = ir.client_id
     join equipment e on e.id = ir.equipment_id
     join work_orders wo on wo.id = ir.work_order_id
     where ir.id = $1`,
    [c.req.param('reportId')]
  )

  const report = result.rows[0]
  if (!report) return jsonError(c, 'Report not found', 404)

  const pdf = buildSimplePdf([
    'ManuGent - Relatorio de Intervencao',
    `Cliente: ${report.client_name}`,
    `Equipamento: ${report.equipment_code} - ${report.equipment_name}`,
    `OT: ${report.work_order_title}`,
    `Estado: ${report.work_order_status}`,
    `Resumo: ${report.summary}`,
    `Acoes: ${report.actions_performed ?? '-'}`,
    `Recomendacoes: ${report.recommendations ?? '-'}`,
    `Data: ${report.created_at}`,
  ])

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${report.id}.pdf"`,
    },
  })
})

// ── Routes: Quotes ────────────────────────────────────────────────────────────

app.post('/api/work-orders/:id/quotes', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json()

    const workOrderResult = await db.query('select * from work_orders where id = $1', [c.req.param('id')])
    const workOrder = workOrderResult.rows[0]
    if (!workOrder) return jsonError(c, 'Work order not found', 404)

    const result = await db.query(
      `insert into quotes (work_order_id, client_id, reference, description, amount, currency)
       values ($1, $2, $3, $4, $5, coalesce($6, 'EUR'))
       returning *`,
      [workOrder.id, workOrder.client_id, body.reference, body.description, body.amount, body.currency ?? null]
    )

    return c.json({ quote: result.rows[0] }, 201)
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not create quote')
  }
})

app.get('/api/client-portal/clients/:clientId/quotes', async (c) => {
  const db = requirePool()

  const result = await db.query(
    `select q.*, wo.title as work_order_title
     from quotes q
     join work_orders wo on wo.id = q.work_order_id
     where q.client_id = $1
     order by q.created_at desc`,
    [c.req.param('clientId')]
  )

  return c.json({ quotes: result.rows })
})

app.post('/api/client-portal/quotes/:quoteId/approve', async (c) => {
  try {
    const db = requirePool()
    const body = await c.req.json().catch(() => ({}))

    const result = await db.query(
      `update quotes
       set status = 'approved', approved_by = $2, approved_at = now(), updated_at = now()
       where id = $1 and status = 'pending'
       returning *`,
      [c.req.param('quoteId'), (body as Record<string, unknown>).approvedBy ?? 'client']
    )

    if (result.rowCount === 0) return jsonError(c, 'Pending quote not found', 404)

    await db.query(
      `insert into notifications (work_order_id, recipient_role, title, message)
       values ($1, 'supervisor', 'Orcamento aprovado', $2)`,
      [result.rows[0].work_order_id, `Orcamento ${result.rows[0].reference} aprovado pelo cliente.`]
    )

    return c.json({ quote: result.rows[0] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not approve quote')
  }
})

// ── Catch-all ─────────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: 'Not found' }, 404))
// ── React SPA fallback ────────────────────────────────────────────────────
// Public React shell routes
app.get('/', serveReactShell)
app.get('/landing', serveReactShell)
app.get('/login', serveReactShell)
app.get('/react/index.html', serveReactShell)

// Legacy dashboard shell aliases
app.get('/dashboard', serveLegacyShell)
app.get('/dashboard/*', serveLegacyShell)
app.get('/settings', serveLegacyShell)
app.get('/settings/*', serveLegacyShell)
app.onError((error, c) => {
  console.error('[Unhandled Error]', error)
  if (error instanceof DatabaseNotConfiguredError) {
    return c.json({ error: 'Base de dados não configurada. Configure DATABASE_URL no .env.' }, 503)
  }
  return c.json({ error: error.message }, 500)
})

// ── Time Entry Helpers ────────────────────────────────────────────────────────

async function upsertTimeEntry(c: Context, status: 'joined' | 'running') {
  try {
    const db = requirePool()
    const body = await c.req.json()
    const technicianId = body.technicianId
    if (!technicianId) return jsonError(c, 'technicianId is required')

    const result = await db.query(
      `insert into work_order_time_entries (work_order_id, technician_id, status, started_at)
       values ($1, $2, $3, case when $3 = 'running' then now() else null end)
       on conflict (work_order_id, technician_id) where status in ('joined', 'running', 'paused')
       do update set
         status = $3,
         started_at = coalesce(work_order_time_entries.started_at, case when $3 = 'running' then now() else null end),
         resumed_at = case when $3 = 'running' then now() else work_order_time_entries.resumed_at end,
         updated_at = now()
       returning *`,
      [c.req.param('id'), technicianId, status]
    )

    if (status === 'running') {
      await db.query(
        `update work_orders
         set status = 'in_progress', started_at = coalesce(started_at, now()), updated_at = now()
         where id = $1`,
        [c.req.param('id')]
      )
    }

    return c.json({ timeEntry: result.rows[0] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update time entry')
  }
}

async function updateTimeEntry(c: Context, action: 'pause' | 'resume' | 'exit') {
  try {
    const db = requirePool()
    const body = await c.req.json()
    const technicianId = body.technicianId
    if (!technicianId) return jsonError(c, 'technicianId is required')

    const status = action === 'pause' ? 'paused' : action === 'resume' ? 'running' : 'finished'

    const result = await db.query(
      `update work_order_time_entries
       set
         effective_seconds = effective_seconds + case
           when status = 'running' and $3 in ('paused', 'finished')
             then greatest(0, extract(epoch from (now() - coalesce(resumed_at, started_at)))::integer)
           else 0
         end,
         status = $3,
         paused_at = case when $3 = 'paused' then now() else paused_at end,
         resumed_at = case when $3 = 'running' then now() when $3 = 'finished' then null else resumed_at end,
         ended_at = case when $3 = 'finished' then now() else ended_at end,
         updated_at = now()
       where work_order_id = $1 and technician_id = $2 and status in ('joined', 'running', 'paused')
       returning *`,
      [c.req.param('id'), technicianId, status]
    )

    if (result.rowCount === 0) return jsonError(c, 'Active time entry not found', 404)

    if (action === 'pause') {
      await db.query(
        `update work_orders set status = 'paused', updated_at = now() where id = $1`,
        [c.req.param('id')]
      )
    }

    return c.json({ timeEntry: result.rows[0] })
  } catch (error) {
    return jsonError(c, error instanceof Error ? error.message : 'Could not update time entry')
  }
}

// ── Server Bootstrap ──────────────────────────────────────────────────────────

ensureSchema()
  .then(() => {
    const hasAI = Boolean(openaiApiKey || groqApiKey)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  ManuGent API v2.0.0')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (hasAI) {
      console.log(`  IA: ✅ ${aiProvider.toUpperCase()} (${aiModel})`)
    } else {
      console.log('  IA: ⚠️  Sem configuração (defina OPENAI_API_KEY ou GROQ_API_KEY)')
    }
    console.log(`  DB: ${pool ? '✅ PostgreSQL conectado' : '⚠️  Sem base de dados (modo local)'}`)

    serve({ fetch: app.fetch, port }, (info) => {
      console.log(`  URL: http://localhost:${info.port}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })
  })
  .catch((error) => {
    console.error('Falha ao inicializar schema da base de dados:', error)
    process.exit(1)
  })
