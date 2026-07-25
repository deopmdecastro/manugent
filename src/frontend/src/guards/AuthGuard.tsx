import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from '../hooks/useAuth'

type AuthGuardProps = PropsWithChildren<{
  requiredRole?: Role
}>

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole) {
    const roleHierarchy: Role[] = ['cliente', 'tecnico', 'gestor', 'admin']
    const userLevel = roleHierarchy.indexOf(user!.role)
    const requiredLevel = roleHierarchy.indexOf(requiredRole)
    if (userLevel < requiredLevel) {
      return <Navigate to="/dashboard/admin" replace />
    }
  }

  return <>{children}</>
}
