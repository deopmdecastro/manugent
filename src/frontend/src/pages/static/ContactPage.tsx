import { useState } from 'react'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <StaticPageLayout
      badge="Contacto"
      title="Fala com a nossa equipa"
      desc="Tens uma questão sobre o produto, preços ou uma parceria? Estamos aqui para ajudar."
      narrow={false}
    >
      <div className="static-contact-grid">
        <div>
          {sent ? (
            <div className="static-contact-info-card">
              <h3><i className="fas fa-circle-check" style={{ color: '#34d399' }} /> Mensagem enviada</h3>
              <p>Obrigado pelo contacto. A nossa equipa responde normalmente em menos de 24 horas úteis.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="contact-name">Nome</label>
                <div className="auth-input-group">
                  <i className="fas fa-user" />
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="O teu nome"
                    value={form.name}
                    onChange={handleChange('name')}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="contact-email">Email</label>
                <div className="auth-input-group">
                  <i className="fas fa-envelope" />
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="tu@empresa.pt"
                    value={form.email}
                    onChange={handleChange('email')}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="contact-company">Empresa</label>
                <div className="auth-input-group">
                  <i className="fas fa-building" />
                  <input
                    id="contact-company"
                    type="text"
                    placeholder="Nome da empresa (opcional)"
                    value={form.company}
                    onChange={handleChange('company')}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="contact-message">Mensagem</label>
                <div className="auth-input-group" style={{ alignItems: 'flex-start', padding: '12px 14px' }}>
                  <i className="fas fa-message" style={{ marginTop: '3px' }} />
                  <textarea
                    id="contact-message"
                    placeholder="Como podemos ajudar?"
                    value={form.message}
                    onChange={handleChange('message')}
                    required
                    rows={5}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', padding: '12px 0' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary auth-submit">
                <i className="fas fa-paper-plane" /> Enviar mensagem
              </button>
            </form>
          )}
        </div>

        <div>
          <div className="static-contact-info-card">
            <h3><i className="fas fa-envelope" /> Email</h3>
            <p>geral@manugent.pt</p>
          </div>
          <div className="static-contact-info-card">
            <h3><i className="fas fa-headset" /> Suporte</h3>
            <p>suporte@manugent.pt · resposta em menos de 24h úteis</p>
          </div>
          <div className="static-contact-info-card">
            <h3><i className="fas fa-handshake" /> Parcerias</h3>
            <p>parcerias@manugent.pt</p>
          </div>
          <div className="static-contact-info-card">
            <h3><i className="fas fa-location-dot" /> Sede</h3>
            <p>Lisboa, Portugal</p>
          </div>
        </div>
      </div>
    </StaticPageLayout>
  )
}
