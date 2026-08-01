import { useState, useEffect } from 'react'
import { authHeaders } from '../../../hooks/useAuth'

type LR = { code: string; label: string; flag: string; active: boolean; translatedPages: number; totalPages: number }

export function LanguageManager() {
  const [langs, setLangs] = useState<LR[]>([])
  const [adding, setAdding] = useState(false)
  const [nl, setNl] = useState({ code: '', label: '', flag: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/languages', { headers: authHeaders() }).then(r => r.json()).then(d => { setLangs(d.languages || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const save = async (u: LR[]) => { await fetch('/api/admin/languages', { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ languages: u }) }) }

  const toggle = (code: string) => { const u = langs.map(l => l.code === code ? { ...l, active: !l.active } : l); setLangs(u); save(u) }
  const add = () => { if (!nl.code || !nl.label) return; const u = [...langs, { ...nl, active: true, translatedPages: 0, totalPages: 18 }]; setLangs(u); save(u); setAdding(false); setNl({ code: '', label: '', flag: '' }) }

  if (loading) return <div className="admin-section"><p>A carregar...</p></div>

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}><h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Idiomas</h2><button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setAdding(true)}><i className="fas fa-plus" /> Adicionar</button></div>
      <div className="admin-cards-grid">
        {langs.map(l => (<div key={l.code} className="admin-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><span style={{ fontSize: 28 }}>{l.flag}</span><div style={{ flex: 1 }}><p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{l.label}</p><p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{l.code}</p></div><span className={`badge badge-${l.active ? 'success' : 'secondary'}`}>{l.active ? 'Ativo' : 'Inativo'}</span></div>
          <div style={{ background: 'var(--border)', borderRadius: 6, height: 6, overflow: 'hidden' }}><div style={{ width: (l.translatedPages/l.totalPages)*100+'%', height: '100%', background: l.translatedPages===l.totalPages?'var(--accent-green)':'var(--accent)', borderRadius: 6 }} /></div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{l.translatedPages}/{l.totalPages} ({Math.round(l.translatedPages/l.totalPages*100)}%)</p>
          <div style={{ display: 'flex', gap: 4, marginTop: 12 }}><button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }}><i className="fas fa-pen" /> Editar</button><button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: l.active?'#f87171':'var(--accent-green)' }} onClick={() => toggle(l.code)}>{l.active?<><i className="fas fa-ban" /> Desativar</>:<><i className="fas fa-check" /> Ativar</>}</button></div>
        </div>))}
      </div>
      {adding && <div className="admin-card" style={{ marginTop: 16, padding: 24 }}><h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Novo idioma</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}><div><label>Código</label><input className="glass-input" value={nl.code} onChange={e => setNl({ ...nl, code: e.target.value })} placeholder="pt" style={{ width: '100%' }} /></div><div><label>Nome</label><input className="glass-input" value={nl.label} onChange={e => setNl({ ...nl, label: e.target.value })} placeholder="Português" style={{ width: '100%' }} /></div><div><label>Bandeira</label><input className="glass-input" value={nl.flag} onChange={e => setNl({ ...nl, flag: e.target.value })} placeholder="🇵🇹" style={{ width: '100%' }} /></div></div><div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button className="btn btn-primary" onClick={add}><i className="fas fa-plus" /> Criar</button><button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancelar</button></div></div>}
    </div>
  )
}