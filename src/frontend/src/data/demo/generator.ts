// ============================================================================
// ManuGent — Demo Data Layer — Gerador
// Gera uma base de dados fictícia completa, relacional e determinística
// (mesma seed => mesmos dados), simulando um ambiente de produção real.
// ============================================================================

import type {
  DemoDatabase, User, Role, Team, Technician, Company, Client, Building,
  Equipment, WorkOrder, WorkOrderStatus, MaintenanceRequest, RequestStatus,
  PreventivePlan, Supplier, Part, InventoryItem, Document, Folder, Contract,
  Notification, Audit, Report, Checklist, Comment, Testimonial, Attachment,
  ActivityLogEntry, CalendarEvent, Priority,
} from './types'

// ---- PRNG determinístico (mulberry32) -------------------------------------
function mulberry32(seed: number) {
  let a = seed
  return function rand() {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let rand = mulberry32(20260802)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const pickMany = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  }
  return out
}
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const float = (min: number, max: number, decimals = 2) =>
  Number((rand() * (max - min) + min).toFixed(decimals))
const chance = (p: number) => rand() < p
let idCounters: Record<string, number> = {}
const id = (prefix: string) => {
  idCounters[prefix] = (idCounters[prefix] || 0) + 1
  return `${prefix}_${String(idCounters[prefix]).padStart(5, '0')}`
}
function daysAgo(d: number) { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString() }
function daysFromNow(d: number) { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString() }

// ---- Pools de nomes realistas (PT) -----------------------------------------
const FIRST_NAMES = ['João', 'Maria', 'Pedro', 'Ana', 'Rui', 'Sofia', 'Carlos', 'Beatriz', 'Miguel', 'Inês',
  'André', 'Catarina', 'Tiago', 'Marta', 'Bruno', 'Diana', 'Nuno', 'Filipa', 'Ricardo', 'Cláudia',
  'Hugo', 'Vera', 'Fábio', 'Patrícia', 'Luís', 'Sara', 'Diogo', 'Joana', 'Vasco', 'Teresa']
const LAST_NAMES = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Rodrigues', 'Martins', 'Jesus',
  'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto',
  'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira']
const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`

const CITIES = ['Porto', 'Lisboa', 'Braga', 'Coimbra', 'Aveiro', 'Faro', 'Setúbal', 'Leiria', 'Viseu', 'Guimarães']
const SECTORS = ['Indústria Alimentar', 'Retalho', 'Saúde', 'Logística', 'Hotelaria', 'Educação', 'Serviços Financeiros', 'Automóvel', 'Têxtil', 'Farmacêutica']
const COMPANY_SUFFIX = ['Lda', 'S.A.', 'Group', 'Indústrias', 'Serviços']
const companyName = () => `${pick(['Norte', 'Atlântico', 'Ibérica', 'Central', 'Douro', 'Lusitana', 'Metropolitana', 'Vanguarda', 'Prime', 'Global'])} ${pick(['Fabril', 'Retail', 'Health', 'Logistics', 'Hotels', 'Tech', 'Foods', 'Motors', 'Textiles', 'Pharma'])} ${pick(COMPANY_SUFFIX)}`

const EQUIPMENT_CATALOG: Record<string, string[]> = {
  'HVAC': ['Unidade AVAC Rooftop', 'Chiller', 'Ventiloconvector', 'Unidade de Tratamento de Ar'],
  'Elétrico': ['Quadro Elétrico Geral', 'Gerador de Emergência', 'UPS', 'Transformador'],
  'Elevadores': ['Elevador de Passageiros', 'Monta-cargas', 'Escada Rolante'],
  'Segurança': ['Sistema de Deteção de Incêndio', 'Extintor', 'Bomba de Incêndio', 'CCTV'],
  'Refrigeração': ['Câmara Frigorífica', 'Arca Congeladora', 'Sistema de Refrigeração Industrial'],
  'Hidráulico': ['Bomba de Água', 'Autoclave', 'ETAR Compacta'],
}
const BRANDS = ['Daikin', 'Carrier', 'Schneider Electric', 'Siemens', 'ABB', 'Otis', 'KONE', 'Grundfos', 'Bosch', 'Honeywell']

function seqCode(prefix: string, n: number) { return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(5, '0')}` }

