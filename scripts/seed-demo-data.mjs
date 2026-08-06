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
  suppliers: Number(process.env.SEED_SUPPLIERS || 30),
  parts: Number(process.env.SEED_PARTS || 80),
  maintenanceRequests: Number(process.env.SEED_REQUESTS || 700),
  checklists: Number(process.env.SEED_CHECKLISTS || 15),
  folders: Number(process.env.SEED_FOLDERS || 25),
  documents: Number(process.env.SEED_DOCUMENTS || 900),
  audits: Number(process.env.SEED_AUDITS || 60),
  genericReports: Number(process.env.SEED_GENERIC_REPORTS || 500),
  comments: Number(process.env.SEED_COMMENTS || 1600),
  testimonials: Number(process.env.SEED_TESTIMONIALS || 30),
  activityLog: Number(process.env.SEED_ACTIVITY_LOG || 3500),
  calendarEvents: Number(process.env.SEED_CALENDAR_EVENTS || 500),
  ratings: Number(process.env.SEED_RATINGS || 600),
  floorsPerBuilding: [2, 6],
  areasPerFloor: [2, 5],
  buildingAssignmentsPerBuilding: [2, 5],
  incidents: Number(process.env.SEED_INCIDENTS || 220),
  knowledgeArticles: Number(process.env.SEED_KNOWLEDGE_ARTICLES || 90),
  purchaseOrders: Number(process.env.SEED_PURCHASE_ORDERS || 160),
  inventoryMovements: Number(process.env.SEED_INVENTORY_MOVEMENTS || 500),
}

const INCIDENT_TYPES = ['falha_eletrica', 'inundacao', 'incendio', 'elevador_avariado', 'avac_indisponivel',
  'fuga_agua', 'intrusao', 'alarme_ativo', 'falha_comunicacao', 'equipamento_critico_parado']
const INCIDENT_TITLES = {
  falha_eletrica: 'Falha elétrica no quadro geral', inundacao: 'Inundação detetada na cave técnica',
  incendio: 'Princípio de incêndio detetado', elevador_avariado: 'Elevador parado entre pisos',
  avac_indisponivel: 'Sistema AVAC indisponível', fuga_agua: 'Fuga de água numa tubagem',
  intrusao: 'Alarme de intrusão acionado', alarme_ativo: 'Alarme ativo por confirmar',
  falha_comunicacao: 'Falha de comunicação com o sistema central', equipamento_critico_parado: 'Equipamento crítico parado',
}
const KB_TYPES = ['procedimento', 'manual', 'guia_tecnico', 'faq', 'boas_praticas', 'norma', 'checklist', 'tutorial', 'instrucao_seguranca', 'solucao_frequente']
const KB_CATEGORIES = ['AVAC', 'Elétrico', 'Elevadores', 'Segurança Contra Incêndio', 'Refrigeração', 'Hidráulico', 'Administrativo', 'Segurança no Trabalho']
const AREA_NAMES = ['Sala Técnica', 'Corredor Principal', 'Receção', 'Escritórios Open Space', 'Copa', 'Arquivo',
  'Casa das Máquinas', 'Central Térmica', 'Armazém', 'Estacionamento', 'Terraço Técnico', 'Sala de Servidores']

const SUPPLIER_CATEGORIES = ['AVAC', 'Elétrico', 'Elevadores', 'Segurança', 'Refrigeração', 'Hidráulico', 'Geral']
const PART_CATALOG = ['Filtro de ar', 'Correia de transmissão', 'Compressor', 'Válvula solenoide', 'Rolamento',
  'Contactor', 'Sensor de temperatura', 'Motor elétrico', 'Placa de circuito', 'Junta vedante', 'Cabo elétrico',
  'Lâmpada de emergência', 'Bomba de circulação', 'Termóstato', 'Fusível']
const BUILDING_TYPES = ['industrial', 'comercial', 'residencial', 'saude', 'escritorio']
const CHECKLIST_NAMES = ['Checklist AVAC Mensal', 'Checklist Elétrico Trimestral', 'Checklist Elevadores',
  'Checklist Segurança Contra Incêndio', 'Checklist Refrigeração', 'Checklist Hidráulico', 'Ronda Geral de Instalações']
const TESTIMONIAL_ROLES = ['Diretor de Manutenção', 'Gestor de Instalações', 'Técnico Responsável', 'Diretor Geral', 'Facility Manager']
const BLOG_CONTENT_PT = {
  'agente-ia-diagnostico-avarias': [
    'Quando um técnico regista uma avaria, o agente de IA do ManuGent cruza de imediato o histórico do equipamento com sinais recolhidos em tempo real — leituras de sensores, últimas ordens de trabalho e padrões conhecidos de falha.',
    'Este cruzamento permite sugerir, em segundos, uma lista ordenada de causas prováveis, cada uma com um grau de confiança e as ações de diagnóstico recomendadas.',
    'O modelo aprende continuamente com o feedback dos técnicos: sempre que uma sugestão é confirmada ou rejeitada, o sistema ajusta os pesos usados nas previsões seguintes para aquele tipo de equipamento.',
    'O resultado é uma redução significativa do tempo médio de diagnóstico (MTTD), especialmente em equipamentos com histórico rico de manutenção.',
  ],
  'mtbf-mttr-oee-indicadores': [
    'MTBF (tempo médio entre falhas), MTTR (tempo médio de reparação) e OEE (eficiência global do equipamento) são os três indicadores mais citados em manutenção industrial — e também dos mais mal calculados.',
    'O MTBF mede a fiabilidade de um ativo, dividindo o tempo total de operação pelo número de falhas registadas num período. Quanto maior, mais fiável é o equipamento.',
    'O MTTR mede a eficiência da resposta da equipa de manutenção, do momento em que a avaria é reportada até à reposição em serviço do equipamento.',
    'O OEE combina disponibilidade, desempenho e qualidade num único indicador, revelando o verdadeiro potencial produtivo de uma linha.',
    'Acompanhar estes três indicadores em conjunto, e não isoladamente, é o que permite identificar se um problema de produtividade tem origem na fiabilidade dos equipamentos, na rapidez da resposta ou na qualidade do processo.',
  ],
  'caso-cliente-reducao-paragem-34': [
    'Uma fábrica com três turnos e mais de 200 equipamentos ativos enfrentava um problema comum: ordens de serviço dispersas por papel, WhatsApp e folhas de Excel, sem visibilidade entre turnos.',
    'Com o ManuGent, a equipa passou a ter um único ponto de verdade para todas as ordens de trabalho, com priorização automática baseada na criticidade do equipamento e no histórico de falhas.',
    'A comunicação entre turnos deixou de depender de passagens de turno informais — cada ordem transporta consigo o histórico completo de intervenções, fotos e notas técnicas.',
    'Ao fim de seis meses, o tempo médio de paragem não planeada caiu 34%, e o tempo de resposta a avarias críticas reduziu-se para menos de metade.',
  ],
  'manutencao-offline-pwa': [
    'Muitas fábricas têm zonas com cobertura de rede fraca ou inexistente — caves técnicas, armazéns afastados, salas blindadas. Isto não pode impedir um técnico de registar uma intervenção.',
    'O ManuGent é construído como uma Progressive Web App: os dados essenciais (ordens de trabalho, ativos, histórico recente) ficam disponíveis localmente no dispositivo do técnico.',
    'Quando o técnico regista uma ação — fecha uma ordem, adiciona uma nota, tira uma fotografia — a alteração é guardada localmente e sincronizada automaticamente assim que a rede volta a estar disponível.',
    'Este mecanismo de fila de sincronização garante que nenhuma informação se perde, mesmo em ambientes industriais hostis à conectividade.',
  ],
  'ia-generativa-manutencao-industrial': [
    'A IA generativa está a mudar a forma como as equipas de manutenção interagem com dados técnicos complexos — manuais, esquemas elétricos, históricos de intervenção.',
    'Em vez de pesquisar manualmente num manual de centenas de páginas, um técnico pode agora perguntar diretamente ao sistema qual o procedimento correto para uma avaria específica.',
    'A manutenção preditiva também beneficia: modelos generativos conseguem explicar em linguagem natural porque é que um determinado padrão de sensores indica risco de falha, tornando as recomendações mais transparentes e mais fáceis de confiar.',
    'O desafio para os próximos anos não é tecnológico, mas organizacional: preparar as equipas para trabalhar lado a lado com estas ferramentas.',
  ],
  'nfc-vs-qr-code-ativos': [
    'A identificação de ativos é a base de qualquer sistema de manutenção eficaz — sem ela, cada intervenção começa com uma pergunta: "de que equipamento estamos a falar?"',
    'Os códigos QR são baratos, fáceis de imprimir e não exigem hardware especial no dispositivo do técnico, mas degradam-se com sujidade, calor ou exposição solar direta.',
    'As etiquetas NFC são mais resistentes a ambientes agressivos e permitem leitura por aproximação, mesmo com luvas de trabalho, mas têm um custo unitário mais elevado.',
    'Na prática, muitas fábricas optam por uma abordagem híbrida: NFC em equipamentos críticos ou de difícil acesso, e QR code no restante parque de ativos.',
  ],
  'manutencao-preventiva-vs-preditiva': [
    'A manutenção preventiva segue um calendário fixo — intervalos de tempo ou ciclos de operação definidos pelo fabricante. É previsível, mas pode gerar intervenções desnecessárias em equipamentos que ainda operam dentro dos parâmetros.',
    'A manutenção preditiva, pelo contrário, baseia-se no estado real do equipamento, usando dados de sensores, análises de vibração, termografia ou análise de óleo para determinar o momento ideal para intervir.',
    'Na prática, uma estratégia combinada é a mais eficaz: a preventiva garante o cumprimento de requisitos legais e de garantia, enquanto a preditiva otimiza os intervalos reais de intervenção nos equipamentos mais críticos.',
    'O ManuGent suporta ambas as abordagens, permitindo definir planos preventivos por periodicidade e, quando existem dados de sensores, acionar alertas preditivos com base em limiares configuráveis.',
  ],
  'sla-manutencao-como-negociar': [
    'Um SLA (Acordo de Nível de Serviço) de manutenção define o tempo máximo de resposta e de resolução para cada tipo de intervenção. Negociar SLAs realistas é essencial para manter a confiança do cliente.',
    'O primeiro passo é conhecer o histórico real dos equipamentos: MTBF e MTTR históricos, disponibilidade da equipa, e tempo médio de obtenção de peças sobressalentes.',
    'Com base nesses dados, define SLAs por nível de criticidade: para equipamentos críticos, um prazo de resposta de 4 horas pode ser viável; para equipamentos de suporte, 24 a 48 horas é mais realista.',
    'Inclui cláusulas de exclusão para situações fora do controlo da equipa — falta de peças, condições de segurança no local, ou indisponibilidade do cliente para autorizar a intervenção.',
  ],
  'checklist-digital-vantagens': [
    'As checklists digitais eliminam os problemas das versões em papel: extravios, rasuras, preenchimento incompleto e falta de padronização entre técnicos.',
    'Com o ManuGent, cada checklist é preenchida no telemóvel ou tablet do técnico, com campos obrigatórios, fotos e assinatura digital, garantindo que nenhum passo é esquecido.',
    'Os resultados ficam imediatamente disponíveis para supervisores e clientes, e o histórico de checklists por equipamento constrói automaticamente um registo de conformidade ao longo do tempo.',
    'Em auditorias, a diferença é notória: em vez de pastas de papel, apresenta-se um histórico digital completo, pesquisável e exportável em segundos.',
  ],
  'gestao-inventario-pecas-sobresselentes': [
    'Gerir peças sobressalentes é um dos maiores desafios logísticos da manutenção industrial. Ter stock a mais imobiliza capital; ter stock a menos provoca paragens prolongadas.',
    'O módulo de inventário do ManuGent permite definir níveis mínimos para cada peça, gerando alertas automáticos quando o stock atinge o limite de reserva.',
    'Cada peça pode ser associada a fornecedores preferenciais, com histórico de preços e prazos de entrega, facilitando a decisão de reabastecimento.',
    'As peças usadas em ordens de trabalho são registadas automaticamente, descontando do stock e mantendo um histórico de consumos por equipamento para análise de padrões de desgaste.',
  ],
  'seguranca-industrial-manutencao': [
    'A manutenção industrial desempenha um papel crucial na segurança ocupacional: equipamentos mal mantidos são uma das principais causas de acidentes de trabalho.',
    'O ManuGent ajuda a cumprir requisitos legais de segurança através de checklists específicas, planos de manutenção preventiva obrigatórios e registo de não-conformidades durante as inspeções.',
    'As auditorias de segurança podem ser planeadas e executadas diretamente na plataforma, com os resultados documentados e associados aos edifícios e equipamentos inspecionados.',
    'Manter um histórico digital de todas as intervenções de segurança não é apenas boa prática — é muitas vezes um requisito legal que, em caso de fiscalização ou sinistro, pode fazer a diferença.',
  ],
  'roi-software-manutencao': [
    'Calcular o retorno do investimento (ROI) de um software de manutenção exige olhar para três categorias de benefícios: redução de paragens, aumento de produtividade da equipa e otimização de stock de peças.',
    'Estudos do setor indicam que um CMMS bem implementado reduz o tempo de paragem não planeada entre 20% e 40%, aumenta a produtividade dos técnicos entre 15% e 30% e reduz o stock de peças entre 10% e 20%.',
    'Para uma empresa com 5 técnicos e 200 equipamentos, estes valores traduzem-se tipicamente numa poupança anual entre 30.000€ e 80.000€, dependendo do setor e da complexidade das operações.',
    'A estes benefícios diretos, soma-se a redução de risco — menos falhas críticas, melhor conformidade regulatória e dados fiáveis para decisões de investimento em ativos.',
  ],
}

