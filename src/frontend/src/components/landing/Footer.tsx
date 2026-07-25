const FOOTER_GROUPS = [
  {
    title: 'Produto',
    links: [
      { label: 'Funcionalidades', href: '#features' },
      { label: 'Módulos CMMS', href: '#modules' },
      { label: 'Agente IA', href: '#ai' },
      { label: 'Preços', href: '#pricing' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Documentação', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Base de conhecimento', href: '#' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Carreiras', href: '#' },
      { label: 'Contacto', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacidade', href: '#' },
      { label: 'Termos', href: '#' },
      { label: 'GDPR', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
]

const SOCIAL_LINKS = [
  { label: 'LinkedIn', short: 'in', href: '#' },
  { label: 'GitHub', short: 'gh', href: '#' },
  { label: 'X / Twitter', short: 'x', href: '#' },
]

export function Footer() {
  return (
    <footer className="l-footer">
      <div className="l-footer-orb l-footer-orb-1" aria-hidden="true" />
      <div className="l-footer-orb l-footer-orb-2" aria-hidden="true" />

      <div className="l-footer-top">
        <div className="l-footer-brand">
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" height="36" />
          <p>
            Plataforma CMMS inteligente com agente IA integrado para equipas de
            manutenção industrial que precisam de precisão, velocidade e controlo.
          </p>
          <div className="l-footer-status">
            <span className="l-footer-status-dot" />
            Sistema IA operacional
          </div>
          <div className="l-footer-socials">
            {SOCIAL_LINKS.map(link => (
              <a key={link.label} href={link.href} aria-label={link.label}>
                {link.short}
              </a>
            ))}
          </div>
        </div>

        <div className="l-footer-newsletter">
          <span className="l-footer-eyebrow">ManuGent Insights</span>
          <h3>Manutenção mais inteligente, todas as semanas.</h3>
          <p>Recebe novidades de IA, CMMS e boas práticas para operações industriais.</p>
          <a href="mailto:contacto@manugent.ai" className="l-footer-newsletter-cta">
            Receber novidades <span>→</span>
          </a>
        </div>
      </div>

      <div className="l-footer-grid">
        {FOOTER_GROUPS.map(group => (
          <div className="l-footer-column" key={group.title}>
            <h4>{group.title}</h4>
            {group.links.map(link => (
              <a href={link.href} key={link.label}>{link.label}</a>
            ))}
          </div>
        ))}
      </div>

      <div className="l-footer-bottom">
        <span>© 2026 ManuGent. Todos os direitos reservados.</span>
        <span className="l-footer-bottom-links">
          <a href="#">Segurança</a>
          <a href="#">Estado</a>
          <span>Feito com 💜 em Portugal</span>
        </span>
      </div>
    </footer>
  )
}