import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const OPENINGS = [
  { title: 'Engenheiro/a de Software Full-Stack', team: 'Produto', location: 'Lisboa · Híbrido' },
  { title: 'Engenheiro/a de Machine Learning', team: 'IA', location: 'Remoto (Portugal)' },
  { title: 'Customer Success Manager', team: 'Clientes', location: 'Lisboa' },
  { title: 'Account Executive', team: 'Vendas', location: 'Porto · Híbrido' },
  { title: 'Product Designer', team: 'Produto', location: 'Remoto (Portugal)' },
]

const PERKS = [
  { icon: 'fa-house-laptop', title: 'Trabalho flexível', desc: 'Modelo híbrido ou remoto, consoante a função.' },
  { icon: 'fa-graduation-cap', title: 'Orçamento de formação', desc: 'Apoio anual para cursos, livros e conferências.' },
  { icon: 'fa-heart-pulse', title: 'Saúde e bem-estar', desc: 'Seguro de saúde e apoio à saúde mental.' },
  { icon: 'fa-umbrella-beach', title: 'Férias sem limites rígidos', desc: 'Confiamos na tua gestão de tempo.' },
]

export function CareersPage() {
  return (
    <StaticPageLayout
      badge="Carreiras"
      title="Ajuda-nos a reinventar a manutenção industrial"
      desc="Somos uma equipa pequena e ambiciosa a construir a próxima geração de software de manutenção. Vem construir connosco."
      narrow={false}
    >
      <h2>Porquê trabalhar no ManuGent</h2>
      <div className="static-card-grid">
        {PERKS.map(p => (
          <div className="static-card" key={p.title}>
            <div className="static-card-icon"><i className={`fas ${p.icon}`} /></div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        ))}
      </div>

      <h2>Vagas abertas</h2>
      {OPENINGS.map(job => (
        <div className="static-job-row" key={job.title}>
          <div className="static-job-info">
            <h3>{job.title}</h3>
            <div className="static-job-meta">
              <span><i className="fas fa-diagram-project" /> {job.team}</span>
              <span><i className="fas fa-location-dot" /> {job.location}</span>
            </div>
          </div>
          <a href="#" className="l-btn l-btn-ghost l-btn-sm">Candidatar-me</a>
        </div>
      ))}

      <p style={{ marginTop: '32px' }}>
        Não encontras a vaga certa? <Link to="/contacto" className="static-inline-link">Contacta-nos</Link> na
        mesma — estamos sempre curiosos por conhecer pessoas talentosas.
      </p>
    </StaticPageLayout>
  )
}
