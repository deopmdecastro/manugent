// ============================================================================
// ManuGent — Demo Data Layer — Gerador v2
// Gera uma base de dados fictícia completa, relacional e determinística
// (mesma seed => mesmos dados), simulando um ambiente de produção real.
//
// Volume gerado (aproximado):
//   35 empresas · 35 clientes · ~140 edifícios · ~1.400 equipamentos
//   ~4.200 ordens de trabalho · ~700 pedidos de manutenção
//   ~130 utilizadores · 12 equipas · 65 técnicos
//   ~980 planos preventivos · 30 fornecedores · 80 peças
//   ~2.000 notificações · 3.500 entradas de histórico
//   12 posts de blog · ~600 avaliações · 30 testemunhos
// ============================================================================

import type {
  DemoDatabase, User, Role, Team, Technician, Company, Client, Building,
  Equipment, WorkOrder, WorkOrderStatus, MaintenanceRequest, RequestStatus,
  PreventivePlan, Supplier, Part, InventoryItem, Document, Folder, Contract,
  Notification, Audit, Report, Checklist, Comment, Testimonial, Attachment,
  ActivityLogEntry, CalendarEvent, Priority, BlogPost, Rating,
} from './types'

// ---- PRNG determinístico (mulberry32) ---------------------------------------
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
function daysAgo(d: number) {
  const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString()
}
function daysFromNow(d: number) {
  const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString()
}

// ---- Pools de nomes realistas (PT) ------------------------------------------
const FIRST_NAMES = [
  'João', 'Maria', 'Pedro', 'Ana', 'Rui', 'Sofia', 'Carlos', 'Beatriz', 'Miguel', 'Inês',
  'André', 'Catarina', 'Tiago', 'Marta', 'Bruno', 'Diana', 'Nuno', 'Filipa', 'Ricardo', 'Cláudia',
  'Hugo', 'Vera', 'Fábio', 'Patrícia', 'Luís', 'Sara', 'Diogo', 'Joana', 'Vasco', 'Teresa',
  'Rodrigo', 'Leonor', 'Gonçalo', 'Mariana', 'Eduardo', 'Raquel', 'Henrique', 'Susana', 'Marco', 'Natália',
]
const LAST_NAMES = [
  'Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Rodrigues', 'Martins', 'Jesus',
  'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida',
  'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes',
  'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Machado', 'Castro',
]
const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`

const CITIES = [
  'Porto', 'Lisboa', 'Braga', 'Coimbra', 'Aveiro', 'Faro', 'Setúbal', 'Leiria', 'Viseu',
  'Guimarães', 'Funchal', 'Évora', 'Viana do Castelo', 'Castelo Branco', 'Santarém',
]
const SECTORS = [
  'Indústria Alimentar', 'Retalho', 'Saúde', 'Logística', 'Hotelaria', 'Educação',
  'Serviços Financeiros', 'Automóvel', 'Têxtil', 'Farmacêutica', 'Construção Civil',
  'Energia Renovável', 'Telecomunicações', 'Transporte e Mobilidade',
]
const COMPANY_PREFIX = [
  'Norte', 'Atlântico', 'Ibérica', 'Central', 'Douro', 'Lusitana', 'Metropolitana',
  'Vanguarda', 'Prime', 'Global', 'Portus', 'Tagus', 'Alva', 'Tejo', 'Minho',
  'Solaris', 'Nexus', 'Vertex', 'Sigma', 'Omega',
]
const COMPANY_SUFFIX_NAMES = [
  'Fabril', 'Retail', 'Health', 'Logistics', 'Hotels', 'Tech', 'Foods', 'Motors',
  'Textiles', 'Pharma', 'Build', 'Energy', 'Telecom', 'Mobility', 'Agro',
]
const COMPANY_LEGAL = ['Lda', 'S.A.', 'Group', 'Indústrias', 'Serviços', 'S.A.U.']
const companyName = () =>
  `${pick(COMPANY_PREFIX)} ${pick(COMPANY_SUFFIX_NAMES)} ${pick(COMPANY_LEGAL)}`

const EQUIPMENT_CATALOG: Record<string, string[]> = {
  'HVAC': [
    'Unidade AVAC Rooftop', 'Chiller de Água', 'Ventiloconvector', 'Unidade de Tratamento de Ar',
    'Fan Coil', 'Split Industrial', 'Central de Ventilação', 'Recuperador de Calor',
  ],
  'Elétrico': [
    'Quadro Elétrico Geral', 'Gerador de Emergência', 'UPS', 'Transformador de Potência',
    'Painel de Comutação', 'Grupo Gerador Diesel', 'Inversor Solar',
  ],
  'Elevadores': [
    'Elevador de Passageiros', 'Monta-cargas', 'Escada Rolante', 'Plataforma Elevatória',
    'Elevador de Cargas Pesadas',
  ],
  'Segurança': [
    'Sistema de Deteção de Incêndio', 'Extintor CO₂', 'Bomba de Incêndio', 'CCTV IP',
    'Controlo de Acessos', 'Alarme Perimetral', 'Sprinkler',
  ],
  'Refrigeração': [
    'Câmara Frigorífica', 'Arca Congeladora Industrial', 'Sistema de Refrigeração por Compressão',
    'Evaporador', 'Condensador a Ar',
  ],
  'Hidráulico': [
    'Bomba de Água Centrífuga', 'Autoclave de Pressão', 'ETAR Compacta', 'Grupo Hidropressor',
    'Bomba de Drenagem',
  ],
  'Compressão': [
    'Compressor de Ar Parafuso', 'Secador de Ar Comprimido', 'Reservatório de Ar', 'Purificador',
  ],
  'Automação': [
    'PLC Siemens S7', 'SCADA Local', 'Sensor IoT de Temperatura', 'Analisador de Energia',
    'Gateway Industrial', 'HMI Touch',
  ],
}
const BRANDS = [
  'Daikin', 'Carrier', 'Schneider Electric', 'Siemens', 'ABB', 'Otis', 'KONE',
  'Grundfos', 'Bosch', 'Honeywell', 'Trane', 'Mitsubishi Electric', 'Atlas Copco',
  'Danfoss', 'Emerson', 'Yokogawa', 'Rockwell Automation',
]

function seqCode(prefix: string, n: number) {
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`
}

