import { useState, useEffect } from 'react'
import { AppShell } from './layouts/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { LandingPage } from './pages/LandingPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { PresetsPage } from './pages/PresetsPage'

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || 'landing')

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1) || 'landing')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

const ROUTES: Record<string, React.ComponentType> = {
  landing: LandingPage,
  login: LoginPage,
  dashboard: DashboardPage,
  projects: ProjectsPage,
  presets: PresetsPage,
}

export function App() {
  const route = useHashRoute()
  const Page = ROUTES[route] || LandingPage

  // Public routes — no shell
  if (route === 'landing' || route === 'login') {
    return <Page />
  }

  return (
    <AppShell>
      <Page />
    </AppShell>
  )
}
