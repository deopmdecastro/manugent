import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const CATEGORIES = [
  { icon: 'fa-rocket', title: 'Primeiros passos', desc: 'Criar conta, configurar a organização e convidar a equipa.' },
  { icon: 'fa-key', title: 'Conta e acesso', desc: 'Login, recuperação de password e permissões de utilizador.' },
  { icon: 'fa-boxes-stacked', title: 'Ativos e equipamentos', desc: 'Registar, editar e consultar o histórico de ativos.' },
  { icon: 'fa-screwdriver-wrench', title: 'Ordens de serviço', desc: 'Criar, atribuir e acompanhar ordens corretivas e preventivas.' },
  { icon: 'fa-robot', title: 'Agente de IA', desc: 'Como tirar o máximo partido do técnico digital.' },
  { icon: 'fa-credit-card', title: 'Faturação e planos', desc: 'Gerir subscrição, faturas e métodos de pagamento.' },
]

const FAQS = [
  {
    q: 'Como recupero o acesso se esquecer a minha password?',
    a: 'Na página de login, seleciona "Esqueci a password" e introduz o teu email. Vais receber instruções para criar uma nova password em poucos minutos.',
  },
  {
    q: 'Não tenho conta — como posso obter acesso ao ManuGent?',
    a: 'Se a tua empresa já usa o ManuGent, seleciona "Contacta o administrador" na página de login e o administrador da tua organização trata do teu acesso. Se a tua empresa ainda não usa o ManuGent, fala com a nossa equipa comercial.',
  },
  {
    q: 'O ManuGent funciona sem ligação à internet?',
    a: 'Sim. A aplicação móvel funciona como PWA e continua a registar ordens de serviço offline, sincronizando automaticamente quando a rede volta a estar disponível.',
  },
  {
    q: 'Posso integrar o ManuGent com o meu ERP?',
    a: 'Sim, através da nossa API REST. Consulta a documentação da API para conheceres os endpoints disponíveis.',
  },
  {
    q: 'Como posso mudar de plano ou cancelar a subscrição?',
    a: 'Podes gerir o teu plano e faturação nas definições da conta, ou contactar a nossa equipa de suporte para ajuda personalizada.',
  },
]

export function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <StaticPageLayout
      badge="Central de ajuda"
      title="Como podemos ajudar?"
      desc="Encontra respostas rápidas sobre a tua conta, a plataforma e as funcionalidades do ManuGent."
      narrow={false}
    >
      <h2>Por categoria</h2>
      <div className="static-card-grid">
        {CATEGORIES.map(c => (
          <div className="static-card" key={c.title}>
            <div className="static-card-icon"><i className={`fas ${c.icon}`} /></div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <h2>Perguntas frequentes</h2>
      {FAQS.map((faq, i) => (
        <div
          key={faq.q}
          style={{
            borderBottom: '1px solid var(--l-hairline-a)',
            padding: '18px 0',
            cursor: 'pointer',
          }}
          onClick={() => setOpenFaq(openFaq === i ? null : i)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>{faq.q}</h3>
            <i className={`fas fa-chevron-${openFaq === i ? 'up' : 'down'}`} style={{ color: 'var(--l-text-muted)', flexShrink: 0 }} />
          </div>
          {openFaq === i && <p style={{ marginTop: '12px' }}>{faq.a}</p>}
        </div>
      ))}

      <h2 style={{ marginTop: '48px' }}>Não encontraste o que procuravas?</h2>
      <p>
        A nossa equipa de suporte responde normalmente em menos de 24 horas úteis. Podes também consultar a{' '}
        <Link to="/documentacao" className="static-inline-link">documentação completa</Link>.
      </p>
      <Link to="/contacto" className="static-inline-link">Falar com o suporte →</Link>
    </StaticPageLayout>
  )
}
