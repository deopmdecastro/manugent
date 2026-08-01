import { useState, useEffect } from 'react'
import { authHeaders } from '../../../hooks/useAuth'

type Ticket = { id: string; user: string; subject: string; status: 'open' | 'in_progress' | 'resolved'; priority: 'high' | 'medium' | 'low'; createdAt: string }
const SC = { open: '#f59e0b', in_progress: '#6366f1', resolved: '#10b981' }
const SL = { open: 'Aberto', in_progress: 'Em progresso', resolved: 'Resolvido' }

export function SupportManager() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/support', { headers: authHeaders() }).then(r => r.json()).then(d => {
      setTickets(d.tickets || d || [])
      setLoading(false)
    }).catch(() => {
      // Fallback mock if endpoint doesn't exist yet
      setTickets([
        { id: 't-1', user: 'Técnico Costa', subject: 'Erro ao gerar relatório PDF', status: 'open', priority: 'high', createdAt: '2026-08-01 10:23' },
        { id: 't-2', user: 'Cliente Demo', subject: 'Dúvida sobre acesso à plataforma', status: 'in_progress', priority: 'medium', createdAt: '2026-07-31 14:15' },
        { id: 't-3', user: 'Gestor Silva', subject: 'Sugestão: novo campo em OTs', status: 'resolved', priority: 'low', createdAt: '2026-07-28 09:00' },
      ])
      setLoading(false)
    })
  }, [])

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  if (loading) return <div className="admin-section"><p>A carregar tickets...</p></div>

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Suporte ({tickets.length} tickets)</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all','open','in_progress','resolved'] as const).map(f => (
            <button key={f} className={`badge ${filter === f ? 'badge-primary' : ''}`} onClick={() => setFilter(f)}
              style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12, border: filter === f ? undefined : '1px solid var(--border)', background: filter === f ? undefined : 'transparent', color: filter === f ? undefined : 'var(--text-muted)', borderRadius: 'var(--radius)' }}>
              {f === 'all' ? 'Todos' : SL[f]}
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
                <td><span className="badge" style={{ background: SC[t.status] + '20', color: SC[t.status], fontSize: 12 }}>{SL[t.status]}</span></td>
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