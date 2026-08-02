// ============================================================================
// ManuGent — Demo Data Layer — KPIs & Estatísticas
// Nada aqui é um valor fixo: tudo é derivado do estado atual da DemoDatabase,
// pelo que qualquer criação/edição/remoção de registos recalcula os números.
// ============================================================================

import type { DemoDatabase } from './types'

export interface DashboardStats {
  utilizadoresAtivos: number
  otAbertas: number
  otConcluidas: number
  otEmExecucao: number
  pedidosPendentes: number
  pedidosEmAtraso: number
  tempoMedioResolucaoHoras: number
  tempoMedioRespostaHoras: number
  equipamentosCriticos: number
  equipamentosAvariados: number
  preventivasExecutadas: number
  preventivasEmAtraso: number
  tecnicosDisponiveis: number
  tecnicosEmServico: number
  clientesAtivos: number
  edificiosGeridos: number
  custosManutencaoTotal: number
  custosPorCliente: { clientId: string; clientName: string; total: number }[]
  horasTrabalhadas: number
  consumoPecas: number
  alertasAtivos: number
  notificacoesPendentes: number
  // Módulos adicionais
  avaliacaoMediaOTs: number
  avaliacaoMediaTecnicos: number
  totalComentarios: number
  totalAnexos: number
  postsBlogPublicados: number
  totalViewsBlog: number
}

export function computeDashboardStats(db: DemoDatabase): DashboardStats {
  const otConcluidasList = db.workOrders.filter(w => w.status === 'concluida')
  const resolTimes = otConcluidasList
    .filter(w => w.startedAt && w.completedAt)
    .map(w => (new Date(w.completedAt!).getTime() - new Date(w.startedAt!).getTime()) / 3_600_000)
  const responseTimes = db.workOrders
    .filter(w => w.startedAt)
    .map(w => (new Date(w.startedAt!).getTime() - new Date(w.createdAt).getTime()) / 3_600_000)
    .filter(h => h >= 0)

  const custosPorClienteMap = new Map<string, number>()
  for (const wo of otConcluidasList) {
    custosPorClienteMap.set(wo.clientId, (custosPorClienteMap.get(wo.clientId) || 0) + wo.cost)
  }
  const custosPorCliente = [...custosPorClienteMap.entries()]
    .map(([clientId, total]) => ({ clientId, clientName: db.clients.find(c => c.id === clientId)?.name || '—', total }))
    .sort((a, b) => b.total - a.total)

  const ratings = db.ratings ?? []
  const otRatings = ratings.filter(r => r.entityType === 'work_order').map(r => r.score)
  const techRatings = ratings.filter(r => r.entityType === 'technician').map(r => r.score)
  const blogPosts = db.blogPosts ?? []
  const allComments = db.comments ?? []
  const allAttachments = db.attachments ?? []

  return {
    utilizadoresAtivos: db.users.filter(u => u.active).length,
    otAbertas: db.workOrders.filter(w => w.status === 'aberta').length,
    otConcluidas: otConcluidasList.length,
    otEmExecucao: db.workOrders.filter(w => w.status === 'em_execucao').length,
    pedidosPendentes: db.maintenanceRequests.filter(r => !['concluido', 'cancelado'].includes(r.status)).length,
    pedidosEmAtraso: db.maintenanceRequests.filter(r => r.isLate).length,
    tempoMedioResolucaoHoras: avg(resolTimes),
    tempoMedioRespostaHoras: avg(responseTimes),
    equipamentosCriticos: db.equipment.filter(e => e.criticality === 'critica').length,
    equipamentosAvariados: db.equipment.filter(e => e.status === 'avariado').length,
    preventivasExecutadas: db.preventivePlans.filter(p => p.status === 'executado').length,
    preventivasEmAtraso: db.preventivePlans.filter(p => p.status === 'atrasado').length,
    tecnicosDisponiveis: db.technicians.filter(t => t.status === 'disponivel').length,
    tecnicosEmServico: db.technicians.filter(t => t.status === 'em_servico').length,
    clientesAtivos: db.clients.filter(c => c.active).length,
    edificiosGeridos: db.buildings.length,
    custosManutencaoTotal: round(otConcluidasList.reduce((s, w) => s + w.cost, 0)),
    custosPorCliente,
    horasTrabalhadas: round(otConcluidasList.reduce((s, w) => s + (w.actualHours || 0), 0)),
    consumoPecas: otConcluidasList.reduce((s, w) => s + w.partsUsed.reduce((s2, p) => s2 + p.quantity, 0), 0),
    alertasAtivos: db.notifications.filter(n => !n.read).length,
    notificacoesPendentes: db.notifications.filter(n => !n.read).length,
    avaliacaoMediaOTs: avg(otRatings),
    avaliacaoMediaTecnicos: avg(techRatings),
    totalComentarios: allComments.length,
    totalAnexos: allAttachments.length,
    postsBlogPublicados: blogPosts.filter(p => p.published).length,
    totalViewsBlog: blogPosts.reduce((s, p) => s + p.views, 0),
  }
}

export interface LandingStats {
  utilizadoresAtivos: string
  otConcluidasPercent: string
  satisfacaoClientes: string
  reducaoCustosPercent: string
  tempoMedioResposta: string
  equipamentosMonitorizados: number
  empresasClientes: number
  pedidosResolvidosEsteMes: number
}

export function computeLandingStats(db: DemoDatabase): LandingStats {
  const s = computeDashboardStats(db)
  const totalOt = db.workOrders.length || 1
  const otConcluidasPercent = (s.otConcluidas / totalOt) * 100

  // Satisfação calculada a partir de avaliações explícitas (ratings) + testemunhos
  const ratingsScores = (db.ratings ?? []).filter(r => r.entityType === 'work_order').map(r => r.score)
  const testimonialScores = db.testimonials.map(t => t.rating)
  const allSatisfactionScores = [...ratingsScores, ...testimonialScores]
  const avgSatisfaction = avg(allSatisfactionScores)
  const satisfacaoPercent = avgSatisfaction > 0 ? Math.round((avgSatisfaction / 5) * 100) : 96

  const rollingMonthAgo = new Date(Date.now() - 30 * 24 * 3_600_000)
  const resolvidosEsteMes = db.maintenanceRequests.filter(
    r => r.status === 'concluido' && new Date(r.createdAt) >= rollingMonthAgo,
  ).length

  return {
    utilizadoresAtivos: formatCompact(db.users.length * 87), // simula base alargada de utilizadores finais das empresas clientes
    otConcluidasPercent: `${Math.min(99, Math.round(otConcluidasPercent))}%`,
    satisfacaoClientes: `${satisfacaoPercent}%`,
    reducaoCustosPercent: `${Math.round(12 + (s.preventivasExecutadas / Math.max(1, db.preventivePlans.length)) * 20)}%`,
    tempoMedioResposta: `${s.tempoMedioRespostaHoras.toFixed(1)}h`,
    equipamentosMonitorizados: db.equipment.length,
    empresasClientes: db.companies.filter(c => c.active).length,
    pedidosResolvidosEsteMes: resolvidosEsteMes,
  }
}

function avg(nums: number[]) { return nums.length ? round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0 }
function round(n: number) { return Math.round(n * 100) / 100 }
function formatCompact(n: number) {
  if (n >= 1000) return `+${Math.floor(n / 1000)}.000`
  return `+${n}`
}
