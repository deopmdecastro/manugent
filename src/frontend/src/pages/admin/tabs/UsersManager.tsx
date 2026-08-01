import { useState, useEffect } from 'react'
import type { Role } from '../../../hooks/useAuth'

const COLORS: Record<Role, string> = { admin: '#6366f1', gestor: '#06b6d4', tecnico: '#10b981', cliente: '#f59e0b' }

export function UsersManager() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : (d.users || [])
      setUsers(list.map((u: any) => ({
        id: u.id, name: u.name, email: u.email, role: u.role || 'cliente',
        active: u.active !== false, joinedAt: u.created_at || u.joinedAt || '-'
      })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="admin-section"><p>A carregar utilizadores...</p></div>

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Utilizadores ({users.length})</h2>
        <input className="glass-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." style={{ width: 200, fontSize: 13 }} />
      </div>
      <div className="admin-table-wrap admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead><tr><th>Nome</th><th>Email</th><th>Role</th><th>Estado</th><th>Registo</th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span className="badge" style={{ background: COLORS[u.role as Role] + '20', color: COLORS[u.role as Role], fontSize: 12 }}>{u.role}</span></td>
                <td><span className={`badge badge-${u.active ? 'success' : 'secondary'}`}>{u.active ? 'Ativo' : 'Inativo'}</span></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}