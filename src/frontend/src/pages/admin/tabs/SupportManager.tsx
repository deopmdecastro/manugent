import { useState } from 'react'

type Ticket = {
  id: string; user: string; subject: string
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

const MOCK_TICKETS: Ticket[] = [
  { id: 't-1', user: 'Técnico Costa', subject: 'Erro ao gerar relatório PDF', status: 'open', priority: 'high', createdAt: '2026-08-01 10:23' },
  { id: 't-2', user: 'Cliente Demo', subject: 'Dúvida sobre acesso à plataforma', status: 'in_progress', priority: 'medium', createdAt: '2026-07-31 14:15' },
  { id: 't-3', user: 'Gestor Silva', subject: 'Sugestão: novo campo em OTs', status: 'resolved', priority: 'low', createdAt: '2026-07-28 09:00' },
]

const STATUS_COLORS = { open: '#f59e0b', in_progress: '#6366f1', resolved: '#10b981' }
const STATUS_LABELS = { open: 'Aberto', in_progress: 'Em progresso', resolved: 'Resolvido' }

export function SupportManager() {
  const [tickets] = useState(MOCK_TICKETS)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Suporte</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all','open','in_progress','resolved'] as const).map(f => (
            <button key={f} className={`badge ${filter === f ? 'badge-primary' : ''}`} onClick={() => setFilter(f)}
              style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12, border: filter === f ? undefined : '1px solid var(--border)', background: filter === f ? undefined : 'transparent', color: filter === f ? undefined : 'var(--text-muted)', borderRadius: 'var(--radius)', transition: 'all 0.2s' }}>
              {f === 'all' ? 'Todos' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-table-wrap glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Utilizador</th><th>Assunto</th><th>Prioridade</th><th>Estado</th><th>Data</th><th></th></tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{t.id}</td>
                <td>{t.user}</td><td>{t.subject}</td>
                <td><span className="badge" style={{ background: t.priority === 'high' ? '#f8717120' : t.priority === 'medium' ? '#f59e0b20' : '#10b98120', color: t.priority === 'high' ? '#f87171' : t.priority === 'medium' ? '#f59e0b' : '#10b981', fontSize: 12 }}>{t.priority}</span></td>
                <td><span className="badge" style={{ background: STATUS_COLORS[t.status] + '20', color: STATUS_COLORS[t.status], fontSize: 12 }}>{STATUS_LABELS[t.status]}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.createdAt}</td>
                <td><button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }}><i className="fas fa-reply" /> Responder</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
