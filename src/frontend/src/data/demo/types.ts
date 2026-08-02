// ============================================================================
// ManuGent — Demo Data Layer — Tipos de Entidades
// Todas as entidades usam IDs prefixados (ex: usr_, cli_, edf_) para que as
// relações entre módulos sejam explícitas e fáceis de seguir/depurar.
// ============================================================================

export type UUID = string

export type Role =
  | 'superadmin'
  | 'admin'
  | 'gestor'
  | 'tecnico'
  | 'cliente'
  | 'financeiro'

export type WorkOrderStatus =
  | 'aberta'
  | 'em_analise'
  | 'atribuida'
  | 'em_execucao'
  | 'concluida'
  | 'cancelada'

export type RequestStatus =
  | 'aberto'
  | 'em_analise'
  | 'atribuido'
  | 'em_execucao'
  | 'concluido'
  | 'cancelado'

export type Priority = 'baixa' | 'media' | 'alta' | 'critica'

export interface User {
  id: UUID
  name: string
  email: string
  role: Role
  companyId?: UUID
  avatarSeed: string
  active: boolean
  onDuty: boolean
  createdAt: string
  lastLoginAt: string
  phone: string
}

export interface Team {
  id: UUID
  name: string
  leaderId: UUID
  memberIds: UUID[]
  specialty: string
}

export interface Technician {
  id: UUID
  userId: UUID
  specialties: string[]
  teamId?: UUID
  status: 'disponivel' | 'em_servico' | 'ausente' | 'ferias'
  rating: number
  completedOrders: number
  activeOrders: number
}

export interface Company {
  id: UUID
  name: string
  taxId: string
  sector: string
  active: boolean
  since: string
}

export interface Client {
  id: UUID
  companyId: UUID
  name: string
  email: string
  phone: string
  address: string
  city: string
  active: boolean
  contractId?: UUID
  since: string
}

export interface Building {
  id: UUID
  clientId: UUID
  name: string
  address: string
  city: string
  type: 'industrial' | 'comercial' | 'residencial' | 'saude' | 'escritorio'
  areaM2: number
}

export interface Equipment {
  id: UUID
  buildingId: UUID
  name: string
  category: string
  brand: string
  model: string
  serialNumber: string
  criticality: Priority
  status: 'operacional' | 'em_manutencao' | 'avariado' | 'inativo'
  installedAt: string
  lastMaintenanceAt: string
  nextMaintenanceAt: string
  qrCode: string
}

export interface WorkOrder {
  id: UUID
  code: string
  equipmentId: UUID
  buildingId: UUID
  clientId: UUID
  technicianId?: UUID
  teamId?: UUID
  status: WorkOrderStatus
  priority: Priority
  type: 'corretiva' | 'preventiva' | 'preditiva' | 'inspecao'
  title: string
  description: string
  createdAt: string
  scheduledAt: string
  startedAt?: string
  completedAt?: string
  estimatedHours: number
  actualHours?: number
  cost: number
  partsUsed: { partId: UUID; quantity: number }[]
}

export interface MaintenanceRequest {
  id: UUID
  clientId: UUID
  buildingId: UUID
  equipmentId?: UUID
  requestedBy: UUID
  assignedTo: UUID[]
  status: RequestStatus
  priority: Priority
  title: string
  description: string
  createdAt: string
  dueAt: string
  workOrderId?: UUID
  isLate: boolean
}

export interface PreventivePlan {
  id: UUID
  equipmentId: UUID
  name: string
  frequency: 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual'
  lastExecutedAt: string
  nextDueAt: string
  status: 'em_dia' | 'atrasado' | 'executado'
  checklistId?: UUID
  responsibleTeamId: UUID
}

export interface Supplier {
  id: UUID
  name: string
  taxId: string
  category: string
  email: string
  phone: string
  rating: number
  active: boolean
}

export interface Part {
  id: UUID
  name: string
  sku: string
  category: string
  unitCost: number
  supplierId: UUID
}

export interface InventoryItem {
  id: UUID
  partId: UUID
  warehouse: string
  quantity: number
  minQuantity: number
  reserved: number
  lastMovementAt: string
}

