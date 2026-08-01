import { useState } from 'react'

type LanguageRow = {
  code: string
  label: string
  flag: string
  active: boolean
  translatedPages: number
  totalPages: number
}

const MOCK_LANGUAGES: LanguageRow[] = [
  { code: 'pt', label: 'Português', flag: '🇵🇹', active: true, translatedPages: 18, totalPages: 18 },
  { code: 'en', label: 'English', flag: '🇬🇧', active: true, translatedPages: 18, totalPages: 18 },
  { code: 'es', label: 'Español', flag: '🇪🇸', active: false, translatedPages: 12, totalPages: 18 },
  { code: 'fr', label: 'Français', flag: '🇫🇷', active: false, translatedPages: 8, totalPages: 18 },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', active: false, translatedPages: 3, totalPages: 18 },
]

export function LanguageManager() {
  const [languages] = useState(MOCK_LANGUAGES)
  const [adding, setAdding] = useState(false)
  const [newLang, setNewLang] = useState({ code: '', label: '', flag: '' })

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Idiomas</h2>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setAdding(true)}>
          <i className="fas fa-plus" /> Adicionar idioma
        </button>
      </div>

      <div className="admin-cards-grid">
        {languages.map(l => (
          <div key={l.code} className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{l.flag}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{l.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{l.code}</p>
              </div>
              <span className={`badge badge-${l.active ? 'success' : 'secondary'}`}>{l.active ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${(l.translatedPages / l.totalPages) * 100}%`, height: '100%', background: l.translatedPages === l.totalPages ? 'var(--accent-green)' : 'var(--accent)', borderRadius: 6, transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {l.translatedPages} / {l.totalPages} páginas traduzidas ({Math.round((l.translatedPages / l.totalPages) * 100)}%)
            </p>
            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }}><i className="fas fa-pen" /> Editar traduções</button>
              {!l.active && <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 10px' }}><i className="fas fa-check" /> Ativar</button>}
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <div className="glass-card" style={{ marginTop: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Novo idioma</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Código (ISO)</label><input className="glass-input" value={newLang.code} onChange={e => setNewLang({ ...newLang, code: e.target.value })} placeholder="pt, en, es..." style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Nome</label><input className="glass-input" value={newLang.label} onChange={e => setNewLang({ ...newLang, label: e.target.value })} placeholder="Português" style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Bandeira (emoji)</label><input className="glass-input" value={newLang.flag} onChange={e => setNewLang({ ...newLang, flag: e.target.value })} placeholder="🇵🇹" style={{ width: '100%' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => setAdding(false)}><i className="fas fa-plus" /> Criar e começar a traduzir</button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
