import { useState, useCallback, useSyncExternalStore } from 'react'

export type Role = 'superadmin' | 'admin' | 'gestor' | 'tecnico' | 'cliente'
export type Permission = 
  | 'dashboard:view' | 'ots:view' | 'ots:create' | 'ots:edit' | 'ots:delete'
  | 'equipment:view' | 'equipment:create' | 'equipment:edit' | 'equipment:delete'
  | 'clients:view' | 'clients:create' | 'clients:edit' | 'clients:delete'
  | 'technicians:view' | 'projects:view' | 'presets:view'
  | 'editor:view' | 'files:view' | 'ai:use' | 'calendar:view'
  | 'settings:view' | 'settings:edit' | 'reports:view' | 'quotes:approve'
  | 'time:track'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  teamId?: string
  teamName?: string
}

const AUTH_KEY = 'manugent.user'
const TOKEN_KEY = 'manugent.token'
let currentUser: User | null = null

/** The JWT issued by POST /api/auth/login, for calling authenticated APIs. */
export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Spread into a fetch() `headers` object to attach the current session's JWT. */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

function getSnapshot(): User | null {
  if (currentUser) return currentUser
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    if (raw) {
      currentUser = JSON.parse(raw) as User
      return currentUser
    }
  } catch {}
  return null
}

function subscribe(cb: () => void) {
  const handler = () => { currentUser = null; cb() }
  window.addEventListener('manugent:auth', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('manugent:auth', handler)
    window.removeEventListener('storage', handler)
  }
}

function persist(user: User | null, token?: string) {
  currentUser = user

  // React app auth (sessionStorage)
  if (user) {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(user))
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  }

  // Legacy dashboard auth bridge (localStorage)
  if (user) {
    try {
      // Ensure mg_data exists (preserve existing data if any)
      const existingRaw = localStorage.getItem('mg_data')
      const existingData = existingRaw ? JSON.parse(existingRaw) : {}
      existingData.user = {
        name: user.name,
        email: user.email,
        role: user.role,
      }
      localStorage.setItem('mg_data', JSON.stringify(existingData))
      // Create session token for legacy dashboard
      const seed = Date.now() + '-' + Math.random().toString(36).slice(2)
      const token = 'mg-session-' + btoa(seed).replace(/=+$/, '')
      localStorage.setItem('mg_auth_token', token)
    } catch { /* ignore bridge errors */ }
  } else {
    localStorage.removeItem('mg_auth_token')
    try {
      const existingRaw = localStorage.getItem('mg_data')
      if (existingRaw) {
        const existingData = JSON.parse(existingRaw)
        delete existingData.user
        localStorage.setItem('mg_data', JSON.stringify(existingData))
      }
    } catch { /* ignore bridge errors */ }
  }

  window.dispatchEvent(new Event('manugent:auth'))
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    'dashboard:view', 'ots:view', 'ots:create', 'ots:edit', 'ots:delete',
    'equipment:view', 'equipment:create', 'equipment:edit', 'equipment:delete',
    'clients:view', 'clients:create', 'clients:edit', 'clients:delete',
    'technicians:view', 'projects:view', 'presets:view',
    'editor:view', 'files:view', 'ai:use', 'calendar:view',
    'settings:view', 'settings:edit', 'reports:view', 'quotes:approve',
    'time:track',
  ],
  admin: [
    'dashboard:view', 'ots:view', 'ots:create', 'ots:edit', 'ots:delete',
    'equipment:view', 'equipment:create', 'equipment:edit', 'equipment:delete',
    'clients:view', 'clients:create', 'clients:edit', 'clients:delete',
    'technicians:view', 'projects:view', 'presets:view',
    'editor:view', 'files:view', 'ai:use', 'calendar:view',
    'settings:view', 'settings:edit', 'reports:view', 'quotes:approve',
    'time:track',
  ],
  gestor: [
    'dashboard:view', 'ots:view', 'ots:create', 'ots:edit',
    'equipment:view', 'equipment:edit',
    'clients:view', 'clients:edit',
    'technicians:view', 'projects:view', 'presets:view',
    'files:view', 'ai:use', 'calendar:view',
    'settings:view', 'reports:view', 'quotes:approve',
    'time:track',
  ],
  tecnico: [
    'dashboard:view', 'ots:view', 'ots:create',
    'equipment:view',
    'clients:view',
    'files:view', 'ai:use', 'calendar:view',
    'time:track',
  ],
  cliente: [
    'dashboard:view', 'ots:view',
    'equipment:view',
    'reports:view', 'quotes:approve',
  ],
}

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Credenciais inválidas.')
      }
      const raw = data.user as { id: string; name: string; email: string; role: Role; team_id?: string; team_name?: string }
      const loggedUser: User = {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        role: raw.role,
        teamId: raw.team_id,
        teamName: raw.team_name,
      }
      persist(loggedUser, data.token as string | undefined)
      return loggedUser
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    persist(null)
  }, [])

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
  }, [user])

  return { user, loading, login, logout, hasPermission, isAuthenticated: !!user }
}
