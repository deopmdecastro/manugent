type TopbarProps = {
  collapsed: boolean
  onToggleSidebar: () => void
}

export function Topbar({ collapsed, onToggleSidebar }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="icon-button" onClick={onToggleSidebar} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>
        <i className={collapsed ? 'fas fa-angles-right' : 'fas fa-angles-left'} aria-hidden="true" />
      </button>
      <button className="ai-button">
        <i className="fas fa-robot" aria-hidden="true" />
        Assistente IA ManuGent
      </button>
      <div className="topbar-spacer" />
      <button className="icon-button" aria-label="Notificações">
        <i className="fas fa-bell" aria-hidden="true" />
      </button>
    </header>
  )
}
