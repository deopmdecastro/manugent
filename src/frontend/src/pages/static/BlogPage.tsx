import { StaticPageLayout } from '../../components/static/StaticPageLayout'

const POSTS = [
  {
    category: 'Produto',
    title: 'Como o agente de IA do ManuGent diagnostica avarias em segundos',
    excerpt: 'Um olhar por dentro do modelo que combina histórico de manutenção com sinais em tempo real para sugerir a causa raiz de uma avaria.',
    date: '18 jul 2026',
    readTime: '6 min',
  },
  {
    category: 'Boas práticas',
    title: 'MTBF, MTTR e OEE: os três indicadores que toda a equipa de manutenção devia acompanhar',
    excerpt: 'Explicamos o que significam estes indicadores, como calculá-los corretamente e como usá-los para melhorar a fiabilidade dos equipamentos.',
    date: '2 jul 2026',
    readTime: '8 min',
  },
  {
    category: 'Casos de cliente',
    title: 'Como uma fábrica reduziu o tempo de paragem em 34% com ordens de serviço inteligentes',
    excerpt: 'Um estudo de caso sobre a implementação do ManuGent numa linha de produção com múltiplos turnos.',
    date: '14 jun 2026',
    readTime: '5 min',
  },
  {
    category: 'Produto',
    title: 'Manutenção offline: como o ManuGent funciona sem rede na fábrica',
    excerpt: 'Explicamos a arquitetura PWA que permite à equipa continuar a trabalhar mesmo sem cobertura de rede.',
    date: '29 mai 2026',
    readTime: '4 min',
  },
  {
    category: 'Indústria',
    title: 'O que muda na manutenção industrial com a chegada da IA generativa',
    excerpt: 'Uma análise das tendências que estão a moldar o futuro da manutenção preditiva e corretiva.',
    date: '9 mai 2026',
    readTime: '7 min',
  },
  {
    category: 'Boas práticas',
    title: 'NFC vs. QR code: qual a melhor forma de identificar os teus ativos?',
    excerpt: 'Comparamos as duas tecnologias e damos recomendações práticas para diferentes tipos de instalação.',
    date: '20 abr 2026',
    readTime: '5 min',
  },
]

export function BlogPage() {
  return (
    <StaticPageLayout
      badge="Blog"
      title="Novidades e boas práticas de manutenção"
      desc="Artigos sobre produto, indústria e boas práticas de gestão de manutenção, escritos pela equipa ManuGent."
      narrow={false}
    >
      <div className="static-blog-grid">
        {POSTS.map(post => (
          <a href="#" className="static-blog-card" key={post.title} style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="static-blog-category">{post.category}</span>
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
            <div className="static-blog-meta">{post.date} · {post.readTime} de leitura</div>
          </a>
        ))}
      </div>
    </StaticPageLayout>
  )
}
