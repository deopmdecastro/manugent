import { useState, useEffect } from 'react'

type DI = { id: string; type: 'doc' | 'faq'; title: { pt: string; en: string }; content: { pt: string; en: string }; order: number }

export function ContentManager() {
  const [items, setItems] = useState<DI[]>([])
  const [tab, setTab] = useState<'doc' | 'faq'>('doc')
  const [editing, setEditing] = useState<DI | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/content').then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const save = async (u: DI[]) => { await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: u }) }) }

  const handleSave = () => {
    if (!editing) return
    const u = items.find(i => i.id === editing.id) ? items.map(i => i.id === editing.id ? editing : i) : [...items, { ...editing, id: editing.type + '-' + Date.now() }]
    setItems(u); save(u); setEditing(null)
  }

  const filtered = items.filter(i => i.type === tab)
  if (loading) return <div className="admin-section"><p>A carregar...</p></div>

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}><h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Docs & FAQ</h2><button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setEditing({ id: '', type: tab, title: { pt: '', en: '' }, content: { pt: '', en: '' }, order: filtered.length + 1 })}><i className="fas fa-plus" /> Novo</button></div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>{(['doc','faq'] as const).map(t => (<button key={t} className={`badge ${tab===t?'badge-primary':''}`} onClick={() => setTab(t)} style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 13, border: tab===t?undefined:'1px solid var(--border)', background: tab===t?undefined:'transparent', color: tab===t?undefined:'var(--text-muted)', borderRadius: 'var(--radius)' }}>{t==='doc'?'Documentos':'FAQ'}</button>))}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(i => (<div key={i.id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}><div style={{ flex: 1 }}><strong style={{ fontSize: 15 }}>{i.title.pt}</strong><p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{i.content.pt.slice(0,120)}...</p></div><button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => setEditing(i)}><i className="fas fa-pen" /> Editar</button><button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: '#f87171' }} onClick={() => { const u = items.filter(x => x.id!==i.id); setItems(u); save(u) }}><i className="fas fa-trash" /></button></div>))}
      </div>
      {editing && <div className="glass-card" style={{ marginTop: 16, padding: 24 }}><h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{editing.id?'Editar':'Novo'}</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div style={{ gridColumn: '1/-1' }}><label>Tipo</label><select className="glass-input" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as 'doc'|'faq' })} style={{ width: '100%' }}><option value="doc">Documento</option><option value="faq">FAQ</option></select></div><div><label>Título (PT)</label><input className="glass-input" value={editing.title.pt} onChange={e => setEditing({ ...editing, title: { ...editing.title, pt: e.target.value } })} style={{ width: '100%' }} /></div><div><label>Título (EN)</label><input className="glass-input" value={editing.title.en} onChange={e => setEditing({ ...editing, title: { ...editing.title, en: e.target.value } })} style={{ width: '100%' }} /></div><div><label>Conteúdo (PT)</label><textarea className="glass-input" rows={4} value={editing.content.pt} onChange={e => setEditing({ ...editing, content: { ...editing.content, pt: e.target.value } })} style={{ width: '100%' }} /></div><div><label>Conteúdo (EN)</label><textarea className="glass-input" rows={4} value={editing.content.en} onChange={e => setEditing({ ...editing, content: { ...editing.content, en: e.target.value } })} style={{ width: '100%' }} /></div></div><div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button className="btn btn-primary" onClick={handleSave}><i className="fas fa-save" /> Guardar</button><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button></div></div>}
    </div>
  )
}