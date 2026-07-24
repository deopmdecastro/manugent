import { useState } from 'react'

const FEATURES = [
  { icon: 'fas fa-brain', title: 'Agente IA Inteligente', desc: 'Diagnóstico e recomendações em tempo real com GPT-4o e Llama 3. O teu especialista de manutenção sempre disponível.' },
  { icon: 'fas fa-wrench', title: 'Ordens de Trabalho', desc: 'CRUD completo com tracking de tempo, mudanças de estado automáticas e notificações inteligentes.' },
  { icon: 'fas fa-chart-line', title: 'KPIs em Tempo Real', desc: 'MTBF, MTTR, OEE e compliance num dashboard vivo. Toma decisões com dados, não com feeling.' },
  { icon: 'fas fa-qrcode', title: 'NFC & QR Codes', desc: 'Scan de equipamentos com o telemóvel. Acede ao histórico completo em segundos.' },
  { icon: 'fas fa-file-pdf', title: 'Relatórios Automáticos', desc: 'Geração de PDFs profissionais com um clique. Relatórios de intervenção prontos para o cliente.' },
  { icon: 'fas fa-mobile-screen', title: 'Mobile & Offline', desc: 'PWA completa. Funciona sem rede — sincroniza automaticamente quando voltas online.' },
]

const PLANS = [
  { name: 'Starter', price: 'Grátis', period: '', features: ['Até 50 equipamentos', '5 OTs/mês', 'IA modo local', '1 utilizador'], cta: 'Começar grátis', popular: false },
  { name: 'Pro', price: '€49', period: '/mês', features: ['Equipamentos ilimitados', 'OTs ilimitadas', 'IA OpenAI + Groq', '10 utilizadores', 'Portal do cliente', 'Relatórios PDF'], cta: 'Experimentar Pro', popular: true },
  { name: 'Enterprise', price: '€199', period: '/mês', features: ['Tudo no Pro', 'Utilizadores ilimitados', 'SSO e RBAC', 'API access', 'SLA 99.9%', 'Suporte 24/7'], cta: 'Falar connosco', popular: false },
]