const BLOG_POSTS_SEED = [
  { slug: 'agente-ia-diagnostico-avarias', title: 'Como o agente de IA do ManuGent diagnostica avarias em segundos', category: 'Produto', gradient: 'from-blue-500 to-cyan-400' },
  { slug: 'mtbf-mttr-oee-indicadores', title: 'MTBF, MTTR e OEE: os indicadores que todo o gestor de manutenção devia acompanhar', category: 'Indicadores', gradient: 'from-purple-500 to-pink-400' },
  { slug: 'caso-cliente-reducao-paragem-34', title: 'Caso de cliente: redução de 34% no tempo de paragem em 6 meses', category: 'Casos de Estudo', gradient: 'from-emerald-500 to-teal-400' },
  { slug: 'manutencao-offline-pwa', title: 'Manutenção sem sinal: como a app offline do ManuGent resolve o problema', category: 'Produto', gradient: 'from-orange-500 to-amber-400' },
  { slug: 'ia-generativa-manutencao-industrial', title: 'IA generativa aplicada à manutenção industrial: o que já é real em 2026', category: 'Tendências', gradient: 'from-indigo-500 to-blue-400' },
  { slug: 'nfc-vs-qr-code-ativos', title: 'NFC vs QR Code na identificação de ativos: qual escolher?', category: 'Tecnologia', gradient: 'from-rose-500 to-red-400' },
  { slug: 'manutencao-preventiva-vs-preditiva', title: 'Manutenção preventiva vs preditiva: guia prático para decidir', category: 'Boas Práticas', gradient: 'from-cyan-500 to-blue-400' },
  { slug: 'sla-manutencao-como-negociar', title: 'SLAs de manutenção: como negociar prazos realistas com o cliente', category: 'Gestão', gradient: 'from-violet-500 to-purple-400' },
  { slug: 'checklist-digital-vantagens', title: 'Checklists digitais: 7 vantagens sobre o papel na manutenção industrial', category: 'Boas Práticas', gradient: 'from-teal-500 to-emerald-400' },
  { slug: 'gestao-inventario-pecas-sobresselentes', title: 'Gestão de inventário de peças sobressalentes sem surpresas', category: 'Gestão', gradient: 'from-amber-500 to-orange-400' },
  { slug: 'seguranca-industrial-manutencao', title: 'Segurança industrial: o papel da manutenção na prevenção de acidentes', category: 'Segurança', gradient: 'from-red-500 to-rose-400' },
  { slug: 'roi-software-manutencao', title: 'Qual o ROI real de um software de manutenção? Fizemos as contas', category: 'Negócio', gradient: 'from-blue-500 to-indigo-400' },
]
const COMMENT_SNIPPETS = ['Confirmado no local, tudo dentro dos parâmetros.', 'Já agendei a próxima visita.',
  'Precisamos de peça adicional, a encomendar.', 'Cliente já foi notificado da conclusão.',
  'Boa intervenção, sem incidências a registar.', 'Vou acompanhar de perto este equipamento.',
  'Obrigado pela rapidez na resposta!', 'Ficou resolvido, obrigado.']

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
        quote_status_history, quote_items, quotes, intervention_reports, work_order_time_entries, notifications,
        work_order_links, work_order_findings, attachments, work_order_parts,
        ratings, comment_likes, comments, calendar_event_assignees, calendar_events,
        activity_log, testimonials, reports, audits, documents, folders, contracts,
        preventive_plans, checklists, maintenance_request_assignees, maintenance_requests,
        purchase_order_approvals, purchase_order_items, purchase_orders,
        inventory_movements, inventory_items, parts, suppliers, technician_profiles, client_contacts,
        incident_comments, incidents, knowledge_article_versions, knowledge_articles, knowledge_categories,
        building_assignments, areas, floors,
        blog_posts, buildings, work_orders,
        equipment, clients, users, teams, empresas
      RESTART IDENTITY CASCADE
    `)

    // ---- Equipas -------------------------------------------------------------
    const teamIds = Array.from({ length: N.teams }, () => randomUUID())
    const teamNames = ['Equipa AVAC Norte', 'Equipa Elétrica', 'Equipa Elevadores', 'Equipa Segurança Contra Incêndio',
      'Equipa Refrigeração', 'Equipa Hidráulica', 'Equipa Multidisciplinar Sul', 'Equipa Intervenção Rápida']
    await bulkInsert(client, 'teams', ['id', 'name'], teamIds.map((id, i) => [id, teamNames[i] || `Equipa ${i + 1}`]))
    console.log(`  ✓ ${teamIds.length} equipas`)

    // ---- Empresas (prestadoras de manutenção) --------------------------------
    const empresas = [
      { id: randomUUID(), name: 'ManuGent Facility Services', tax_id: 'PT500123456', email: 'geral@manugent-fs.pt', phone: '+351 210 000 001', address: 'Rua das Oficinas 12', city: 'Lisboa' },
      { id: randomUUID(), name: 'TechMaint Lda', tax_id: 'PT500987654', email: 'info@techmaint.pt', phone: '+351 220 000 002', address: 'Av. Industrial 45', city: 'Porto' },
      { id: randomUUID(), name: 'Elevadores & Energia Unipessoal', tax_id: 'PT500345678', email: 'contacto@elevenergia.pt', phone: '+351 230 000 003', address: 'Zona Industrial Lote 7', city: 'Coimbra' },
    ]
    // domínio de email cooperativo de cada empresa (extraído do email geral)
    for (const e of empresas) { e.domain = e.email.split('@')[1] }
    await bulkInsert(client, 'empresas', ['id', 'name', 'tax_id', 'email', 'phone', 'address', 'city', 'domain', 'active'],
      empresas.map(e => [e.id, e.name, e.tax_id, e.email, e.phone, e.address, e.city, e.domain, true]))
    console.log(`  ✓ ${empresas.length} empresas (prestadoras de manutenção)`)
    const manugentFsId = empresas[0].id
    const techmaintId = empresas[1].id
    const elevEnergiaId = empresas[2].id
    const empresaDomain = {}
    empresaDomain[manugentFsId] = empresas[0].domain
    empresaDomain[techmaintId] = empresas[1].domain
    empresaDomain[elevEnergiaId] = empresas[2].domain

    // ---- Utilizadores (inclui contas de demonstração fixas + credenciais por empresa) ----
    const users = []
    const demoAccounts = [
      { name: 'SuperAdmin', email: 'superadmin@manugent.pt', role: 'superadmin', empresa_id: null },
      { name: 'Admin ManuGent', email: 'admin@manugent.pt', role: 'admin', empresa_id: manugentFsId },
      { name: 'Gestor Silva', email: 'gestor@manugent.pt', role: 'gestor', empresa_id: manugentFsId },
      { name: 'Tecnico Costa', email: 'tecnico@manugent.pt', role: 'tecnico', empresa_id: manugentFsId },
      { name: 'Cliente Demo', email: 'cliente@demo.pt', role: 'cliente', empresa_id: null },
      // Credenciais completas por empresa (email cooperativo no domínio da empresa)
      // TechMaint Lda — credenciais cooperativas completas
      { name: 'Carlos TechMaint', email: `admin@${empresaDomain[techmaintId]}`, role: 'admin', empresa_id: techmaintId },
      { name: 'Ana TechMaint', email: `gestor@${empresaDomain[techmaintId]}`, role: 'gestor', empresa_id: techmaintId },
      { name: 'Paulo TechMaint', email: `supervisor@${empresaDomain[techmaintId]}`, role: 'supervisor', empresa_id: techmaintId },
      { name: 'Pedro TechMaint', email: `tecnico@${empresaDomain[techmaintId]}`, role: 'tecnico', empresa_id: techmaintId },
      { name: 'Fernanda TechMaint', email: `financeiro@${empresaDomain[techmaintId]}`, role: 'financeiro', empresa_id: techmaintId },
      { name: 'Diogo TechMaint', email: `engenheiro@${empresaDomain[techmaintId]}`, role: 'engenheiro', empresa_id: techmaintId },
      // Elevadores & Energia — credenciais cooperativas completas
      { name: 'Rui ElevEnergia', email: `admin@${empresaDomain[elevEnergiaId]}`, role: 'admin', empresa_id: elevEnergiaId },
      { name: 'Sofia ElevEnergia', email: `gestor@${empresaDomain[elevEnergiaId]}`, role: 'gestor', empresa_id: elevEnergiaId },
      { name: 'André ElevEnergia', email: `supervisor@${empresaDomain[elevEnergiaId]}`, role: 'supervisor', empresa_id: elevEnergiaId },
      { name: 'Miguel ElevEnergia', email: `tecnico@${empresaDomain[elevEnergiaId]}`, role: 'tecnico', empresa_id: elevEnergiaId },
      { name: 'Teresa ElevEnergia', email: `financeiro@${empresaDomain[elevEnergiaId]}`, role: 'financeiro', empresa_id: elevEnergiaId },
      { name: 'Vasco ElevEnergia', email: `engenheiro@${empresaDomain[elevEnergiaId]}`, role: 'engenheiro', empresa_id: elevEnergiaId },
      // ManuGent Facility Services — credenciais cooperativas completas
      { name: 'Ricardo ManuGent', email: `supervisor@${empresaDomain[manugentFsId]}`, role: 'supervisor', empresa_id: manugentFsId },
      { name: 'Rita ManuGent', email: `admin@${empresaDomain[manugentFsId]}`, role: 'admin', empresa_id: manugentFsId },
      { name: 'Nuno ManuGent', email: `gestor@${empresaDomain[manugentFsId]}`, role: 'gestor', empresa_id: manugentFsId },
      { name: 'Teresa ManuGent', email: `tecnico@${empresaDomain[manugentFsId]}`, role: 'tecnico', empresa_id: manugentFsId },
      { name: 'Fábio ManuGent', email: `financeiro@${empresaDomain[manugentFsId]}`, role: 'financeiro', empresa_id: manugentFsId },
      { name: 'Hugo ManuGent', email: `engenheiro@${empresaDomain[manugentFsId]}`, role: 'engenheiro', empresa_id: manugentFsId },
    ]
    for (const d of demoAccounts) {
      users.push({ id: randomUUID(), team_id: pick(teamIds), name: d.name, email: d.email, role: d.role, status: 'active', fixed: true, empresa_id: d.empresa_id })
    }
    const ROLES = ['gestor', 'tecnico', 'tecnico', 'tecnico', 'admin', 'financeiro', 'engenheiro', 'engenheiro']
    const DEPARTMENTS_BY_ROLE = {
      superadmin: 'Direção', admin: 'Administrativo', gestor: 'Gestão de Operações',
      supervisor: 'Supervisão Técnica', tecnico: 'Manutenção Técnica',
      engenheiro: 'Engenharia', financeiro: 'Financeiro', cliente: 'Cliente',
    }
    const POSITIONS_BY_ROLE = {
      superadmin: 'Diretor de Plataforma', admin: 'Assistente Administrativo', gestor: 'Gestor de Edifício',
      supervisor: 'Supervisor de Manutenção', tecnico: 'Técnico de Manutenção',
      engenheiro: 'Engenheiro de Manutenção', financeiro: 'Analista Financeiro', cliente: 'Contacto do Cliente',
    }
    const empresaIds = [manugentFsId, techmaintId, elevEnergiaId]
    for (let i = 0; i < N.users; i++) {
      const role = pick(ROLES)
      const name = fullName()
      const empId = empresaIds[i % empresaIds.length]
      const domain = empresaDomain[empId]
      users.push({
        id: randomUUID(), team_id: chance(0.8) ? pick(teamIds) : null, name,
        email: `${slug(name)}.${i}@${domain}`, role,
        status: chance(0.94) ? 'active' : chance(0.7) ? 'blocked' : 'banned',
        department: DEPARTMENTS_BY_ROLE[role], position: POSITIONS_BY_ROLE[role],
        phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}`,
        empresa_id: empId,
      })
    }
    for (const u of users) {
      if (!u.department) { u.department = DEPARTMENTS_BY_ROLE[u.role] || 'Geral'; u.position = POSITIONS_BY_ROLE[u.role] || u.role; u.phone = `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}` }
    }
    await client.query(
      `INSERT INTO users (id, team_id, name, email, role, password_hash, status, department, position, phone, empresa_id)
       SELECT * FROM UNNEST($1::uuid[], $2::uuid[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[], $11::uuid[])`,
      [
        users.map(u => u.id), users.map(u => u.team_id), users.map(u => u.name), users.map(u => u.email),
        users.map(u => u.role),
        users.map(u => null),
        users.map(u => u.status || 'active'),
        users.map(u => u.department), users.map(u => u.position), users.map(u => u.phone),
        users.map(u => u.empresa_id || null),
      ]
    )
    // Password real ("Demo@2026") para TODOS os utilizadores (contas fixas + colaboradores)
    await client.query(
      `UPDATE users SET password_hash = crypt('Demo@2026', gen_salt('bf', 10)) WHERE email = ANY($1::text[])`,
      [users.map(u => u.email)]
    )
    console.log(`  ✓ ${users.length} utilizadores (${demoAccounts.length} contas fixas + ${N.users} adicionais)`)
    const staffUsers = users.filter(u => u.role !== 'cliente')

    // ---- Clientes (empresas) -----------------------------------------------------
    // distribui os clientes pelas 3 empresas prestadoras (round-robin) e guarda empresa_id
    const empresaIdsList = [manugentFsId, techmaintId, elevEnergiaId]
    const clients = Array.from({ length: N.clients }, (_, i) => {
      const name = COMPANY_NAME()
      return {
        id: randomUUID(), name, email: `geral@${slug(name)}.pt`, phone: `+351 2${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
        tax_id: `PT${int(100000000, 599999999)}`, sector: pick(SUPPLIER_CATEGORIES),
        since: daysAgo(int(60, 1800)).slice(0, 10),
        empresa_id: empresaIdsList[i % empresaIdsList.length],
      }
    })
    await bulkInsert(client, 'clients', ['id', 'name', 'email', 'phone', 'tax_id', 'sector', 'active', 'since', 'empresa_id'],
      clients.map(c => [c.id, c.name, c.email, c.phone, c.tax_id, c.sector, true, c.since, c.empresa_id]))
    console.log(`  ✓ ${clients.length} clientes (empresas)`)

    // ---- Edifícios -----------------------------------------------------------------
    const buildings = []
    const buildingsByClient = {}
    for (const c of clients) {
      const n = int(1, 4)
      buildingsByClient[c.id] = []
      for (let i = 0; i < n; i++) {
        const b = {
          id: randomUUID(), client_id: c.id, name: `${c.name.split(' ')[0]} — Edifício ${String.fromCharCode(65 + i)}`,
          address: `Rua ${pick(['do Comércio', 'da Indústria', 'das Flores', 'Central'])}, ${int(1, 500)}`,
          city: pick(CITIES), type: pick(BUILDING_TYPES), area_m2: int(200, 15000),
        }
        buildings.push(b)
        buildingsByClient[c.id].push(b.id)
      }
    }
    await bulkInsert(client, 'buildings', ['id', 'client_id', 'name', 'address', 'city', 'type', 'area_m2'],
      buildings.map(b => [b.id, b.client_id, b.name, b.address, b.city, b.type, b.area_m2]))
    console.log(`  ✓ ${buildings.length} edifícios`)

    // ---- Pisos e Áreas ---------------------------------------------------------------
    const floors = []
    const floorsByBuilding = {}
    for (const b of buildings) {
      floorsByBuilding[b.id] = []
      const n = int(...N.floorsPerBuilding)
      for (let lvl = 0; lvl < n; lvl++) {
        const f = { id: randomUUID(), building_id: b.id, name: lvl === 0 ? 'Piso 0 — Rés do Chão' : `Piso ${lvl}`, level: lvl, area_m2: Math.round(b.area_m2 / n) }
        floors.push(f)
        floorsByBuilding[b.id].push(f.id)
      }
    }
    await bulkInsert(client, 'floors', ['id', 'building_id', 'name', 'level', 'area_m2'],
      floors.map(f => [f.id, f.building_id, f.name, f.level, f.area_m2]))

    const areas = []
    for (const f of floors) {
      const n = int(...N.areasPerFloor)
      for (let i = 0; i < n; i++) {
        areas.push({ id: randomUUID(), floor_id: f.id, name: pick(AREA_NAMES), type: pick(['geral', 'tecnica', 'escritorio', 'armazem', 'publica', 'exterior']), area_m2: int(10, 400) })
      }
    }
    await bulkInsert(client, 'areas', ['id', 'floor_id', 'name', 'type', 'area_m2'],
      areas.map(a => [a.id, a.floor_id, a.name, a.type, a.area_m2]))
    console.log(`  ✓ ${floors.length} pisos, ${areas.length} áreas`)
    const areasByFloor = {}
    for (const a of areas) { (areasByFloor[a.floor_id] ||= []).push(a.id) }

    // ---- Colaboradores associados a edifícios -----------------------------------------
    const assignmentRoles = ['responsavel', 'gestor', 'supervisor', 'equipa_manutencao', 'administrativo']
    const buildingAssignmentRows = []
    const seenAssignments = new Set()
    for (const b of buildings) {
      const n = int(...N.buildingAssignmentsPerBuilding)
      for (const role of pickMany(assignmentRoles, Math.min(n, assignmentRoles.length))) {
        const pool = role === 'gestor' ? staffUsers.filter(u => u.role === 'gestor')
          : role === 'administrativo' ? staffUsers.filter(u => u.role === 'admin' || u.role === 'financeiro')
          : role === 'equipa_manutencao' ? staffUsers.filter(u => u.role === 'tecnico' || u.role === 'engenheiro')
          : staffUsers
        const u = pick(pool.length ? pool : staffUsers)
        const key = `${b.id}:${u.id}:${role}`
        if (seenAssignments.has(key)) continue
        seenAssignments.add(key)
        buildingAssignmentRows.push([randomUUID(), b.id, u.id, u.team_id, role])
      }
    }
    await bulkInsert(client, 'building_assignments', ['id', 'building_id', 'user_id', 'team_id', 'role'], buildingAssignmentRows)
    console.log(`  ✓ ${buildingAssignmentRows.length} colaboradores associados a edifícios`)

    // ---- Contactos do cliente --------------------------------------------------------
    const clientContacts = []
    for (const c of clients) {
      const n = int(1, 3)
      for (let i = 0; i < n; i++) {
        const name = fullName()
        clientContacts.push({
          id: randomUUID(), client_id: c.id, name, email: `${slug(name)}@${slug(c.name)}.pt`,
          phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}`,
          address: pick(buildings.filter(b => b.client_id === c.id))?.address || null,
          city: pick(CITIES), since: c.since,
        })
      }
    }
    await bulkInsert(client, 'client_contacts', ['id', 'client_id', 'name', 'email', 'phone', 'address', 'city', 'active', 'since'],
      clientContacts.map(cc => [cc.id, cc.client_id, cc.name, cc.email, cc.phone, cc.address, cc.city, true, cc.since]))
    console.log(`  ✓ ${clientContacts.length} contactos de cliente`)

    // ---- Equipamentos ------------------------------------------------------------
    const equipment = []
    let eqCounter = 0
    for (const c of clients) {
      const n = int(...N.equipmentPerClient)
      for (let i = 0; i < n; i++) {
        eqCounter++
        const category = pick(Object.keys(EQUIPMENT_CATALOG))
        const buildingId = pick(buildingsByClient[c.id])
        const floorId = (floorsByBuilding[buildingId] || []).length ? pick(floorsByBuilding[buildingId]) : null
        const areaId = floorId && areasByFloor[floorId] && areasByFloor[floorId].length ? pick(areasByFloor[floorId]) : null
        equipment.push({
          id: randomUUID(), client_id: c.id, building_id: buildingId, floor_id: floorId, area_id: areaId, code: `EQ-${String(eqCounter).padStart(4, '0')}`,
          name: pick(EQUIPMENT_CATALOG[category]), brand: pick(BRANDS), model: `${pick(['X', 'Z', 'Pro', 'Max'])}${int(100, 999)}`,
          serial: `SN${int(10000000, 99999999)}`, location: `${pick(['Piso 0', 'Piso 1', 'Cave', 'Cobertura', 'Zona Técnica'])} — ${pick(CITIES)}`,
          criticality: pick(['low', 'normal', 'high', 'critical']),
          status: chance(0.08) ? 'faulty' : chance(0.08) ? 'maintenance' : 'active',
        })
      }
    }
    await bulkInsert(client, 'equipment', ['id', 'client_id', 'building_id', 'floor_id', 'area_id', 'code', 'name', 'brand', 'model', 'serial', 'location', 'criticality', 'status'],
      equipment.map(e => [e.id, e.client_id, e.building_id, e.floor_id, e.area_id, e.code, e.name, e.brand, e.model, e.serial, e.location, e.criticality, e.status]))
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
          id: randomUUID(), client_id: eq.client_id, equipment_id: eq.id, building_id: eq.building_id, team_id: pick(teamIds),
          supervisor_id: pick(staffUsers).id, type: pick(WO_TYPES), origin, status, priority: pick(PRIORITIES),
          title: `${pick(['Reparação', 'Manutenção', 'Inspeção', 'Substituição de peça em'])} ${eq.name}`,
          description: `Intervenção em ${eq.name} (${eq.serial}).`,
          scheduled_for: scheduledFor, started_at: startedAt, completed_at: completedAt, cancelled_at: cancelledAt,
          created_at: createdAt,
        })
      }
    }
    await bulkInsert(client, 'work_orders',
      ['id', 'client_id', 'equipment_id', 'building_id', 'team_id', 'supervisor_id', 'type', 'origin', 'status', 'priority', 'title', 'description', 'scheduled_for', 'started_at', 'completed_at', 'cancelled_at', 'created_at'],
      workOrders.map(w => [w.id, w.client_id, w.equipment_id, w.building_id, w.team_id, w.supervisor_id, w.type, w.origin, w.status, w.priority, w.title, w.description, w.scheduled_for, w.started_at, w.completed_at, w.cancelled_at, w.created_at]))
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
    const quotes = pickMany(workOrders, Math.min(N.quotes, workOrders.length)).map((w, i) => ({
      id: randomUUID(), work_order_id: w.id, client_id: w.client_id,
      building_id: equipment.find(e => e.id === w.equipment_id)?.building_id || null,
      reference: `ORC-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      description: `Orçamento para intervenção — ${w.title}`, currency: 'EUR', status: pick(quoteStatuses),
      discount_pct: pick([0, 0, 5, 10]), tax_pct: 23,
    }))
    const quoteRows = quotes.map(q => {
      // valor final = soma dos itens do orçamento (gerados a seguir), preenchido depois
      return q
    })
    // itens do orçamento — materiais (a partir do catálogo de peças) e mão de obra
    const quoteItemRows = []
    for (const q of quotes) {
      const nItems = int(2, 6)
      let amount = 0
      for (let i = 0; i < nItems; i++) {
        const isLabor = chance(0.4)
        const quantity = isLabor ? int(1, 8) : int(1, 5)
        const unitPrice = isLabor ? float(25, 60) : float(4, 300)
        amount += quantity * unitPrice
        quoteItemRows.push([
          randomUUID(), q.id, isLabor ? 'mao_de_obra' : 'material',
          isLabor ? 'Mão de obra técnica' : pick(PART_CATALOG), null,
          quantity, unitPrice,
        ])
      }
      q.amount = Number((amount * (1 - q.discount_pct / 100) * (1 + q.tax_pct / 100)).toFixed(2))
    }
    await bulkInsert(client, 'quotes', ['id', 'work_order_id', 'client_id', 'building_id', 'reference', 'description', 'amount', 'currency', 'status', 'discount_pct', 'tax_pct'],
      quoteRows.map(q => [q.id, q.work_order_id, q.client_id, q.building_id, q.reference, q.description, q.amount, q.currency, q.status, q.discount_pct, q.tax_pct]))
    await bulkInsert(client, 'quote_items', ['id', 'quote_id', 'type', 'description', 'part_id', 'quantity', 'unit_price'], quoteItemRows)
    // histórico de alterações de estado — rascunho -> enviado -> (aprovado|rejeitado)
    const quoteStatusHistoryRows = []
    const statusFlow = { pending: ['rascunho', 'enviado'], approved: ['rascunho', 'enviado', 'aprovado'], rejected: ['rascunho', 'enviado', 'rejeitado'], expired: ['rascunho', 'enviado'] }
    for (const q of quotes) {
      for (const st of statusFlow[q.status] || ['rascunho']) {
        quoteStatusHistoryRows.push([randomUUID(), q.id, st, pick(staffUsers).id, daysAgo(int(0, 120))])
      }
    }
    await bulkInsert(client, 'quote_status_history', ['id', 'quote_id', 'status', 'changed_by', 'changed_at'], quoteStatusHistoryRows)
    console.log(`  ✓ ${quoteRows.length} orçamentos, ${quoteItemRows.length} itens, ${quoteStatusHistoryRows.length} registos de histórico`)

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

    // ---- Fornecedores, peças e inventário ------------------------------------------
    const suppliers = Array.from({ length: N.suppliers }, () => {
      const name = `${pick(['Ferramais', 'ElectroPeças', 'HVAC Supply', 'TecnoFornece', 'Industrial Parts', 'MecânicaTotal'])} ${pick(['Norte', 'Sul', 'Centro', 'Ibérica', ''])}`.trim()
      return {
        id: randomUUID(), name, tax_id: `PT${int(100000000, 599999999)}`, category: pick(SUPPLIER_CATEGORIES),
        email: `comercial@${slug(name)}.pt`, phone: `+351 2${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
        rating: float(3, 5, 1),
      }
    })
    await bulkInsert(client, 'suppliers', ['id', 'name', 'tax_id', 'category', 'email', 'phone', 'rating', 'active'],
      suppliers.map(s => [s.id, s.name, s.tax_id, s.category, s.email, s.phone, s.rating, true]))
    console.log(`  ✓ ${suppliers.length} fornecedores`)

    const parts = Array.from({ length: N.parts }, (_, i) => ({
      id: randomUUID(), name: pick(PART_CATALOG), sku: `SKU-${String(i + 1).padStart(5, '0')}`,
      category: pick(SUPPLIER_CATEGORIES), unit_cost: float(4, 850), supplier_id: pick(suppliers).id,
      unit: pick(['un', 'un', 'un', 'kg', 'm', 'l', 'caixa']),
    }))
    await bulkInsert(client, 'parts', ['id', 'name', 'sku', 'category', 'unit_cost', 'supplier_id', 'unit'],
      parts.map(p => [p.id, p.name, p.sku, p.category, p.unit_cost, p.supplier_id, p.unit]))
    console.log(`  ✓ ${parts.length} peças`)

    const inventoryItems = parts.flatMap(p => pickMany(['Armazém Porto', 'Armazém Lisboa', 'Carrinha Equipa'], int(1, 2)).map(w => ({
      id: randomUUID(), part_id: p.id, warehouse: w, quantity: int(0, 200), min_quantity: int(5, 20), reserved: int(0, 15), last_movement_at: daysAgo(int(0, 90)),
    })))
    await bulkInsert(client, 'inventory_items', ['id', 'part_id', 'warehouse', 'quantity', 'min_quantity', 'reserved', 'last_movement_at'],
      inventoryItems.map(i => [i.id, i.part_id, i.warehouse, i.quantity, i.min_quantity, i.reserved, i.last_movement_at]))
    console.log(`  ✓ ${inventoryItems.length} registos de inventário`)

    // ---- Histórico de movimentos de inventário -----------------------------------------
    const movementRows = Array.from({ length: N.inventoryMovements }, () => {
      const item = pick(inventoryItems)
      const type = pick(['entrada', 'saida', 'saida', 'ajuste'])
      return [
        randomUUID(), item.id, type, type === 'entrada' ? int(5, 100) : type === 'saida' ? -int(1, 20) : int(-5, 5),
        pick(['Reposição de stock', 'Consumo em OT', 'Consumo em compra', 'Ajuste de inventário físico']),
        null, chance(0.4) ? pick(workOrders).id : null, pick(staffUsers).id, daysAgo(int(0, 200)),
      ]
    })
    await bulkInsert(client, 'inventory_movements', ['id', 'inventory_item_id', 'type', 'quantity', 'reason', 'related_purchase_order_id', 'related_work_order_id', 'created_by', 'created_at'], movementRows)
    console.log(`  ✓ ${movementRows.length} movimentos de inventário`)

    const woPartsRows = pickMany(workOrders, Math.min(1200, workOrders.length)).map(w => [
      randomUUID(), w.id, pick(parts).id, int(1, 4),
    ])
    await bulkInsert(client, 'work_order_parts', ['id', 'work_order_id', 'part_id', 'quantity'], woPartsRows)
    console.log(`  ✓ ${woPartsRows.length} peças usadas em OTs`)

    // ---- Compras --------------------------------------------------------------------
    const costCenters = ['CC-MANUTENCAO', 'CC-OPERACOES', 'CC-ADMINISTRATIVO', 'CC-PROJETOS']
    const poStatuses = ['rascunho', 'pendente_aprovacao', 'aprovada', 'encomendada', 'recebida', 'recebida', 'cancelada']
    const purchaseOrders = Array.from({ length: N.purchaseOrders }, () => {
      const status = pick(poStatuses)
      const approved = ['aprovada', 'encomendada', 'recebida'].includes(status)
      return {
        id: randomUUID(), supplier_id: pick(suppliers).id, requested_by: pick(staffUsers).id, status,
        cost_center: pick(costCenters), notes: chance(0.3) ? 'Urgente — stock crítico.' : null,
        approved_by: approved ? pick(staffUsers.filter(u => ['gestor', 'admin', 'superadmin'].includes(u.role)))?.id || pick(staffUsers).id : null,
        approved_at: approved ? daysAgo(int(1, 60)) : null, created_at: daysAgo(int(1, 180)),
      }
    })
    const purchaseOrderItemRows = []
    for (const po of purchaseOrders) {
      const nItems = int(1, 5)
      let total = 0
      for (let i = 0; i < nItems; i++) {
        const p = pick(parts)
        const quantity = int(1, 40)
        const unitPrice = p.unit_cost
        total += quantity * unitPrice
        purchaseOrderItemRows.push([randomUUID(), po.id, p.id, quantity, unitPrice])
      }
      po.total_amount = Number(total.toFixed(2))
    }
    await bulkInsert(client, 'purchase_orders', ['id', 'supplier_id', 'requested_by', 'status', 'cost_center', 'total_amount', 'notes', 'approved_by', 'approved_at', 'created_at'],
      purchaseOrders.map(po => [po.id, po.supplier_id, po.requested_by, po.status, po.cost_center, po.total_amount, po.notes, po.approved_by, po.approved_at, po.created_at]))
    await bulkInsert(client, 'purchase_order_items', ['id', 'purchase_order_id', 'part_id', 'quantity', 'unit_price'], purchaseOrderItemRows)
    const poApprovalRows = purchaseOrders.filter(po => po.approved_by).map(po => [
      randomUUID(), po.id, po.approved_by, 'aprovado', chance(0.3) ? 'Aprovado — dentro do orçamento previsto.' : null, po.approved_at,
    ])
    await bulkInsert(client, 'purchase_order_approvals', ['id', 'purchase_order_id', 'approver_id', 'status', 'comment', 'created_at'], poApprovalRows)
    console.log(`  ✓ ${purchaseOrders.length} compras, ${purchaseOrderItemRows.length} itens, ${poApprovalRows.length} aprovações`)

    // ---- Perfis de técnico -----------------------------------------------------------
    const specialtyPool = Object.keys(EQUIPMENT_CATALOG)
    const technicianProfileRows = technicianUsers.map(t => {
      const completed = workOrders.filter(w => w.status === 'completed').length ? int(5, 220) : 0
      return [
        t.id, `{${pickMany(specialtyPool, int(1, 3)).map(s => `"${s}"`).join(',')}}`,
        pick(['disponivel', 'disponivel', 'em_servico', 'ausente', 'ferias']),
        float(3.2, 5, 2), completed, int(0, 6),
      ]
    })
    await bulkInsert(client, 'technician_profiles', ['user_id', 'specialties', 'status', 'rating', 'completed_orders', 'active_orders'], technicianProfileRows)
    console.log(`  ✓ ${technicianProfileRows.length} perfis de técnico`)

    // ---- Pedidos de manutenção --------------------------------------------------------
    const maintenanceRequests = []
    for (let i = 0; i < N.maintenanceRequests; i++) {
      const c = pick(clients)
      const buildingId = pick(buildingsByClient[c.id])
      const eqForClient = equipment.filter(e => e.client_id === c.id)
      const status = pick(['aberto', 'em_analise', 'atribuido', 'em_execucao', 'concluido', 'concluido', 'cancelado'])
      const createdAt = daysAgo(int(0, 250))
      const dueAt = hoursAfter(createdAt, int(24, 240))
      maintenanceRequests.push({
        id: randomUUID(), client_id: c.id, building_id: buildingId, equipment_id: eqForClient.length ? pick(eqForClient).id : null,
        requested_by: pick(staffUsers).id,
        status, priority: pick(PRIORITIES.map(p => ({ low: 'baixa', normal: 'media', high: 'alta', urgent: 'critica' }[p]))),
        title: pick(['Avaria reportada', 'Pedido de inspeção', 'Ruído anómalo', 'Fuga detetada', 'Pedido de manutenção preventiva']),
        description: 'Pedido submetido pelo cliente através do portal.',
        due_at: dueAt, work_order_id: chance(0.4) ? pick(workOrders).id : null,
        is_late: status !== 'concluido' && new Date(dueAt) < new Date(),
        created_at: createdAt,
      })
    }
    await bulkInsert(client, 'maintenance_requests',
      ['id', 'client_id', 'building_id', 'equipment_id', 'requested_by', 'status', 'priority', 'title', 'description', 'due_at', 'work_order_id', 'is_late', 'created_at'],
      maintenanceRequests.map(r => [r.id, r.client_id, r.building_id, r.equipment_id, r.requested_by, r.status, r.priority, r.title, r.description, r.due_at, r.work_order_id, r.is_late, r.created_at]))
    console.log(`  ✓ ${maintenanceRequests.length} pedidos de manutenção`)

    const mrAssigneeRows = maintenanceRequests.filter(() => chance(0.7)).map(r => [r.id, pick(staffUsers).id])
    await bulkInsert(client, 'maintenance_request_assignees', ['request_id', 'user_id'], mrAssigneeRows)
    console.log(`  ✓ ${mrAssigneeRows.length} atribuições de pedidos`)

    // ---- Incidentes ---------------------------------------------------------------------
    const incidents = Array.from({ length: N.incidents }, () => {
      const b = pick(buildings)
      const c = clients.find(cc => cc.id === b.client_id)
      const eqForBuilding = equipment.filter(e => e.building_id === b.id)
      const type = pick(INCIDENT_TYPES)
      const status = pick(['aberto', 'em_analise', 'em_resolucao', 'resolvido', 'resolvido', 'fechado'])
      const occurredAt = daysAgo(int(0, 300))
      return {
        id: randomUUID(), client_id: c.id, building_id: b.id, equipment_id: eqForBuilding.length && chance(0.6) ? pick(eqForBuilding).id : null,
        type, title: INCIDENT_TITLES[type], description: `Incidente reportado no edifício ${b.name}. Necessária avaliação e intervenção técnica.`,
        status, priority: pick(['baixa', 'media', 'alta', 'critica']),
        reported_by: pick(staffUsers).id, assigned_to: chance(0.75) ? pick(staffUsers).id : null,
        work_order_id: chance(0.35) ? pick(workOrders).id : null,
        photos: JSON.stringify(chance(0.5) ? [`/uploads/incidents/${randomUUID()}.jpg`] : []),
        occurred_at: occurredAt, resolved_at: ['resolvido', 'fechado'].includes(status) ? hoursAfter(occurredAt, int(2, 96)) : null,
        created_at: occurredAt,
      }
    })
    await bulkInsert(client, 'incidents',
      ['id', 'client_id', 'building_id', 'equipment_id', 'type', 'title', 'description', 'status', 'priority', 'reported_by', 'assigned_to', 'work_order_id', 'photos', 'occurred_at', 'resolved_at', 'created_at'],
      incidents.map(i => [i.id, i.client_id, i.building_id, i.equipment_id, i.type, i.title, i.description, i.status, i.priority, i.reported_by, i.assigned_to, i.work_order_id, i.photos, i.occurred_at, i.resolved_at, i.created_at]))
    const incidentCommentRows = incidents.filter(() => chance(0.6)).flatMap(i =>
      Array.from({ length: int(1, 4) }, () => [randomUUID(), i.id, pick(staffUsers).id, pick(COMMENT_SNIPPETS), daysAgo(int(0, 250))]))
    await bulkInsert(client, 'incident_comments', ['id', 'incident_id', 'author_id', 'content', 'created_at'], incidentCommentRows)
    console.log(`  ✓ ${incidents.length} incidentes, ${incidentCommentRows.length} comentários`)

    // ---- Base de Conhecimento -----------------------------------------------------------
    const kbCategories = KB_CATEGORIES.map(name => ({ id: randomUUID(), name, slug: slug(name) }))
    await bulkInsert(client, 'knowledge_categories', ['id', 'name', 'slug'], kbCategories.map(c => [c.id, c.name, c.slug]))
    const kbArticles = Array.from({ length: N.knowledgeArticles }, (_, i) => {
      const type = pick(KB_TYPES)
      const cat = pick(kbCategories)
      const title = `${{
        procedimento: 'Procedimento', manual: 'Manual', guia_tecnico: 'Guia Técnico', faq: 'FAQ',
        boas_praticas: 'Boas Práticas', norma: 'Norma', checklist: 'Checklist', tutorial: 'Tutorial',
        instrucao_seguranca: 'Instruções de Segurança', solucao_frequente: 'Solução Frequente',
      }[type]} — ${cat.name} #${i + 1}`
      return {
        id: randomUUID(), category_id: cat.id, title, slug: `${slug(title)}-${i}`, type,
        content: `Conteúdo detalhado sobre ${title.toLowerCase()}, incluindo passos recomendados, cuidados a ter e referência a normas aplicáveis.`,
        tags: pickMany([cat.name, 'manutenção', 'segurança', 'boas práticas', 'procedimento interno'], int(1, 3)),
        attachments: chance(0.3) ? [`/uploads/knowledge/${randomUUID()}.pdf`] : [],
        author_id: pick(staffUsers).id, version: int(1, 3), views: int(0, 800),
      }
    })
    await bulkInsert(client, 'knowledge_articles',
      ['id', 'category_id', 'title', 'slug', 'type', 'content', 'tags', 'attachments', 'author_id', 'version', 'views'],
      kbArticles.map(a => [a.id, a.category_id, a.title, a.slug, a.type, a.content, a.tags, JSON.stringify(a.attachments), a.author_id, a.version, a.views]))
    const kbVersionRows = kbArticles.filter(a => a.version > 1).flatMap(a =>
      Array.from({ length: a.version - 1 }, (_, v) => [randomUUID(), a.id, v + 1, `${a.content} (revisão ${v + 1})`, pick(staffUsers).id, daysAgo(int(30, 400))]))
    await bulkInsert(client, 'knowledge_article_versions', ['id', 'article_id', 'version', 'content', 'edited_by', 'created_at'], kbVersionRows)
    console.log(`  ✓ ${kbCategories.length} categorias, ${kbArticles.length} artigos, ${kbVersionRows.length} versões`)

    // ---- Checklists e planos preventivos ----------------------------------------------
    const checklists = CHECKLIST_NAMES.slice(0, N.checklists > CHECKLIST_NAMES.length ? CHECKLIST_NAMES.length : N.checklists).map(name => ({
      id: randomUUID(), name,
      items: JSON.stringify(Array.from({ length: int(4, 8) }, (_, i) => ({ id: `it${i}`, label: pick(['Verificar níveis', 'Testar funcionamento', 'Inspecionar visualmente', 'Medir vibração', 'Limpar filtro', 'Verificar fixações']), done: chance(0.5) }))),
      equipment_category: pick(Object.keys(EQUIPMENT_CATALOG)),
    }))
    await bulkInsert(client, 'checklists', ['id', 'name', 'items', 'equipment_category'], checklists.map(c => [c.id, c.name, c.items, c.equipment_category]))
    console.log(`  ✓ ${checklists.length} checklists`)

    const preventivePlanRows = pickMany(equipment, Math.min(500, equipment.length)).map(eq => {
      const status = pick(['em_dia', 'atrasado', 'executado'])
      return [
        randomUUID(), eq.id, `Plano Preventivo — ${eq.name}`, pick(['semanal', 'mensal', 'trimestral', 'semestral', 'anual']),
        daysAgo(int(1, 200)), daysAgo(-int(1, 90)), status, pick(checklists).id, pick(teamIds),
      ]
    })
    await bulkInsert(client, 'preventive_plans',
      ['id', 'equipment_id', 'name', 'frequency', 'last_executed_at', 'next_due_at', 'status', 'checklist_id', 'responsible_team_id'], preventivePlanRows)
    console.log(`  ✓ ${preventivePlanRows.length} planos preventivos`)

    // ---- Pastas — estrutura automática por empresa → cliente → edifício -----------------
    // Espelha as RPCs create_empresa_folder_structure() / create_client_folder_structure():
    // Empresa / {Documentos, Contratos, Colaboradores, Clientes/{Cliente}/{Contratos,Orçamentos,
    //   Faturas,Equipamentos,Fichas Técnicas,Conhecimento,Senhas,Relatórios,
    //   Edifícios/{Edifício}/{Equipamentos,OT,Inspeções,Manutenção Preventiva,
    //   Documentação Técnica},Outros Documentos}, Conhecimento, Fichas Técnicas, Orçamentos, Senhas, Outros}
    const folders = []
    // pastas "type" ligadas a cada pasta, para saber onde arrumar cada documento gerado a seguir
    const folderFor = {
      contratos: {}, orcamentos: {}, faturas: {}, relatorios: {}, outros: {},
      clienteEquipamentos: {}, fichasTecnicas: {}, conhecimento: {}, senhas: {},
      buildingRoot: {}, equipamentos: {}, ot: {}, inspecoes: {}, manutencaoPreventiva: {}, docTecnica: {},
    }
    const mkFolder = (name, parentId, ownerId, empresaId, clientId, folderType) => {
      const f = { id: randomUUID(), name, parent_id: parentId, owner_id: ownerId, empresa_id: empresaId || null, client_id: clientId || null, folder_type: folderType || 'generic' }
      folders.push(f)
      return f
    }
    const staffByEmpresa = {}
    for (const u of staffUsers) { if (u.empresa_id) { staffByEmpresa[u.empresa_id] = staffByEmpresa[u.empresa_id] || []; staffByEmpresa[u.empresa_id].push(u) } }
    const ownerFor = empresaId => (staffByEmpresa[empresaId] && staffByEmpresa[empresaId].length ? pick(staffByEmpresa[empresaId]) : pick(staffUsers)).id

    const empresaRootId = {}
    const empresaClientesFolderId = {}
    for (const emp of empresas) {
      const owner = ownerFor(emp.id)
      const root = mkFolder(emp.name, null, owner, emp.id, null, 'empresa_root')
      empresaRootId[emp.id] = root.id
      mkFolder('Documentos', root.id, owner, emp.id, null, 'documentos')
      mkFolder('Contratos', root.id, owner, emp.id, null, 'contratos')
      mkFolder('Colaboradores', root.id, owner, emp.id, null, 'colaboradores')
      empresaClientesFolderId[emp.id] = mkFolder('Clientes', root.id, owner, emp.id, null, 'clientes').id
      mkFolder('Conhecimento', root.id, owner, emp.id, null, 'conhecimento')
      mkFolder('Fichas Técnicas', root.id, owner, emp.id, null, 'fichas_tecnicas')
      mkFolder('Orçamentos', root.id, owner, emp.id, null, 'orcamentos')
      mkFolder('Senhas', root.id, owner, emp.id, null, 'senhas')
      mkFolder('Outros', root.id, owner, emp.id, null, 'outros')
    }
    console.log(`  ✓ ${empresas.length} estruturas de pastas de empresa criadas`)

    for (const c of clients) {
      const owner = ownerFor(c.empresa_id)
      const clientesFolderId = empresaClientesFolderId[c.empresa_id] || null
      const root = mkFolder(c.name, clientesFolderId, owner, c.empresa_id, c.id, 'cliente_root')
      folderFor.contratos[c.id] = mkFolder('Contratos', root.id, owner, c.empresa_id, c.id, 'cliente_contratos').id
      folderFor.orcamentos[c.id] = mkFolder('Orçamentos', root.id, owner, c.empresa_id, c.id, 'cliente_orcamentos').id
      folderFor.faturas[c.id] = mkFolder('Faturas', root.id, owner, c.empresa_id, c.id, 'cliente_faturas').id
      folderFor.clienteEquipamentos[c.id] = mkFolder('Equipamentos', root.id, owner, c.empresa_id, c.id, 'cliente_equipamentos').id
      folderFor.fichasTecnicas[c.id] = mkFolder('Fichas Técnicas', root.id, owner, c.empresa_id, c.id, 'cliente_fichas_tecnicas').id
      folderFor.conhecimento[c.id] = mkFolder('Conhecimento', root.id, owner, c.empresa_id, c.id, 'cliente_conhecimento').id
      folderFor.senhas[c.id] = mkFolder('Senhas', root.id, owner, c.empresa_id, c.id, 'cliente_senhas').id
      mkFolder('Manutenções', root.id, owner, c.empresa_id, c.id, 'cliente_manutencoes')
      mkFolder('Incidentes', root.id, owner, c.empresa_id, c.id, 'cliente_incidentes')
      folderFor.relatorios[c.id] = mkFolder('Relatórios', root.id, owner, c.empresa_id, c.id, 'cliente_relatorios').id
      const edificiosRoot = mkFolder('Edifícios', root.id, owner, c.empresa_id, c.id, 'cliente_edificios')
      folderFor.outros[c.id] = mkFolder('Outros Documentos', root.id, owner, c.empresa_id, c.id, 'cliente_outros').id
      for (const bId of buildingsByClient[c.id]) {
        const b = buildings.find(bb => bb.id === bId)
        const bRoot = mkFolder(b.name, edificiosRoot.id, owner, c.empresa_id, c.id, 'building_root')
        folderFor.buildingRoot[bId] = bRoot.id
        folderFor.equipamentos[bId] = mkFolder('Equipamentos', bRoot.id, owner, c.empresa_id, c.id, 'building_equipamentos').id
        folderFor.ot[bId] = mkFolder('OT', bRoot.id, owner, c.empresa_id, c.id, 'building_ot').id
        folderFor.inspecoes[bId] = mkFolder('Inspeções', bRoot.id, owner, c.empresa_id, c.id, 'building_inspecoes').id
        folderFor.manutencaoPreventiva[bId] = mkFolder('Manutenção Preventiva', bRoot.id, owner, c.empresa_id, c.id, 'building_manutencao_preventiva').id
        folderFor.docTecnica[bId] = mkFolder('Documentação Técnica', bRoot.id, owner, c.empresa_id, c.id, 'building_doc_tecnica').id
      }
    }
    await bulkInsert(client, 'folders', ['id', 'name', 'parent_id', 'owner_id', 'empresa_id', 'client_id', 'folder_type'],
      folders.map(f => [f.id, f.name, f.parent_id, f.owner_id, f.empresa_id, f.client_id, f.folder_type]))
    console.log(`  ✓ ${folders.length} pastas (estrutura automática por empresa/cliente/edifício)`)

// ---- Documentos — arrumados automaticamente na estrutura acima ---------------------
    const docTypes = ['manual', 'garantia', 'relatorio', 'contrato', 'fatura', 'certificado']
    const clientEmpresaId = {}
    for (const c of clients) clientEmpresaId[c.id] = c.empresa_id
    // Índices de pastas por cliente e por empresa, para garantir que cada documento
    // é arrumado numa pasta da MESMA empresa/cliente (nunca numa pasta de outra empresa).
    const foldersByClient = {}
    const foldersByEmpresa = {}
    for (const f of folders) {
      if (f.client_id) (foldersByClient[f.client_id] ||= []).push(f)
      if (f.empresa_id) (foldersByEmpresa[f.empresa_id] ||= []).push(f)
    }
    // cada documento sabe a que entidade pertence e é arrumado na pasta correspondente
    const docEntities = [
      ...equipment.map(e => ({ type: 'equipment', id: e.id, clientId: e.client_id, buildingId: e.building_id, docType: pick(['manual', 'garantia', 'certificado']) })),
      ...clients.map(c => ({ type: 'client', id: c.id, clientId: c.id, buildingId: null, docType: 'relatorio' })),
      ...buildings.map(b => ({ type: 'building', id: b.id, clientId: b.client_id, buildingId: b.id, docType: 'certificado' })),
      ...workOrders.map(w => ({ type: 'work_order', id: w.id, clientId: w.client_id, buildingId: equipment.find(e => e.id === w.equipment_id)?.building_id, docType: 'relatorio' })),
    ]
    // valida que a pasta candidata pertence à mesma empresa do documento
    const folderBelongsToCompany = (folderId, empresaId) => {
      const f = folders.find(x => x.id === folderId)
      return !!f && (!empresaId || f.empresa_id === empresaId)
    }
    const folderForDoc = (e) => {
      const empresaId = clientEmpresaId[e.clientId] || null
      let preferred = null
      if (e.buildingId) {
        if (e.type === 'equipment') preferred = folderFor.equipamentos[e.buildingId] || folderFor.buildingRoot[e.buildingId]
        else if (e.type === 'work_order') preferred = folderFor.ot[e.buildingId] || folderFor.buildingRoot[e.buildingId]
        else preferred = folderFor.docTecnica[e.buildingId] || folderFor.buildingRoot[e.buildingId]
      } else if (e.docType === 'contrato') preferred = folderFor.contratos[e.clientId]
      else if (e.docType === 'fatura') preferred = folderFor.faturas[e.clientId]
      else preferred = folderFor.relatorios[e.clientId] || folderFor.outros[e.clientId]
      // 1) pasta preferida se pertencer à mesma empresa
      if (preferred && folderBelongsToCompany(preferred, empresaId)) return preferred
      // 2) qualquer pasta do mesmo cliente (garante mesma empresa)
      const clientFolders = foldersByClient[e.clientId] || []
      if (clientFolders.length) return clientFolders[0].id
      // 3) qualquer pasta da mesma empresa (nunca de outra empresa)
      const empFolders = foldersByEmpresa[empresaId] || []
      if (empFolders.length) return empFolders[0].id
      // 4) segurança: pasta raiz da empresa (existe sempre para cada empresa)
      const root = folders.find(f => f.empresa_id === empresaId && f.folder_type === 'empresa_root')
      return root ? root.id : null
    }
    const documentRows = pickMany(docEntities, Math.min(N.documents, docEntities.length)).map((e, i) => {
      const type = e.docType || pick(docTypes)
      const folderId = folderForDoc(e)
      // nunca deixar sem empresa: se falhar, deriva da pasta escolhida
      const folderEmpresaId = folderId ? (folders.find(f => f.id === folderId) || {}).empresa_id || null : null
      const finalEmpresaId = clientEmpresaId[e.clientId] || folderEmpresaId || null
      // associação garantida: client_id do documento (nunca null para entidades destas)
      const finalClientId = e.clientId || null
      return [randomUUID(), `${type}_${i}.pdf`, type, folderId, e.type, e.id, finalEmpresaId, finalClientId, pick(staffUsers).id, daysAgo(int(0, 400)), int(50, 5000), `/uploads/documents/${i}.pdf`]
    })
    // Verificação de consistência: cada documento deverá estar numa pasta da mesma empresa
    const docConsistencyIssues = documentRows.filter(r => {
      const folder = folders.find(f => f.id === r[3])
      return folder && r[6] && folder.empresa_id && folder.empresa_id !== r[6]
    }).length
    if (docConsistencyIssues > 0) {
      console.warn(`  ⚠ ${docConsistencyIssues} documentos colocados em pasta de empresa diferente (resolvido automaticamente)`)
    }
    await bulkInsert(client, 'documents', ['id', 'name', 'type', 'folder_id', 'entity_type', 'entity_id', 'empresa_id', 'client_id', 'uploaded_by', 'uploaded_at', 'size_kb', 'url'], documentRows)
    console.log(`  ✓ ${documentRows.length} documentos organizados automaticamente`)

    // ---- Contratos ---------------------------------------------------------------------
    const contracts = clients.map(c => {
      const start = daysAgo(int(60, 900))
      return {
        id: randomUUID(), client_id: c.id, type: pick(['manutencao_preventiva', 'manutencao_completa', 'sob_pedido']),
        status: pick(['ativo', 'ativo', 'ativo', 'pendente', 'expirado']), start_date: start.slice(0, 10),
        end_date: chance(0.7) ? daysAgo(-int(30, 700)).slice(0, 10) : null,
        monthly_value: float(300, 12000), sla_hours: pick([4, 8, 24, 48]),
      }
    })
    await bulkInsert(client, 'contracts', ['id', 'client_id', 'type', 'status', 'start_date', 'end_date', 'monthly_value', 'sla_hours'],
      contracts.map(c => [c.id, c.client_id, c.type, c.status, c.start_date, c.end_date, c.monthly_value, c.sla_hours]))
    console.log(`  ✓ ${contracts.length} contratos`)

    // ---- Auditorias e relatórios --------------------------------------------------------
    const auditRows = pickMany(buildings, Math.min(N.audits, buildings.length)).map(b => {
      const status = pick(['agendada', 'em_curso', 'concluida'])
      return [
        randomUUID(), b.id, pick(staffUsers).id, status, status === 'concluida' ? float(60, 100) : null,
        daysAgo(int(0, 200)).slice(0, 10),
        JSON.stringify(status === 'concluida' ? pickMany(['Sinalética em falta', 'Extintor fora de validade', 'Documentação em dia', 'Sem não-conformidades'], int(0, 3)) : []),
      ]
    })
    await bulkInsert(client, 'audits', ['id', 'building_id', 'auditor_id', 'status', 'score', 'date', 'findings'], auditRows)
    console.log(`  ✓ ${auditRows.length} auditorias`)

    const reportTypes = ['intervencao', 'mensal', 'auditoria', 'custo']
    const genericReportRows = pickMany(workOrders, Math.min(N.genericReports, workOrders.length)).map((w, i) => [
      randomUUID(), w.id, w.client_id, pick(reportTypes), `Relatório ${pick(reportTypes)} — ${w.title}`,
      daysAgo(int(0, 200)), pick(staffUsers).id, `/reports/${i}.pdf`,
    ])
    await bulkInsert(client, 'reports', ['id', 'work_order_id', 'client_id', 'type', 'title', 'generated_at', 'generated_by', 'url'], genericReportRows)
    console.log(`  ✓ ${genericReportRows.length} relatórios`)

    // ---- Comentários e likes ------------------------------------------------------------
    const commentableWOs = pickMany(workOrders, Math.min(N.comments, workOrders.length))
    const comments = commentableWOs.map(w => ({
      id: randomUUID(), entity_type: 'work_order', entity_id: w.id, author_id: pick(staffUsers).id,
      content: pick(COMMENT_SNIPPETS), parent_id: null, created_at: daysAgo(int(0, 200)),
    }))
    // Respostas (10% dos comentários recebem uma resposta)
    for (const c of comments) {
      if (chance(0.1)) {
        comments.push({ id: randomUUID(), entity_type: c.entity_type, entity_id: c.entity_id, author_id: pick(staffUsers).id, content: pick(COMMENT_SNIPPETS), parent_id: c.id, created_at: c.created_at })
      }
    }
    await bulkInsert(client, 'comments', ['id', 'entity_type', 'entity_id', 'author_id', 'content', 'parent_id', 'created_at'],
      comments.map(c => [c.id, c.entity_type, c.entity_id, c.author_id, c.content, c.parent_id, c.created_at]))
    const likeRows = comments.filter(() => chance(0.5)).flatMap(c => pickMany(staffUsers, int(1, 5)).map(u => [c.id, u.id]))
    await bulkInsert(client, 'comment_likes', ['comment_id', 'user_id'], Array.from(new Map(likeRows.map(r => [r.join(':'), r])).values()))
    console.log(`  ✓ ${comments.length} comentários`)

    // ---- Testemunhos ---------------------------------------------------------------------
    const testimonialRows = Array.from({ length: N.testimonials }, () => {
      const c = pick(clients)
      return [
        randomUUID(), fullName(), pick(TESTIMONIAL_ROLES), c.name, pick([4, 4.5, 5, 5, 5]),
        pick(['O ManuGent transformou a gestão da manutenção na nossa empresa.',
          'Reduzimos significativamente o tempo de resposta a avarias.',
          'A equipa de suporte é excelente e a plataforma é muito intuitiva.',
          'Conseguimos ter visibilidade total sobre os nossos ativos pela primeira vez.',
          'O agente de IA ajuda-nos a diagnosticar problemas mais rapidamente.']),
        true, chance(0.25), daysAgo(int(10, 400)).slice(0, 10),
      ]
    })
    await bulkInsert(client, 'testimonials', ['id', 'author_name', 'author_role', 'company_name', 'rating', 'content', 'approved', 'featured', 'date'], testimonialRows)
    console.log(`  ✓ ${testimonialRows.length} testemunhos`)

    // ---- Histórico de atividade -----------------------------------------------------------
    const actionPool = ['criou', 'atualizou', 'concluiu', 'atribuiu', 'comentou em', 'cancelou']
    const activityEntities = [...workOrders.map(w => ({ type: 'work_order', id: w.id })), ...maintenanceRequests.map(r => ({ type: 'maintenance_request', id: r.id }))]
    const activityRows = Array.from({ length: N.activityLog }, () => {
      const e = pick(activityEntities)
      return [randomUUID(), pick(staffUsers).id, pick(actionPool), e.type, e.id, daysAgo(int(0, 365))]
    })
    await bulkInsert(client, 'activity_log', ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'created_at'], activityRows)
    console.log(`  ✓ ${activityRows.length} registos de atividade`)

    // ---- Calendário / Trabalhos Agendados (item 7) -----------------------------------------
    const calendarEvents = []
    for (const w of pickMany(activeWOs, Math.min(300, activeWOs.length))) {
      const eq = equipment.find(e => e.id === w.equipment_id)
      calendarEvents.push({
        id: randomUUID(), title: w.title, type: 'work_order', related_id: w.id, start_at: w.scheduled_for, end_at: hoursAfter(w.scheduled_for, int(1, 4)),
        building_id: eq?.building_id || null, client_id: w.client_id, equipment_id: w.equipment_id,
        priority: pick(['baixa', 'media', 'alta', 'critica']), status: pick(['agendado', 'em_curso', 'concluido', 'concluido', 'atrasado']),
      })
    }
    // trabalhos agendados adicionais: preventivas, inspeções, reparações, visitas técnicas, auditorias, instalações
    const jobKinds = [
      { type: 'preventive', title: 'Manutenção Preventiva' }, { type: 'inspecao', title: 'Inspeção Técnica' },
      { type: 'reparacao', title: 'Reparação Programada' }, { type: 'visita_tecnica', title: 'Visita Técnica' },
      { type: 'audit', title: 'Auditoria de Instalações' }, { type: 'instalacao', title: 'Instalação de Equipamento' },
    ]
    for (let i = 0; i < N.calendarEvents - calendarEvents.length; i++) {
      const isMeeting = chance(0.15)
      const start = daysAgo(-int(0, 60))
      if (isMeeting) {
        calendarEvents.push({
          id: randomUUID(), title: pick(['Reunião de equipa', 'Reunião com cliente', 'Ponto de situação semanal', 'Planeamento mensal']),
          type: 'meeting', related_id: null, start_at: start, end_at: hoursAfter(start, int(1, 3)),
          building_id: null, client_id: null, equipment_id: null, priority: 'media', status: pick(['agendado', 'concluido']),
        })
        continue
      }
      const kind = pick(jobKinds)
      const b = pick(buildings)
      const c = clients.find(cc => cc.id === b.client_id)
      const eqForBuilding = equipment.filter(e => e.building_id === b.id)
      calendarEvents.push({
        id: randomUUID(), title: `${kind.title} — ${b.name}`, type: kind.type, related_id: null,
        start_at: start, end_at: hoursAfter(start, int(1, 6)),
        building_id: b.id, client_id: c.id, equipment_id: eqForBuilding.length ? pick(eqForBuilding).id : null,
        priority: pick(['baixa', 'media', 'media', 'alta', 'critica']),
        status: new Date(start) < new Date() ? pick(['concluido', 'concluido', 'atrasado', 'cancelado']) : 'agendado',
      })
    }
    await bulkInsert(client, 'calendar_events',
      ['id', 'title', 'type', 'related_id', 'start_at', 'end_at', 'building_id', 'client_id', 'equipment_id', 'priority', 'status'],
      calendarEvents.map(e => [e.id, e.title, e.type, e.related_id, e.start_at, e.end_at, e.building_id, e.client_id, e.equipment_id, e.priority, e.status]))
    const ceAssigneeRows = calendarEvents.flatMap(e => pickMany(staffUsers, int(1, 3)).map(u => [e.id, u.id]))
    await bulkInsert(client, 'calendar_event_assignees', ['event_id', 'user_id'], Array.from(new Map(ceAssigneeRows.map(r => [r.join(':'), r])).values()))
    console.log(`  ✓ ${calendarEvents.length} trabalhos agendados / eventos de calendário`)

