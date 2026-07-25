export function Footer() {
  return (
    <footer className="l-footer">
      <div className="l-footer-grid">
        <div className="l-footer-brand">
          <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" height="30" />
          <p>
            Plataforma CMMS inteligente com agente IA integrado.
            Manutenção industrial do futuro, hoje.
          </p>
          <div className="l-footer-socials">
            <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in" /></a>
            <a href="#" aria-label="GitHub"><i className="fab fa-github" /></a>
            <a href="#" aria-label="Twitter"><i className="fab fa-twitter" /></a>
          </div>
        </div>
        <div>
          <h4>Produto</h4>
          <a href="#features">Funcionalidades</a>
          <a href="#pricing">Preços</a>
          <a href="#">Documentação</a>
          <a href="#">API</a>
          <a href="#">Changelog</a>
        </div>
        <div>
          <h4>Empresa</h4>
          <a href="#">Sobre</a>
          <a href="#">Blog</a>
          <a href="#">Carreiras</a>
          <a href="#">Contacto</a>
          <a href="#">Parceiros</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="#">Privacidade</a>
          <a href="#">Termos</a>
          <a href="#">GDPR</a>
          <a href="#">Cookies</a>
        </div>
      </div>
      <div className="l-footer-bottom">
        <span>© 2026 ManuGent. Todos os direitos reservados.</span>
        <span>Feito com 💜 em Portugal</span>
      </div>
    </footer>
  )
}