// ---- Conteúdo para comentários, logs e testemunhos --------------------------
const WO_COMMENTS = [
  'Confirmado, a caminho do local.',
  'Peça encomendada, chegará amanhã cedo.',
  'Concluído sem incidências. Cliente satisfeito.',
  'Necessário acesso adicional à sala técnica.',
  'Cliente notificado da resolução do problema.',
  'Aguarda aprovação de orçamento pelo responsável.',
  'Diagnóstico efetuado: problema no módulo de controlo.',
  'Substituição da peça realizada com sucesso.',
  'Equipa no local, início da intervenção confirmado.',
  'Intervenção suspensa por indisponibilidade de material.',
  'Solicitação de apoio técnico ao fabricante.',
  'Registo fotográfico realizado antes e após intervenção.',
  'Alinhamento com o gestor do cliente agendado para amanhã.',
  'Teste de funcionamento positivo após reparação.',
  'Verificados todos os parâmetros de funcionamento. Normal.',
  'Detetada falha secundária não reportada inicialmente.',
  'OT relançada após entrega de peça de substituição.',
  'Manutenção preventiva concluída dentro do prazo previsto.',
]
const REQUEST_COMMENTS = [
  'Pedido recebido e em análise pela equipa.',
  'Técnico atribuído, intervenção agendada.',
  'A aguardar confirmação de disponibilidade do edifício.',
  'Situação urgente — escalada para gestor de zona.',
  'Orçamento enviado ao cliente para aprovação.',
  'Cliente confirmou disponibilidade para amanhã de manhã.',
  'Problema resolvido remotamente. OT encerrada.',
  'Visita ao local confirmada para esta semana.',
]
const TESTIMONIAL_CONTENTS = [
  'A plataforma reduziu drasticamente o nosso tempo de resposta a avarias. Passámos de 48h para menos de 4h em média.',
  'Finalmente temos visibilidade total sobre o estado de todos os nossos equipamentos em tempo real.',
  'O suporte da equipa técnica do ManuGent é excecional — disponíveis 24/7 e sempre com resposta rápida.',
  'Passámos a antecipar falhas em vez de as remediar. Isso mudou completamente a nossa operação.',
  'Em seis meses, reduzimos os custos de manutenção corretiva em 28%. Os números falam por si.',
  'A gestão das ordens de trabalho nunca foi tão simples. Os técnicos adaptaram-se em dois dias.',
  'O agente de IA faz diagnósticos que antes levavam horas ao nosso técnico sénior. Impressionante.',
  'Conseguimos centralizar toda a documentação técnica dos nossos 300+ equipamentos numa única plataforma.',
  'O módulo de manutenção preventiva ajudou-nos a cumprir os requisitos de auditoria ISO 9001 sem esforço extra.',
  'A visibilidade do dashboard em tempo real é o que precisávamos para tomar decisões mais rápidas.',
  'Recomendo a qualquer empresa com parque de equipamentos significativo. O ROI foi evidente no primeiro trimestre.',
  'Desde que adotámos o ManuGent, as nossas paragens não planeadas reduziram 41%. Excelente investimento.',
  'A integração com o nosso ERP foi simples e o suporte durante a migração foi exemplar.',
  'Os relatórios automáticos mensais poupam ao nosso gestor de manutenção cerca de 3 horas por semana.',
  'A funcionalidade de QR code nos equipamentos agilizou imenso o trabalho dos nossos técnicos no terreno.',
  'Plataforma intuitiva, rápida e com todas as funcionalidades de que necessitamos. Nada a apontar.',
  'O portal do cliente facilitou muito a comunicação com os nossos clientes B2B. Recomendo vivamente.',
  'Conseguimos digitalizar 100% dos nossos processos de manutenção sem precisar de IT adicional.',
  'O histórico de intervenções por equipamento é uma funcionalidade que utilizamos diariamente.',
  'Com o ManuGent, passámos a ter dados para tomar decisões. Antes éramos completamente reativos.',
]
const TESTIMONIAL_ROLES = [
  'Diretor de Operações', 'Facility Manager', 'Diretor Geral', 'Responsável de Manutenção',
  'Gestor de Infraestruturas', 'Head of Engineering', 'Operations Manager',
  'Coordenador Técnico', 'Diretor Industrial', 'Responsável de Qualidade',
]
const ACTIVITY_ACTIONS = [
  'criou', 'atualizou', 'concluiu', 'atribuiu', 'comentou em',
  'cancelou', 'reagendou', 'aprovou', 'rejeitou', 'exportou', 'arquivou',
]
const ACTIVITY_ENTITY_TYPES = [
  'ordem de trabalho', 'pedido de manutenção', 'equipamento', 'documento',
  'contrato', 'plano preventivo', 'auditoria', 'relatório', 'notificação',
]
const RATING_COMMENTS_GOOD = [
  'Excelente trabalho, muito profissional.',
  'Resolvido de forma rápida e eficiente.',
  'Superou as expectativas. Recomendo.',
  'Técnico muito competente e comunicativo.',
  'Serviço de topo. Sem nada a apontar.',
]
const RATING_COMMENTS_OK = [
  'Bom serviço, mas com algum atraso.',
  'Problema resolvido, comunicação poderia ser melhor.',
  'Satisfeito, mas esperava resposta mais rápida.',
  'Trabalho correto, dentro do esperado.',
]
const RATING_COMMENTS_BAD = [
  'Demorou mais do que o previsto.',
  'O problema voltou a ocorrer na semana seguinte.',
  'Pouca comunicação durante a intervenção.',
]

