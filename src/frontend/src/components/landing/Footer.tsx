import { Link } from 'react-router-dom'

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
  { label: 'LinkedIn', icon: 'linkedin', href: '#' },
  { label: 'GitHub', icon: 'github', href: '#' },
  { label: 'X / Twitter', icon: 'twitter', href: '#' },
]

function SocialIcon({ icon }: { icon: string }) {
  if (icon === 'linkedin') return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 12.5 2h-9zM5 5.5h1.5V11H5V5.5zm.75-1a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zM8 5.5h1.5v.75c.25-.45.85-.85 1.6-.75.65.1 1.15.7 1.15 1.6V11H10.5V8.25c0-.45-.3-.75-.75-.75s-.75.3-.75.75V11H8V5.5z"/></svg>
  if (icon === 'github') return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 0 0-2.21 13.64c.35.07.48-.15.48-.33v-1.17c-1.96.42-2.37-1.04-2.37-1.04-.32-.81-.78-1.03-.78-1.03-.64-.44.05-.43.05-.43.7.05 1.07.72 1.07.72.63 1.07 1.64.76 2.04.58.06-.45.24-.76.44-.94-1.55-.18-3.18-.78-3.18-3.46 0-.76.27-1.39.72-1.88-.07-.18-.31-.89.07-1.85 0 0 .58-.19 1.9.72a6.56 6.56 0 0 1 3.46 0c1.32-.9 1.9-.72 1.9-.72.38.96.14 1.67.07 1.85.45.49.72 1.12.72 1.88 0 2.69-1.63 3.28-3.19 3.45.25.22.47.64.47 1.3v1.92c0 .18.13.4.48.33A7 7 0 0 0 8 1z"/></svg>
  if (icon === 'twitter') return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9.52 6.76 14.47 1H13.3L8.99 6 5.65 1H1.2l5.2 7.56L1.2 15h1.17l4.55-5.28 3.63 5.28h4.45L9.52 6.76zM7.83 8.86l-.53-.75L2.78 1.9h1.78l3.4 4.85.53.76 4.4 6.3h-1.78l-3.6-5.15z"/></svg>
  return null
}

export function Footer() {
  return (
    <footer className="l-footer">
      {/* Top row: brand + newsletter */}
      <div className="l-footer-top">
        <div className="l-footer-brand">
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" height="40" />
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
        <span className="l-footer-badge l-footer-version"><i className="fas fa-circle" /> v2.0.0</span>
        <span className="l-footer-copyright">© {new Date().getFullYear()} ManuGent. Todos os direitos reservados.</span>
        <span className="l-footer-badge l-footer-secure"><i className="fas fa-circle-check" /> Seguro e protegido</span>
      </div>
    </footer>
  )
}
