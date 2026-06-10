import { createContext, useContext } from 'react'

type AppContextValue = {
  userRole: 'admin' | 'gestor' | 'tecnico' | 'cliente'
}

const AppContext = createContext<AppContextValue>({ userRole: 'admin' })

export const AppProvider = AppContext.Provider

export function useAppContext() {
  return useContext(AppContext)
}
