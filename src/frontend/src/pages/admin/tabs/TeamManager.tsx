import { useState, useEffect } from 'react'

type TM = { id: string; name: string; role: string; bio: string; image: string; order: number }

export function TeamManager() {
  const [members, setMembers] = useState<TM[]>([])
  const [editing, setEditing] = useState<TM | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/team').then(r => r.json()).then(d => { setMembers(d.members || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const save = async (updated: TM[]) => {
    await fetch('/api/admin/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ members: updated }) })
  }

  const handleSave = () => {
    if (!editing) return
    const u = editing.id ? members.map(m => m.id === editing.id ? editing : m) : [...members, { ...editing, id: 'new-' + Date.now() }]
    setMembers(u); save(u); setEditing(null)
  }

  if (loading) return <div className="admin-section"><p>A carregar...</p></div>

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>CEO / Equipa</h2>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setEditing({ id: '', name: '', role: '', bio: '', image: '', order: members.length + 1 })}><i className="fas fa-plus" /> Adicionar</button>
      </div>
      <div className="admin-cards-grid">
        {members.map(m => (
          <div key={m.id} className="glass-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{m.name.charAt(0)}</div>
            <div style={{ flex: 1 }}><p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{m.name}</p><p style={{ fontSize: 13, color: 'var(--accent)', margin: '2px 0' }}>{m.role}</p><p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{m.bio}</p></div>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 8px' }} onClick={() => setEditing(m)}><i className="fas fa-pen" /></button>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 8px', color: '#f87171' }} onClick={() => { const u = members.filter(x => x.id !== m.id); setMembers(u); save(u) }}><i className="fas fa-trash" /></button>
          </div>
        ))}
      </div>
      {editing && <div className="glass-card" style={{ marginTop: 16, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{editing.id ? 'Editar' : 'Novo'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label>Nome</label><input className="glass-input" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} style={{ width: '100%' }} /></div>
          <div><label>Cargo</label><input className="glass-input" value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })} style={{ width: '100%' }} /></div>
          <div style={{ gridColumn: '1/-1' }}><label>Bio</label><textarea className="glass-input" rows={3} value={editing.bio} onChange={e => setEditing({ ...editing, bio: e.target.value })} style={{ width: '100%' }} /></div>
          <div><label>Ordem</label><input className="glass-input" type="number" value={editing.order} onChange={e => setEditing({ ...editing, order: Number(e.target.value) })} style={{ width: '100%' }} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button className="btn btn-primary" onClick={handleSave}><i className="fas fa-save" /> Guardar</button><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button></div>
      </div>}
    </div>
  )
}