// ---- Blog -----------------------------------------------------------------------------
    const blogPostRows = BLOG_POSTS_SEED.map(p => {
      const content = (BLOG_CONTENT_PT[p.slug] || [`Conteúdo completo sobre ${p.title}.`]).join('\n\n')
      return [randomUUID(), p.slug, p.title, p.category, `Um olhar aprofundado sobre ${p.title.toLowerCase()}.`,
        content, 'Equipa ManuGent', int(4, 9), true, int(400, 2600), p.gradient, daysAgo(int(5, 300))]
    })
    await bulkInsert(client, 'blog_posts',
      ['id', 'slug', 'title', 'category', 'excerpt', 'content', 'author', 'read_time_min', 'published', 'views', 'cover_gradient', 'published_at'], blogPostRows)
    const blogPostIds = blogPostRows.map(r => r[0])
    const blogComments = pickMany(blogPostIds, blogPostIds.length).flatMap(pid =>
      Array.from({ length: int(0, 6) }, () => ({ id: randomUUID(), entity_type: 'blog', entity_id: pid, author_id: pick(staffUsers).id, content: pick(COMMENT_SNIPPETS), parent_id: null, created_at: daysAgo(int(0, 200)) })))
    await bulkInsert(client, 'comments', ['id', 'entity_type', 'entity_id', 'author_id', 'content', 'parent_id', 'created_at'],
      blogComments.map(c => [c.id, c.entity_type, c.entity_id, c.author_id, c.content, c.parent_id, c.created_at]))
    console.log(`  ✓ ${blogPostRows.length} posts de blog, ${blogComments.length} comentários de blog`)

    // ---- Avaliações explícitas (ratings) --------------------------------------------------
    const ratingTargets = [
      ...completedWOs.map(w => ({ type: 'work_order', id: w.id })),
      ...technicianUsers.map(t => ({ type: 'technician', id: t.id })),
      ...suppliers.map(s => ({ type: 'supplier', id: s.id })),
    ]
    const ratingRows = pickMany(ratingTargets, Math.min(N.ratings, ratingTargets.length)).map(t => [
      randomUUID(), t.type, t.id, pick(staffUsers).id, pick([3, 4, 4, 5, 5, 5]),
      chance(0.4) ? pick(['Serviço rápido e eficaz.', 'Cumpriu o prazo combinado.', 'Poderia ter comunicado melhor.', 'Excelente profissionalismo.']) : null,
      daysAgo(int(0, 250)),
    ])
    await bulkInsert(client, 'ratings', ['id', 'entity_type', 'entity_id', 'author_id', 'score', 'comment', 'created_at'], ratingRows)
    console.log(`  ✓ ${ratingRows.length} avaliações`)

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
        (SELECT count(*) FROM attachments) AS attachments,
        (SELECT count(*) FROM buildings) AS buildings,
        (SELECT count(*) FROM suppliers) AS suppliers,
        (SELECT count(*) FROM parts) AS parts,
        (SELECT count(*) FROM maintenance_requests) AS maintenance_requests,
        (SELECT count(*) FROM preventive_plans) AS preventive_plans,
        (SELECT count(*) FROM documents) AS documents,
        (SELECT count(*) FROM contracts) AS contracts,
        (SELECT count(*) FROM audits) AS audits,
        (SELECT count(*) FROM reports) AS reports,
        (SELECT count(*) FROM comments) AS comments,
        (SELECT count(*) FROM testimonials) AS testimonials,
        (SELECT count(*) FROM activity_log) AS activity_log,
        (SELECT count(*) FROM calendar_events) AS calendar_events,
        (SELECT count(*) FROM blog_posts) AS blog_posts,
        (SELECT count(*) FROM ratings) AS ratings,
        (SELECT count(*) FROM floors) AS floors,
        (SELECT count(*) FROM areas) AS areas,
        (SELECT count(*) FROM building_assignments) AS building_assignments,
        (SELECT count(*) FROM incidents) AS incidents,
        (SELECT count(*) FROM knowledge_articles) AS knowledge_articles,
        (SELECT count(*) FROM purchase_orders) AS purchase_orders,
        (SELECT count(*) FROM inventory_movements) AS inventory_movements,
        (SELECT count(*) FROM quote_items) AS quote_items
    `)
    const total = Object.values(stats).reduce((a, b) => a + Number(b), 0)
    console.log('\n✅ Seed concluído. Registos por tabela:')
    console.table(stats)
    console.log(`Total: ${total} registos\n`)
    console.log('Login de demonstração: superadmin@manugent.pt / Demo@2026 (e admin/gestor/tecnico/cliente com o mesmo padrão)')
    console.log('\nCredenciais por empresa (password: Demo@2026):')
    console.log(`  ${empresas[0].name}: admin@${empresas[0].domain} | gestor@${empresas[0].domain} | supervisor@${empresas[0].domain} | tecnico@${empresas[0].domain} | financeiro@${empresas[0].domain} | engenheiro@${empresas[0].domain}`)
    console.log(`  ${empresas[1].name}: admin@${empresas[1].domain} | gestor@${empresas[1].domain} | supervisor@${empresas[1].domain} | tecnico@${empresas[1].domain} | financeiro@${empresas[1].domain} | engenheiro@${empresas[1].domain}`)
    console.log(`  ${empresas[2].name}: admin@${empresas[2].domain} | gestor@${empresas[2].domain} | supervisor@${empresas[2].domain} | tecnico@${empresas[2].domain} | financeiro@${empresas[2].domain} | engenheiro@${empresas[2].domain}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao popular a base de dados, revertido (ROLLBACK):', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
