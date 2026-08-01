import { useState, useEffect } from 'react'

type BP = { slug: string; title: { pt: string; en: string }; excerpt: { pt: string; en: string }; category: string; status: 'published' | 'draft'; date: string; readTime: string }

export function BlogManager() {
  const [posts, setPosts] = useState<BP[]>([])
  const [editing, setEditing] = useState<BP | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/blog').then(r => r.json()).then(d => { setPosts(d.posts || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const save = async (u: BP[]) => { await fetch('/api/admin/blog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ posts: u }) }) }

  const handleSave = () => {
    if (!editing) return
    const u = posts.find(p => p.slug === editing.slug) ? posts.map(p => p.slug === editing.slug ? editing : p) : [...posts, editing]
    setPosts(u); save(u); setEditing(null)
  }

  if (loading) return <div className="admin-section"><p>A carregar...</p></div>

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Blog ({posts.length})</h2>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setEditing({ slug: '', title: { pt: '', en: '' }, excerpt: { pt: '', en: '' }, category: '', status: 'draft', date: new Date().toISOString().slice(0, 10), readTime: '1 min' })}><i className="fas fa-plus" /> Novo</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posts.map(p => (
          <div key={p.slug} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><strong style={{ fontSize: 15 }}>{p.title.pt}</strong><span className={`badge badge-${p.status === 'published' ? 'success' : 'warning'}`}>{p.status === 'published' ? 'Publicado' : 'Rascunho'}</span></div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{p.excerpt.pt}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}><span><i className="fas fa-folder" /> {p.category}</span><span><i className="fas fa-calendar" /> {p.date}</span><span><i className="fas fa-clock" /> {p.readTime}</span></div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => setEditing(p)}><i className="fas fa-pen" /> Editar</button>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: '#f87171' }} onClick={() => { const u = posts.filter(x => x.slug !== p.slug); setPosts(u); save(u) }}><i className="fas fa-trash" /></button>
          </div>
        ))}
      </div>
      {editing && <div className="glass-card" style={{ marginTop: 16, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{posts.find(p => p.slug === editing.slug) ? 'Editar' : 'Novo artigo'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}><label>Slug</label><input className="glass-input" value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} style={{ width: '100%' }} /></div>
          <div><label>Título (PT)</label><input className="glass-input" value={editing.title.pt} onChange={e => setEditing({ ...editing, title: { ...editing.title, pt: e.target.value } })} style={{ width: '100%' }} /></div>
          <div><label>Título (EN)</label><input className="glass-input" value={editing.title.en} onChange={e => setEditing({ ...editing, title: { ...editing.title, en: e.target.value } })} style={{ width: '100%' }} /></div>
          <div><label>Excerto (PT)</label><textarea className="glass-input" rows={2} value={editing.excerpt.pt} onChange={e => setEditing({ ...editing, excerpt: { ...editing.excerpt, pt: e.target.value } })} style={{ width: '100%' }} /></div>
          <div><label>Excerto (EN)</label><textarea className="glass-input" rows={2} value={editing.excerpt.en} onChange={e => setEditing({ ...editing, excerpt: { ...editing.excerpt, en: e.target.value } })} style={{ width: '100%' }} /></div>
          <div><label>Categoria</label><input className="glass-input" value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} style={{ width: '100%' }} /></div>
          <div><label>Estado</label><select className="glass-input" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} style={{ width: '100%' }}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button className="btn btn-primary" onClick={handleSave}><i className="fas fa-save" /> Guardar</button><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button></div>
      </div>}
    </div>
  )
}