import { Link } from 'react-router-dom'

const STATS = [
  { label: 'Páginas', value: 18, sub: 'Páginas publicadas no site', status: 'Conteúdo ativo', icon: 'fas fa-file-lines', tint: 'purple' },
  { label: 'Utilizadores', value: 4, sub: 'Contas com acesso à plataforma', status: 'Base ativa', icon: 'fas fa-users', tint: 'green' },
  { label: 'Posts Blog', value: 6, sub: 'Artigos publicados', status: 'Blog ativo', icon: 'fas fa-newspaper', tint: 'blue' },
  { label: 'Idiomas', value: 2, sub: 'Traduções disponíveis', status: 'Sincronizado', icon: 'fas fa-language', tint: 'amber' },
]

const TINTS: Record<string, { bg: string; color: string; dot: string }> = {
  purple: { bg: 'rgba(124,58,237,0.2)', color: '#C4B5FD', dot: '#a78bfa' },
  green: { bg: 'rgba(16,185,129,0.18)', color: '#6EE7B7', dot: '#34d399' },
  blue: { bg: 'rgba(99,102,241,0.18)', color: '#93C5FD', dot: '#60a5fa' },
  amber: { bg: 'rgba(245,158,11,0.18)', color: '#FCD34D', dot: '#fbbf24' },
}

const SECTIONS = [
  { to: '/superadmin/landing', label: 'Landing Page', desc: 'Editar hero, features, stats, CTA, footer', icon: 'fas fa-palette', color: '#6366f1' },
  { to: '/superadmin/team', label: 'CEO / Equipa', desc: 'Gerir membros, bios, fotos, cargos', icon: 'fas fa-user-tie', color: '#06b6d4' },
  { to: '/superadmin/users', label: 'Utilizadores', desc: 'Criar, editar, roles, permissões', icon: 'fas fa-users-gear', color: '#10b981' },
  { to: '/superadmin/ai', label: 'Configuração IA', desc: 'Provedor, modelo e estado do Agente IA', icon: 'fas fa-robot', color: '#a855f7' },
  { to: '/superadmin/support', label: 'Suporte', desc: 'Tickets, mensagens, chat IA', icon: 'fas fa-headset', color: '#f59e0b' },
  { to: '/superadmin/blog', label: 'Blog', desc: 'Criar/editar artigos, categorias', icon: 'fas fa-newspaper', color: '#8b5cf6' },
  { to: '/superadmin/content', label: 'Docs & FAQ', desc: 'Documentação e perguntas frequentes', icon: 'fas fa-file-lines', color: '#ec4899' },
  { to: '/superadmin/languages', label: 'Idiomas', desc: 'Gerir traduções e novos idiomas', icon: 'fas fa-language', color: '#f97316' },
]

export function SuperAdminOverview() {
  return (
    <div className="admin-overview">
      <div className="admin-stats-grid">
        {STATS.map(s => {
          const t = TINTS[s.tint]
          return (
            <div key={s.label} className="admin-metric-card">
              <div className="admin-metric-card__header">
                <span className="admin-metric-card__label">{s.label}</span>
                <span className="admin-metric-card__icon" style={{ background: t.bg, color: t.color }}>
                  <i className={s.icon} />
                </span>
              </div>
              <div className="admin-metric-card__value">{s.value}</div>
              <p className="admin-metric-card__sub">{s.sub}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '999px', background: t.dot, boxShadow: `0 0 8px ${t.dot}` }} />
                {s.status}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Gestão rápida</h3>
        <div className="admin-quick-links">
          {SECTIONS.map(s => (
            <Link key={s.to} to={s.to} className="admin-card admin-quick-link" style={{ padding: '20px 24px', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={s.icon} style={{ color: s.color, fontSize: 18 }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0, color: 'var(--text-primary)' }}>{s.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
