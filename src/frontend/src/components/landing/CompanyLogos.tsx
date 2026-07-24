const COMPANIES = [
  { name: 'ENGIE', width: 90 },
  { name: 'Vallourec', width: 100 },
  { name: 'WEG', width: 70 },
  { name: 'VALE', width: 80 },
  { name: 'Petrobras', width: 100 },
  { name: 'ArcelorMittal', width: 110 },
]

export function CompanyLogos() {
  return (
    <section className="l-companies">
      <p className="l-companies-label">Empresas que confiam na ManuGent</p>
      <div className="l-companies-row">
        {COMPANIES.map(c => (
          <div key={c.name} className="l-company-logo" style={{ minWidth: c.width }}>
            {c.name}
          </div>
        ))}
      </div>
    </section>
  )
}
