#!/usr/bin/env node
// ============================================================================
// ManuGent — Seed de Dados Fictícios (base de dados Postgres REAL)
//
// Popula a base de dados real (a mesma que a API/SPA legada e o SuperAdmin
// consomem em src/server.ts) com um conjunto de dados fictícios completo e
// relacional, para que a plataforma pareça estar em produção mesmo sem
// dados reais de clientes.
//
// Uso:
//   npm run db:seed
//   (ou diretamente) DATABASE_URL=postgres://... node scripts/seed-demo-data.mjs
//
// Por omissão liga a postgres://manugent:manugent_password@localhost:5433/manugent
// (o valor exposto pelo docker-compose.yml deste projeto).
//
// O script é seguro para re-correr: limpa (TRUNCATE) os dados fictícios
// anteriores antes de inserir um novo conjunto, e preserva sempre as 5 contas
// de demonstração (superadmin/admin/gestor/tecnico/cliente@...) usadas pelo
// seletor de perfil da aplicação.
// ============================================================================

import pg from 'pg'
import { randomUUID } from 'node:crypto'

const { Client } = pg

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://manugent:manugent_password@localhost:5433/manugent'

// ---- PRNG determinístico (mesma família usada no gerador do frontend) -----
function mulberry32(seed) {
  let a = seed
  return function rand() {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260802)
const pick = arr => arr[Math.floor(rand() * arr.length)]
const pickMany = (arr, n) => {
  const copy = [...arr]; const out = []
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  return out
}
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const float = (min, max, d = 2) => Number((rand() * (max - min) + min).toFixed(d))
const chance = p => rand() < p
function daysAgo(d) { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString() }
function hoursAfter(iso, h) { return new Date(new Date(iso).getTime() + h * 3_600_000).toISOString() }

const FIRST_NAMES = ['João', 'Maria', 'Pedro', 'Ana', 'Rui', 'Sofia', 'Carlos', 'Beatriz', 'Miguel', 'Inês',
  'André', 'Catarina', 'Tiago', 'Marta', 'Bruno', 'Diana', 'Nuno', 'Filipa', 'Ricardo', 'Cláudia',
  'Hugo', 'Vera', 'Fábio', 'Patrícia', 'Luís', 'Sara', 'Diogo', 'Joana', 'Vasco', 'Teresa']
const LAST_NAMES = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Rodrigues', 'Martins', 'Jesus',
  'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto']
const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '.')
const CITIES = ['Porto', 'Lisboa', 'Braga', 'Coimbra', 'Aveiro', 'Faro', 'Setúbal', 'Leiria']
const COMPANY_NAME = () => `${pick(['Norte', 'Atlântico', 'Ibérica', 'Central', 'Douro', 'Lusitana', 'Vanguarda', 'Prime'])} ${pick(['Fabril', 'Retail', 'Health', 'Logistics', 'Hotels', 'Tech', 'Foods', 'Motors'])} ${pick(['Lda', 'S.A.', 'Group'])}`
const EQUIPMENT_CATALOG = {
  'AVAC': ['Unidade AVAC Rooftop', 'Chiller', 'Ventiloconvector'],
  'Elétrico': ['Quadro Elétrico Geral', 'Gerador de Emergência', 'UPS'],
  'Elevadores': ['Elevador de Passageiros', 'Monta-cargas'],
  'Segurança': ['Sistema de Deteção de Incêndio', 'Bomba de Incêndio'],
  'Refrigeração': ['Câmara Frigorífica', 'Arca Congeladora'],
  'Hidráulico': ['Bomba de Água', 'Autoclave'],
}
const BRANDS = ['Daikin', 'Carrier', 'Schneider Electric', 'Siemens', 'ABB', 'Otis', 'Grundfos', 'Bosch']

