import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../../hooks/useAuth'

type TopbarProps = {
  collapsed: boolean
  user: User | null
  onLogout: () => void
  onToggleSidebar: () => void
}

export function Topbar({ collapsed, user, onLogout, onToggleSidebar }: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  return (
    <header className="topbar">
      <button className="icon-button" onClick={onToggleSidebar} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>
        <i className={isMobile ? 'fas fa-bars' : collapsed ? 'fas fa-angles-right' : 'fas fa-angles-left'} aria-hidden="true" />
      </button>

      <button className="ai-button" onClick={() => navigate('/dashboard/ai')}>
        <i className="fas fa-robot" aria-hidden="true" /> Assistente IA
      </button>

      <div className="topbar-spacer" />

      <button className="icon-button" aria-label="Pesquisar">
        <i className="fas fa-search" aria-hidden="true" />
      </button>

      <button className="icon-button" aria-label="Notificações">
        <i className="fas fa-bell" aria-hidden="true" />
      </button>

      <div style={{ position: 'relative' }}>
        <button className="icon-button" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-label="Perfil" style={{ width: 42, height: 42, padding: 0, overflow: 'hidden' }}>
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=36`} alt="" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)' }} />
        </button>
        {userMenuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={() => setUserMenuOpen(false)} />
            <div className="glass-card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, padding: 8, zIndex: 40 }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button className="sidebar-link" onClick={() => { navigate('/dashboard/user'); setUserMenuOpen(false); }} style={{ width: '100%' }}>
                <i className="fas fa-user-gear" /> <span>Painel</span>
              </button>
              <button className="sidebar-link" onClick={() => { navigate('/settings'); setUserMenuOpen(false); }} style={{ width: '100%' }}>
                <i className="fas fa-cog" /> <span>Definições</span>
              </button>
              <button className="sidebar-link" onClick={() => { onLogout(); setUserMenuOpen(false); }} style={{ width: '100%', color: '#f87171' }}>
                <i className="fas fa-sign-out-alt" /> <span>Sair</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
