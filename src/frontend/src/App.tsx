import { useState, useEffect } from 'react'
import { AppShell } from './layouts/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { PresetsPage } from './pages/PresetsPage'
import { EditorPage } from './pages/EditorPage'

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || 'dashboard')

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1) || 'dashboard')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

const ROUTES: Record<string, React.ComponentType> = {
  login: LoginPage,
  dashboard: DashboardPage,
  projects: ProjectsPage,
  presets: PresetsPage,
  editor: EditorPage,
}

export function App() {
  const route = useHashRoute()
  const Page = ROUTES[route] || DashboardPage

  if (route === 'login') {
    return <LoginPage />
  }

  return (
    <AppShell>
      <Page />
    </AppShell>
  )
}
