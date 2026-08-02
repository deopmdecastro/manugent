// ============================================================================
// ManuGent — Demo Data Layer — Hook React
// Subscreve o serviço de dados fictícios e força re-render sempre que algo é
// criado, editado ou eliminado — dashboards, tabelas e KPIs ficam sempre
// sincronizados com o estado atual, sem necessidade de refresh manual.
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { demoDataService } from './service'
import type { DemoDatabase } from './types'

/** Devolve a base de dados fictícia completa, atualizada em tempo real. */
export function useDemoDatabase(): DemoDatabase {
  const [, setTick] = useState(0)
  useEffect(() => demoDataService.subscribe(() => setTick(t => t + 1)), [])
  return demoDataService.getDatabase()
}

/** Devolve os KPIs do dashboard, recalculados sempre que os dados mudam. */
export function useDashboardStats() {
  const [, setTick] = useState(0)
  useEffect(() => demoDataService.subscribe(() => setTick(t => t + 1)), [])
  return demoDataService.getDashboardStats()
}

/** Devolve as estatísticas dinâmicas da landing page. */
export function useLandingStats() {
  const [, setTick] = useState(0)
  useEffect(() => demoDataService.subscribe(() => setTick(t => t + 1)), [])
  return demoDataService.getLandingStats()
}

/** Acesso direto ao CRUD genérico do serviço (create/update/delete/search). */
export function useDemoCrud() {
  const [, setTick] = useState(0)
  useEffect(() => demoDataService.subscribe(() => setTick(t => t + 1)), [])
  const refresh = useCallback(() => setTick(t => t + 1), [])
  return { service: demoDataService, refresh }
}
