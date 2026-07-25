const FOOTER_GROUPS = [
  {
    title: 'Produto',
    links: [
      { label: 'Funcionalidades', href: '#features' },
      { label: 'Preços', href: '#pricing' },
      { label: 'Documentação', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Carreiras', href: '#' },
      { label: 'Contacto', href: '#' },
      { label: 'Parceiros', href: '#' },
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
  { label: 'LinkedIn', icon: 'fab fa-linkedin-in', href: '#' },
  { label: 'GitHub', icon: 'fab fa-github', href: '#' },
  { label: 'X / Twitter', icon: 'fab fa-x-twitter', href: '#' },
]

export function Footer() {
  return (
    <footer className="l-footer">
      {/* Top row: brand + newsletter */}
      <div className="l-footer-top">
        <div className="l-footer-brand">
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" height="30" />
          <p>
            Plataforma CMMS inteligente com agente IA integrado.
            Manutenção industrial do futuro, hoje.
          </p>
          <div className="l-footer-socials">
            {SOCIAL_LINKS.map(link => (
              <a key={link.label} href={link.href} aria-label={link.label} target="_blank" rel="noopener noreferrer">
                <i className={link.icon} />
              </a>
            ))}
          </div>
        </div>

        <div className="l-footer-links-grid">
          {FOOTER_GROUPS.map(group => (
            <div className="l-footer-column" key={group.title}>
              <h4>{group.title}</h4>
              {group.links.map(link => (
                <a href={link.href} key={link.label}>{link.label}</a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="l-footer-bottom">
        <span>© 2026 ManuGent. Todos os direitos reservados.</span>
        <span>Feito com 💜 em Portugal</span>
      </div>
    </footer>
  )
}
