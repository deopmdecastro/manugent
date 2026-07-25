import type { PropsWithChildren } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { useAuth } from '../hooks/useAuth'
import { Sidebar } from '../components/navigation/Sidebar'
import { Topbar } from '../components/navigation/Topbar'

export function AppShell({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = usePersistentState('manugent.sidebar.collapsed', false)
  const [mobileOpen, setMobileOpen] = usePersistentState('manugent.sidebar.mobileOpen', false)
  const { user, logout } = useAuth()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  return (
    <div className="app-shell" data-sidebar={collapsed && !isMobile ? 'collapsed' : 'expanded'}>
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className="app-main">
        <Topbar
          collapsed={collapsed}
          user={user}
          onLogout={logout}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen((v) => !v)
            } else {
              setCollapsed((v) => !v)
            }
          }}
        />
        <section className="app-content">{children}</section>
      </main>
    </div>
  )
}