// ---- Definições dos posts de blog -------------------------------------------
const BLOG_POSTS_STATIC = [
  {
    slug: 'agente-ia-diagnostico-avarias',
    title: 'Como o agente de IA do ManuGent diagnostica avarias em segundos',
    category: 'Produto',
    excerpt: 'Um olhar por dentro do modelo que combina histórico de manutenção com sinais em tempo real para sugerir a causa raiz de uma avaria.',
    author: 'Equipa ManuGent',
    date: '18 jul 2026',
    readTimeMin: 6,
    coverGradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  },
  {
    slug: 'mtbf-mttr-oee-indicadores',
    title: 'MTBF, MTTR e OEE: os três indicadores que toda a equipa de manutenção devia acompanhar',
    category: 'Boas práticas',
    excerpt: 'Explicamos o que significam estes indicadores, como calculá-los corretamente e como usá-los para melhorar a fiabilidade dos equipamentos.',
    author: 'Equipa ManuGent',
    date: '2 jul 2026',
    readTimeMin: 8,
    coverGradient: 'linear-gradient(135deg, #0d9488, #1d4ed8)',
  },
  {
    slug: 'manutencao-preditiva-iot',
    title: 'Manutenção preditiva com IoT: quando é que vale realmente a pena?',
    category: 'Tecnologia',
    excerpt: 'Analisamos os cenários onde a manutenção preditiva baseada em IoT gera ROI positivo e onde a preventiva clássica ainda ganha.',
    author: 'Equipa ManuGent',
    date: '19 jun 2026',
    readTimeMin: 7,
    coverGradient: 'linear-gradient(135deg, #0891b2, #7c3aed)',
  },
  {
    slug: 'gestao-inventario-manutencao',
    title: 'Gestão de inventário em manutenção: os erros mais comuns e como evitá-los',
    category: 'Boas práticas',
    excerpt: 'Stock em excesso imobiliza capital. Stock a zero causa paragens. Como encontrar o equilíbrio certo para peças de reserva.',
    author: 'Equipa ManuGent',
    date: '5 jun 2026',
    readTimeMin: 6,
    coverGradient: 'linear-gradient(135deg, #b45309, #7c3aed)',
  },
  {
    slug: 'ia-generativa-manutencao-2026',
    title: 'IA generativa na manutenção industrial: o que muda em 2026',
    category: 'Tecnologia',
    excerpt: 'LLMs especializados em manutenção estão a reescrever os processos de diagnóstico, documentação e formação de técnicos.',
    author: 'Equipa ManuGent',
    date: '22 mai 2026',
    readTimeMin: 9,
    coverGradient: 'linear-gradient(135deg, #be185d, #7c3aed)',
  },
  {
    slug: 'nfc-vs-qr-code-ativos',
    title: 'NFC vs. QR code: qual a melhor forma de identificar os teus ativos?',
    category: 'Boas práticas',
    excerpt: 'Comparamos as duas tecnologias e damos recomendações práticas para diferentes tipos de instalação.',
    author: 'Equipa ManuGent',
    date: '20 abr 2026',
    readTimeMin: 5,
    coverGradient: 'linear-gradient(135deg, #0d9488, #2563eb)',
  },
  {
    slug: 'relatorios-manutencao-clientes',
    title: 'Como criar relatórios de manutenção que os clientes realmente leem',
    category: 'Produto',
    excerpt: 'A maioria dos relatórios de manutenção é ignorada. Mostramos como estruturar informação para que a gestão tome melhores decisões.',
    author: 'Equipa ManuGent',
    date: '8 abr 2026',
    readTimeMin: 5,
    coverGradient: 'linear-gradient(135deg, #065f46, #1e40af)',
  },
  {
    slug: 'cmms-vs-erp-manutencao',
    title: 'CMMS vs. ERP: qual a diferença e qual precisa a tua equipa?',
    category: 'Boas práticas',
    excerpt: 'Perceber quando um módulo de manutenção no ERP chega e quando precisas de um CMMS dedicado pode poupar anos de frustrações.',
    author: 'Equipa ManuGent',
    date: '25 mar 2026',
    readTimeMin: 7,
    coverGradient: 'linear-gradient(135deg, #6d28d9, #1d4ed8)',
  },
  {
    slug: 'checklist-manutencao-preventiva',
    title: 'Checklists de manutenção preventiva: guia completo para criar as suas',
    category: 'Boas práticas',
    excerpt: 'Uma boa checklist é a diferença entre uma preventiva que previne avarias e uma que é apenas burocracia. Guia prático com exemplos reais.',
    author: 'Equipa ManuGent',
    date: '11 mar 2026',
    readTimeMin: 6,
    coverGradient: 'linear-gradient(135deg, #047857, #0369a1)',
  },
  {
    slug: 'portal-cliente-manutencao',
    title: 'Portal do cliente em manutenção: o que funciona e o que irrita',
    category: 'Produto',
    excerpt: 'O que separa um portal que os clientes adoram de um que ignoram? Estudámos o comportamento de 120 utilizadores e partilhamos as conclusões.',
    author: 'Equipa ManuGent',
    date: '28 fev 2026',
    readTimeMin: 7,
    coverGradient: 'linear-gradient(135deg, #9333ea, #2563eb)',
  },
  {
    slug: 'kpis-manutencao-industrial',
    title: 'Os 12 KPIs de manutenção que realmente importam (e os que são perda de tempo)',
    category: 'Boas práticas',
    excerpt: 'Com tantos indicadores disponíveis, focar-se nos errados é pior do que não medir nada. Este guia ajuda a escolher os certos para a sua operação.',
    author: 'Equipa ManuGent',
    date: '14 fev 2026',
    readTimeMin: 10,
    coverGradient: 'linear-gradient(135deg, #b45309, #0f766e)',
  },
  {
    slug: 'mobile-first-manutencao',
    title: 'Mobile-first na manutenção: como a digitalização de campo começa no smartphone',
    category: 'Tecnologia',
    excerpt: 'Os técnicos já não saem sem o telemóvel. Mostrar como o ManuGent está a transformar o trabalho de campo com acesso móvel completo.',
    author: 'Equipa ManuGent',
    date: '1 fev 2026',
    readTimeMin: 6,
    coverGradient: 'linear-gradient(135deg, #0284c7, #7c3aed)',
  },
]

const BLOG_COMMENTS = [
  'Artigo muito útil, obrigado pela partilha!',
  'Ótima explicação. Vou aplicar na minha equipa esta semana.',
  'Já usamos esta abordagem e confirmo que funciona muito bem.',
  'Alguma sugestão de fornecedores para a implementação?',
  'Exatamente o que precisava de ler hoje. Muito relevante.',
  'Excelente conteúdo como sempre. Continuem assim.',
  'Posso partilhar este artigo internamente com a minha equipa?',
  'Já tinha ouvido falar disto mas este artigo explica muito melhor.',
  'Quais as diferenças entre os modelos para instalações mais pequenas?',
  'Muito bem escrito e fundamentado. Parabéns à equipa.',
  'Aplicámos isto no ano passado e os resultados foram surpreendentes.',
  'Faz falta mais artigos assim em português sobre manutenção industrial.',
]

