import { createContext, useContext } from 'react'
import type { User, Role, Permission } from '../hooks/useAuth'

export type AppContextValue = {
  user: User | null
  userRole: Role | 'superadmin'
  hasPermission: (p: Permission) => boolean
}

const AppContext = createContext<AppContextValue>({
  user: null,
  userRole: 'superadmin',
  hasPermission: () => false,
})

export const AppProvider = AppContext.Provider

export function useAppContext() {
  return useContext(AppContext)
}