// Volumes (ajustáveis via env vars para bases de dados maiores/menores)
const N = {
  teams: Number(process.env.SEED_TEAMS || 10),
  users: Number(process.env.SEED_USERS || 140),
  clients: Number(process.env.SEED_CLIENTS || 24),
  equipmentPerClient: [6, 16],
  workOrdersPerEquipment: [2, 6],
  findings: Number(process.env.SEED_FINDINGS || 900),
  notifications: Number(process.env.SEED_NOTIFICATIONS || 800),
  timeEntries: Number(process.env.SEED_TIME_ENTRIES || 1100),
  reports: Number(process.env.SEED_REPORTS || 700),
  quotes: Number(process.env.SEED_QUOTES || 400),
  attachments: Number(process.env.SEED_ATTACHMENTS || 700),
}

const WO_TYPES = ['preventive', 'inspection', 'round', 'checklist', 'corrective', 'breakdown', 'emergency', 'customer_request']
const WO_STATUSES_POOL = ['open', 'scheduled', 'in_progress', 'in_progress', 'completed', 'completed', 'completed', 'cancelled']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']

async function bulkInsert(client, table, columns, rows) {
  if (!rows.length) return
  const chunkSize = 400
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const values = []
    const placeholders = chunk.map((row, r) => {
      const base = r * columns.length
      row.forEach(v => values.push(v))
      return `(${columns.map((_, c) => `$${base + c + 1}`).join(',')})`
    }).join(',')
    await client.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`, values)
  }
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  console.log(`🔌 Ligado a ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`)

  try {
    await client.query('BEGIN')

    // ---- Limpar dados fictícios anteriores (preserva app_metadata) --------
    console.log('🧹 A limpar dados fictícios anteriores...')
    await client.query(`
      TRUNCATE TABLE
        quotes, intervention_reports, work_order_time_entries, notifications,
        work_order_links, work_order_findings, attachments, work_orders,
        equipment, clients, users, teams
      RESTART IDENTITY CASCADE
    `)

    // ---- Equipas -------------------------------------------------------------
    const teamIds = Array.from({ length: N.teams }, () => randomUUID())
    const teamNames = ['Equipa AVAC Norte', 'Equipa Elétrica', 'Equipa Elevadores', 'Equipa Segurança Contra Incêndio',
      'Equipa Refrigeração', 'Equipa Hidráulica', 'Equipa Multidisciplinar Sul', 'Equipa Intervenção Rápida']
    await bulkInsert(client, 'teams', ['id', 'name'], teamIds.map((id, i) => [id, teamNames[i] || `Equipa ${i + 1}`]))
    console.log(`  ✓ ${teamIds.length} equipas`)

    // ---- Utilizadores (inclui as 5 contas de demonstração fixas) -------------
    const users = []
    const demoAccounts = [
      { name: 'SuperAdmin', email: 'superadmin@manugent.pt', role: 'superadmin' },
      { name: 'Admin ManuGent', email: 'admin@manugent.pt', role: 'admin' },
      { name: 'Gestor Silva', email: 'gestor@manugent.pt', role: 'gestor' },
      { name: 'Tecnico Costa', email: 'tecnico@manugent.pt', role: 'tecnico' },
      { name: 'Cliente Demo', email: 'cliente@demo.pt', role: 'cliente' },
    ]
    for (const d of demoAccounts) {
      users.push({ id: randomUUID(), team_id: pick(teamIds), name: d.name, email: d.email, role: d.role, status: 'active', fixed: true })
    }
    const ROLES = ['gestor', 'tecnico', 'tecnico', 'tecnico', 'admin', 'financeiro']
    for (let i = 0; i < N.users; i++) {
      const role = pick(ROLES)
      const name = fullName()
      users.push({
        id: randomUUID(), team_id: chance(0.8) ? pick(teamIds) : null, name,
        email: `${slug(name)}.${i}@manugent.pt`, role,
        status: chance(0.94) ? 'active' : chance(0.7) ? 'blocked' : 'banned',
      })
    }
    await client.query(
      `INSERT INTO users (id, team_id, name, email, role, password_hash, status)
       SELECT * FROM UNNEST($1::uuid[], $2::uuid[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[])`,
      [
        users.map(u => u.id), users.map(u => u.team_id), users.map(u => u.name), users.map(u => u.email),
        users.map(u => u.role),
        users.map(u => (u.fixed ? null : null)), // password_hash preenchido a seguir só para as contas fixas
        users.map(u => u.status || 'active'),
      ]
    )
    // Password real ("Demo@2026") apenas nas 5 contas fixas usadas pelo seletor de perfil
    for (const d of demoAccounts) {
      await client.query(
        `UPDATE users SET password_hash = crypt('Demo@2026', gen_salt('bf', 10)) WHERE email = $1`,
        [d.email]
      )
    }
    console.log(`  ✓ ${users.length} utilizadores (5 contas fixas + ${N.users} adicionais)`)
    const staffUsers = users.filter(u => u.role !== 'cliente')

    // ---- Clientes --------------------------------------------------------------
    const clients = Array.from({ length: N.clients }, () => {
      const name = COMPANY_NAME()
      return { id: randomUUID(), name, email: `geral@${slug(name)}.pt`, phone: `+351 2${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}` }
    })
    await bulkInsert(client, 'clients', ['id', 'name', 'email', 'phone'], clients.map(c => [c.id, c.name, c.email, c.phone]))
    console.log(`  ✓ ${clients.length} clientes`)

    // ---- Equipamentos ------------------------------------------------------------
    const equipment = []
    let eqCounter = 0
    for (const c of clients) {
      const n = int(...N.equipmentPerClient)
      for (let i = 0; i < n; i++) {
        eqCounter++
        const category = pick(Object.keys(EQUIPMENT_CATALOG))
        equipment.push({
          id: randomUUID(), client_id: c.id, code: `EQ-${String(eqCounter).padStart(4, '0')}`,
          name: pick(EQUIPMENT_CATALOG[category]), brand: pick(BRANDS), model: `${pick(['X', 'Z', 'Pro', 'Max'])}${int(100, 999)}`,
          serial: `SN${int(10000000, 99999999)}`, location: `${pick(['Piso 0', 'Piso 1', 'Cave', 'Cobertura', 'Zona Técnica'])} — ${pick(CITIES)}`,
          criticality: pick(['low', 'normal', 'high', 'critical']),
          status: chance(0.08) ? 'faulty' : chance(0.08) ? 'maintenance' : 'active',
        })
      }
    }
    await bulkInsert(client, 'equipment', ['id', 'client_id', 'code', 'name', 'brand', 'model', 'serial', 'location', 'criticality', 'status'],
      equipment.map(e => [e.id, e.client_id, e.code, e.name, e.brand, e.model, e.serial, e.location, e.criticality, e.status]))
    console.log(`  ✓ ${equipment.length} equipamentos`)

    // ---- Ordens de Trabalho --------------------------------------------------------
    const workOrders = []
    for (const eq of equipment) {
      const n = int(...N.workOrdersPerEquipment)
      for (let i = 0; i < n; i++) {
        const status = pick(WO_STATUSES_POOL)
        const origin = chance(0.6) ? 'scheduled' : 'request'
        const createdAt = daysAgo(int(0, 300))
        const scheduledFor = hoursAfter(createdAt, int(1, 72))
        const isRunningOrDone = status === 'in_progress' || status === 'completed'
        const startedAt = isRunningOrDone ? hoursAfter(createdAt, int(1, 96)) : null
        const completedAt = status === 'completed' ? hoursAfter(startedAt, int(1, 120)) : null
        const cancelledAt = status === 'cancelled' ? hoursAfter(createdAt, int(1, 48)) : null
        workOrders.push({
          id: randomUUID(), client_id: eq.client_id, equipment_id: eq.id, team_id: pick(teamIds),
          supervisor_id: pick(staffUsers).id, type: pick(WO_TYPES), origin, status, priority: pick(PRIORITIES),
          title: `${pick(['Reparação', 'Manutenção', 'Inspeção', 'Substituição de peça em'])} ${eq.name}`,
          description: `Intervenção em ${eq.name} (${eq.serial}).`,
          scheduled_for: scheduledFor, started_at: startedAt, completed_at: completedAt, cancelled_at: cancelledAt,
          created_at: createdAt,
        })
      }
    }
    await bulkInsert(client, 'work_orders',
      ['id', 'client_id', 'equipment_id', 'team_id', 'supervisor_id', 'type', 'origin', 'status', 'priority', 'title', 'description', 'scheduled_for', 'started_at', 'completed_at', 'cancelled_at', 'created_at'],
      workOrders.map(w => [w.id, w.client_id, w.equipment_id, w.team_id, w.supervisor_id, w.type, w.origin, w.status, w.priority, w.title, w.description, w.scheduled_for, w.started_at, w.completed_at, w.cancelled_at, w.created_at]))
    console.log(`  ✓ ${workOrders.length} ordens de trabalho`)

    const completedWOs = workOrders.filter(w => w.status === 'completed')
    const activeWOs = workOrders.filter(w => ['open', 'scheduled', 'in_progress'].includes(w.status))

    // ---- Findings ------------------------------------------------------------------
    const findingTypes = ['ok', 'ok', 'ok', 'nok', 'defect', 'note']
    const findingsRows = pickMany(workOrders, Math.min(N.findings, workOrders.length)).map(w => [
      randomUUID(), w.id, pick(findingTypes),
      pick(['Componente dentro dos parâmetros.', 'Detetado desgaste acima do esperado.', 'Fuga ligeira identificada.', 'Sem anomalias registadas.', 'Recomenda-se substituição preventiva.']),
      pick(staffUsers).id,
    ])
    await bulkInsert(client, 'work_order_findings', ['id', 'work_order_id', 'type', 'description', 'created_by'], findingsRows)
    console.log(`  ✓ ${findingsRows.length} registos de diagnóstico (findings)`)

    // ---- Notificações --------------------------------------------------------------
    const notifRows = pickMany(workOrders, Math.min(N.notifications, workOrders.length)).map(w => [
      randomUUID(), w.id, pick(staffUsers).id, null, null, 'in_app',
      `OT atualizada — ${w.title}`, `O estado mudou para "${w.status}".`, chance(0.5) ? new Date().toISOString() : null,
    ])
    await bulkInsert(client, 'notifications', ['id', 'work_order_id', 'recipient_user_id', 'recipient_team_id', 'recipient_role', 'channel', 'title', 'message', 'read_at'], notifRows)
    console.log(`  ✓ ${notifRows.length} notificações`)

    // ---- Registos de tempo (técnicos) -----------------------------------------------
    const technicianUsers = staffUsers.filter(u => u.role === 'tecnico')
    const timeEntryRows = pickMany(workOrders.filter(w => w.started_at), Math.min(N.timeEntries, workOrders.length)).map(w => {
      const tech = pick(technicianUsers.length ? technicianUsers : staffUsers)
      const status = w.completed_at ? 'finished' : pick(['running', 'paused'])
      return [randomUUID(), w.id, tech.id, status, w.started_at, null, null, w.completed_at, int(600, 28800)]
    })
    await bulkInsert(client, 'work_order_time_entries', ['id', 'work_order_id', 'technician_id', 'status', 'started_at', 'paused_at', 'resumed_at', 'ended_at', 'effective_seconds'], timeEntryRows)
    console.log(`  ✓ ${timeEntryRows.length} registos de tempo`)

    // ---- Relatórios de intervenção -----------------------------------------------------
    const reportRows = pickMany(completedWOs, Math.min(N.reports, completedWOs.length)).map(w => [
      randomUUID(), w.id, w.client_id, w.equipment_id, `Relatório de Intervenção — ${w.title}`,
      'Intervenção concluída sem incidências relevantes para o funcionamento do equipamento.',
      pick(['Substituição de componente desgastado.', 'Limpeza e lubrificação geral.', 'Ajuste de parâmetros de funcionamento.', 'Verificação de segurança elétrica.']),
      pick(['Sem recomendações adicionais.', 'Recomenda-se reavaliação em 6 meses.', 'Sugerida substituição preventiva no próximo ciclo.']),
      pick(staffUsers).id,
    ])
    await bulkInsert(client, 'intervention_reports', ['id', 'work_order_id', 'client_id', 'equipment_id', 'title', 'summary', 'actions_performed', 'recommendations', 'created_by'], reportRows)
    console.log(`  ✓ ${reportRows.length} relatórios de intervenção`)

    // ---- Orçamentos (quotes) -----------------------------------------------------------
    const quoteStatuses = ['pending', 'approved', 'approved', 'rejected', 'expired']
    const quoteRows = pickMany(workOrders, Math.min(N.quotes, workOrders.length)).map((w, i) => [
      randomUUID(), w.id, w.client_id, `ORC-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      `Orçamento para intervenção — ${w.title}`, float(80, 3500), 'EUR', pick(quoteStatuses),
    ])
    await bulkInsert(client, 'quotes', ['id', 'work_order_id', 'client_id', 'reference', 'description', 'amount', 'currency', 'status'], quoteRows)
    console.log(`  ✓ ${quoteRows.length} orçamentos`)

    // ---- Anexos --------------------------------------------------------------------------
    const attachmentEntities = [
      ...workOrders.map(w => ({ type: 'work_order', id: w.id })),
      ...equipment.map(e => ({ type: 'equipment', id: e.id })),
      ...clients.map(c => ({ type: 'client', id: c.id })),
    ]
    const attachmentRows = pickMany(attachmentEntities, Math.min(N.attachments, attachmentEntities.length)).map((e, i) => {
      const fname = pick(['foto_antes.jpg', 'foto_depois.jpg', 'relatorio.pdf', 'manual.pdf', 'certificado.pdf'])
      return [randomUUID(), e.type, e.id, `${i}_${fname}`, fname, fname.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', int(80000, 4000000), `/uploads/${e.type}/${e.id}/${i}_${fname}`, pick(staffUsers).id]
    })
    await bulkInsert(client, 'attachments', ['id', 'entity_type', 'entity_id', 'filename', 'original_name', 'mime_type', 'file_size', 'storage_path', 'uploaded_by'], attachmentRows)
    console.log(`  ✓ ${attachmentRows.length} anexos`)

    await client.query('COMMIT')

    // ---- Resumo final -----------------------------------------------------------------
    const { rows: [stats] } = await client.query(`
      SELECT
        (SELECT count(*) FROM teams) AS teams,
        (SELECT count(*) FROM users) AS users,
        (SELECT count(*) FROM clients) AS clients,
        (SELECT count(*) FROM equipment) AS equipment,
        (SELECT count(*) FROM work_orders) AS work_orders,
        (SELECT count(*) FROM work_order_findings) AS findings,
        (SELECT count(*) FROM notifications) AS notifications,
        (SELECT count(*) FROM work_order_time_entries) AS time_entries,
        (SELECT count(*) FROM intervention_reports) AS reports,
        (SELECT count(*) FROM quotes) AS quotes,
        (SELECT count(*) FROM attachments) AS attachments
    `)
    const total = Object.values(stats).reduce((a, b) => a + Number(b), 0)
    console.log('\n✅ Seed concluído. Registos por tabela:')
    console.table(stats)
    console.log(`Total: ${total} registos\n`)
    console.log('Login de demonstração: superadmin@manugent.pt / Demo@2026 (e admin/gestor/tecnico/cliente com o mesmo padrão)')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao popular a base de dados, revertido (ROLLBACK):', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