export interface Document {
  id: UUID
  name: string
  type: 'manual' | 'garantia' | 'relatorio' | 'contrato' | 'fatura' | 'certificado'
  folderId?: UUID
  entityType: 'equipment' | 'client' | 'building' | 'work_order' | 'contract'
  entityId: UUID
  uploadedBy: UUID
  uploadedAt: string
  sizeKb: number
  url: string
}

export interface Folder {
  id: UUID
  name: string
  parentId?: UUID
  ownerId: UUID
  createdAt: string
}

export interface Contract {
  id: UUID
  clientId: UUID
  type: 'manutencao_preventiva' | 'manutencao_completa' | 'sob_pedido'
  status: 'ativo' | 'expirado' | 'pendente' | 'cancelado'
  startDate: string
  endDate: string
  monthlyValue: number
  slaHours: number
}

export interface Notification {
  id: UUID
  userId: UUID
  type: 'work_order' | 'request' | 'preventive' | 'system' | 'contract' | 'inventory'
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedEntityId?: UUID
}

export interface Audit {
  id: UUID
  buildingId: UUID
  auditorId: UUID
  status: 'agendada' | 'em_curso' | 'concluida'
  score?: number
  date: string
  findings: string[]
}

export interface Report {
  id: UUID
  workOrderId?: UUID
  clientId: UUID
  type: 'intervencao' | 'mensal' | 'auditoria' | 'custo'
  title: string
  generatedAt: string
  generatedBy: UUID
  url: string
}

export interface Checklist {
  id: UUID
  name: string
  items: { id: string; label: string; done: boolean }[]
  equipmentCategory?: string
}

export interface Comment {
  id: UUID
  entityType: 'work_order' | 'request' | 'blog' | 'audit'
  entityId: UUID
  authorId: UUID
  content: string
  createdAt: string
  parentId?: UUID
  likeIds: UUID[]
}

export interface Testimonial {
  id: UUID
  authorName: string
  authorRole: string
  companyName: string
  rating: number
  content: string
  date: string
  featured: boolean
}

export interface Attachment {
  id: UUID
  entityType: 'work_order' | 'request' | 'audit' | 'equipment'
  entityId: UUID
  fileName: string
  mimeType: string
  sizeKb: number
  uploadedBy: UUID
  uploadedAt: string
}

export interface ActivityLogEntry {
  id: UUID
  userId: UUID
  action: string
  entityType: string
  entityId: string
  createdAt: string
}

export interface CalendarEvent {
  id: UUID
  title: string
  type: 'work_order' | 'preventive' | 'audit' | 'meeting'
  relatedId: string
  start: string
  end: string
  assignedTo: UUID[]
}

// ---- Módulos adicionais -------------------------------------------------------

/**
 * Artigo de blog com métricas de engagement calculadas a partir dos dados demo.
 * Os campos dinâmicos (views, likes, commentCount) são recalculados no serviço.
 */
export interface BlogPost {
  id: UUID
  slug: string
  title: string
  category: string
  excerpt: string
  author: string
  date: string
  readTimeMin: number
  published: boolean
  views: number
  coverGradient: string
}

/**
 * Avaliação explícita de uma entidade por um utilizador.
 * Complementa os likes (implícitos) com uma classificação numérica (1-5)
 * e um comentário opcional.
 */
export interface Rating {
  id: UUID
  entityType: 'technician' | 'work_order' | 'supplier' | 'service'
  entityId: UUID
  authorId: UUID
  score: number          // 1–5
  comment?: string
  createdAt: string
}

export interface DemoDatabase {
  users: User[]
  teams: Team[]
  technicians: Technician[]
  companies: Company[]
  clients: Client[]
  buildings: Building[]
  equipment: Equipment[]
  workOrders: WorkOrder[]
  maintenanceRequests: MaintenanceRequest[]
  preventivePlans: PreventivePlan[]
  suppliers: Supplier[]
  parts: Part[]
  inventory: InventoryItem[]
  documents: Document[]
  folders: Folder[]
  contracts: Contract[]
  notifications: Notification[]
  audits: Audit[]
  reports: Report[]
  checklists: Checklist[]
  comments: Comment[]
  testimonials: Testimonial[]
  attachments: Attachment[]
  activityLog: ActivityLogEntry[]
  calendarEvents: CalendarEvent[]
  blogPosts: BlogPost[]
  ratings: Rating[]
  generatedAt: string
  seed: number
}
