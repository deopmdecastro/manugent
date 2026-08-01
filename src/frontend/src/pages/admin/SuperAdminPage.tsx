import { useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LandingManager } from './tabs/LandingManager'
import { TeamManager } from './tabs/TeamManager'
import { UsersManager } from './tabs/UsersManager'
import { SupportManager } from './tabs/SupportManager'
import { BlogManager } from './tabs/BlogManager'
import { ContentManager } from './tabs/ContentManager'
import { LanguageManager } from './tabs/LanguageManager'
import { AIConfigManager } from './tabs/AIConfigManager'
import { SuperAdminOverview } from './tabs/SuperAdminOverview'

const SECTIONS = [
  { id: '',             label: 'Visão Geral',   icon: 'fas fa-gauge-high',       component: SuperAdminOverview },
  { id: 'landing',      label: 'Landing Page',  icon: 'fas fa-palette',          component: LandingManager,   group: 'Site' },
  { id: 'team',         label: 'CEO / Equipa',  icon: 'fas fa-user-tie',         component: TeamManager,      group: 'Site' },
  { id: 'blog',         label: 'Blog',          icon: 'fas fa-newspaper',        component: BlogManager,      group: 'Site' },
  { id: 'content',      label: 'Docs & FAQ',    icon: 'fas fa-file-lines',       component: ContentManager,   group: 'Site' },
  { id: 'languages',    label: 'Idiomas',       icon: 'fas fa-language',         component: LanguageManager,  group: 'Site' },
  { id: 'users',        label: 'Utilizadores',  icon: 'fas fa-users-gear',       component: UsersManager,     group: 'Plataforma' },
  { id: 'ai',           label: 'Configuração IA', icon: 'fas fa-robot',          component: AIConfigManager,  group: 'Plataforma' },
  { id: 'support',      label: 'Suporte',       icon: 'fas fa-headset',          component: SupportManager,   group: 'Plataforma' },
]

export function SuperAdminPage() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  if (user?.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <i className="fas fa-shield-haltered" style={{ fontSize: 48, color: '#f87171' }} />
        <h2>Acesso Restrito</h2>
        <p>Apenas administradores podem aceder ao painel de superadmin.</p>
        <Link to="/landing" className="btn btn-primary">Voltar ao site</Link>
      </div>
    )
  }

  const currentSection = SECTIONS.find(s => location.pathname === `/superadmin/${s.id}`) || SECTIONS[0]
  const initial = (user?.name || 'A').charAt(0).toUpperCase()

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="admin-sidebar-brand">
          <Link to="/superadmin">
            <img src="/app/assets/icon_manugent.png" alt="ManuGent" style={{ height: 32 }} />
            {!collapsed && <span className="admin-sidebar-brand-name">SuperAdmin</span>}
          </Link>
        </div>

        <div className="admin-sidebar-user-card">
          <div className="admin-sidebar-user-label">Plataforma</div>
          <div className="admin-sidebar-user-row">
            <div className="admin-sidebar-avatar">{initial}</div>
            <div className="admin-sidebar-user-meta">
              <div className="admin-sidebar-user-name">{user?.name}</div>
              <div className="admin-sidebar-user-email">{user?.email}</div>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {SECTIONS.map((s, i) => {
            const prevGroup = i > 0 ? SECTIONS[i - 1].group : undefined
            const showLabel = !collapsed && s.group && s.group !== prevGroup
            return (
              <div key={s.id}>
                {showLabel && <div className="admin-sidebar-section-label">{s.group}</div>}
                <Link
                  to={`/superadmin/${s.id}`}
                  className={`admin-sidebar-link${location.pathname === `/superadmin/${s.id}` ? ' active' : ''}`}
                  title={collapsed ? s.label : undefined}
                >
                  <i className={s.icon} />
                  <span>{s.label}</span>
                </Link>
              </div>
            )
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/landing" className="admin-sidebar-link" title={collapsed ? 'Voltar ao site' : undefined}>
            <i className="fas fa-arrow-left" />
            <span>Voltar ao site</span>
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="admin-sidebar-collapse" aria-label="Toggle sidebar">
            <i className={`fas fa-angles-${collapsed ? 'right' : 'left'}`} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="admin-topbar-pill">
              <i className="fas fa-shield-halved" /> SuperAdmin
            </span>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-secondary)' }}>{currentSection.label}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="admin-topbar-icon-btn" aria-label="Pesquisar"><i className="fas fa-search" /></button>
            <button className="admin-topbar-icon-btn" aria-label="Notificações"><i className="fas fa-bell" /></button>
            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">{initial}</div>
            </div>
          </div>
        </header>
        <div className="admin-content">
          <Routes>
            <Route index element={<SuperAdminOverview />} />
            <Route path="landing" element={<LandingManager />} />
            <Route path="team" element={<TeamManager />} />
            <Route path="users" element={<UsersManager />} />
            <Route path="ai" element={<AIConfigManager />} />
            <Route path="support" element={<SupportManager />} />
            <Route path="blog" element={<BlogManager />} />
            <Route path="content" element={<ContentManager />} />
            <Route path="languages" element={<LanguageManager />} />
            <Route path="*" element={<Navigate to="/superadmin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
