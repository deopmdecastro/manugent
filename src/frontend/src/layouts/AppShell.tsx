import type { PropsWithChildren } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { Sidebar } from '../components/navigation/Sidebar'
import { Topbar } from '../components/navigation/Topbar'

export function AppShell({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = usePersistentState('manugent.sidebar.collapsed', false)

  return (
    <div className="app-shell" data-sidebar={collapsed ? 'collapsed' : 'expanded'}>
      <Sidebar collapsed={collapsed} />
      <main className="app-main">
        <Topbar collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} />
        <section className="app-content">{children}</section>
      </main>
    </div>
  )
}
