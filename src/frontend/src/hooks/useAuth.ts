import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'

export type Role = 'admin' | 'gestor' | 'tecnico' | 'cliente'
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

// ── External store that survives hash changes ──
let currentUserSnapshot: User | null = null

function getSnapshot(): User | null {
  if (currentUserSnapshot) return currentUserSnapshot
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as User
      currentUserSnapshot = parsed
      return parsed
    }
  } catch { /* ignore */ }
  return null
}

function subscribe(cb: () => void) {
  const handler = () => {
    currentUserSnapshot = null // force re-read
    cb()
  }
  window.addEventListener('manugent:auth', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('manugent:auth', handler)
    window.removeEventListener('storage', handler)
  }
}

function persist(user: User | null) {
  currentUserSnapshot = user
  if (user) {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(user))
  } else {
    sessionStorage.removeItem(AUTH_KEY)
  }
  window.dispatchEvent(new Event('manugent:auth'))
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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

const MOCK_USERS: Record<string, User> = {
  admin: { id: 'u1', name: 'Admin ManuGent', email: 'admin@manugent.pt', role: 'admin', teamName: 'Direção' },
  gestor: { id: 'u2', name: 'Gestor Silva', email: 'gestor@manugent.pt', role: 'gestor', teamName: 'Operações' },
  tecnico: { id: 'u3', name: 'Técnico Costa', email: 'tecnico@manugent.pt', role: 'tecnico', teamName: 'Equipa Manutenção' },
  cliente: { id: 'u4', name: 'Cliente Demo', email: 'cliente@demo.pt', role: 'cliente' },
}

export function useAuth() {
  // useSyncExternalStore survives hash changes — always in sync
  const user = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email: string, role?: Role) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    let foundRole: Role = role || 'admin'
    if (email.includes('gestor')) foundRole = 'gestor'
    else if (email.includes('tecnico')) foundRole = 'tecnico'
    else if (email.includes('cliente')) foundRole = 'cliente'

    const loggedUser = MOCK_USERS[foundRole]
    persist(loggedUser)
    setLoading(false)
    return loggedUser
  }, [])

  const logout = useCallback(() => {
    persist(null)
    window.location.hash = '#login'
  }, [])

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
  }, [user])

  return { user, loading, login, logout, hasPermission, isAuthenticated: !!user }
}
