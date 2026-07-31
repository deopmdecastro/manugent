import { Link } from 'react-router-dom'
import { StaticPageLayout } from '../../components/static/StaticPageLayout'

export function AboutPage() {
  return (
    <StaticPageLayout
      badge="Sobre nós"
      title="Estamos a reinventar a manutenção industrial"
      desc="O ManuGent nasceu para dar às equipas de manutenção o mesmo nível de inteligência de dados que já existe noutras áreas da indústria."
    >
      <h2>A nossa missão</h2>
      <p>
        Acreditamos que o conhecimento técnico das equipas de manutenção é um dos ativos mais valiosos —
        e mais mal aproveitados — de qualquer organização industrial. O ManuGent transforma esse
        conhecimento numa plataforma inteligente que ajuda técnicos e gestores a tomar melhores decisões,
        todos os dias.
      </p>

      <h2>Como começámos</h2>
      <p>
        A equipa fundadora trabalhou anos em fábricas e instalações industriais e viu em primeira mão o
        mesmo problema repetir-se: informação crítica de manutenção espalhada por folhas de cálculo,
        cadernos e conhecimento tácito que se perde quando alguém muda de função. Construímos o ManuGent
        para resolver isso, combinando um CMMS robusto com um agente de inteligência artificial que
        aprende com cada intervenção.
      </p>

      <h2>Os nossos valores</h2>
      <ul>
        <li><strong>Fiabilidade em primeiro lugar</strong> — a manutenção industrial não tem margem para falhas.</li>
        <li><strong>Simplicidade</strong> — ferramentas poderosas não precisam de ser complicadas de usar.</li>
        <li><strong>Dados protegidos</strong> — segurança e privacidade são inegociáveis.</li>
        <li><strong>Perto das equipas</strong> — construímos com técnicos e gestores, não apenas para eles.</li>
      </ul>

      <h2>Junta-te a nós</h2>
      <p>
        Estamos sempre à procura de pessoas que queiram ajudar a transformar a manutenção industrial.
        Vê as <Link to="/carreiras" className="static-inline-link">vagas abertas</Link> ou{' '}
        <Link to="/contacto" className="static-inline-link">entra em contacto</Link> connosco.
      </p>
    </StaticPageLayout>
  )
}
