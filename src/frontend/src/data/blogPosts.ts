export interface BlogPost {
  slug: string
  category: string
  title: string
  excerpt: string
  content: string[]
  author: string
  date: string
  readTime: string
  coverIcon: string
  coverGradient: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'agente-ia-diagnostico-avarias',
    category: 'Produto',
    title: 'Como o agente de IA do ManuGent diagnostica avarias em segundos',
    excerpt: 'Um olhar por dentro do modelo que combina histórico de manutenção com sinais em tempo real para sugerir a causa raiz de uma avaria.',
    content: [
      'Quando um técnico regista uma avaria, o agente de IA do ManuGent cruza de imediato o histórico do equipamento com sinais recolhidos em tempo real — leituras de sensores, últimas ordens de trabalho e padrões conhecidos de falha.',
      'Este cruzamento permite sugerir, em segundos, uma lista ordenada de causas prováveis, cada uma com um grau de confiança e as ações de diagnóstico recomendadas.',
      'O modelo aprende continuamente com o feedback dos técnicos: sempre que uma sugestão é confirmada ou rejeitada, o sistema ajusta os pesos usados nas previsões seguintes para aquele tipo de equipamento.',
      'O resultado é uma redução significativa do tempo médio de diagnóstico (MTTD), especialmente em equipamentos com histórico rico de manutenção.',
    ],
    author: 'Equipa ManuGent',
    date: '18 jul 2026',
    readTime: '6 min',
    coverIcon: 'fa-solid fa-brain',
    coverGradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  },
  {
    slug: 'mtbf-mttr-oee-indicadores',
    category: 'Boas práticas',
    title: 'MTBF, MTTR e OEE: os três indicadores que toda a equipa de manutenção devia acompanhar',
    excerpt: 'Explicamos o que significam estes indicadores, como calculá-los corretamente e como usá-los para melhorar a fiabilidade dos equipamentos.',
    content: [
      'MTBF (tempo médio entre falhas), MTTR (tempo médio de reparação) e OEE (eficiência global do equipamento) são os três indicadores mais citados em manutenção industrial — e também dos mais mal calculados.',
      'O MTBF mede a fiabilidade de um ativo, dividindo o tempo total de operação pelo número de falhas registadas num período. Quanto maior, mais fiável é o equipamento.',
      'O MTTR mede a eficiência da resposta da equipa de manutenção, do momento em que a avaria é reportada até à reposição em serviço do equipamento.',
      'O OEE combina disponibilidade, desempenho e qualidade num único indicador, revelando o verdadeiro potencial produtivo de uma linha.',
      'Acompanhar estes três indicadores em conjunto, e não isoladamente, é o que permite identificar se um problema de produtividade tem origem na fiabilidade dos equipamentos, na rapidez da resposta ou na qualidade do processo.',
    ],
    author: 'Equipa ManuGent',
    date: '2 jul 2026',
    readTime: '8 min',
    coverIcon: 'fa-solid fa-chart-line',
    coverGradient: 'linear-gradient(135deg, #059669, #0891b2)',
  },
  {
    slug: 'caso-cliente-reducao-paragem-34',
    category: 'Casos de cliente',
    title: 'Como uma fábrica reduziu o tempo de paragem em 34% com ordens de serviço inteligentes',
    excerpt: 'Um estudo de caso sobre a implementação do ManuGent numa linha de produção com múltiplos turnos.',
    content: [
      'Uma fábrica com três turnos e mais de 200 equipamentos ativos enfrentava um problema comum: ordens de serviço dispersas por papel, WhatsApp e folhas de Excel, sem visibilidade entre turnos.',
      'Com o ManuGent, a equipa passou a ter um único ponto de verdade para todas as ordens de trabalho, com priorização automática baseada na criticidade do equipamento e no histórico de falhas.',
      'A comunicação entre turnos deixou de depender de passagens de turno informais — cada ordem transporta consigo o histórico completo de intervenções, fotos e notas técnicas.',
      'Ao fim de seis meses, o tempo médio de paragem não planeada caiu 34%, e o tempo de resposta a avarias críticas reduziu-se para menos de metade.',
    ],
    author: 'Equipa ManuGent',
    date: '14 jun 2026',
    readTime: '5 min',
    coverIcon: 'fa-solid fa-industry',
    coverGradient: 'linear-gradient(135deg, #d97706, #dc2626)',
  },
  {
    slug: 'manutencao-offline-pwa',
    category: 'Produto',
    title: 'Manutenção offline: como o ManuGent funciona sem rede na fábrica',
    excerpt: 'Explicamos a arquitetura PWA que permite à equipa continuar a trabalhar mesmo sem cobertura de rede.',
    content: [
      'Muitas fábricas têm zonas com cobertura de rede fraca ou inexistente — caves técnicas, armazéns afastados, salas blindadas. Isto não pode impedir um técnico de registar uma intervenção.',
      'O ManuGent é construído como uma Progressive Web App: os dados essenciais (ordens de trabalho, ativos, histórico recente) ficam disponíveis localmente no dispositivo do técnico.',
      'Quando o técnico regista uma ação — fecha uma ordem, adiciona uma nota, tira uma fotografia — a alteração é guardada localmente e sincronizada automaticamente assim que a rede volta a estar disponível.',
      'Este mecanismo de fila de sincronização garante que nenhuma informação se perde, mesmo em ambientes industriais hostis à conectividade.',
    ],
    author: 'Equipa ManuGent',
    date: '29 mai 2026',
    readTime: '4 min',
    coverIcon: 'fa-solid fa-wifi',
    coverGradient: 'linear-gradient(135deg, #4338ca, #6d28d9)',
  },
  {
    slug: 'ia-generativa-manutencao-industrial',
    category: 'Indústria',
    title: 'O que muda na manutenção industrial com a chegada da IA generativa',
    excerpt: 'Uma análise das tendências que estão a moldar o futuro da manutenção preditiva e corretiva.',
    content: [
      'A IA generativa está a mudar a forma como as equipas de manutenção interagem com dados técnicos complexos — manuais, esquemas elétricos, históricos de intervenção.',
      'Em vez de pesquisar manualmente num manual de centenas de páginas, um técnico pode agora perguntar diretamente ao sistema qual o procedimento correto para uma avaria específica.',
      'A manutenção preditiva também beneficia: modelos generativos conseguem explicar em linguagem natural porque é que um determinado padrão de sensores indica risco de falha, tornando as recomendações mais transparentes e mais fáceis de confiar.',
      'O desafio para os próximos anos não é tecnológico, mas organizacional: preparar as equipas para trabalhar lado a lado com estas ferramentas.',
    ],
    author: 'Equipa ManuGent',
    date: '9 mai 2026',
    readTime: '7 min',
    coverIcon: 'fa-solid fa-microchip',
    coverGradient: 'linear-gradient(135deg, #be185d, #7c3aed)',
  },
  {
    slug: 'nfc-vs-qr-code-ativos',
    category: 'Boas práticas',
    title: 'NFC vs. QR code: qual a melhor forma de identificar os teus ativos?',
    excerpt: 'Comparamos as duas tecnologias e damos recomendações práticas para diferentes tipos de instalação.',
    content: [
      'A identificação de ativos é a base de qualquer sistema de manutenção eficaz — sem ela, cada intervenção começa com uma pergunta: "de que equipamento estamos a falar?"',
      'Os códigos QR são baratos, fáceis de imprimir e não exigem hardware especial no dispositivo do técnico, mas degradam-se com sujidade, calor ou exposição solar direta.',
      'As etiquetas NFC são mais resistentes a ambientes agressivos e permitem leitura por aproximação, mesmo com luvas de trabalho, mas têm um custo unitário mais elevado.',
      'Na prática, muitas fábricas optam por uma abordagem híbrida: NFC em equipamentos críticos ou de difícil acesso, e QR code no restante parque de ativos.',
    ],
    author: 'Equipa ManuGent',
    date: '20 abr 2026',
    readTime: '5 min',
    coverIcon: 'fa-solid fa-tag',
    coverGradient: 'linear-gradient(135deg, #0d9488, #2563eb)',
  },
]

export function getBlogPostBySlug(slug: string | undefined): BlogPost | undefined {
  return BLOG_POSTS.find(post => post.slug === slug)
}
