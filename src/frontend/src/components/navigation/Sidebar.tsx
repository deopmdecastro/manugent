import { NAV_ITEMS } from '../../config/navigation'

type SidebarProps = {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <aside
      className={`sidebar${mobileOpen ? ' open' : ''}`}
      aria-label="Navegação principal"
    >
      <div className="sidebar-brand">
        <img
          src="/app/assets/ManuGent_logo.png"
          alt="ManuGent"
          className="sidebar-brand-full"
        />
        <img
          src="/app/assets/icon_manugent.png"
          alt="M"
          className="sidebar-brand-icon"
        />
      </div>
      <nav className="sidebar-nav">
        {/* Section: Principal */}
        <div className="sidebar-nav-section">
          <div className="sidebar-nav-section-label">Principal</div>
          {NAV_ITEMS.filter((i) => ['dashboard', 'ots', 'equipment', 'clients'].includes(i.id)).map((item) => (
            <button
              className={`sidebar-link${item.id === 'dashboard' ? ' active' : ''}`}
              key={item.id}
              title={collapsed && !mobileOpen ? item.label : undefined}
              onClick={() => { if (mobileOpen) onCloseMobile() }}
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Section: Gestão */}
        <div className="sidebar-nav-section">
          <div className="sidebar-nav-section-label">Gestão</div>
          {NAV_ITEMS.filter((i) => ['buildings', 'technicians', 'files', 'calendar'].includes(i.id)).map((item) => (
            <button
              className="sidebar-link"
              key={item.id}
              title={collapsed && !mobileOpen ? item.label : undefined}
              onClick={() => { if (mobileOpen) onCloseMobile() }}
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Section: Sistema */}
        <div className="sidebar-nav-section">
          <div className="sidebar-nav-section-label">Sistema</div>
          {NAV_ITEMS.filter((i) => ['ai', 'settings'].includes(i.id)).map((item) => (
            <button
              className={`sidebar-link${item.id === 'ai' ? ' animate-pulse-glow' : ''}`}
              key={item.id}
              title={collapsed && !mobileOpen ? item.label : undefined}
              onClick={() => { if (mobileOpen) onCloseMobile() }}
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  )
}
