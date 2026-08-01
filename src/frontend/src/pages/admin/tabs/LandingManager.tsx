import { useState } from 'react'

type LandingSection = {
  id: string
  label: string
  status: 'published' | 'draft'
  lastModified: string
  fields: number
}

const MOCK_SECTIONS: LandingSection[] = [
  { id: 'hero', label: 'Hero Section', status: 'published', lastModified: '2026-08-01', fields: 12 },
  { id: 'stats', label: 'Stats Bar', status: 'published', lastModified: '2026-07-31', fields: 8 },
  { id: 'features', label: 'Features Grid', status: 'published', lastModified: '2026-08-01', fields: 6 },
  { id: 'testimonials', label: 'Testemunhos', status: 'draft', lastModified: '2026-07-30', fields: 5 },
  { id: 'cta', label: 'CTA Section', status: 'published', lastModified: '2026-07-29', fields: 4 },
  { id: 'footer', label: 'Footer', status: 'published', lastModified: '2026-08-01', fields: 10 },
]

export function LandingManager() {
  const [sections] = useState(MOCK_SECTIONS)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Landing Page</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Edita cada secao da landing page.</p>
        </div>
        <button className="btn btn-primary" style={{ fontSize: 13 }}><i className="fas fa-eye" /> Pre-visualizar</button>
      </div>
      <div className="admin-table-wrap glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead><tr><th>Seccao</th><th>Estado</th><th>Campos</th><th>Modificado</th><th></th></tr></thead>
          <tbody>
            {sections.map(s => (
              <tr key={s.id} onClick={() => setSelected(s.id === selected ? null : s.id)} style={{ cursor: 'pointer' }}>
                <td><strong>{s.label}</strong></td>
                <td><span className={`badge badge-${s.status === 'published' ? 'success' : 'warning'}`}>{s.status === 'published' ? 'Publicado' : 'Rascunho'}</span></td>
                <td>{s.fields}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.lastModified}</td>
                <td><button className="btn btn-ghost" style={{ fontSize: 13, padding: '4px 10px' }}><i className="fas fa-pen" /> Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="glass-card" style={{ marginTop: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <i className="fas fa-pen" style={{ marginRight: 8 }} /> A editar: {sections.find(s => s.id === selected)?.label}
          </h3>
          <div style={{ background: 'rgba(99,102,241,0.04)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--text-muted)' }}>
              <i className="fas fa-info-circle" /> As traducoes estao em <strong>src/frontend/src/i18n/landing.ts</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
