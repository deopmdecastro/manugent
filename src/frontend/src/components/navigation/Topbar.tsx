type TopbarProps = {
  collapsed: boolean
  onToggleSidebar: () => void
}

export function Topbar({ collapsed, onToggleSidebar }: TopbarProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  return (
    <header className="topbar">
      <button
        className="icon-button"
        onClick={onToggleSidebar}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <i
          className={
            isMobile
              ? 'fas fa-bars'
              : collapsed
                ? 'fas fa-angles-right'
                : 'fas fa-angles-left'
          }
          aria-hidden="true"
        />
      </button>

      <button className="ai-button">
        <i className="fas fa-robot" aria-hidden="true" />
        Assistente IA
      </button>

      <div className="topbar-spacer" />

      <button className="icon-button" aria-label="Pesquisar">
        <i className="fas fa-search" aria-hidden="true" />
      </button>

      <button className="icon-button" aria-label="Notificações">
        <i className="fas fa-bell" aria-hidden="true" />
      </button>

      <button className="icon-button" aria-label="Perfil">
        <i className="fas fa-user-circle" aria-hidden="true" />
      </button>
    </header>
  )
}
