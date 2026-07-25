import { useEffect, useState, useCallback } from 'react'

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

let currentUser: User | null = null

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // Try restore from session
    const stored = sessionStorage.getItem('manugent.user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User
        currentUser = parsed
        return parsed
      } catch { /* ignore */ }
    }
    return currentUser
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email: string, role?: Role) => {
    setLoading(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 800))
    
    // Quick login by role keyword
    let foundRole: Role = role || 'admin'
    if (email.includes('gestor')) foundRole = 'gestor'
    else if (email.includes('tecnico')) foundRole = 'tecnico'
    else if (email.includes('cliente')) foundRole = 'cliente'
    
    const loggedUser = MOCK_USERS[foundRole]
    currentUser = loggedUser
    sessionStorage.setItem('manugent.user', JSON.stringify(loggedUser))
    setUser(loggedUser)
    setLoading(false)
    return loggedUser
  }, [])

  const logout = useCallback(() => {
    currentUser = null
    sessionStorage.removeItem('manugent.user')
    setUser(null)
    window.location.hash = '#login'
  }, [])

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
  }, [user])

  const canAccess = useCallback((route: string): boolean => {
    if (!user) return false
    const routePermMap: Record<string, Permission> = {
      dashboard: 'dashboard:view',
      ots: 'ots:view', equipment: 'equipment:view',
      clients: 'clients:view', buildings: 'equipment:view',
      technicians: 'technicians:view', projects: 'projects:view',
      presets: 'presets:view', editor: 'editor:view',
      files: 'files:view', ai: 'ai:use', calendar: 'calendar:view',
      settings: 'settings:view',
    }
    const perm = routePermMap[route]
    if (!perm) return true
    return hasPermission(perm)
  }, [user, hasPermission])

  return { user, loading, login, logout, hasPermission, canAccess, isAuthenticated: !!user }
}
