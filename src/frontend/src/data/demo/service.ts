// ============================================================================
// ManuGent — Demo Data Layer — Serviço (CRUD + persistência + pub/sub)
// Modo demo totalmente independente do backend real: os dados vivem em
// memória + localStorage, para que criar/editar/eliminar qualquer registo
// funcione sem API, e todos os componentes subscritos (dashboards, tabelas,
// KPIs) sejam notificados e recalculem automaticamente.
// ============================================================================

import type { DemoDatabase } from './types'
import { generateDemoDatabase } from './generator'
import { computeDashboardStats, computeLandingStats, DashboardStats, LandingStats } from './stats'

// Sempre que a estrutura/geração dos dados mudar de forma incompatível,
// incrementar esta versão força todos os browsers a regenerar do zero em
// vez de reutilizar um estado antigo (evita ficar preso a dados
// parciais/corrompidos indefinidamente).
// v3: adicionados módulos blogPosts e ratings; volume de dados expandido.
const STORAGE_KEY = 'manugent_demo_db_v3'
const DEMO_MODE_KEY = 'manugent_demo_mode'

// Coleções que nunca devem ficar vazias numa base de dados válida.
// Se alguma estiver vazia/ausente, tratamos os dados carregados como
// corrompidos e regeneramos, em vez de mostrar zeros permanentemente.
const CRITICAL_COLLECTIONS: (keyof DemoDatabase)[] = ['companies', 'clients', 'buildings', 'equipment', 'workOrders']

function isValidDatabase(db: unknown): db is DemoDatabase {
  if (!db || typeof db !== 'object') return false
  return CRITICAL_COLLECTIONS.every(key => Array.isArray((db as any)[key]) && (db as any)[key].length > 0)
}

type Collection = {
  [K in keyof DemoDatabase]: DemoDatabase[K] extends Array<infer _T> ? K : never
}[keyof DemoDatabase]

type Listener = () => void

class DemoDataService {
  private db: DemoDatabase
  private listeners = new Set<Listener>()

  constructor() {
    const loaded = this.load()
    if (isValidDatabase(loaded)) {
      this.db = loaded
    } else {
      // Não existe estado guardado, ou está vazio/corrompido: gera de novo
      // e substitui imediatamente o que estiver em localStorage.
      this.db = generateDemoDatabase()
      this.persist()
    }
  }

  // ---- modo demo (liga/desliga sem tocar no backend real) -----------------
  isDemoMode(): boolean {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(DEMO_MODE_KEY) !== 'off'
  }
  setDemoMode(on: boolean) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DEMO_MODE_KEY, on ? 'on' : 'off')
    this.notify()
  }

  // ---- persistência ----------------------------------------------------------
  private load(): DemoDatabase | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as DemoDatabase) : null
    } catch { return null }
  }
  private persist() {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db)) } catch { /* quota exceeded, ignore */ }
  }

  // ---- pub/sub -----------------------------------------------------------------
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private notify() { this.persist(); this.listeners.forEach(fn => fn()) }

  // ---- acesso à base completa -----------------------------------------------------
  getDatabase(): DemoDatabase { return this.db }
  resetDatabase(seed?: number) { this.db = generateDemoDatabase(seed); this.notify() }

  // ---- KPIs derivados (recalculados sempre que chamados) -----------------------------
  getDashboardStats(): DashboardStats { return computeDashboardStats(this.db) }
  getLandingStats(): LandingStats { return computeLandingStats(this.db) }

  // ---- CRUD genérico sobre qualquer coleção -------------------------------------------
  list<K extends Collection>(collection: K): DemoDatabase[K] {
    return this.db[collection]
  }
  find<K extends Collection>(collection: K, id: string): DemoDatabase[K][number] | undefined {
    return (this.db[collection] as any[]).find((item: any) => item.id === id)
  }
  create<K extends Collection>(collection: K, item: DemoDatabase[K][number]): void {
    ;(this.db[collection] as any[]).push(item)
    this.notify()
  }
  update<K extends Collection>(collection: K, id: string, patch: Partial<DemoDatabase[K][number]>): boolean {
    const arr = this.db[collection] as any[]
    const idx = arr.findIndex((item: any) => item.id === id)
    if (idx === -1) return false
    arr[idx] = { ...arr[idx], ...patch }
    this.notify()
    return true
  }
  delete<K extends Collection>(collection: K, id: string): boolean {
    const arr = this.db[collection] as any[]
    const before = arr.length
    this.db[collection] = arr.filter((item: any) => item.id !== id) as DemoDatabase[K]
    const changed = arr.length !== before
    if (changed) this.notify()
    return changed
  }
  filter<K extends Collection>(collection: K, predicate: (item: DemoDatabase[K][number]) => boolean): DemoDatabase[K][number][] {
    return (this.db[collection] as any[]).filter(predicate)
  }
  search<K extends Collection>(collection: K, query: string, fields: string[]): DemoDatabase[K][number][] {
    const q = query.trim().toLowerCase()
    if (!q) return this.db[collection] as any[]
    return (this.db[collection] as any[]).filter((item: any) =>
      fields.some(f => String(item[f] ?? '').toLowerCase().includes(q))
    )
  }
}

// Singleton partilhado por toda a aplicação
export const demoDataService = new DemoDataService()
export type { DashboardStats, LandingStats }