// ============================================================================
export function generateDemoDatabase(seed = 20260802): DemoDatabase {
  rand = mulberry32(seed)
  idCounters = {}

  // ---- Empresas (tenants B2B clientes da plataforma) ----------------------
  const companies: Company[] = Array.from({ length: 18 }, () => ({
    id: id('emp'),
    name: companyName(),
    taxId: `PT${int(100000000, 599999999)}`,
    sector: pick(SECTORS),
    active: chance(0.9),
    since: daysAgo(int(60, 1800)),
  }))

  // ---- Utilizadores (equipa ManuGent + clientes) ---------------------------
  const roles: Role[] = ['superadmin', 'admin', 'gestor', 'tecnico', 'cliente', 'financeiro']
  const users: User[] = []
  users.push({ id: id('usr'), name: 'Diogo Castro', email: 'admin@manugent.pt', role: 'superadmin', avatarSeed: 'diogo', active: true, onDuty: true, createdAt: daysAgo(700), lastLoginAt: daysAgo(0), phone: '+351 91 000 0001' })
  for (let i = 0; i < 12; i++) users.push({ id: id('usr'), name: fullName(), email: '', role: 'gestor', avatarSeed: `g${i}`, active: chance(0.95), onDuty: chance(0.7), createdAt: daysAgo(int(30, 900)), lastLoginAt: daysAgo(int(0, 10)), phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}` })
  const technicianUsers: User[] = []
  for (let i = 0; i < 45; i++) {
    const u: User = { id: id('usr'), name: fullName(), email: '', role: 'tecnico', avatarSeed: `t${i}`, active: chance(0.96), onDuty: chance(0.55), createdAt: daysAgo(int(15, 1200)), lastLoginAt: daysAgo(int(0, 15)), phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}` }
    users.push(u); technicianUsers.push(u)
  }
  for (let i = 0; i < 6; i++) users.push({ id: id('usr'), name: fullName(), email: '', role: 'financeiro', avatarSeed: `f${i}`, active: true, onDuty: chance(0.6), createdAt: daysAgo(int(30, 800)), lastLoginAt: daysAgo(int(0, 20)), phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}` })
  const clientUsers: User[] = []
  for (const c of companies) {
    const n = int(1, 4)
    for (let i = 0; i < n; i++) {
      const u: User = { id: id('usr'), name: fullName(), email: '', role: 'cliente', companyId: c.id, avatarSeed: `${c.id}${i}`, active: c.active && chance(0.92), onDuty: false, createdAt: c.since, lastLoginAt: daysAgo(int(0, 30)), phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}` }
      users.push(u); clientUsers.push(u)
    }
  }
  users.forEach(u => { u.email = u.email || `${u.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.')}@${u.role === 'cliente' ? 'clientmail' : 'manugent'}.pt` })

  // ---- Equipas & Técnicos ---------------------------------------------------
  const SPECIALTIES = ['AVAC', 'Elétrica', 'Elevadores', 'Segurança Contra Incêndio', 'Refrigeração', 'Hidráulica', 'Multidisciplinar']
  const teams: Team[] = Array.from({ length: 8 }, (_, i) => {
    const members = pickMany(technicianUsers, int(3, 6))
    return { id: id('eqp'), name: `Equipa ${pick(SPECIALTIES)} ${i + 1}`, leaderId: members[0].id, memberIds: members.map(m => m.id), specialty: pick(SPECIALTIES) }
  })
  const technicians: Technician[] = technicianUsers.map(u => {
    const team = teams.find(t => t.memberIds.includes(u.id))
    const status = !u.active ? 'ferias' : u.onDuty ? (chance(0.8) ? 'em_servico' : 'disponivel') : (chance(0.3) ? 'ferias' : 'ausente')
    return {
      id: id('tec'), userId: u.id, specialties: pickMany(SPECIALTIES, int(1, 3)), teamId: team?.id,
      status, rating: float(3.5, 5, 1), completedOrders: int(10, 400), activeOrders: int(0, 6),
    }
  })

  // ---- Clientes, Edifícios, Equipamentos -------------------------------------
  const contracts: Contract[] = []
  const clients: Client[] = companies.map(c => {
    const startDate = c.since
    const contract: Contract = {
      id: id('ctr'), clientId: '', type: pick(['manutencao_preventiva', 'manutencao_completa', 'sob_pedido']),
      status: c.active ? (chance(0.85) ? 'ativo' : 'pendente') : 'expirado',
      startDate, endDate: daysFromNow(int(30, 700)), monthlyValue: int(400, 12000), slaHours: pick([4, 8, 24, 48]),
    }
    contracts.push(contract)
    const client: Client = {
      id: id('cli'), companyId: c.id, name: c.name, email: `geral@${c.name.toLowerCase().replace(/[^a-z]/g, '')}.pt`,
      phone: `+351 2${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}`, address: `Rua ${pick(LAST_NAMES)}, ${int(1, 300)}`,
      city: pick(CITIES), active: c.active, contractId: contract.id, since: c.since,
    }
    contract.clientId = client.id
    return client
  })

  const buildings: Building[] = []
  for (const cl of clients) {
    const n = int(1, 5)
    for (let i = 0; i < n; i++) {
      buildings.push({
        id: id('edf'), clientId: cl.id, name: `${pick(['Fábrica', 'Loja', 'Armazém', 'Escritório', 'Centro', 'Unidade'])} ${cl.city} ${i + 1}`,
        address: `Zona Industrial de ${cl.city}, ${int(1, 200)}`, city: cl.city,
        type: pick(['industrial', 'comercial', 'residencial', 'saude', 'escritorio']), areaM2: int(150, 15000),
      })
    }
  }

  const equipment: Equipment[] = []
  for (const b of buildings) {
    const n = int(3, 12)
    for (let i = 0; i < n; i++) {
      const category = pick(Object.keys(EQUIPMENT_CATALOG))
      const name = pick(EQUIPMENT_CATALOG[category])
      const installedAt = daysAgo(int(60, 3000))
      equipment.push({
        id: id('ekp'), buildingId: b.id, name, category, brand: pick(BRANDS), model: `${pick(['X', 'Z', 'Pro', 'Max', 'Eco'])}${int(100, 999)}`,
        serialNumber: `SN${int(10000000, 99999999)}`, criticality: pick(['baixa', 'media', 'alta', 'critica']),
        status: chance(0.08) ? 'avariado' : chance(0.1) ? 'em_manutencao' : chance(0.03) ? 'inativo' : 'operacional',
        installedAt, lastMaintenanceAt: daysAgo(int(1, 180)), nextMaintenanceAt: daysFromNow(int(-10, 90)),
        qrCode: `QR-${int(100000, 999999)}`,
      })
    }
  }

  // ---- Fornecedores, Peças, Inventário ---------------------------------------
  const suppliers: Supplier[] = Array.from({ length: 22 }, () => ({
    id: id('for'), name: `${pick(['Fer', 'Tec', 'Indus', 'Peça', 'Master'])}${pick(['Parts', 'Supply', 'Componentes', 'Distribuição'])}`,
    taxId: `PT${int(100000000, 599999999)}`, category: pick(['Elétrico', 'Mecânico', 'HVAC', 'Segurança', 'Hidráulico', 'Geral']),
    email: 'geral@fornecedor.pt', phone: `+351 2${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}`, rating: float(3, 5, 1), active: chance(0.9),
  }))
  const PART_NAMES = ['Filtro de Ar', 'Correia de Transmissão', 'Rolamento', 'Válvula Solenoide', 'Sensor de Temperatura',
    'Compressor', 'Contactor Elétrico', 'Fusível', 'Bomba de Circulação', 'Motor Elétrico', 'Placa de Controlo', 'Termóstato']
  const parts: Part[] = Array.from({ length: 60 }, () => ({
    id: id('pca'), name: pick(PART_NAMES), sku: `SKU-${int(10000, 99999)}`, category: pick(['Elétrico', 'Mecânico', 'HVAC', 'Consumível']),
    unitCost: float(3, 850), supplierId: pick(suppliers).id,
  }))
  const inventory: InventoryItem[] = parts.map(p => ({
    id: id('inv'), partId: p.id, warehouse: pick(['Armazém Porto', 'Armazém Lisboa', 'Armazém Faro']),
    quantity: int(0, 300), minQuantity: int(5, 40), reserved: int(0, 20), lastMovementAt: daysAgo(int(0, 60)),
  }))

  // ---- Checklists -------------------------------------------------------------
  const checklists: Checklist[] = Object.keys(EQUIPMENT_CATALOG).map(cat => ({
    id: id('chk'), name: `Checklist Preventiva — ${cat}`, equipmentCategory: cat,
    items: Array.from({ length: int(4, 8) }, (_, i) => ({ id: `it${i}`, label: pick(['Verificar níveis', 'Inspecionar fugas', 'Testar funcionamento', 'Limpar componente', 'Verificar ruído anómalo', 'Medir vibração', 'Verificar ligações elétricas', 'Substituir consumível']), done: chance(0.6) })),
  }))

  // ---- Planos Preventivos ------------------------------------------------------
  const preventivePlans: PreventivePlan[] = pickMany(equipment, Math.floor(equipment.length * 0.7)).map(eq => {
    const nextDueAt = daysFromNow(int(-15, 60))
    const status = new Date(nextDueAt) < new Date() ? 'atrasado' : chance(0.3) ? 'executado' : 'em_dia'
    return {
      id: id('pvt'), equipmentId: eq.id, name: `Manutenção Preventiva ${eq.name}`,
      frequency: pick(['semanal', 'mensal', 'trimestral', 'semestral', 'anual']),
      lastExecutedAt: daysAgo(int(5, 200)), nextDueAt, status,
      checklistId: checklists.find(c => c.equipmentCategory === eq.category)?.id,
      responsibleTeamId: pick(teams).id,
    }
  })

  // ---- Ordens de Trabalho -------------------------------------------------------
  const woStatuses: WorkOrderStatus[] = ['aberta', 'em_analise', 'atribuida', 'em_execucao', 'concluida', 'concluida', 'concluida', 'cancelada']
  const workOrders: WorkOrder[] = []
  let woCounter = 0
  for (const eq of equipment) {
    const n = int(1, 5)
    for (let i = 0; i < n; i++) {
      woCounter++
      const building = buildings.find(b => b.id === eq.buildingId)!
      const status = pick(woStatuses)
      const tech = pick(technicians)
      const createdAgoDays = int(0, 400)
      const createdAt = daysAgo(createdAgoDays)
      const createdAtMs = new Date(createdAt).getTime()
      const scheduledAt = new Date(createdAtMs + int(1, 72) * 3_600_000).toISOString()
      const isDone = status === 'concluida'
      const isCancelled = status === 'cancelada'
      // resposta realista: técnico inicia entre 1h e 4 dias após a criação
      const responseHours = int(1, 96)
      const startedAtMs = createdAtMs + responseHours * 3_600_000
      const canHaveStarted = (isDone || status === 'em_execucao') && startedAtMs <= Date.now()
      const startedAt = canHaveStarted ? new Date(startedAtMs).toISOString() : undefined
      // resolução realista: conclusão entre 1h e 5 dias após o início
      const completedAt = isDone && startedAt
        ? new Date(startedAtMs + int(1, 120) * 3_600_000).toISOString()
        : undefined
      workOrders.push({
        id: id('ord'), code: seqCode('OT', woCounter), equipmentId: eq.id, buildingId: eq.buildingId, clientId: building.clientId,
        technicianId: status === 'aberta' || status === 'em_analise' ? undefined : tech.id,
        teamId: pick(teams).id, status: isCancelled ? 'cancelada' : status, priority: eq.criticality,
        type: pick(['corretiva', 'preventiva', 'preditiva', 'inspecao']),
        title: `${pick(['Reparação', 'Manutenção', 'Inspeção', 'Substituição de peça em'])} ${eq.name}`,
        description: `Intervenção em ${eq.name} (${eq.serialNumber}) no edifício ${building.name}.`,
        createdAt, scheduledAt, startedAt, completedAt,
        estimatedHours: float(0.5, 8, 1), actualHours: isDone ? float(0.5, 10, 1) : undefined,
        cost: isDone ? float(30, 2500) : 0,
        partsUsed: isDone && chance(0.6) ? pickMany(parts, int(1, 3)).map(p => ({ partId: p.id, quantity: int(1, 4) })) : [],
      })
    }
  }

  // ---- Pedidos de Manutenção -----------------------------------------------------
  const reqStatuses: RequestStatus[] = ['aberto', 'em_analise', 'atribuido', 'em_execucao', 'concluido', 'concluido', 'cancelado']
  const maintenanceRequests: MaintenanceRequest[] = []
  for (const cl of clients) {
    const clBuildings = buildings.filter(b => b.clientId === cl.id)
    if (!clBuildings.length) continue
    const n = int(3, 15)
    for (let i = 0; i < n; i++) {
      const b = pick(clBuildings)
      const bEquip = equipment.filter(e => e.buildingId === b.id)
      const status = pick(reqStatuses)
      const createdAt = chance(0.35) ? daysAgo(int(0, 28)) : daysAgo(int(0, 200))
      const dueAt = daysFromNow(int(-20, 20))
      const isLate = new Date(dueAt) < new Date() && !['concluido', 'cancelado'].includes(status)
      const requester = pick(clientUsers.filter(u => u.companyId === cl.companyId)) || pick(clientUsers)
      const wo = chance(0.5) ? pick(workOrders.filter(w => w.buildingId === b.id)) : undefined
      maintenanceRequests.push({
        id: id('ped'), clientId: cl.id, buildingId: b.id, equipmentId: bEquip.length ? pick(bEquip).id : undefined,
        requestedBy: requester.id, assignedTo: status === 'aberto' ? [] : pickMany(technicianUsers, int(1, 2)).map(u => u.id),
        status, priority: pick(['baixa', 'media', 'alta', 'critica']),
        title: pick(['Ruído anómalo em equipamento', 'Falha no arranque', 'Fuga detetada', 'Pedido de inspeção', 'Alarme ativo', 'Substituição solicitada']),
        description: 'Pedido registado através do portal do cliente.',
        createdAt, dueAt, workOrderId: wo?.id, isLate,
      })
    }
  }

  // ---- Documentos & Pastas --------------------------------------------------------
  const folders: Folder[] = clients.flatMap(cl => ([
    { id: id('pst'), name: `${cl.name} — Manuais`, ownerId: pick(users).id, createdAt: cl.since },
    { id: id('pst'), name: `${cl.name} — Contratos`, ownerId: pick(users).id, createdAt: cl.since },
  ]))
  const documents: Document[] = []
  for (const eq of pickMany(equipment, Math.floor(equipment.length * 0.6))) {
    documents.push({
      id: id('doc'), name: `Manual_${eq.name.replace(/\s+/g, '_')}.pdf`, type: 'manual',
      folderId: pick(folders).id, entityType: 'equipment', entityId: eq.id, uploadedBy: pick(users).id,
      uploadedAt: daysAgo(int(1, 500)), sizeKb: int(200, 8000), url: `/documents/${eq.id}.pdf`,
    })
  }
  for (const wo of pickMany(workOrders.filter(w => w.status === 'concluida'), Math.min(300, workOrders.length))) {
    documents.push({
      id: id('doc'), name: `Relatorio_${wo.code}.pdf`, type: 'relatorio', folderId: pick(folders).id,
      entityType: 'work_order', entityId: wo.id, uploadedBy: pick(users).id, uploadedAt: wo.completedAt || daysAgo(1),
      sizeKb: int(100, 3000), url: `/documents/${wo.id}.pdf`,
    })
  }
  for (const ctr of contracts) {
    documents.push({
      id: id('doc'), name: `Contrato_${ctr.id}.pdf`, type: 'contrato', folderId: pick(folders).id,
      entityType: 'contract', entityId: ctr.id, uploadedBy: pick(users).id, uploadedAt: ctr.startDate,
      sizeKb: int(150, 900), url: `/documents/${ctr.id}.pdf`,
    })
  }

  // ---- Notificações -----------------------------------------------------------------
  const notifications: Notification[] = []
  for (const wo of pickMany(workOrders, Math.min(500, workOrders.length))) {
    if (!wo.technicianId) continue
    const tech = technicians.find(t => t.id === wo.technicianId)
    const u = users.find(u => u.id === tech?.userId)
    if (!u) continue
    notifications.push({
      id: id('not'), userId: u.id, type: 'work_order',
      title: `OT ${wo.code} atualizada`, message: `O estado da ordem de trabalho ${wo.code} mudou para "${wo.status}".`,
      read: chance(0.6), createdAt: wo.createdAt, relatedEntityId: wo.id,
    })
  }
  for (const p of preventivePlans.filter(p => p.status === 'atrasado')) {
    notifications.push({
      id: id('not'), userId: pick(users.filter(u => u.role === 'gestor')).id, type: 'preventive',
      title: 'Plano preventivo em atraso', message: `${p.name} está atrasado desde ${p.nextDueAt.slice(0, 10)}.`,
      read: chance(0.3), createdAt: p.nextDueAt, relatedEntityId: p.id,
    })
  }
  for (const item of inventory.filter(i => i.quantity <= i.minQuantity)) {
    notifications.push({
      id: id('not'), userId: pick(users.filter(u => u.role === 'gestor' || u.role === 'admin')).id, type: 'inventory',
      title: 'Stock baixo', message: `Peça com stock abaixo do mínimo em ${item.warehouse}.`,
      read: chance(0.4), createdAt: daysAgo(int(0, 10)), relatedEntityId: item.id,
    })
  }

  // ---- Auditorias & Relatórios --------------------------------------------------------
  const audits: Audit[] = pickMany(buildings, Math.min(40, buildings.length)).map(b => ({
    id: id('aud'), buildingId: b.id, auditorId: pick(users.filter(u => u.role === 'gestor' || u.role === 'tecnico')).id,
    status: pick(['agendada', 'em_curso', 'concluida', 'concluida']), score: chance(0.7) ? int(60, 100) : undefined,
    date: chance(0.5) ? daysAgo(int(0, 200)) : daysFromNow(int(1, 60)),
    findings: pickMany(['Extintor fora de validade', 'Sinalética em falta', 'Quadro elétrico sem etiquetagem', 'Saída de emergência obstruída', 'Registo de manutenção incompleto', 'Conforme'], int(1, 3)),
  }))
  const reports: Report[] = []
  for (const wo of workOrders.filter(w => w.status === 'concluida')) {
    if (!chance(0.8)) continue
    reports.push({ id: id('rel'), workOrderId: wo.id, clientId: wo.clientId, type: 'intervencao', title: `Relatório de Intervenção — ${wo.code}`, generatedAt: wo.completedAt || daysAgo(1), generatedBy: pick(users).id, url: `/reports/${wo.id}.pdf` })
  }
  for (const cl of clients) {
    for (let m = 0; m < 6; m++) {
      reports.push({ id: id('rel'), clientId: cl.id, type: 'mensal', title: `Relatório Mensal — ${cl.name} (${m + 1}/${new Date().getFullYear()})`, generatedAt: daysAgo(m * 30), generatedBy: pick(users.filter(u => u.role === 'gestor')).id, url: `/reports/monthly_${cl.id}_${m}.pdf` })
    }
  }

  // ---- Comentários, Anexos, Likes --------------------------------------------------------
  const comments: Comment[] = []
  for (const wo of pickMany(workOrders, Math.min(400, workOrders.length))) {
    const n = int(0, 4)
    let lastId: string | undefined
    for (let i = 0; i < n; i++) {
      const c: Comment = { id: id('com'), entityType: 'work_order', entityId: wo.id, authorId: pick(users).id, content: pick(['Confirmado, a caminho do local.', 'Peça encomendada, chega amanhã.', 'Concluído sem incidências.', 'Necessário acesso adicional ao local.', 'Cliente notificado da resolução.', 'Aguarda aprovação de orçamento.']), createdAt: daysAgo(int(0, 200)), parentId: i > 0 && chance(0.3) ? lastId : undefined, likeIds: pickMany(users, int(0, 5)).map(u => u.id) }
      comments.push(c); lastId = c.id
    }
  }
  const attachments: Attachment[] = []
  for (const wo of pickMany(workOrders, Math.min(350, workOrders.length))) {
    attachments.push({ id: id('anx'), entityType: 'work_order', entityId: wo.id, fileName: pick(['foto_antes.jpg', 'foto_depois.jpg', 'assinatura_cliente.png', 'diagnostico.pdf']), mimeType: pick(['image/jpeg', 'image/png', 'application/pdf']), sizeKb: int(80, 4000), uploadedBy: pick(users).id, uploadedAt: wo.completedAt || wo.createdAt })
  }

  // ---- Testemunhos ----------------------------------------------------------------------
  const testimonials: Testimonial[] = pickMany(clientUsers, Math.min(24, clientUsers.length)).map(u => {
    const company = companies.find(c => c.id === u.companyId)
    return {
      id: id('tst'), authorName: u.name, authorRole: pick(['Diretor de Operações', 'Facility Manager', 'Diretor Geral', 'Responsável de Manutenção']),
      companyName: company?.name || 'Empresa Cliente', rating: pick([4, 5, 5, 5]), date: daysAgo(int(10, 500)), featured: chance(0.3),
      content: pick([
        'A plataforma reduziu drasticamente o nosso tempo de resposta a avarias.',
        'Finalmente conseguimos ter visibilidade total sobre o estado dos nossos equipamentos.',
        'O suporte da equipa técnica é excelente e o sistema é muito intuitivo.',
        'Passámos a antecipar falhas em vez de as remediar — mudou a nossa operação.',
      ]),
    }
  })

  // ---- Histórico de atividades ------------------------------------------------------------
  const activityLog: ActivityLogEntry[] = []
  for (let i = 0; i < 1800; i++) {
    const u = pick(users)
    const action = pick(['criou', 'atualizou', 'concluiu', 'atribuiu', 'comentou em', 'cancelou', 'reagendou'])
    const entityType = pick(['ordem de trabalho', 'pedido de manutenção', 'equipamento', 'documento', 'contrato'])
    activityLog.push({ id: id('act'), userId: u.id, action: `${action} ${entityType}`, entityType, entityId: pick(workOrders).id, createdAt: daysAgo(int(0, 365)) })
  }

  // ---- Calendário --------------------------------------------------------------------------
  const calendarEvents: CalendarEvent[] = []
  for (const wo of workOrders.filter(w => ['atribuida', 'em_execucao'].includes(w.status))) {
    const start = wo.scheduledAt
    const end = new Date(new Date(start).getTime() + wo.estimatedHours * 3600 * 1000).toISOString()
    calendarEvents.push({ id: id('cal'), title: wo.title, type: 'work_order', relatedId: wo.id, start, end, assignedTo: wo.technicianId ? [wo.technicianId] : [] })
  }
  for (const p of preventivePlans) {
    calendarEvents.push({ id: id('cal'), title: p.name, type: 'preventive', relatedId: p.id, start: p.nextDueAt, end: p.nextDueAt, assignedTo: [] })
  }
  for (const a of audits.filter(a => a.status !== 'concluida')) {
    calendarEvents.push({ id: id('cal'), title: `Auditoria — ${buildings.find(b => b.id === a.buildingId)?.name}`, type: 'audit', relatedId: a.id, start: a.date, end: a.date, assignedTo: [a.auditorId] })
  }

  return {
    users, teams, technicians, companies, clients, buildings, equipment, workOrders,
    maintenanceRequests, preventivePlans, suppliers, parts, inventory, documents, folders,
    contracts, notifications, audits, reports, checklists, comments, testimonials, attachments,
    activityLog, calendarEvents, generatedAt: new Date().toISOString(), seed,
  }
}
