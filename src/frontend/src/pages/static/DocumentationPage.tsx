import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'
import { DOC_GUIDES } from '../../data/docGuides'

export function DocumentationPage() {
  return (
    <StaticPageLayout
      badge="Documentação"
      title="Tudo o que precisas para tirar partido do ManuGent"
      desc="Guias passo-a-passo, referência técnica e boas práticas para configurar e operar a plataforma."
      narrow={false}
    >
      <div className="static-card-grid">
        {DOC_GUIDES.map(guide => (
          <div className="static-card" key={guide.slug}>
            <div className="static-card-icon"><i className={`fas ${guide.icon}`} /></div>
            <h3>{guide.title}</h3>
            <p>{guide.desc}</p>
            <Link to={`/documentacao/${guide.slug}`} className="static-card-link">Ler guia <i className="fas fa-arrow-right" /></Link>
          </div>
        ))}
      </div>

      <h2>Sobre esta documentação</h2>
      <p>
        A documentação do ManuGent está organizada por área funcional para que encontres rapidamente
        o que precisas, quer estejas a configurar a plataforma pela primeira vez, quer estejas à procura
        de um pormenor específico de uma funcionalidade avançada.
      </p>
      <p>
        Se procuras informação sobre integrações programáticas e endpoints, consulta a{' '}
        <Link to="/api-docs" className="static-inline-link">referência da API</Link>. Para acompanhar novidades
        e alterações recentes à plataforma, visita o{' '}
        <Link to="/changelog" className="static-inline-link">changelog</Link>.
      </p>

      <h2>Precisas de ajuda adicional?</h2>
      <p>
        A nossa equipa de suporte está disponível para esclarecer dúvidas técnicas ou ajudar na configuração
        inicial da tua organização.
      </p>
      <Link to="/contacto" className="static-inline-link">Falar com a equipa de suporte →</Link>
    </StaticPageLayout>
  )
}
