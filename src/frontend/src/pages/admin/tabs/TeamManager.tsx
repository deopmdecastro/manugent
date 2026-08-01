import { useState } from 'react'

type TeamMember = {
  id: string
  name: string
  role: string
  bio: string
  image: string
  order: number
}

const MOCK_TEAM: TeamMember[] = [
  { id: 'ceo-1', name: 'João Silva', role: 'CEO & Fundador', bio: 'Mais de 20 anos em manutenção industrial.', image: '', order: 1 },
  { id: 'cto-1', name: 'Maria Costa', role: 'CTO', bio: 'Especialista em IA e sistemas distribuídos.', image: '', order: 2 },
  { id: 'coo-1', name: 'Pedro Santos', role: 'COO', bio: 'Gestão operacional e qualidade.', image: '', order: 3 },
]

export function TeamManager() {
  const [members, setMembers] = useState(MOCK_TEAM)
  const [editing, setEditing] = useState<TeamMember | null>(null)

  const handleSave = () => {
    if (!editing) return
    if (editing.id) {
      setMembers(prev => prev.map(m => m.id === editing.id ? editing : m))
    } else {
      setMembers(prev => [...prev, { ...editing, id: 'new-' + Date.now() }])
    }
    setEditing(null)
  }

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>CEO / Equipa</h2>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setEditing({ id: '', name: '', role: '', bio: '', image: '', order: members.length + 1 })}>
          <i className="fas fa-plus" /> Adicionar membro
        </button>
      </div>

      <div className="admin-cards-grid">
        {members.map(m => (
          <div key={m.id} className="glass-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
              {m.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{m.name}</p>
              <p style={{ fontSize: 13, color: 'var(--accent)', margin: '2px 0' }}>{m.role}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{m.bio}</p>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 8px' }} onClick={() => setEditing(m)}><i className="fas fa-pen" /></button>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 8px', color: '#f87171' }} onClick={() => setMembers(prev => prev.filter(x => x.id !== m.id))}><i className="fas fa-trash" /></button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="glass-card" style={{ marginTop: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{editing.id ? 'Editar membro' : 'Novo membro'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Nome</label><input className="glass-input" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Nome completo" style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Cargo</label><input className="glass-input" value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })} placeholder="CEO, CTO, etc." style={{ width: '100%' }} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Bio</label><textarea className="glass-input" rows={3} value={editing.bio} onChange={e => setEditing({ ...editing, bio: e.target.value })} placeholder="Breve descrição..." style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Ordem</label><input className="glass-input" type="number" value={editing.order} onChange={e => setEditing({ ...editing, order: Number(e.target.value) })} style={{ width: '100%' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave}><i className="fas fa-save" /> Guardar</button>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
