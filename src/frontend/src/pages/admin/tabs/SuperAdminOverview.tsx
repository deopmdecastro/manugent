import { Link } from 'react-router-dom'

const STATS = [
  { label: 'Páginas', value: 18, icon: 'fas fa-file-lines', color: 'var(--accent)' },
  { label: 'Utilizadores', value: 4, icon: 'fas fa-users', color: 'var(--accent-green)' },
  { label: 'Posts Blog', value: 6, icon: 'fas fa-newspaper', color: 'var(--accent-cyan)' },
  { label: 'Idiomas', value: 2, icon: 'fas fa-language', color: 'var(--accent-purple)' },
]

const SECTIONS = [
  { to: '/superadmin/landing', label: 'Landing Page', desc: 'Editar hero, features, stats, CTA, footer', icon: 'fas fa-palette', color: '#6366f1' },
  { to: '/superadmin/team', label: 'CEO / Equipa', desc: 'Gerir membros, bios, fotos, cargos', icon: 'fas fa-user-tie', color: '#06b6d4' },
  { to: '/superadmin/users', label: 'Utilizadores', desc: 'Criar, editar, roles, permissões', icon: 'fas fa-users-gear', color: '#10b981' },
  { to: '/superadmin/support', label: 'Suporte', desc: 'Tickets, mensagens, chat IA', icon: 'fas fa-headset', color: '#f59e0b' },
  { to: '/superadmin/blog', label: 'Blog', desc: 'Criar/editar artigos, categorias', icon: 'fas fa-newspaper', color: '#8b5cf6' },
  { to: '/superadmin/content', label: 'Docs & FAQ', desc: 'Documentação e perguntas frequentes', icon: 'fas fa-file-lines', color: '#ec4899' },
  { to: '/superadmin/languages', label: 'Idiomas', desc: 'Gerir traduções e novos idiomas', icon: 'fas fa-language', color: '#f97316' },
]

export function SuperAdminOverview() {
  return (
    <div className="admin-overview">
      <div className="admin-stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={s.icon} style={{ color: s.color, fontSize: 20 }} />
            </div>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Gestão rápida</h3>
        <div className="admin-quick-links">
          {SECTIONS.map(s => (
            <Link key={s.to} to={s.to} className="glass-card admin-quick-link" style={{ padding: '20px 24px', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={s.icon} style={{ color: s.color, fontSize: 18 }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0, color: 'var(--text)' }}>{s.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
