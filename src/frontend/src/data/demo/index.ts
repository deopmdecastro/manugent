// ============================================================================
// ManuGent — Demo Data Layer — Índice
// Base de dados fictícia completa e relacional para demonstrar/testar toda
// a plataforma sem depender do backend real.
//
// Uso rápido:
//   import { demoDataService, useDashboardStats, useLandingStats } from '@/data/demo'
//
//   const db = demoDataService.getDatabase()
//   demoDataService.create('workOrders', novaOT)
//   demoDataService.update('workOrders', id, { status: 'concluida' })
//   demoDataService.delete('notifications', id)
//
// Ativar/desativar modo demo (não afeta o backend real):
//   demoDataService.setDemoMode(true | false)
// ============================================================================

export * from './types'
export { generateDemoDatabase } from './generator'
export { computeDashboardStats, computeLandingStats } from './stats'
export type { DashboardStats, LandingStats } from './stats'
export { demoDataService } from './service'
export { useDemoDatabase, useDashboardStats, useLandingStats, useDemoCrud } from './useDemoData'
