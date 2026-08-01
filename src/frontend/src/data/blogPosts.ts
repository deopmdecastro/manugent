import type { Language } from '../i18n/landing'

export interface Localized {
  pt: string
  en: string
}

export interface BlogPost {
  slug: string
  category: Localized
  title: Localized
  excerpt: Localized
  content: { pt: string[]; en: string[] }
  author: string
  date: string
  readTime: Localized
  coverIcon: string
  coverGradient: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'agente-ia-diagnostico-avarias',
    category: { pt: 'Produto', en: 'Product' },
    title: {
      pt: 'Como o agente de IA do ManuGent diagnostica avarias em segundos',
      en: 'How the ManuGent AI agent diagnoses breakdowns in seconds',
    },
    excerpt: {
      pt: 'Um olhar por dentro do modelo que combina histórico de manutenção com sinais em tempo real para sugerir a causa raiz de uma avaria.',
      en: 'A look inside the model that combines maintenance history with real-time signals to suggest the root cause of a breakdown.',
    },
    content: {
      pt: [
        'Quando um técnico regista uma avaria, o agente de IA do ManuGent cruza de imediato o histórico do equipamento com sinais recolhidos em tempo real — leituras de sensores, últimas ordens de trabalho e padrões conhecidos de falha.',
        'Este cruzamento permite sugerir, em segundos, uma lista ordenada de causas prováveis, cada uma com um grau de confiança e as ações de diagnóstico recomendadas.',
        'O modelo aprende continuamente com o feedback dos técnicos: sempre que uma sugestão é confirmada ou rejeitada, o sistema ajusta os pesos usados nas previsões seguintes para aquele tipo de equipamento.',
        'O resultado é uma redução significativa do tempo médio de diagnóstico (MTTD), especialmente em equipamentos com histórico rico de manutenção.',
      ],
      en: [
        'When a technician logs a breakdown, the ManuGent AI agent immediately cross-references the equipment history with real-time signals — sensor readings, recent work orders and known failure patterns.',
        'This cross-referencing lets it suggest, in seconds, a ranked list of likely causes, each with a confidence score and the recommended diagnostic actions.',
        'The model keeps learning from technician feedback: every time a suggestion is confirmed or rejected, the system adjusts the weights used in the next predictions for that equipment type.',
        'The result is a significant reduction in mean time to diagnose (MTTD), especially for equipment with a rich maintenance history.',
      ],
    },
    author: 'Equipa ManuGent',
    date: '18 jul 2026',
    readTime: { pt: '6 min', en: '6 min' },
    coverIcon: 'fa-solid fa-brain',
    coverGradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  },
  {
    slug: 'mtbf-mttr-oee-indicadores',
    category: { pt: 'Boas práticas', en: 'Best practices' },
    title: {
      pt: 'MTBF, MTTR e OEE: os três indicadores que toda a equipa de manutenção devia acompanhar',
      en: 'MTBF, MTTR and OEE: the three indicators every maintenance team should track',
    },
    excerpt: {
      pt: 'Explicamos o que significam estes indicadores, como calculá-los corretamente e como usá-los para melhorar a fiabilidade dos equipamentos.',
      en: 'We explain what these indicators mean, how to calculate them correctly, and how to use them to improve equipment reliability.',
    },
    content: {
      pt: [
        'MTBF (tempo médio entre falhas), MTTR (tempo médio de reparação) e OEE (eficiência global do equipamento) são os três indicadores mais citados em manutenção industrial — e também dos mais mal calculados.',
        'O MTBF mede a fiabilidade de um ativo, dividindo o tempo total de operação pelo número de falhas registadas num período. Quanto maior, mais fiável é o equipamento.',
        'O MTTR mede a eficiência da resposta da equipa de manutenção, do momento em que a avaria é reportada até à reposição em serviço do equipamento.',
        'O OEE combina disponibilidade, desempenho e qualidade num único indicador, revelando o verdadeiro potencial produtivo de uma linha.',
        'Acompanhar estes três indicadores em conjunto, e não isoladamente, é o que permite identificar se um problema de produtividade tem origem na fiabilidade dos equipamentos, na rapidez da resposta ou na qualidade do processo.',
      ],
      en: [
        'MTBF (mean time between failures), MTTR (mean time to repair) and OEE (overall equipment effectiveness) are the three most cited indicators in industrial maintenance — and also among the most poorly calculated.',
        'MTBF measures the reliability of an asset by dividing total operating time by the number of failures recorded in a period. The higher it is, the more reliable the equipment.',
        'MTTR measures how efficiently the maintenance team responds, from the moment a breakdown is reported until the equipment is back in service.',
        'OEE combines availability, performance and quality into a single indicator, revealing a line\u2019s true production potential.',
        'Tracking these three indicators together, rather than in isolation, is what lets you identify whether a productivity problem stems from equipment reliability, response speed or process quality.',
      ],
    },
    author: 'Equipa ManuGent',
    date: '2 jul 2026',
    readTime: { pt: '8 min', en: '8 min' },
    coverIcon: 'fa-solid fa-chart-line',
    coverGradient: 'linear-gradient(135deg, #059669, #0891b2)',
  },
  {
    slug: 'caso-cliente-reducao-paragem-34',
    category: { pt: 'Casos de cliente', en: 'Customer stories' },
    title: {
      pt: 'Como uma fábrica reduziu o tempo de paragem em 34% com ordens de serviço inteligentes',
      en: 'How a factory cut downtime by 34% with smart work orders',
    },
    excerpt: {
      pt: 'Um estudo de caso sobre a implementação do ManuGent numa linha de produção com múltiplos turnos.',
      en: 'A case study on rolling out ManuGent across a multi-shift production line.',
    },
    content: {
      pt: [
        'Uma fábrica com três turnos e mais de 200 equipamentos ativos enfrentava um problema comum: ordens de serviço dispersas por papel, WhatsApp e folhas de Excel, sem visibilidade entre turnos.',
        'Com o ManuGent, a equipa passou a ter um único ponto de verdade para todas as ordens de trabalho, com priorização automática baseada na criticidade do equipamento e no histórico de falhas.',
        'A comunicação entre turnos deixou de depender de passagens de turno informais — cada ordem transporta consigo o histórico completo de intervenções, fotos e notas técnicas.',
        'Ao fim de seis meses, o tempo médio de paragem não planeada caiu 34%, e o tempo de resposta a avarias críticas reduziu-se para menos de metade.',
      ],
      en: [
        'A factory running three shifts with over 200 active pieces of equipment faced a common problem: work orders scattered across paper, WhatsApp and spreadsheets, with no visibility between shifts.',
        'With ManuGent, the team gained a single source of truth for all work orders, with automatic prioritization based on equipment criticality and failure history.',
        'Communication between shifts no longer relied on informal handovers — every order carries its full history of interventions, photos and technical notes.',
        'After six months, average unplanned downtime dropped 34%, and response time to critical breakdowns fell by more than half.',
      ],
    },
    author: 'Equipa ManuGent',
    date: '14 jun 2026',
    readTime: { pt: '5 min', en: '5 min' },
    coverIcon: 'fa-solid fa-industry',
    coverGradient: 'linear-gradient(135deg, #d97706, #dc2626)',
  },
  {
    slug: 'manutencao-offline-pwa',
    category: { pt: 'Produto', en: 'Product' },
    title: {
      pt: 'Manutenção offline: como o ManuGent funciona sem rede na fábrica',
      en: 'Offline maintenance: how ManuGent works without a network on the shop floor',
    },
    excerpt: {
      pt: 'Explicamos a arquitetura PWA que permite à equipa continuar a trabalhar mesmo sem cobertura de rede.',
      en: 'We explain the PWA architecture that lets the team keep working even without network coverage.',
    },
    content: {
      pt: [
        'Muitas fábricas têm zonas com cobertura de rede fraca ou inexistente — caves técnicas, armazéns afastados, salas blindadas. Isto não pode impedir um técnico de registar uma intervenção.',
        'O ManuGent é construído como uma Progressive Web App: os dados essenciais (ordens de trabalho, ativos, histórico recente) ficam disponíveis localmente no dispositivo do técnico.',
        'Quando o técnico regista uma ação — fecha uma ordem, adiciona uma nota, tira uma fotografia — a alteração é guardada localmente e sincronizada automaticamente assim que a rede volta a estar disponível.',
        'Este mecanismo de fila de sincronização garante que nenhuma informação se perde, mesmo em ambientes industriais hostis à conectividade.',
      ],
      en: [
        'Many factories have zones with weak or nonexistent network coverage — technical basements, remote warehouses, shielded rooms. That can\u2019t stop a technician from logging an intervention.',
        'ManuGent is built as a Progressive Web App: essential data (work orders, assets, recent history) stays available locally on the technician\u2019s device.',
        'When the technician logs an action — closes an order, adds a note, takes a photo — the change is saved locally and automatically synced as soon as the network is back.',
        'This sync-queue mechanism ensures no information is ever lost, even in industrial environments that are hostile to connectivity.',
      ],
    },
    author: 'Equipa ManuGent',
    date: '29 mai 2026',
    readTime: { pt: '4 min', en: '4 min' },
    coverIcon: 'fa-solid fa-wifi',
    coverGradient: 'linear-gradient(135deg, #4338ca, #6d28d9)',
  },
  {
    slug: 'ia-generativa-manutencao-industrial',
    category: { pt: 'Indústria', en: 'Industry' },
    title: {
      pt: 'O que muda na manutenção industrial com a chegada da IA generativa',
      en: 'What changes in industrial maintenance with the arrival of generative AI',
    },
    excerpt: {
      pt: 'Uma análise das tendências que estão a moldar o futuro da manutenção preditiva e corretiva.',
      en: 'An analysis of the trends shaping the future of predictive and corrective maintenance.',
    },
    content: {
      pt: [
        'A IA generativa está a mudar a forma como as equipas de manutenção interagem com dados técnicos complexos — manuais, esquemas elétricos, históricos de intervenção.',
        'Em vez de pesquisar manualmente num manual de centenas de páginas, um técnico pode agora perguntar diretamente ao sistema qual o procedimento correto para uma avaria específica.',
        'A manutenção preditiva também beneficia: modelos generativos conseguem explicar em linguagem natural porque é que um determinado padrão de sensores indica risco de falha, tornando as recomendações mais transparentes e mais fáceis de confiar.',
        'O desafio para os próximos anos não é tecnológico, mas organizacional: preparar as equipas para trabalhar lado a lado com estas ferramentas.',
      ],
      en: [
        'Generative AI is changing how maintenance teams interact with complex technical data — manuals, wiring diagrams, intervention histories.',
        'Instead of manually searching through a hundred-page manual, a technician can now ask the system directly what the correct procedure is for a specific breakdown.',
        'Predictive maintenance benefits too: generative models can explain in plain language why a given sensor pattern signals a risk of failure, making recommendations more transparent and easier to trust.',
        'The challenge for the coming years isn\u2019t technological but organizational: preparing teams to work side by side with these tools.',
      ],
    },
    author: 'Equipa ManuGent',
    date: '9 mai 2026',
    readTime: { pt: '7 min', en: '7 min' },
    coverIcon: 'fa-solid fa-microchip',
    coverGradient: 'linear-gradient(135deg, #be185d, #7c3aed)',
  },
  {
    slug: 'nfc-vs-qr-code-ativos',
    category: { pt: 'Boas práticas', en: 'Best practices' },
    title: {
      pt: 'NFC vs. QR code: qual a melhor forma de identificar os teus ativos?',
      en: 'NFC vs. QR code: what\u2019s the best way to identify your assets?',
    },
    excerpt: {
      pt: 'Comparamos as duas tecnologias e damos recomendações práticas para diferentes tipos de instalação.',
      en: 'We compare both technologies and give practical recommendations for different types of facilities.',
    },
    content: {
      pt: [
        'A identificação de ativos é a base de qualquer sistema de manutenção eficaz — sem ela, cada intervenção começa com uma pergunta: "de que equipamento estamos a falar?"',
        'Os códigos QR são baratos, fáceis de imprimir e não exigem hardware especial no dispositivo do técnico, mas degradam-se com sujidade, calor ou exposição solar direta.',
        'As etiquetas NFC são mais resistentes a ambientes agressivos e permitem leitura por aproximação, mesmo com luvas de trabalho, mas têm um custo unitário mais elevado.',
        'Na prática, muitas fábricas optam por uma abordagem híbrida: NFC em equipamentos críticos ou de difícil acesso, e QR code no restante parque de ativos.',
      ],
      en: [
        'Asset identification is the foundation of any effective maintenance system — without it, every intervention starts with a question: \u201cwhich piece of equipment are we even talking about?\u201d',
        'QR codes are cheap, easy to print and require no special hardware on the technician\u2019s device, but they degrade with dirt, heat or direct sunlight.',
        'NFC tags hold up better in harsh environments and can be read by simply tapping, even with work gloves on, but cost more per unit.',
        'In practice, many factories go for a hybrid approach: NFC on critical or hard-to-reach equipment, and QR codes across the rest of the asset fleet.',
      ],
    },
    author: 'Equipa ManuGent',
    date: '20 abr 2026',
    readTime: { pt: '5 min', en: '5 min' },
    coverIcon: 'fa-solid fa-tag',
    coverGradient: 'linear-gradient(135deg, #0d9488, #2563eb)',
  },
]

export function getBlogPostBySlug(slug: string | undefined): BlogPost | undefined {
  return BLOG_POSTS.find(post => post.slug === slug)
}

export function pickLang<T extends string | string[]>(value: { pt: T; en: T }, language: Language): T {
  return value[language]
}
