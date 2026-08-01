import { useState } from 'react'

type BlogPost = {
  slug: string
  title: { pt: string; en: string }
  excerpt: { pt: string; en: string }
  category: string
  status: 'published' | 'draft'
  date: string
  readTime: string
}

const MOCK_POSTS: BlogPost[] = [
  { slug: 'manutencao-preditiva-ia', title: { pt: 'Manutenção Preditiva com IA', en: 'Predictive Maintenance with AI' }, excerpt: { pt: 'Como a IA está a revolucionar a manutenção industrial.', en: 'How AI is revolutionizing industrial maintenance.' }, category: 'Tecnologia', status: 'published', date: '2026-07-20', readTime: '5 min' },
  { slug: 'como-reduzir-custos-cmms', title: { pt: 'Como Reduzir Custos com CMMS', en: 'How to Reduce Costs with CMMS' }, excerpt: { pt: 'Estratégias práticas para reduzir custos operacionais.', en: 'Practical strategies to cut operational costs.' }, category: 'Gestão', status: 'published', date: '2026-07-15', readTime: '7 min' },
  { slug: 'seguranca-manutencao', title: { pt: 'Segurança na Manutenção em 2026', en: 'Maintenance Safety in 2026' }, excerpt: { pt: 'Normas atualizadas e melhores práticas.', en: 'Updated standards and best practices.' }, category: 'Segurança', status: 'draft', date: '2026-08-01', readTime: '4 min' },
]

export function BlogManager() {
  const [posts, setPosts] = useState(MOCK_POSTS)
  const [editing, setEditing] = useState<BlogPost | null>(null)

  const handleSave = () => {
    if (!editing) return
    if (posts.find(p => p.slug === editing.slug)) {
      setPosts(prev => prev.map(p => p.slug === editing.slug ? editing : p))
    } else {
      setPosts(prev => [...prev, editing])
    }
    setEditing(null)
  }

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Blog ({posts.length} artigos)</h2>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setEditing({ slug: '', title: { pt: '', en: '' }, excerpt: { pt: '', en: '' }, category: '', status: 'draft', date: new Date().toISOString().slice(0, 10), readTime: '1 min' })}>
          <i className="fas fa-plus" /> Novo artigo
        </button>
      </div>

      <div className="admin-cards-grid" style={{ gridTemplateColumns: '1fr' }}>
        {posts.map(p => (
          <div key={p.slug} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 15 }}>{p.title.pt}</strong>
                <span className={`badge badge-${p.status === 'published' ? 'success' : 'warning'}`}>{p.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{p.excerpt.pt}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <span><i className="fas fa-folder" /> {p.category}</span>
                <span><i className="fas fa-calendar" /> {p.date}</span>
                <span><i className="fas fa-clock" /> {p.readTime}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => setEditing(p)}><i className="fas fa-pen" /> Editar</button>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: '#f87171' }} onClick={() => setPosts(prev => prev.filter(x => x.slug !== p.slug))}><i className="fas fa-trash" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="glass-card" style={{ marginTop: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{editing.slug && posts.find(p => p.slug === editing.slug) ? 'Editar artigo' : 'Novo artigo'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Slug</label><input className="glass-input" value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="nome-do-artigo" style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título (PT)</label><input className="glass-input" value={editing.title.pt} onChange={e => setEditing({ ...editing, title: { ...editing.title, pt: e.target.value } })} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título (EN)</label><input className="glass-input" value={editing.title.en} onChange={e => setEditing({ ...editing, title: { ...editing.title, en: e.target.value } })} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Excerto (PT)</label><textarea className="glass-input" rows={2} value={editing.excerpt.pt} onChange={e => setEditing({ ...editing, excerpt: { ...editing.excerpt, pt: e.target.value } })} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Excerto (EN)</label><textarea className="glass-input" rows={2} value={editing.excerpt.en} onChange={e => setEditing({ ...editing, excerpt: { ...editing.excerpt, en: e.target.value } })} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Categoria</label><input className="glass-input" value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Estado</label><select className="glass-input" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as 'published' | 'draft' })} style={{ width: '100%' }}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></div>
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
