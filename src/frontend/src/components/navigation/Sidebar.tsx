import { NAV_ITEMS } from '../../config/navigation'

type SidebarProps = {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar-brand">
        <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" />
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button className="sidebar-link" key={item.id} title={collapsed ? item.label : undefined}>
            <i className={item.icon} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
