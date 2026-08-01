import { useState, useEffect } from 'react'
import { authHeaders } from '../../../hooks/useAuth'

type LS = { id: string; label: string; status: 'published' | 'draft'; lastModified: string; fields: number }

export function LandingManager() {
  const [sections, setSections] = useState<LS[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/landing', { headers: authHeaders() }).then(r => r.json()).then(d => { setSections(d.sections || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const toggle = async (id: string) => {
    const u = sections.map(s => s.id === id ? { ...s, status: s.status === 'published' ? 'draft' as const : 'published' as const, lastModified: new Date().toISOString().slice(0, 10) } : s)
    setSections(u)
    await fetch('/api/admin/landing', { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ sections: u }) })
  }

  if (loading) return <div className="admin-section"><p>A carregar...</p></div>

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div><h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Landing Page</h2><p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Toggle estado com clique. Dados persistidos via API.</p></div>
      </div>
      <div className="admin-table-wrap admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead><tr><th>Secção</th><th>Estado</th><th>Campos</th><th>Modificado</th><th></th></tr></thead>
          <tbody>
            {sections.map(s => (
              <tr key={s.id}>
                <td><strong>{s.label}</strong></td>
                <td><button onClick={() => toggle(s.id)} className={`badge badge-${s.status === 'published' ? 'success' : 'warning'}`} style={{ cursor: 'pointer', border: 'none', fontSize: 12 }}>{s.status === 'published' ? 'Publicado' : 'Rascunho'}</button></td>
                <td>{s.fields}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.lastModified}</td>
                <td><button className="btn btn-ghost" onClick={() => setSelected(s.id === selected ? null : s.id)} style={{ fontSize: 13 }}><i className="fas fa-pen" /> Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <div className="admin-card" style={{ marginTop: 16, padding: 24 }}><h3><i className="fas fa-pen" /> {sections.find(s => s.id === selected)?.label}</h3><p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dados em /data/superadmin/landing.json via API</p></div>}
    </div>
  )
}