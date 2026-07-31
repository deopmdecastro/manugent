import { Link, Navigate, useParams } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'
import { DOC_GUIDES, getDocGuideBySlug } from '../../data/docGuides'

export function DocGuidePage() {
  const { slug } = useParams<{ slug: string }>()
  const guide = getDocGuideBySlug(slug)

  if (!guide) {
    return <Navigate to="/documentacao" replace />
  }

  const otherGuides = DOC_GUIDES.filter(g => g.slug !== guide.slug)
  const currentIndex = DOC_GUIDES.findIndex(g => g.slug === guide.slug)
  const nextGuide = DOC_GUIDES[(currentIndex + 1) % DOC_GUIDES.length]

  return (
    <StaticPageLayout
      badge="Documentação"
      title={guide.title}
      desc={guide.desc}
    >
      <p className="static-doc-breadcrumb">
        <Link to="/documentacao" className="static-inline-link">Documentação</Link> / {guide.title}
      </p>

      {guide.intro.map((p, i) => <p key={i}>{p}</p>)}

      <nav className="static-doc-toc" aria-label="Nesta página">
        <span className="static-doc-toc-label">Nesta página</span>
        <ul>
          {guide.sections.map(section => (
            <li key={section.heading}>
              <a href={`#${slugify(section.heading)}`}>{section.heading}</a>
            </li>
          ))}
        </ul>
      </nav>

      {guide.sections.map(section => (
        <section key={section.heading} id={slugify(section.heading)}>
          <h2>{section.heading}</h2>
          {section.body.map((p, i) => <p key={i}>{p}</p>)}
          {section.steps && (
            <ol className="static-doc-steps">
              {section.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          )}
        </section>
      ))}

      <div className="static-doc-next">
        <span>Guia seguinte</span>
        <Link to={`/documentacao/${nextGuide.slug}`} className="static-doc-next-link">
          <i className={`fas ${nextGuide.icon}`} />
          <span>{nextGuide.title}</span>
          <i className="fas fa-arrow-right" />
        </Link>
      </div>

      <h2>Outros guias</h2>
      <div className="static-card-grid">
        {otherGuides.map(g => (
          <div className="static-card" key={g.slug}>
            <div className="static-card-icon"><i className={`fas ${g.icon}`} /></div>
            <h3>{g.title}</h3>
            <p>{g.desc}</p>
            <Link to={`/documentacao/${g.slug}`} className="static-card-link">Ler guia <i className="fas fa-arrow-right" /></Link>
          </div>
        ))}
      </div>

      <p>
        Não encontraste o que procuravas? Consulta a{' '}
        <Link to="/api-docs" className="static-inline-link">referência da API</Link> ou{' '}
        <Link to="/contacto" className="static-inline-link">fala com a equipa de suporte</Link>.
      </p>
    </StaticPageLayout>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
