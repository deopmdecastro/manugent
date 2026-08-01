import { useState } from 'react'

type DocItem = {
  id: string
  type: 'doc' | 'faq'
  title: { pt: string; en: string }
  content: { pt: string; en: string }
  order: number
}

const MOCK_DOCS: DocItem[] = [
  { id: 'doc-1', type: 'doc', title: { pt: 'Introdução ao CMMS', en: 'Introduction to CMMS' }, content: { pt: 'Um CMMS (Computerized Maintenance Management System) é uma plataforma que centraliza...', en: 'A CMMS is a platform that centralizes...' }, order: 1 },
  { id: 'doc-2', type: 'doc', title: { pt: 'Primeiros Passos', en: 'Getting Started' }, content: { pt: 'Para começar com o ManuGent...', en: 'To get started with ManuGent...' }, order: 2 },
  { id: 'faq-1', type: 'faq', title: { pt: 'Como criar uma OT?', en: 'How to create a work order?' }, content: { pt: 'Vai ao menu Ordens de Trabalho e clica em Nova OT.', en: 'Go to Work Orders menu and click New Work Order.' }, order: 1 },
  { id: 'faq-2', type: 'faq', title: { pt: 'Que planos existem?', en: 'What plans are available?' }, content: { pt: 'Temos planos Starter, Pro e Enterprise.', en: 'We have Starter, Pro, and Enterprise plans.' }, order: 2 },
]

export function ContentManager() {
  const [items, setItems] = useState(MOCK_DOCS)
  const [tab, setTab] = useState<'docs' | 'faq'>('docs')
  const [editing, setEditing] = useState<DocItem | null>(null)
  const filtered = items.filter(i => i.type === tab)

  const handleSave = () => {
    if (!editing) return
    if (items.find(i => i.id === editing.id)) {
      setItems(prev => prev.map(i => i.id === editing.id ? editing : i))
    } else {
      setItems(prev => [...prev, { ...editing, id: editing.type + '-' + Date.now() }])
    }
    setEditing(null)
  }

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Docs & FAQ</h2>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setEditing({ id: '', type: tab, title: { pt: '', en: '' }, content: { pt: '', en: '' }, order: filtered.length + 1 })}>
          <i className="fas fa-plus" /> Novo {tab === 'docs' ? 'documento' : 'FAQ'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['docs','faq'] as const).map(t => (
          <button key={t} className={`badge ${tab === t ? 'badge-primary' : ''}`} onClick={() => setTab(t)}
            style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 13, border: tab === t ? undefined : '1px solid var(--border)', background: tab === t ? undefined : 'transparent', color: tab === t ? undefined : 'var(--text-muted)', borderRadius: 'var(--radius)' }}>
            {t === 'docs' ? '📄 Documentação' : '❓ FAQ'}
          </button>
        ))}
      </div>

      <div className="admin-cards-grid" style={{ gridTemplateColumns: '1fr' }}>
        {filtered.map(i => (
          <div key={i.id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 15 }}>{i.title.pt}</strong>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{i.content.pt.slice(0, 120)}...</p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => setEditing(i)}><i className="fas fa-pen" /> Editar</button>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: '#f87171' }} onClick={() => setItems(prev => prev.filter(x => x.id !== i.id))}><i className="fas fa-trash" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="glass-card" style={{ marginTop: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{editing.id ? 'Editar' : 'Novo'} {editing.type === 'docs' ? 'documento' : 'FAQ'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Tipo</label>
              <select className="glass-input" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as 'doc' | 'faq' })} style={{ width: '100%' }}>
                <option value="doc">Documento</option><option value="faq">FAQ</option>
              </select>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título (PT)</label><input className="glass-input" value={editing.title.pt} onChange={e => setEditing({ ...editing, title: { ...editing.title, pt: e.target.value } })} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título (EN)</label><input className="glass-input" value={editing.title.en} onChange={e => setEditing({ ...editing, title: { ...editing.title, en: e.target.value } })} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Conteúdo (PT)</label><textarea className="glass-input" rows={4} value={editing.content.pt} onChange={e => setEditing({ ...editing, content: { ...editing.content, pt: e.target.value } })} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Conteúdo (EN)</label><textarea className="glass-input" rows={4} value={editing.content.en} onChange={e => setEditing({ ...editing, content: { ...editing.content, en: e.target.value } })} style={{ width: '100%' }} /></div>
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
