import { useState } from 'react'
import type { Role } from '../../../hooks/useAuth'

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  joinedAt: string
}

const MOCK_USERS: UserRow[] = [
  { id: 'u1', name: 'Admin ManuGent', email: 'admin@manugent.pt', role: 'admin', active: true, joinedAt: '2025-01-15' },
  { id: 'u2', name: 'Gestor Silva', email: 'gestor@manugent.pt', role: 'gestor', active: true, joinedAt: '2025-03-10' },
  { id: 'u3', name: 'Técnico Costa', email: 'tecnico@manugent.pt', role: 'tecnico', active: true, joinedAt: '2025-06-01' },
  { id: 'u4', name: 'Cliente Demo', email: 'cliente@demo.pt', role: 'cliente', active: false, joinedAt: '2025-08-20' },
]

const ROLE_COLORS: Record<Role, string> = { admin: '#6366f1', gestor: '#06b6d4', tecnico: '#10b981', cliente: '#f59e0b' }

export function UsersManager() {
  const [users] = useState(MOCK_USERS)
  const [search, setSearch] = useState('')
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Utilizadores ({users.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="glass-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." style={{ width: 200, fontSize: 13 }} />
          <button className="btn btn-primary" style={{ fontSize: 13 }}><i className="fas fa-plus" /> Novo utilizador</button>
        </div>
      </div>
      <div className="admin-table-wrap glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead><tr><th>Nome</th><th>Email</th><th>Role</th><th>Estado</th><th>Registo</th><th></th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span className="badge" style={{ background: ROLE_COLORS[u.role] + '20', color: ROLE_COLORS[u.role], fontSize: 12 }}>{u.role}</span></td>
                <td><span className={`badge badge-${u.active ? 'success' : 'secondary'}`}>{u.active ? 'Ativo' : 'Inativo'}</span></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.joinedAt}</td>
                <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }}><i className="fas fa-pen" /></button><button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 8px', color: '#f87171' }}><i className="fas fa-ban" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
