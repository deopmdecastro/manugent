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
import { SuperAdminOverview } from './tabs/SuperAdminOverview'

const SECTIONS = [
  { id: '',             label: 'Visão Geral',  icon: 'fas fa-gauge-high',       component: SuperAdminOverview },
  { id: 'landing',      label: 'Landing Page',  icon: 'fas fa-palette',          component: LandingManager },
  { id: 'team',         label: 'CEO / Equipa',  icon: 'fas fa-user-tie',         component: TeamManager },
  { id: 'users',        label: 'Utilizadores',  icon: 'fas fa-users-gear',       component: UsersManager },
  { id: 'support',      label: 'Suporte',       icon: 'fas fa-headset',          component: SupportManager },
  { id: 'blog',         label: 'Blog',          icon: 'fas fa-newspaper',        component: BlogManager },
  { id: 'content',      label: 'Docs & FAQ',    icon: 'fas fa-file-lines',       component: ContentManager },
  { id: 'languages',    label: 'Idiomas',       icon: 'fas fa-language',         component: LanguageManager },
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

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="admin-sidebar-brand">
          <Link to="/superadmin">
            <img src="/app/assets/icon_manugent.png" alt="ManuGent" style={{ height: 32 }} />
          </Link>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: 14 }}>SuperAdmin</span>}
        </div>
        <nav className="admin-sidebar-nav">
          {SECTIONS.map(s => (
            <Link
              key={s.id}
              to={`/superadmin/${s.id}`}
              className={`admin-sidebar-link${location.pathname === `/superadmin/${s.id}` ? ' active' : ''}`}
              title={collapsed ? s.label : undefined}
            >
              <i className={s.icon} />
              {!collapsed && <span>{s.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={() => setCollapsed(!collapsed)} className="admin-sidebar-collapse" aria-label="Toggle sidebar">
            <i className={`fas fa-angles-${collapsed ? 'right' : 'left'}`} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Painel SuperAdmin</p>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '2px 0 0' }}>{currentSection.label}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/landing" className="btn btn-ghost" style={{ fontSize: 13 }}>
              <i className="fas fa-arrow-left" /> Site
            </Link>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <i className="fas fa-circle" style={{ color: 'var(--accent-green)', fontSize: 8, marginRight: 4 }} />
              {user?.name}
            </span>
          </div>
        </header>
        <div className="admin-content">
          <Routes>
            <Route index element={<SuperAdminOverview />} />
            <Route path="landing" element={<LandingManager />} />
            <Route path="team" element={<TeamManager />} />
            <Route path="users" element={<UsersManager />} />
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