export function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="landing">
      {/* ── Nav ── */}
      <nav className="landing-nav glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <div className="landing-nav-inner">
          <a href="#landing" className="landing-logo-link">
            <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" style={{ height: 32 }} />
          </a>
          <div className={`landing-nav-links${mobileMenu ? ' open' : ''}`}>
            <a href="#features" onClick={() => setMobileMenu(false)}>Funcionalidades</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)}>Planos</a>
            <a href="#footer" onClick={() => setMobileMenu(false)}>Contacto</a>
            <a href="#login" className="btn btn-secondary" style={{ padding: '8px 18px' }}>Entrar</a>
            <a href="#login" className="btn btn-primary" style={{ padding: '8px 18px' }}>Demo grátis</a>
          </div>
          <button className="landing-menu-btn icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
            <i className={`fas fa-${mobileMenu ? 'times' : 'bars'}`} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-content animate-fade-in-up">
          <span className="landing-hero-badge badge badge-primary">
            <i className="fas fa-bolt" style={{ marginRight: 6 }} /> v2.0 — IA Real integrada
          </span>
          <h1 className="landing-hero-title">
            Manutenção industrial
            <br />
            <span className="landing-hero-gradient">com inteligência artificial</span>
          </h1>
          <p className="landing-hero-subtitle">
            O CMMS que pensa contigo. Diagnóstico, planeamento e execução com IA em tempo real.
            Reduz paragens, aumenta a vida útil dos ativos e elimina papelada.
          </p>
          <div className="landing-hero-actions">
            <a href="#login" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 16 }}>
              <i className="fas fa-rocket" /> Começar agora
            </a>
            <a href="#features" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: 16 }}>
              <i className="fas fa-play" /> Ver demo
            </a>
          </div>
          <div className="landing-hero-stats">
            <div><strong>99.9%</strong><span>Uptime</span></div>
            <div><strong>+200</strong><span>Empresas</span></div>
            <div><strong>-40%</strong><span>Paragens</span></div>
            <div><strong>24/7</strong><span>Suporte IA</span></div>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-hero-mockup glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="landing-mockup-bar">
              <span className="landing-mockup-dot" style={{ background: '#ef4444' }} />
              <span className="landing-mockup-dot" style={{ background: '#f59e0b' }} />
              <span className="landing-mockup-dot" style={{ background: '#10b981' }} />
              <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-muted)' }}>ManuGent Dashboard</span>
            </div>
            <div style={{ padding: 20 }}>
              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                <div className="metric-card" style={{ padding: 14 }}>
                  <div><div className="metric-card-label">OTs Ativas</div><div className="metric-card-value" style={{ fontSize: 22 }}>12</div></div>
                  <i className="fas fa-wrench metric-card-icon" style={{ fontSize: 20 }} />
                </div>
                <div className="metric-card" style={{ padding: 14 }}>
                  <div><div className="metric-card-label">Equipamentos</div><div className="metric-card-value" style={{ fontSize: 22 }}>247</div></div>
                  <i className="fas fa-microchip metric-card-icon" style={{ fontSize: 20 }} />
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: i === 1 ? '#10b981' : i === 2 ? '#f59e0b' : '#6366f1' }} />
                    <span style={{ flex: 1 }}>OT #{1040 + i} — {['Preventiva concluída', 'Medição em curso', 'Corretiva aberta'][i-1]}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{['10m','28m','1h'][i-1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section">
        <div className="landing-section-header">
          <p className="eyebrow">Funcionalidades</p>
          <h2 className="landing-section-title">Tudo o que precisas para gerir manutenção</h2>
          <p className="landing-section-sub">Do diagnóstico à execução, uma plataforma que cobre o ciclo completo de manutenção industrial.</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className={`glass-card landing-feature-card animate-fade-in-up stagger-${i + 1}`} style={{ padding: 28 }}>
              <div className="landing-feature-icon">
                <i className={f.icon} />
              </div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="landing-section" style={{ background: 'rgba(99,102,241,0.03)' }}>
        <div className="landing-section-header">
          <p className="eyebrow">Planos</p>
          <h2 className="landing-section-title">Simples, transparente, sem surpresas</h2>
          <p className="landing-section-sub">Escolhe o plano ideal para a tua equipa. Todos incluem atualizações gratuitas.</p>
        </div>
        <div className="landing-pricing-grid">
          {PLANS.map((plan, i) => (
            <div key={i} className={`glass-card landing-pricing-card animate-fade-in-up stagger-${i + 1}${plan.popular ? ' popular' : ''}`}>
              {plan.popular && <div className="landing-pricing-popular">Mais popular</div>}
              <div className="landing-pricing-name">{plan.name}</div>
              <div className="landing-pricing-price">
                <strong>{plan.price}</strong>
                {plan.period && <span>{plan.period}</span>}
              </div>
              <ul className="landing-pricing-features">
                {plan.features.map((f, j) => (
                  <li key={j}><i className="fas fa-check-circle" /> {f}</li>
                ))}
              </ul>
              <a href="#login" className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section landing-cta">
        <div className="glass-card animate-fade-in-up" style={{ 
          padding: '60px 40px', textAlign: 'center', maxWidth: 700, margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid var(--border-glow)',
        }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 16 }}>
            Pronto para transformar a tua manutenção?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16, maxWidth: 480, margin: '0 auto 32px' }}>
            Começa hoje com o plano gratuito. Sem cartão de crédito. Sem compromisso.
          </p>
          <a href="#login" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: 16 }}>
            <i className="fas fa-rocket" /> Criar conta gratuita
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="footer" className="landing-footer">
        <div className="landing-footer-grid">
          <div>
            <img src="/app/assets/ManuGent_logo.png" alt="ManuGent" style={{ height: 28, marginBottom: 16 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 280 }}>
              Plataforma CMMS inteligente com agente IA integrado. Manutenção industrial do futuro, hoje.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <a href="#" className="icon-button" style={{ width: 36, height: 36, fontSize: 14 }}><i className="fab fa-linkedin-in" /></a>
              <a href="#" className="icon-button" style={{ width: 36, height: 36, fontSize: 14 }}><i className="fab fa-github" /></a>
              <a href="#" className="icon-button" style={{ width: 36, height: 36, fontSize: 14 }}><i className="fab fa-x-twitter" /></a>
            </div>
          </div>
          <div>
            <h4>Produto</h4>
            <a href="#features">Funcionalidades</a>
            <a href="#pricing">Planos</a>
            <a href="#">Documentação</a>
            <a href="#">API</a>
          </div>
          <div>
            <h4>Empresa</h4>
            <a href="#">Sobre</a>
            <a href="#">Blog</a>
            <a href="#">Carreiras</a>
            <a href="#">Contacto</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Privacidade</a>
            <a href="#">Termos</a>
            <a href="#">GDPR</a>
            <a href="#">Cookies</a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 ManuGent. Todos os direitos reservados.</span>
          <span>Feito com 💜 em Portugal</span>
        </div>
      </footer>
    </div>
  )
}