// ============================================================================
export function generateDemoDatabase(seed = 20260802): DemoDatabase {
  rand = mulberry32(seed)
  idCounters = {}

  // ---- Empresas (tenants B2B clientes da plataforma) -----------------------
  const companies: Company[] = Array.from({ length: 35 }, () => ({
    id: id('emp'),
    name: companyName(),
    taxId: `PT${int(100000000, 599999999)}`,
    sector: pick(SECTORS),
    active: chance(0.9),
    since: daysAgo(int(60, 2000)),
  }))

  // ---- Utilizadores (equipa ManuGent + clientes) ---------------------------
  const users: User[] = []

  // Conta superadmin fixa
  users.push({
    id: id('usr'), name: 'Diogo Castro', email: 'admin@manugent.pt', role: 'superadmin',
    avatarSeed: 'diogo', active: true, onDuty: true,
    createdAt: daysAgo(900), lastLoginAt: daysAgo(0),
    phone: '+351 91 000 0001',
  })

  // Gestores internos
  for (let i = 0; i < 18; i++) {
    users.push({
      id: id('usr'), name: fullName(), email: '', role: 'gestor',
      avatarSeed: `g${i}`, active: chance(0.95), onDuty: chance(0.7),
      createdAt: daysAgo(int(30, 1000)), lastLoginAt: daysAgo(int(0, 10)),
      phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}`,
    })
  }

  // Administradores
  for (let i = 0; i < 4; i++) {
    users.push({
      id: id('usr'), name: fullName(), email: '', role: 'admin',
      avatarSeed: `adm${i}`, active: true, onDuty: chance(0.8),
      createdAt: daysAgo(int(200, 1500)), lastLoginAt: daysAgo(int(0, 5)),
      phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}`,
    })
  }

  // Técnicos
  const technicianUsers: User[] = []
  for (let i = 0; i < 65; i++) {
    const u: User = {
      id: id('usr'), name: fullName(), email: '', role: 'tecnico',
      avatarSeed: `t${i}`, active: chance(0.96), onDuty: chance(0.55),
      createdAt: daysAgo(int(15, 1400)), lastLoginAt: daysAgo(int(0, 15)),
      phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}`,
    }
    users.push(u); technicianUsers.push(u)
  }

  // Financeiros
  for (let i = 0; i < 8; i++) {
    users.push({
      id: id('usr'), name: fullName(), email: '', role: 'financeiro',
      avatarSeed: `f${i}`, active: true, onDuty: chance(0.6),
      createdAt: daysAgo(int(30, 900)), lastLoginAt: daysAgo(int(0, 20)),
      phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}`,
    })
  }

  // Utilizadores cliente (1-4 por empresa)
  const clientUsers: User[] = []
  for (const c of companies) {
    const n = int(1, 4)
    for (let i = 0; i < n; i++) {
      const u: User = {
        id: id('usr'), name: fullName(), email: '', role: 'cliente',
        companyId: c.id, avatarSeed: `${c.id}${i}`,
        active: c.active && chance(0.92), onDuty: false,
        createdAt: c.since, lastLoginAt: daysAgo(int(0, 30)),
        phone: `+351 9${int(1, 6)} ${int(100, 999)} ${int(1000, 9999)}`,
      }
      users.push(u); clientUsers.push(u)
    }
  }

  // Gerar emails únicos para todos
  const usedEmails = new Set<string>()
  users.forEach(u => {
    if (!u.email) {
      const base = u.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.')
      const domain = u.role === 'cliente' ? 'clientmail.pt' : 'manugent.pt'
      let email = `${base}@${domain}`
      let n = 1
      while (usedEmails.has(email)) { email = `${base}${n++}@${domain}` }
      usedEmails.add(email)
      u.email = email
    }
  })

  // ---- Equipas & Técnicos --------------------------------------------------
  const SPECIALTIES = [
    'AVAC', 'Elétrica', 'Elevadores', 'Segurança Contra Incêndio',
    'Refrigeração', 'Hidráulica', 'Multidisciplinar', 'Automação Industrial',
    'Compressão', 'Energias Renováveis',
  ]
  const teams: Team[] = Array.from({ length: 12 }, (_, i) => {
    const members = pickMany(technicianUsers, int(4, 7))
    return {
      id: id('eqp'),
      name: `Equipa ${pick(SPECIALTIES)} ${i + 1}`,
      leaderId: members[0].id,
      memberIds: members.map(m => m.id),
      specialty: pick(SPECIALTIES),
    }
  })
  const technicians: Technician[] = technicianUsers.map(u => {
    const team = teams.find(t => t.memberIds.includes(u.id))
    const status = !u.active
      ? 'ferias'
      : u.onDuty
        ? (chance(0.8) ? 'em_servico' : 'disponivel')
        : (chance(0.3) ? 'ferias' : 'ausente')
    return {
      id: id('tec'), userId: u.id,
      specialties: pickMany(SPECIALTIES, int(1, 3)),
      teamId: team?.id,
      status, rating: float(3.2, 5, 1),
      completedOrders: int(10, 600),
      activeOrders: int(0, 8),
    }
  })

  // ---- Contratos, Clientes, Edifícios, Equipamentos -----------------------
  const contracts: Contract[] = []
  const clients: Client[] = companies.map(c => {
    const startDate = c.since
    const contract: Contract = {
      id: id('ctr'), clientId: '',
      type: pick(['manutencao_preventiva', 'manutencao_completa', 'sob_pedido']),
      status: c.active
        ? (chance(0.85) ? 'ativo' : 'pendente')
        : (chance(0.5) ? 'expirado' : 'cancelado'),
      startDate,
      endDate: daysFromNow(int(30, 900)),
      monthlyValue: int(350, 18000),
      slaHours: pick([2, 4, 8, 24, 48]),
    }
    contracts.push(contract)
    const client: Client = {
      id: id('cli'), companyId: c.id, name: c.name,
      email: `geral@${c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')}.pt`,
      phone: `+351 2${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
      address: `Rua ${pick(LAST_NAMES)}, ${int(1, 500)}`,
      city: pick(CITIES),
      active: c.active,
      contractId: contract.id,
      since: c.since,
    }
    contract.clientId = client.id
    return client
  })

  const buildings: Building[] = []
  for (const cl of clients) {
    const n = int(2, 6)
    for (let i = 0; i < n; i++) {
      buildings.push({
        id: id('edf'), clientId: cl.id,
        name: `${pick(['Fábrica', 'Loja', 'Armazém', 'Escritório', 'Centro', 'Unidade', 'Terminal', 'Sede'])} ${cl.city} ${i + 1}`,
        address: `Zona Industrial de ${cl.city}, Lote ${int(1, 200)}`,
        city: cl.city,
        type: pick(['industrial', 'comercial', 'residencial', 'saude', 'escritorio']),
        areaM2: int(100, 20000),
      })
    }
  }

  const equipment: Equipment[] = []
  for (const b of buildings) {
    const n = int(5, 18)
    for (let i = 0; i < n; i++) {
      const category = pick(Object.keys(EQUIPMENT_CATALOG))
      const name = pick(EQUIPMENT_CATALOG[category])
      const installedAt = daysAgo(int(60, 4000))
      equipment.push({
        id: id('ekp'), buildingId: b.id, name, category,
        brand: pick(BRANDS),
        model: `${pick(['X', 'Z', 'Pro', 'Max', 'Eco', 'Plus', 'Ultra'])}${int(100, 9999)}`,
        serialNumber: `SN${int(10000000, 99999999)}`,
        criticality: pick(['baixa', 'media', 'alta', 'critica']),
        status: chance(0.07) ? 'avariado'
          : chance(0.1) ? 'em_manutencao'
            : chance(0.03) ? 'inativo'
              : 'operacional',
        installedAt,
        lastMaintenanceAt: daysAgo(int(1, 240)),
        nextMaintenanceAt: daysFromNow(int(-15, 120)),
        qrCode: `QR-${int(100000, 999999)}`,
      })
    }
  }

  // ---- Fornecedores, Peças, Inventário ------------------------------------
  const suppliers: Supplier[] = Array.from({ length: 30 }, () => ({
    id: id('for'),
    name: `${pick(['Fer', 'Tec', 'Indus', 'Peça', 'Master', 'Euro', 'Ibero', 'Tech'])}${pick(['Parts', 'Supply', 'Componentes', 'Distribuição', 'Solutions', 'Técnica'])}`,
    taxId: `PT${int(100000000, 599999999)}`,
    category: pick(['Elétrico', 'Mecânico', 'HVAC', 'Segurança', 'Hidráulico', 'Automação', 'Geral']),
    email: 'comercial@fornecedor.pt',
    phone: `+351 2${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
    rating: float(2.8, 5, 1),
    active: chance(0.88),
  }))

  const PART_NAMES = [
    'Filtro de Ar G4', 'Filtro de Ar F7', 'Correia de Transmissão', 'Rolamento SKF',
    'Válvula Solenoide 24V', 'Sensor de Temperatura NTC', 'Compressor Scroll',
    'Contactor 40A', 'Fusível 16A', 'Bomba de Circulação', 'Motor Elétrico 7.5kW',
    'Placa de Controlo', 'Termóstato Digital', 'Pressostato', 'Mangueira Flexível',
    'Condensador Eletrolítico', 'Transformador 24V', 'Resistência de Aquecimento',
    'Kit de Vedantes', 'Sonda de Pressão', 'Módulo I/O', 'Relé Térmico',
    'Disjuntor 3P 25A', 'Cabo Elétrico 2.5mm²', 'Lubrificante Sintético 5L',
  ]
  const parts: Part[] = Array.from({ length: 80 }, () => ({
    id: id('pca'),
    name: pick(PART_NAMES),
    sku: `SKU-${int(10000, 99999)}`,
    category: pick(['Elétrico', 'Mecânico', 'HVAC', 'Consumível', 'Automação', 'Hidráulico']),
    unitCost: float(2.5, 1200),
    supplierId: pick(suppliers).id,
  }))

  const WAREHOUSES = ['Armazém Porto', 'Armazém Lisboa', 'Armazém Faro', 'Armazém Braga', 'Armazém Aveiro']
  const inventory: InventoryItem[] = parts.map(p => ({
    id: id('inv'), partId: p.id,
    warehouse: pick(WAREHOUSES),
    quantity: int(0, 400),
    minQuantity: int(5, 50),
    reserved: int(0, 30),
    lastMovementAt: daysAgo(int(0, 90)),
  }))

  // ---- Checklists ----------------------------------------------------------
  const checklists: Checklist[] = Object.keys(EQUIPMENT_CATALOG).map(cat => ({
    id: id('chk'),
    name: `Checklist Preventiva — ${cat}`,
    equipmentCategory: cat,
    items: Array.from({ length: int(5, 10) }, (_, i) => ({
      id: `it${i}`,
      label: pick([
        'Verificar níveis de fluido', 'Inspecionar fugas e infiltrações',
        'Testar funcionamento em carga', 'Limpar filtros e grelhas',
        'Verificar ruído ou vibração anómala', 'Medir temperatura de operação',
        'Verificar aperto das ligações elétricas', 'Substituir consumível conforme plano',
        'Calibrar sensores e sondas', 'Inspecionar estado dos rolamentos',
        'Verificar estado do isolamento elétrico', 'Testar sistema de alarme',
        'Lubrificar componentes rotativos', 'Verificar pressão de operação',
        'Inspecionar estado das correias e acoplamentos',
      ]),
      done: chance(0.65),
    })),
  }))

  // ---- Planos Preventivos --------------------------------------------------
  const preventivePlans: PreventivePlan[] = pickMany(
    equipment,
    Math.floor(equipment.length * 0.72),
  ).map(eq => {
    const nextDueAt = daysFromNow(int(-20, 75))
    const isPast = new Date(nextDueAt) < new Date()
    const status = isPast
      ? (chance(0.55) ? 'atrasado' : 'executado')
      : (chance(0.25) ? 'executado' : 'em_dia')
    return {
      id: id('pvt'), equipmentId: eq.id,
      name: `Manutenção Preventiva ${eq.name}`,
      frequency: pick(['semanal', 'mensal', 'trimestral', 'semestral', 'anual']),
      lastExecutedAt: daysAgo(int(5, 250)),
      nextDueAt, status,
      checklistId: checklists.find(c => c.equipmentCategory === eq.category)?.id,
      responsibleTeamId: pick(teams).id,
    }
  })

  // ---- Ordens de Trabalho --------------------------------------------------
  const woStatuses: WorkOrderStatus[] = [
    'aberta', 'em_analise', 'atribuida', 'em_execucao',
    'concluida', 'concluida', 'concluida', 'concluida', 'cancelada',
  ]
  const workOrders: WorkOrder[] = []
  let woCounter = 0
  for (const eq of equipment) {
    const n = int(1, 6)
    for (let i = 0; i < n; i++) {
      woCounter++
      const building = buildings.find(b => b.id === eq.buildingId)!
      const status = pick(woStatuses)
      const tech = pick(technicians)
      const createdAgoDays = int(0, 500)
      const createdAt = daysAgo(createdAgoDays)
      const createdAtMs = new Date(createdAt).getTime()
      const scheduledAt = new Date(createdAtMs + int(1, 72) * 3_600_000).toISOString()
      const isDone = status === 'concluida'
      const isCancelled = status === 'cancelada'
      const responseHours = int(1, 120)
      const startedAtMs = createdAtMs + responseHours * 3_600_000
      const canHaveStarted = (isDone || status === 'em_execucao') && startedAtMs <= Date.now()
      const startedAt = canHaveStarted ? new Date(startedAtMs).toISOString() : undefined
      const completedAt = isDone && startedAt
        ? new Date(startedAtMs + int(1, 150) * 3_600_000).toISOString()
        : undefined
      workOrders.push({
        id: id('ord'), code: seqCode('OT', woCounter),
        equipmentId: eq.id, buildingId: eq.buildingId, clientId: building.clientId,
        technicianId: (status === 'aberta' || status === 'em_analise') ? undefined : tech.id,
        teamId: pick(teams).id,
        status: isCancelled ? 'cancelada' : status,
        priority: eq.criticality,
        type: pick(['corretiva', 'preventiva', 'preditiva', 'inspecao']),
        title: `${pick(['Reparação', 'Manutenção', 'Inspeção', 'Substituição de peça em', 'Revisão de', 'Verificação de'])} ${eq.name}`,
        description: `Intervenção em ${eq.name} (${eq.serialNumber}) no ${building.name}.`,
        createdAt, scheduledAt, startedAt, completedAt,
        estimatedHours: float(0.5, 12, 1),
        actualHours: isDone ? float(0.5, 14, 1) : undefined,
        cost: isDone ? float(25, 3500) : 0,
        partsUsed: isDone && chance(0.55)
          ? pickMany(parts, int(1, 4)).map(p => ({ partId: p.id, quantity: int(1, 5) }))
          : [],
      })
    }
  }

  // ---- Pedidos de Manutenção -----------------------------------------------
  const reqStatuses: RequestStatus[] = [
    'aberto', 'em_analise', 'atribuido', 'em_execucao',
    'concluido', 'concluido', 'concluido', 'cancelado',
  ]
  const maintenanceRequests: MaintenanceRequest[] = []
  for (const cl of clients) {
    const clBuildings = buildings.filter(b => b.clientId === cl.id)
    if (!clBuildings.length) continue
    const n = int(5, 22)
    for (let i = 0; i < n; i++) {
      const b = pick(clBuildings)
      const bEquip = equipment.filter(e => e.buildingId === b.id)
      const status = pick(reqStatuses)
      const createdAt = chance(0.4) ? daysAgo(int(0, 30)) : daysAgo(int(0, 250))
      const dueAt = daysFromNow(int(-30, 30))
      const isLate = new Date(dueAt) < new Date() && !['concluido', 'cancelado'].includes(status)
      const requester = pick(
        clientUsers.filter(u => u.companyId === cl.companyId).length
          ? clientUsers.filter(u => u.companyId === cl.companyId)
          : clientUsers,
      )
      const wo = chance(0.45) ? pick(workOrders.filter(w => w.buildingId === b.id)) : undefined
      maintenanceRequests.push({
        id: id('ped'), clientId: cl.id, buildingId: b.id,
        equipmentId: bEquip.length ? pick(bEquip).id : undefined,
        requestedBy: requester.id,
        assignedTo: status === 'aberto'
          ? []
          : pickMany(technicianUsers, int(1, 3)).map(u => u.id),
        status,
        priority: pick(['baixa', 'media', 'alta', 'critica']),
        title: pick([
          'Ruído anómalo em equipamento', 'Falha no arranque', 'Fuga detetada',
          'Pedido de inspeção periódica', 'Alarme ativo sem causa aparente',
          'Substituição de consumível solicitada', 'Avaria súbita em hora de pico',
          'Sobreaquecimento detetado', 'Perda de desempenho progressiva',
          'Solicitação de orçamento para substituição',
        ]),
        description: 'Pedido registado através do portal do cliente. Aguarda análise técnica.',
        createdAt, dueAt,
        workOrderId: wo?.id, isLate,
      })
    }
  }

  // ---- Documentos & Pastas -------------------------------------------------
  const folders: Folder[] = clients.flatMap(cl => [
    { id: id('pst'), name: `${cl.name} — Manuais`, ownerId: pick(users).id, createdAt: cl.since },
    { id: id('pst'), name: `${cl.name} — Contratos`, ownerId: pick(users).id, createdAt: cl.since },
    { id: id('pst'), name: `${cl.name} — Relatórios`, ownerId: pick(users).id, createdAt: cl.since },
    { id: id('pst'), name: `${cl.name} — Certificados`, ownerId: pick(users).id, createdAt: cl.since },
  ])

  const documents: Document[] = []
  // Manuais de equipamentos
  for (const eq of pickMany(equipment, Math.floor(equipment.length * 0.65))) {
    documents.push({
      id: id('doc'),
      name: `Manual_${eq.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.pdf`,
      type: 'manual',
      folderId: pick(folders).id,
      entityType: 'equipment', entityId: eq.id,
      uploadedBy: pick(users).id,
      uploadedAt: daysAgo(int(1, 600)),
      sizeKb: int(200, 10000),
      url: `/documents/${eq.id}.pdf`,
    })
  }
  // Relatórios de OT concluídas
  for (const wo of pickMany(workOrders.filter(w => w.status === 'concluida'), Math.min(500, workOrders.length))) {
    documents.push({
      id: id('doc'),
      name: `Relatorio_${wo.code}.pdf`,
      type: 'relatorio',
      folderId: pick(folders).id,
      entityType: 'work_order', entityId: wo.id,
      uploadedBy: pick(users).id,
      uploadedAt: wo.completedAt || daysAgo(1),
      sizeKb: int(100, 4000),
      url: `/documents/${wo.id}.pdf`,
    })
  }
  // Contratos
  for (const ctr of contracts) {
    documents.push({
      id: id('doc'),
      name: `Contrato_${ctr.id}.pdf`,
      type: 'contrato',
      folderId: pick(folders).id,
      entityType: 'contract', entityId: ctr.id,
      uploadedBy: pick(users).id,
      uploadedAt: ctr.startDate,
      sizeKb: int(150, 1200),
      url: `/documents/${ctr.id}.pdf`,
    })
  }
  // Certificados de equipamentos críticos
  for (const eq of equipment.filter(e => e.criticality === 'critica').slice(0, 80)) {
    documents.push({
      id: id('doc'),
      name: `Certificado_Conformidade_${eq.serialNumber}.pdf`,
      type: 'certificado',
      folderId: pick(folders).id,
      entityType: 'equipment', entityId: eq.id,
      uploadedBy: pick(users).id,
      uploadedAt: daysAgo(int(30, 800)),
      sizeKb: int(100, 500),
      url: `/documents/cert_${eq.id}.pdf`,
    })
  }

  // ---- Notificações --------------------------------------------------------
  const notifications: Notification[] = []
  // Notificações de OTs
  for (const wo of pickMany(workOrders, Math.min(700, workOrders.length))) {
    if (!wo.technicianId) continue
    const tech = technicians.find(t => t.id === wo.technicianId)
    const u = users.find(u => u.id === tech?.userId)
    if (!u) continue
    notifications.push({
      id: id('not'), userId: u.id, type: 'work_order',
      title: `OT ${wo.code} atualizada`,
      message: `O estado da ordem de trabalho ${wo.code} mudou para "${wo.status}".`,
      read: chance(0.6), createdAt: wo.createdAt,
      relatedEntityId: wo.id,
    })
  }
  // Notificações de preventivas em atraso
  for (const p of preventivePlans.filter(p => p.status === 'atrasado')) {
    const gestor = pick(users.filter(u => u.role === 'gestor'))
    notifications.push({
      id: id('not'), userId: gestor.id, type: 'preventive',
      title: 'Plano preventivo em atraso',
      message: `${p.name} deveria ter sido executado em ${p.nextDueAt.slice(0, 10)}.`,
      read: chance(0.3), createdAt: p.nextDueAt,
      relatedEntityId: p.id,
    })
  }
  // Notificações de stock baixo
  for (const item of inventory.filter(i => i.quantity <= i.minQuantity)) {
    const gestor = pick(users.filter(u => u.role === 'gestor' || u.role === 'admin'))
    notifications.push({
      id: id('not'), userId: gestor.id, type: 'inventory',
      title: 'Stock abaixo do mínimo',
      message: `Stock insuficiente em ${item.warehouse}. Repor brevemente.`,
      read: chance(0.4), createdAt: daysAgo(int(0, 15)),
      relatedEntityId: item.id,
    })
  }
  // Notificações de contratos a expirar
  for (const ctr of contracts.filter(c => c.status === 'ativo')) {
    const days = Math.ceil((new Date(ctr.endDate).getTime() - Date.now()) / 86_400_000)
    if (days > 0 && days <= 30) {
      const gestor = pick(users.filter(u => u.role === 'gestor' || u.role === 'admin'))
      notifications.push({
        id: id('not'), userId: gestor.id, type: 'contract',
        title: 'Contrato prestes a expirar',
        message: `O contrato do cliente expira em ${days} dias. Renovação necessária.`,
        read: chance(0.25), createdAt: daysAgo(int(0, 5)),
        relatedEntityId: ctr.id,
      })
    }
  }
  // Notificações de novos pedidos
  for (const req of pickMany(maintenanceRequests.filter(r => r.status === 'aberto'), 60)) {
    const gestor = pick(users.filter(u => u.role === 'gestor'))
    notifications.push({
      id: id('not'), userId: gestor.id, type: 'request',
      title: 'Novo pedido de manutenção',
      message: `Pedido "${req.title}" recebido e aguarda análise.`,
      read: chance(0.5), createdAt: req.createdAt,
      relatedEntityId: req.id,
    })
  }

  // ---- Auditorias & Relatórios ---------------------------------------------
  const audits: Audit[] = pickMany(buildings, Math.min(70, buildings.length)).map(b => ({
    id: id('aud'), buildingId: b.id,
    auditorId: pick(users.filter(u => u.role === 'gestor' || u.role === 'tecnico')).id,
    status: pick(['agendada', 'em_curso', 'concluida', 'concluida', 'concluida']),
    score: chance(0.75) ? int(55, 100) : undefined,
    date: chance(0.55) ? daysAgo(int(0, 300)) : daysFromNow(int(1, 90)),
    findings: pickMany([
      'Extintor fora de validade', 'Sinalética de emergência em falta',
      'Quadro elétrico sem etiquetagem adequada', 'Saída de emergência parcialmente obstruída',
      'Registo de manutenção incompleto', 'Lubrificação insuficiente em rolamentos',
      'Filtros de ar por substituir', 'Conforme', 'Conforme', 'Conforme',
      'Ligações elétricas com sinais de sobreaquecimento', 'Pressão de reservatório fora de especificação',
    ], int(1, 4)),
  }))

  const reports: Report[] = []
  // Relatórios de intervenção
  for (const wo of workOrders.filter(w => w.status === 'concluida')) {
    if (!chance(0.75)) continue
    reports.push({
      id: id('rel'), workOrderId: wo.id, clientId: wo.clientId,
      type: 'intervencao',
      title: `Relatório de Intervenção — ${wo.code}`,
      generatedAt: wo.completedAt || daysAgo(1),
      generatedBy: pick(users.filter(u => u.role === 'gestor' || u.role === 'tecnico')).id,
      url: `/reports/${wo.id}.pdf`,
    })
  }
  // Relatórios mensais por cliente
  for (const cl of clients) {
    for (let m = 0; m < 12; m++) {
      reports.push({
        id: id('rel'), clientId: cl.id,
        type: 'mensal',
        title: `Relatório Mensal — ${cl.name} (${m + 1}/${new Date().getFullYear()})`,
        generatedAt: daysAgo(m * 30),
        generatedBy: pick(users.filter(u => u.role === 'gestor')).id,
        url: `/reports/monthly_${cl.id}_${m}.pdf`,
      })
    }
  }
  // Relatórios de auditoria
  for (const a of audits.filter(a => a.status === 'concluida')) {
    reports.push({
      id: id('rel'), clientId: buildings.find(b => b.id === a.buildingId)?.clientId || clients[0].id,
      type: 'auditoria',
      title: `Relatório de Auditoria — ${buildings.find(b => b.id === a.buildingId)?.name || a.buildingId}`,
      generatedAt: a.date,
      generatedBy: a.auditorId,
      url: `/reports/audit_${a.id}.pdf`,
    })
  }

  // ---- Comentários ---------------------------------------------------------
  const comments: Comment[] = []
  // Comentários em OTs
  for (const wo of pickMany(workOrders, Math.min(600, workOrders.length))) {
    const n = int(0, 6)
    let lastId: string | undefined
    for (let i = 0; i < n; i++) {
      const c: Comment = {
        id: id('com'), entityType: 'work_order', entityId: wo.id,
        authorId: pick(users).id,
        content: pick(WO_COMMENTS),
        createdAt: daysAgo(int(0, 300)),
        parentId: i > 0 && chance(0.35) ? lastId : undefined,
        likeIds: pickMany(users, int(0, 8)).map(u => u.id),
      }
      comments.push(c); lastId = c.id
    }
  }
  // Comentários em pedidos de manutenção
  for (const req of pickMany(maintenanceRequests, Math.min(200, maintenanceRequests.length))) {
    const n = int(0, 4)
    let lastId: string | undefined
    for (let i = 0; i < n; i++) {
      const c: Comment = {
        id: id('com'), entityType: 'request', entityId: req.id,
        authorId: pick(users).id,
        content: pick(REQUEST_COMMENTS),
        createdAt: daysAgo(int(0, 200)),
        parentId: i > 0 && chance(0.25) ? lastId : undefined,
        likeIds: pickMany(users, int(0, 5)).map(u => u.id),
      }
      comments.push(c); lastId = c.id
    }
  }

  // ---- Anexos --------------------------------------------------------------
  const attachments: Attachment[] = []
  // Anexos em OTs
  for (const wo of pickMany(workOrders, Math.min(500, workOrders.length))) {
    const n = int(1, 4)
    for (let i = 0; i < n; i++) {
      attachments.push({
        id: id('anx'), entityType: 'work_order', entityId: wo.id,
        fileName: pick([
          'foto_antes.jpg', 'foto_durante.jpg', 'foto_depois.jpg',
          'assinatura_cliente.png', 'diagnostico.pdf', 'relatorio_tecnico.pdf',
          'medicao_vibracoes.xlsx', 'certificado_calibracao.pdf',
        ]),
        mimeType: pick(['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
        sizeKb: int(50, 6000),
        uploadedBy: pick(users).id,
        uploadedAt: wo.completedAt || wo.createdAt,
      })
    }
  }
  // Anexos em pedidos
  for (const req of pickMany(maintenanceRequests, Math.min(150, maintenanceRequests.length))) {
    attachments.push({
      id: id('anx'), entityType: 'request', entityId: req.id,
      fileName: pick(['foto_problema.jpg', 'video_avaria.mp4', 'print_alarme.png']),
      mimeType: pick(['image/jpeg', 'video/mp4', 'image/png']),
      sizeKb: int(200, 8000),
      uploadedBy: req.requestedBy,
      uploadedAt: req.createdAt,
    })
  }
  // Anexos em equipamentos críticos
  for (const eq of equipment.filter(e => e.criticality === 'critica').slice(0, 60)) {
    attachments.push({
      id: id('anx'), entityType: 'equipment', entityId: eq.id,
      fileName: pick(['ficha_tecnica.pdf', 'planta_instalacao.pdf', 'historico_falhas.xlsx']),
      mimeType: pick(['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
      sizeKb: int(100, 5000),
      uploadedBy: pick(users).id,
      uploadedAt: eq.installedAt,
    })
  }

  // ---- Testemunhos ---------------------------------------------------------
  const testimonials: Testimonial[] = pickMany(clientUsers, Math.min(30, clientUsers.length)).map(u => {
    const company = companies.find(c => c.id === u.companyId)
    return {
      id: id('tst'),
      authorName: u.name,
      authorRole: pick(TESTIMONIAL_ROLES),
      companyName: company?.name || 'Empresa Cliente',
      rating: pick([3, 4, 4, 5, 5, 5]),
      date: daysAgo(int(5, 600)),
      featured: chance(0.35),
      content: pick(TESTIMONIAL_CONTENTS),
    }
  })

  // ---- Histórico de atividades ---------------------------------------------
  const activityLog: ActivityLogEntry[] = []
  for (let i = 0; i < 3500; i++) {
    const u = pick(users)
    const action = pick(ACTIVITY_ACTIONS)
    const entityType = pick(ACTIVITY_ENTITY_TYPES)
    const entityId = pick([
      ...workOrders.map(w => w.id),
      ...maintenanceRequests.map(r => r.id),
      ...equipment.map(e => e.id),
    ])
    activityLog.push({
      id: id('act'), userId: u.id,
      action: `${action} ${entityType}`,
      entityType, entityId,
      createdAt: daysAgo(int(0, 400)),
    })
  }

  // ---- Calendário ----------------------------------------------------------
  const calendarEvents: CalendarEvent[] = []
  for (const wo of workOrders.filter(w => ['atribuida', 'em_execucao'].includes(w.status))) {
    const start = wo.scheduledAt
    const end = new Date(new Date(start).getTime() + wo.estimatedHours * 3_600_000).toISOString()
    calendarEvents.push({
      id: id('cal'), title: wo.title, type: 'work_order', relatedId: wo.id,
      start, end,
      assignedTo: wo.technicianId ? [wo.technicianId] : [],
    })
  }
  for (const p of preventivePlans.filter(p => p.status !== 'executado')) {
    calendarEvents.push({
      id: id('cal'), title: p.name, type: 'preventive', relatedId: p.id,
      start: p.nextDueAt, end: p.nextDueAt,
      assignedTo: [],
    })
  }
  for (const a of audits.filter(a => a.status !== 'concluida')) {
    calendarEvents.push({
      id: id('cal'),
      title: `Auditoria — ${buildings.find(b => b.id === a.buildingId)?.name || 'Edifício'}`,
      type: 'audit', relatedId: a.id,
      start: a.date, end: a.date,
      assignedTo: [a.auditorId],
    })
  }
  // Reuniões internas
  for (let i = 0; i < 25; i++) {
    const start = daysFromNow(int(-10, 30))
    calendarEvents.push({
      id: id('cal'),
      title: pick(['Reunião de Equipa Semanal', 'Revisão de KPIs Mensais', 'Planeamento de Preventivas', 'Formação Técnica', 'Reunião com Cliente']),
      type: 'meeting',
      relatedId: '',
      start, end: new Date(new Date(start).getTime() + int(1, 3) * 3_600_000).toISOString(),
      assignedTo: pickMany(users, int(2, 6)).map(u => u.id),
    })
  }

  // ---- Posts de Blog -------------------------------------------------------
  const blogPosts: BlogPost[] = BLOG_POSTS_STATIC.map((post, idx) => ({
    id: id('blg'),
    slug: post.slug,
    title: post.title,
    category: post.category,
    excerpt: post.excerpt,
    author: post.author,
    date: post.date,
    readTimeMin: post.readTimeMin,
    published: true,
    views: int(400, 8000) + idx * int(50, 300),
    coverGradient: post.coverGradient,
  }))

  // Comentários em posts de blog
  for (const post of blogPosts) {
    const n = int(2, 10)
    let lastCommentId: string | undefined
    for (let i = 0; i < n; i++) {
      const c: Comment = {
        id: id('com'), entityType: 'blog', entityId: post.id,
        authorId: pick(users).id,
        content: pick(BLOG_COMMENTS),
        createdAt: daysAgo(int(0, 90)),
        parentId: i > 0 && chance(0.3) ? lastCommentId : undefined,
        likeIds: pickMany(users, int(0, 12)).map(u => u.id),
      }
      comments.push(c)
      lastCommentId = c.id
    }
  }

  // ---- Avaliações (Ratings) ------------------------------------------------
  const ratings: Rating[] = []

  // Avaliações de OTs concluídas (por clientes)
  for (const wo of workOrders.filter(w => w.status === 'concluida')) {
    if (!chance(0.55)) continue
    const client = clients.find(c => c.id === wo.clientId)
    const author = client
      ? pick(clientUsers.filter(u => u.companyId === client.companyId) || clientUsers)
      : pick(clientUsers)
    const score = int(1, 5)
    ratings.push({
      id: id('rat'), entityType: 'work_order', entityId: wo.id,
      authorId: author.id, score,
      comment: score >= 4 ? pick(RATING_COMMENTS_GOOD) : score === 3 ? pick(RATING_COMMENTS_OK) : pick(RATING_COMMENTS_BAD),
      createdAt: wo.completedAt || daysAgo(1),
    })
  }

  // Avaliações de técnicos (por gestores e clientes)
  for (const tech of technicians.filter(t => t.completedOrders > 20)) {
    const n = int(2, 8)
    for (let i = 0; i < n; i++) {
      const score = int(2, 5)
      ratings.push({
        id: id('rat'), entityType: 'technician', entityId: tech.id,
        authorId: pick([...users.filter(u => u.role === 'gestor'), ...clientUsers]).id,
        score,
        comment: chance(0.7)
          ? (score >= 4 ? pick(RATING_COMMENTS_GOOD) : pick(RATING_COMMENTS_OK))
          : undefined,
        createdAt: daysAgo(int(0, 365)),
      })
    }
  }

  // Avaliações de fornecedores (por gestores e financeiros)
  for (const supplier of suppliers) {
    const n = int(1, 5)
    for (let i = 0; i < n; i++) {
      const score = int(2, 5)
      ratings.push({
        id: id('rat'), entityType: 'supplier', entityId: supplier.id,
        authorId: pick(users.filter(u => u.role === 'gestor' || u.role === 'financeiro' || u.role === 'admin')).id,
        score,
        comment: chance(0.5) ? pick([...RATING_COMMENTS_GOOD, ...RATING_COMMENTS_OK]) : undefined,
        createdAt: daysAgo(int(0, 500)),
      })
    }
  }

  // ---- Resultado -----------------------------------------------------------
  return {
    users, teams, technicians, companies, clients, buildings, equipment,
    workOrders, maintenanceRequests, preventivePlans,
    suppliers, parts, inventory,
    documents, folders, contracts,
    notifications, audits, reports, checklists,
    comments, testimonials, attachments,
    activityLog, calendarEvents,
    blogPosts, ratings,
    generatedAt: new Date().toISOString(),
    seed,
  }
}
