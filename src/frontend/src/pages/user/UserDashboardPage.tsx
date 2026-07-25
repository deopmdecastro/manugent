import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { MetricCard } from '../../components/ui/MetricCard'

type TabKey = 'overview' | 'activity' | 'team' | 'notifications'

export function UserDashboardPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('overview')

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Visão geral', icon: 'fas fa-th-large' },
    { key: 'activity', label: 'Atividade', icon: 'fas fa-clock' },
    { key: 'team', label: 'Equipa', icon: 'fas fa-users' },
    { key: 'notifications', label: 'Notificações', icon: 'fas fa-bell' },
  ]

  return (
    <div className="page-stack animate-fade-in" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="user-dashboard-header glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div className="user-avatar">
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=80`} alt="" style={{ width: 72, height: 72, borderRadius: 20 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p className="eyebrow" style={{ marginBottom: 2 }}>{user?.role === 'admin' ? 'Administrador' : user?.role === 'gestor' ? 'Gestor' : user?.role === 'tecnico' ? 'Técnico' : 'Cliente'}</p>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{user?.name || 'Utilizador'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{user?.email} {user?.teamName ? `· ${user.teamName}` : ''}</p>
          </div>
          <button className="btn btn-secondary">
            <i className="fas fa-pen" /> Editar perfil
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="user-tabs" style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`user-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 'var(--radius)', border: 'none',
              background: tab === t.key ? 'var(--glass-bg)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <MetricCard label="OTs Concluídas" value={47} icon="fas fa-check-circle" trend={{ value: 12, label: 'este mês' }} />
            <MetricCard label="Tempo Total" value="128h" icon="fas fa-clock" />
            <MetricCard label="Eficiência" value="96%" icon="fas fa-bullseye" trend={{ value: 4, label: 'vs último mês' }} />
            <MetricCard label="Avaliação" value="4.8" icon="fas fa-star" />
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Competências</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Elétrica', 'Mecânica', 'AVAC', 'Automação', 'Soldadura', 'Instrumentação', 'Segurança'].map((skill) => (
                <span key={skill} className="badge badge-primary" style={{ padding: '6px 14px', fontSize: 13 }}>{skill}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'activity' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Atividade Recente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: 'fas fa-check-circle', color: '#10b981', title: 'OT #1042 concluída', desc: 'Preventiva mensal — Compressor A3', time: 'Hoje, 10:30' },
              { icon: 'fas fa-clock', color: '#f59e0b', title: 'OT #1043 em progresso', desc: 'Inspeção de vibração nos rolamentos', time: 'Hoje, 09:15' },
              { icon: 'fas fa-file-pdf', color: '#6366f1', title: 'Relatório gerado', desc: 'Intervenção Bomba Principal — PDF', time: 'Ontem, 16:45' },
              { icon: 'fas fa-star', color: '#8b5cf6', title: 'Avaliação recebida', desc: 'Cliente Demo avaliou com 5 estrelas', time: 'Ontem, 14:20' },
              { icon: 'fas fa-user-plus', color: '#06b6d4', title: 'Adicionado à equipa', desc: 'Equipa Manutenção — Linha 1', time: 'Segunda-feira' },
            ].map((item, i) => (
              <div key={i} className="animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 'var(--radius)', background: 'rgba(99,102,241,0.04)', animationDelay: `${i * 0.05}s` }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--radius)', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={item.icon} style={{ color: item.color, fontSize: 16 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.desc}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Membros da Equipa</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Admin ManuGent', role: 'Administrador', status: 'online' },
              { name: 'Gestor Silva', role: 'Gestor de Operações', status: 'online' },
              { name: 'Técnico Costa', role: 'Técnico Sénior', status: 'away' },
              { name: 'Técnica Pereira', role: 'Técnica de Campo', status: 'offline' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 'var(--radius)', background: 'rgba(99,102,241,0.04)' }}>
                <div style={{ position: 'relative' }}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=6366f1&color=fff&size=44`} alt="" style={{ width: 44, height: 44, borderRadius: 'var(--radius)' }} />
                  <span style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--bg-card)', background: m.status === 'online' ? '#10b981' : m.status === 'away' ? '#f59e0b' : '#475569' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{m.role}</div>
                </div>
                <span className="badge badge-primary" style={{ fontSize: 11 }}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Notificações</h3>
            <button className="btn btn-ghost" style={{ fontSize: 13 }}>Marcar todas como lidas</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: 'fas fa-wrench', title: 'Nova OT atribuída', desc: 'OT #1045 — Inspeção trimestral Chiller B2', time: 'Agora', unread: true },
              { icon: 'fas fa-clock', title: 'Prazo a aproximar-se', desc: 'OT #1042 deve ser concluída até amanhã', time: '2h atrás', unread: true },
              { icon: 'fas fa-check-circle', title: 'OT concluída', desc: 'OT #1040 — Ronda AVAC concluída com sucesso', time: '5h atrás', unread: false },
              { icon: 'fas fa-star', title: 'Nova avaliação', desc: 'Cliente Demo deu 5 estrelas à tua intervenção', time: '1d atrás', unread: false },
            ].map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 'var(--radius)', background: n.unread ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--radius)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={n.icon} style={{ color: 'var(--accent-light)', fontSize: 16 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.unread ? 700 : 500, fontSize: 14 }}>{n.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{n.desc}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{n.time}</span>
                {n.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
