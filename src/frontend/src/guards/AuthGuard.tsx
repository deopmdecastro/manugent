import type { PropsWithChildren } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { Role, Permission } from '../hooks/useAuth'

type AuthGuardProps = PropsWithChildren<{
  requiredRole?: Role
  requiredPermission?: Permission
  fallback?: React.ReactNode
}>

export function AuthGuard({ children, requiredRole, requiredPermission, fallback }: AuthGuardProps) {
  const { user, hasPermission } = useAuth()

  if (!user) {
    return fallback ? <>{fallback}</> : (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="empty-state animate-fade-in">
          <i className="fas fa-lock empty-state-icon" />
          <div className="empty-state-title">Autenticação necessária</div>
          <div className="empty-state-desc">Inicia sessão para aceder a esta página.</div>
          <button className="btn btn-primary" onClick={() => window.location.hash = '#login'}>
            <i className="fas fa-sign-in-alt" /> Entrar
          </button>
        </div>
      </div>
    )
  }

  if (requiredRole) {
    const roleRank: Record<Role, number> = { admin: 4, gestor: 3, tecnico: 2, cliente: 1 }
    if (roleRank[user.role] < roleRank[requiredRole]) {
      return fallback ? <>{fallback}</> : (
        <div className="empty-state animate-fade-in">
          <i className="fas fa-shield-halved empty-state-icon" />
          <div className="empty-state-title">Acesso restrito</div>
          <div className="empty-state-desc">O teu perfil não tem permissão para aceder a esta área.</div>
        </div>
      )
    }
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback ? <>{fallback}</> : (
      <div className="empty-state animate-fade-in">
        <i className="fas fa-ban empty-state-icon" />
        <div className="empty-state-title">Permissão insuficiente</div>
        <div className="empty-state-desc">Não tens a permissão necessária para esta ação.</div>
      </div>
    )
  }

  return <>{children}</>
}
