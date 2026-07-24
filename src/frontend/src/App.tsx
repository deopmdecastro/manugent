import { useState, useEffect, useCallback } from 'react'
import { AppShell } from './layouts/AppShell'
import { AuthGuard } from './guards/AuthGuard'
import { useAuth } from './hooks/useAuth'
import { findRoute } from './router/routes'

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || 'landing')

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1) || 'landing')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((path: string) => {
    window.location.hash = path
  }, [])

  return { route, navigate, setRoute }
}

export function App() {
  const { route } = useHashRoute()
  const { isAuthenticated, user } = useAuth()
  const config = findRoute(route)

  // Default to landing if route not found
  if (!config) {
    window.location.hash = 'landing'
    return null
  }

  // Public routes — no auth or shell
  if (config.public) {
    return <config.component />
  }

  // If not authenticated and route requires auth, show auth guard
  if (!isAuthenticated && !config.public) {
    return <AuthGuard><config.component /></AuthGuard>
  }

  // Authenticated routes with shell
  if (config.shell) {
    return (
      <AppShell>
        <AuthGuard requiredRole={config.minRole}>
          <config.component />
        </AuthGuard>
      </AppShell>
    )
  }

  // Authenticated, no shell
  return (
    <AuthGuard requiredRole={config.minRole}>
      <config.component />
    </AuthGuard>
  )
}
