import { useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../router/routes'

type SidebarProps = {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = ROUTES.filter(r => r.shell && r.label && r.icon).map(r => ({
    id: r.path,
    label: r.label!,
    icon: r.icon!,
    section: r.path.startsWith('dashboard') ? 'principal' :
              ['projects','presets'].includes(r.path) ? 'gestao' : 'sistema',
  }))

  const sections: Record<string, { label: string; items: typeof navItems }> = {
    principal: { label: 'Principal', items: navItems.filter(i => i.section === 'principal') },
    gestao: { label: 'Gestão', items: navItems.filter(i => i.section === 'gestao') },
    sistema: { label: 'Sistema', items: navItems.filter(i => i.section === 'sistema') },
  }

  const handleNav = (path: string) => {
    navigate(`/${path}`)
    if (mobileOpen) onCloseMobile()
  }

  return (
    <aside className={`sidebar${mobileOpen ? ' open' : ''}`} aria-label="Navegação principal">
      <div className="sidebar-brand">
        <span onClick={() => handleNav('dashboard/admin')} style={{ cursor: 'pointer' }}>
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" />
        </span>
        <span onClick={() => handleNav('dashboard/admin')} style={{ cursor: 'pointer' }}>
          <img src="/app/assets/icon_manugent.png" alt="M" className="sidebar-brand-icon" />
        </span>
      </div>
      <nav className="sidebar-nav">
        {Object.entries(sections).map(([key, sec]) => (
          <div className="sidebar-nav-section" key={key}>
            <div className="sidebar-nav-section-label">{sec.label}</div>
            {sec.items.map(item => (
              <button
                key={item.id}
                className={`sidebar-link${location.pathname === `/${item.id}` ? ' active' : ''}`}
                title={collapsed && !mobileOpen ? item.label : undefined}
                onClick={() => handleNav(item.id)}
              >
                <i className={item.icon} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px' }}>
          <i className="fas fa-circle" style={{ color: 'var(--accent-green)', fontSize: 8 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sistema operacional</span>
        </div>
      </div>
    </aside>
  )
}
