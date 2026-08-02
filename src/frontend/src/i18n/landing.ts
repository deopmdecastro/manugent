export type Language = 'pt' | 'en'

export interface LandingTranslations {
  nav: {
    links: { label: string; href: string }[]
    resourcesLabel: string
    resources: { label: string; desc: string; href: string }[]
    login: string
    cta: string
    menuLabel: string
    themeToLight: string
    themeToDark: string
    languageLabel: string
  }
  hero: {
    badge: string
    titleLine1: string
    titleLine2: string
    titleGradient: string
    desc: string
    ctaPrimary: string
    ctaSecondary: string
    perks: { title: string; desc: string }[]
    cards: {
      orders: { label: string; sub: string }
      maintenance: { label: string; sub: string }
      assets: { label: string; sub: string }
      ai: { label: string; sub: string }
      inventory: { label: string; sub: string }
      savings: { label: string; sub: string }
    }
  }
  stats: {
    trustTitle: string
    trustSub: string
    items: { label: string }[]
  }
  companies: {
    label: string
  }
  features: {
    badge: string
    titleLine1: string
    titleGradient: string
    desc: string
    items: { title: string; desc: string; highlights?: string[] }[]
  }
  featuresPage: {
    ctaTitle: string
    ctaDesc: string
    ctaButton: string
  }
  aiPage: {
    badge: string
    titleLine1: string
    titleGradient: string
    desc: string
    capabilitiesTitle: string
    capabilities: { title: string; desc: string; icon: string }[]
    chatTitle: string
    chatSubtitle: string
    welcomeMessage: string
    inputPlaceholder: string
    send: string
    thinking: string
    errorMessage: string
    disclaimer: string
    suggestionsTitle: string
    suggestions: string[]
    ctaTitle: string
    ctaDesc: string
    ctaButton: string
  }
  pricingPage: {
    badge: string
    titleLine1: string
    titleGradient: string
    desc: string
    billingMonthly: string
    billingAnnual: string
    billingAnnualBadge: string
    perUser: string
    perMonth: string
    custom: string
    popularLabel: string
    plans: {
      name: string
      tagline: string
      priceMonthly: string
      priceAnnual: string
      cta: string
      ctaHref: string
      popular?: boolean
      features: string[]
    }[]
    faqTitle: string
    faq: { q: string; a: string }[]
    ctaTitle: string
    ctaDesc: string
    ctaButton: string
  }
  testimonials: {
    badge: string
    titleLine1: string
    titleGradient: string
    desc: string
    items: { quote: string; name: string; role: string }[]
  }
  support: {
    buttonLabel: string
    panelTitle: string
    panelSubtitle: string
    welcomeMessage: string
    inputPlaceholder: string
    send: string
    thinking: string
    errorMessage: string
    disclaimer: string
    close: string
  }
  cookies: {
    title: string
    message: string
    accept: string
    reject: string
    policyLinkText: string
  }
  cta: {
    titleLine1: string
    titleGradient: string
    desc: string
    primary: string
    secondary: string
  }
  footer: {
    brandDesc: string
    groups: { title: string; links: string[] }[]
    copyright: string
    secure: string
  }
  blog: {
    badge: string
    title: string
    desc: string
    readTimeSuffix: string
    views: string
    likes: string
    share: string
    shareOn: string
    copyLink: string
    linkCopied: string
    comments: string
    comment: string
    namePlaceholder: string
    messagePlaceholder: string
    submitComment: string
    noComments: string
    relatedArticles: string
    backToBlog: string
  }
}

export const landingTranslations: Record<Language, LandingTranslations> = {
  pt: {
    nav: {
      links: [
        { label: 'Funcionalidades', href: '/landing#features' },
        { label: 'Módulos', href: '/landing#modules' },
        { label: 'IA', href: '/ia' },
        { label: 'Preços', href: '/precos' },
      ],
      resourcesLabel: 'Recursos',
      resources: [
        { label: 'Documentação', desc: 'Guias e referência da API', href: '/documentacao' },
        { label: 'Blog', desc: 'Novidades e boas práticas', href: '/blog' },
        { label: 'Casos de sucesso', desc: 'Histórias de clientes', href: '/casos-de-sucesso' },
        { label: 'Central de ajuda', desc: 'Suporte e FAQs', href: '/central-de-ajuda' },
      ],
      login: 'Entrar',
      cta: 'Começar grátis',
      menuLabel: 'Menu',
      themeToLight: 'Ativar tema claro',
      themeToDark: 'Ativar tema escuro',
      languageLabel: 'Idioma',
    },
    hero: {
      badge: 'SISTEMA OPERATIVO DE MANUTENÇÃO COM IA',
      titleLine1: 'O conhecimento',
      titleLine2: 'técnico,',
      titleGradient: 'transformado em IA.',
      desc: 'ManuGent é o agente inteligente de manutenção industrial: CMMS, base de conhecimento e técnico sénior digital — tudo numa plataforma que aprende com a sua equipa.',
      ctaPrimary: 'Começar grátis',
      ctaSecondary: 'Ver funcionalidades',
      perks: [
        { title: 'Seguro e confiável', desc: 'Dados protegidos' },
        { title: 'Implementação rápida', desc: 'Em poucos dias' },
        { title: 'Feito para equipas', desc: 'Colaboração inteligente' },
      ],
      cards: {
        orders: { label: 'Ordens de Serviço', sub: 'Abertas' },
        maintenance: { label: 'Manutenções', sub: 'Concluídas' },
        assets: { label: 'Ativos', sub: 'Total' },
        ai: { label: 'IA Insights', sub: 'Recomendações' },
        inventory: { label: 'Inventário', sub: 'Itens' },
        savings: { label: 'Economia', sub: 'Redução de custos' },
      },
    },
    stats: {
      trustTitle: 'Confiado por equipas',
      trustSub: 'em todo o mundo',
      items: [
        { label: 'Utilizadores ativos' },
        { label: 'Ordens de serviço' },
        { label: 'Satisfação dos clientes' },
        { label: 'Redução de custos' },
      ],
    },
    companies: {
      label: 'Empresas que confiam na ManuGent',
    },
    features: {
      badge: 'Plataforma',
      titleLine1: 'Tudo o que precisas para',
      titleGradient: 'gerir manutenção industrial',
      desc: 'Do diagnóstico à execução, uma plataforma que cobre o ciclo completo de manutenção — com IA integrada em cada passo.',
      items: [
        {
          title: 'Agente IA Inteligente',
          desc: 'Diagnóstico e recomendações em tempo real com GPT-4o e Llama 3. O teu especialista de manutenção sempre disponível, 24/7.',
          highlights: ['Diagnóstico assistido por IA em segundos', 'Aprende com o histórico de cada equipamento', 'Disponível a qualquer hora, em qualquer dispositivo'],
        },
        {
          title: 'Ordens de Serviço Inteligentes',
          desc: 'Criação automática de OTs corretivas com base em medições. Tracking de tempo, notificações e mudanças de estado em tempo real.',
          highlights: ['Criação automática a partir de leituras e alarmes', 'Notificações em tempo real para a equipa', 'Histórico completo de cada intervenção'],
        },
        {
          title: 'KPIs em Tempo Real',
          desc: 'MTBF, MTTR, OEE e compliance num dashboard vivo. Toma decisões com dados, não com feeling.',
          highlights: ['Dashboards atualizados ao minuto', 'Indicadores MTBF, MTTR e OEE prontos a usar', 'Alertas de desvio face às metas definidas'],
        },
        {
          title: 'NFC & QR Codes',
          desc: 'Scan instantâneo de equipamentos com o telemóvel. Histórico completo, manuais e checklists em segundos.',
          highlights: ['Identificação instantânea de qualquer ativo', 'Acesso a manuais e checklists no local', 'Sem necessidade de hardware adicional'],
        },
        {
          title: 'Relatórios Automáticos',
          desc: 'Geração de PDFs profissionais com um clique. Relatórios de intervenção prontos para cliente e auditoria.',
          highlights: ['PDFs profissionais gerados num clique', 'Prontos para cliente, auditoria ou arquivo', 'Modelos personalizáveis à imagem da empresa'],
        },
        {
          title: 'Mobile & Offline',
          desc: 'PWA completa. Funciona sem rede — sincroniza automaticamente quando voltas online. Tablet e smartphone.',
          highlights: ['Funciona sem ligação à internet', 'Sincronização automática ao reconectar', 'Otimizado para tablet e smartphone'],
        },
      ],
    },
    featuresPage: {
      ctaTitle: 'Pronto para experimentar?',
      ctaDesc: 'Cria a tua conta grátis e vê estas funcionalidades a funcionar com os dados da tua equipa.',
      ctaButton: 'Começar grátis',
    },
    aiPage: {
      badge: 'Agente IA',
      titleLine1: 'Fala agora com o',
      titleGradient: 'técnico sénior digital da ManuGent',
      desc: 'Este é o mesmo agente de IA que os técnicos usam dentro da plataforma — treinado em diagnóstico industrial, manutenção preventiva e boas práticas de CMMS. Experimenta uma pergunta real, sem criar conta.',
      capabilitiesTitle: 'O que o agente sabe fazer',
      capabilities: [
        { title: 'Diagnóstico de avarias', desc: 'Descreve um sintoma e recebe hipóteses de causa, por ordem de probabilidade, com base em boas práticas de manutenção industrial.', icon: 'fas fa-stethoscope' },
        { title: 'Planeamento preventivo', desc: 'Sugere periodicidades e checklists de manutenção preventiva/preditiva adequadas a cada tipo de equipamento.', icon: 'fas fa-calendar-check' },
        { title: 'Indicadores técnicos', desc: 'Explica e ajuda a calcular MTBF, MTTR, OEE e outros indicadores de desempenho da manutenção.', icon: 'fas fa-chart-line' },
        { title: 'Normas e conformidade', desc: 'Orienta sobre requisitos de normas como ISO 55000, EN 13306 e boas práticas de segurança no trabalho.', icon: 'fas fa-shield-halved' },
      ],
      chatTitle: 'Experimenta o agente ManuGent',
      chatSubtitle: 'Demonstração pública — sem acesso a dados reais de conta',
      welcomeMessage: 'Olá! 👋 Sou o agente técnico da ManuGent, em modo de demonstração pública. Posso ajudar-te a pensar num diagnóstico, num plano preventivo ou explicar um indicador de manutenção. O que queres experimentar?',
      inputPlaceholder: 'Escreve a tua pergunta técnica...',
      send: 'Enviar',
      thinking: 'A analisar...',
      errorMessage: 'Não foi possível obter resposta agora. Tenta novamente dentro de momentos.',
      disclaimer: 'Demonstração pública do agente IA da ManuGent. Não tem acesso a dados reais de conta, OTs ou equipamentos.',
      suggestionsTitle: 'Experimenta perguntar',
      suggestions: [
        'O compressor de ar está a disparar o térmico com frequência, o que pode ser?',
        'Com que periodicidade devo fazer manutenção preventiva a um chiller?',
        'Como calculo o MTBF de um equipamento?',
        'Que checklist devo usar numa inspeção a um quadro elétrico?',
      ],
      ctaTitle: 'Gostaste do agente?',
      ctaDesc: 'Na plataforma, o agente já conhece os teus equipamentos, o histórico de OTs e o stock de peças — as respostas ficam ainda mais precisas.',
      ctaButton: 'Criar conta grátis',
    },
    pricingPage: {
      badge: 'Preços',
      titleLine1: 'Um plano para cada',
      titleGradient: 'fase da tua operação',
      desc: 'Preços simples, sem custos escondidos. Começa grátis e cresce ao ritmo da tua equipa de manutenção.',
      billingMonthly: 'Mensal',
      billingAnnual: 'Anual',
      billingAnnualBadge: '-20%',
      perUser: '/ utilizador',
      perMonth: '/ mês',
      custom: 'Personalizado',
      popularLabel: 'Mais popular',
      plans: [
        {
          name: 'Starter',
          tagline: 'Para equipas pequenas a começar a organizar a manutenção.',
          priceMonthly: '0€',
          priceAnnual: '0€',
          cta: 'Começar grátis',
          ctaHref: '/login',
          features: [
            'Até 3 utilizadores',
            'Até 50 equipamentos',
            'Ordens de Trabalho ilimitadas',
            'App móvel (PWA) com modo offline',
            'Checklists e QR Code',
            'Suporte por email',
          ],
        },
        {
          name: 'Professional',
          tagline: 'Para equipas que querem IA, preventivas e relatórios automáticos.',
          priceMonthly: '49€',
          priceAnnual: '39€',
          cta: 'Começar grátis',
          ctaHref: '/login',
          popular: true,
          features: [
            'Utilizadores ilimitados',
            'Equipamentos ilimitados',
            'Agente IA incluído',
            'Manutenção preventiva/preditiva automática',
            'Relatórios PDF automáticos',
            'Indicadores MTBF, MTTR e OEE',
            'Suporte prioritário',
          ],
        },
        {
          name: 'Enterprise',
          tagline: 'Para operações multi-site com requisitos de segurança e integração.',
          priceMonthly: 'Personalizado',
          priceAnnual: 'Personalizado',
          cta: 'Falar com a equipa',
          ctaHref: '/contacto',
          features: [
            'Tudo do plano Professional',
            'SSO / SAML e permissões avançadas',
            'Integrações via API dedicada',
            'SLA e onboarding assistido',
            'Gestor de conta dedicado',
            'Contrato e faturação à medida',
          ],
        },
      ],
      faqTitle: 'Perguntas frequentes',
      faq: [
        { q: 'Preciso de cartão de crédito para experimentar?', a: 'Não. O plano Starter é gratuito para sempre e não pede dados de pagamento. Só pedimos cartão se decidires mudar para o plano Professional.' },
        { q: 'Posso mudar de plano mais tarde?', a: 'Sim, podes subir ou descer de plano a qualquer momento. As alterações aplicam-se no ciclo de faturação seguinte, sem perda de dados.' },
        { q: 'O que acontece se ultrapassar o limite de equipamentos do Starter?', a: 'Avisamos-te antes de chegares ao limite e sugerimos a mudança para o plano Professional, que não tem limites de equipamentos ou utilizadores.' },
        { q: 'Os meus dados ficam guardados se eu cancelar?', a: 'Mantemos os teus dados disponíveis para exportação durante 30 dias após o cancelamento, para que nunca percas o histórico de manutenção.' },
        { q: 'Como funciona o desconto anual?', a: 'Ao escolher faturação anual, pagas o equivalente a 10 meses em vez de 12 — uma poupança de cerca de 20% face ao plano mensal.' },
      ],
      ctaTitle: 'Ainda com dúvidas sobre o plano ideal?',
      ctaDesc: 'A nossa equipa ajuda-te a escolher o plano certo para o tamanho e complexidade da tua operação.',
      ctaButton: 'Falar com a equipa',
    },
    testimonials: {
      badge: 'Testemunhos',
      titleLine1: 'O que dizem',
      titleGradient: 'sobre nós',
      desc: 'Equipas de manutenção de várias indústrias já confiam na ManuGent no dia a dia.',
      items: [
        {
          quote: 'Reduzimos o tempo de resposta a avarias em mais de 30% desde que passámos a usar a ManuGent. O agente de IA ajuda mesmo os técnicos mais novos a diagnosticar problemas rapidamente.',
          name: 'Carlos Mendes',
          role: 'Diretor de Manutenção, Grupo Industrial',
        },
        {
          quote: 'A gestão de OTs deixou de ser um pesadelo em Excel. Agora temos tudo centralizado, com histórico completo de cada equipamento e relatórios prontos em segundos.',
          name: 'Sofia Ribeiro',
          role: 'Responsável de Operações, Setor Alimentar',
        },
        {
          quote: 'A app funciona mesmo sem rede na fábrica, o que era essencial para nós. Os técnicos registam tudo no telemóvel e sincroniza automaticamente.',
          name: 'Miguel Costa',
          role: 'Técnico Sénior, Setor Automóvel',
        },
        {
          quote: 'A implementação foi rápida e o suporte esteve sempre presente. Em poucos dias já tínhamos a equipa toda a usar a plataforma sem grande curva de aprendizagem.',
          name: 'Ana Torres',
          role: 'Gestora de Facilities',
        },
      ],
    },
    support: {
      buttonLabel: 'Suporte',
      panelTitle: 'Assistente ManuGent',
      panelSubtitle: 'Tira as tuas dúvidas sobre o produto',
      welcomeMessage: 'Olá! 👋 Sou o assistente de IA da ManuGent. Posso ajudar-te a perceber como a plataforma funciona, que funcionalidades tem ou como começar. Em que posso ajudar?',
      inputPlaceholder: 'Escreve a tua pergunta...',
      send: 'Enviar',
      thinking: 'A escrever...',
      errorMessage: 'Não foi possível obter resposta agora. Tenta novamente ou contacta-nos através da página de Contacto.',
      disclaimer: 'Assistente de IA para dúvidas sobre o produto ManuGent.',
      close: 'Fechar',
    },
    cookies: {
      title: 'A tua privacidade',
      message: 'Usamos cookies para melhorar a tua experiência, analisar o tráfego do site e personalizar conteúdo. Ao continuar, aceitas a nossa utilização de cookies.',
      accept: 'Aceitar todos',
      reject: 'Rejeitar não essenciais',
      policyLinkText: 'Política de Cookies',
    },
    cta: {
      titleLine1: 'Pronto para transformar',
      titleGradient: 'a tua manutenção?',
      desc: 'Começa hoje com o plano gratuito. Sem cartão de crédito. Sem compromisso. IA real incluída.',
      primary: 'Criar conta gratuita',
      secondary: 'Agendar demo',
    },
    footer: {
      brandDesc: 'Plataforma CMMS inteligente com agente IA integrado. Manutenção industrial do futuro, hoje.',
      groups: [
        { title: 'Produto', links: ['Funcionalidades', 'Preços', 'Documentação', 'API', 'Changelog'] },
        { title: 'Empresa', links: ['Sobre', 'Blog', 'Carreiras', 'Contacto', 'Parceiros'] },
        { title: 'Legal', links: ['Privacidade', 'Termos', 'GDPR', 'Cookies'] },
      ],
      copyright: 'Todos os direitos reservados.',
      secure: 'Seguro e protegido',
    },
    blog: {
      badge: 'Blog',
      title: 'Novidades e boas práticas de manutenção',
      desc: 'Artigos sobre produto, indústria e boas práticas de gestão de manutenção, escritos pela equipa ManuGent.',
      readTimeSuffix: 'de leitura',
      views: 'visualizações',
      likes: 'gostos',
      share: 'Partilhar',
      shareOn: 'Partilhar no',
      copyLink: 'Copiar link',
      linkCopied: 'Link copiado!',
      comments: 'comentários',
      comment: 'comentário',
      namePlaceholder: 'O teu nome (opcional)',
      messagePlaceholder: 'Escreve um comentário...',
      submitComment: 'Comentar',
      noComments: 'Sê o primeiro a comentar este artigo.',
      relatedArticles: 'Artigos relacionados',
      backToBlog: 'Voltar ao blog',
    },
  },
  en: {
    nav: {
      links: [
        { label: 'Features', href: '/landing#features' },
        { label: 'Modules', href: '/landing#modules' },
        { label: 'AI', href: '/ia' },
        { label: 'Pricing', href: '/precos' },
      ],
      resourcesLabel: 'Resources',
      resources: [
        { label: 'Documentation', desc: 'Guides and API reference', href: '/documentacao' },
        { label: 'Blog', desc: 'News and best practices', href: '/blog' },
        { label: 'Success stories', desc: 'Customer stories', href: '/casos-de-sucesso' },
        { label: 'Help center', desc: 'Support and FAQs', href: '/central-de-ajuda' },
      ],
      login: 'Sign in',
      cta: 'Start for free',
      menuLabel: 'Menu',
      themeToLight: 'Switch to light theme',
      themeToDark: 'Switch to dark theme',
      languageLabel: 'Language',
    },
    hero: {
      badge: 'AI-POWERED MAINTENANCE OPERATING SYSTEM',
      titleLine1: 'Technical',
      titleLine2: 'knowledge,',
      titleGradient: 'turned into AI.',
      desc: 'ManuGent is the intelligent industrial maintenance agent: CMMS, knowledge base and digital senior technician — all in one platform that learns with your team.',
      ctaPrimary: 'Start for free',
      ctaSecondary: 'See features',
      perks: [
        { title: 'Safe and reliable', desc: 'Protected data' },
        { title: 'Fast deployment', desc: 'In just a few days' },
        { title: 'Built for teams', desc: 'Smart collaboration' },
      ],
      cards: {
        orders: { label: 'Work Orders', sub: 'Open' },
        maintenance: { label: 'Maintenance', sub: 'Completed' },
        assets: { label: 'Assets', sub: 'Total' },
        ai: { label: 'AI Insights', sub: 'Recommendations' },
        inventory: { label: 'Inventory', sub: 'Items' },
        savings: { label: 'Savings', sub: 'Cost reduction' },
      },
    },
    stats: {
      trustTitle: 'Trusted by teams',
      trustSub: 'around the world',
      items: [
        { label: 'Active users' },
        { label: 'Work orders' },
        { label: 'Customer satisfaction' },
        { label: 'Cost reduction' },
      ],
    },
    companies: {
      label: 'Companies that trust ManuGent',
    },
    features: {
      badge: 'Platform',
      titleLine1: 'Everything you need to',
      titleGradient: 'manage industrial maintenance',
      desc: 'From diagnosis to execution, a platform that covers the full maintenance cycle — with AI built into every step.',
      items: [
        {
          title: 'Smart AI Agent',
          desc: 'Real-time diagnosis and recommendations with GPT-4o and Llama 3. Your maintenance expert, always available, 24/7.',
          highlights: ['AI-assisted diagnosis in seconds', 'Learns from every equipment\u2019s history', 'Available any time, on any device'],
        },
        {
          title: 'Smart Work Orders',
          desc: 'Automatic creation of corrective work orders based on measurements. Time tracking, notifications and real-time status changes.',
          highlights: ['Automatic creation from readings and alarms', 'Real-time notifications for the team', 'Full history of every intervention'],
        },
        {
          title: 'Real-Time KPIs',
          desc: 'MTBF, MTTR, OEE and compliance in a live dashboard. Make decisions with data, not gut feeling.',
          highlights: ['Dashboards updated by the minute', 'MTBF, MTTR and OEE ready out of the box', 'Alerts when targets are missed'],
        },
        {
          title: 'NFC & QR Codes',
          desc: 'Instant equipment scanning with your phone. Full history, manuals and checklists in seconds.',
          highlights: ['Instant identification of any asset', 'Manuals and checklists available on-site', 'No extra hardware required'],
        },
        {
          title: 'Automatic Reports',
          desc: 'Professional PDF generation with one click. Intervention reports ready for clients and audits.',
          highlights: ['Professional PDFs generated in one click', 'Ready for clients, audits or archiving', 'Templates customizable to your brand'],
        },
        {
          title: 'Mobile & Offline',
          desc: 'Full PWA. Works without a network — syncs automatically when you\u2019re back online. Tablet and smartphone.',
          highlights: ['Works without an internet connection', 'Automatic sync when back online', 'Optimized for tablet and smartphone'],
        },
      ],
    },
    featuresPage: {
      ctaTitle: 'Ready to try it out?',
      ctaDesc: 'Create your free account and see these features work with your own team\u2019s data.',
      ctaButton: 'Start for free',
    },
    aiPage: {
      badge: 'AI Agent',
      titleLine1: 'Talk right now to',
      titleGradient: 'ManuGent\u2019s digital senior technician',
      desc: 'This is the same AI agent technicians use inside the platform — trained on industrial diagnostics, preventive maintenance and CMMS best practices. Try a real question, no account needed.',
      capabilitiesTitle: 'What the agent can do',
      capabilities: [
        { title: 'Fault diagnosis', desc: 'Describe a symptom and get likely causes, ranked by probability, based on industrial maintenance best practices.', icon: 'fas fa-stethoscope' },
        { title: 'Preventive planning', desc: 'Get suggested frequencies and preventive/predictive maintenance checklists tailored to each equipment type.', icon: 'fas fa-calendar-check' },
        { title: 'Technical KPIs', desc: 'Understand and calculate MTBF, MTTR, OEE and other maintenance performance indicators.', icon: 'fas fa-chart-line' },
        { title: 'Standards & compliance', desc: 'Get guidance on standards like ISO 55000, EN 13306 and workplace safety best practices.', icon: 'fas fa-shield-halved' },
      ],
      chatTitle: 'Try the ManuGent agent',
      chatSubtitle: 'Public demo — no access to real account data',
      welcomeMessage: 'Hi! 👋 I\u2019m the ManuGent technical agent, in public demo mode. I can help you think through a diagnosis, a preventive plan, or explain a maintenance KPI. What would you like to try?',
      inputPlaceholder: 'Type your technical question...',
      send: 'Send',
      thinking: 'Analyzing...',
      errorMessage: 'Couldn\u2019t get a reply right now. Please try again in a moment.',
      disclaimer: 'Public demo of the ManuGent AI agent. Has no access to real account, work order or equipment data.',
      suggestionsTitle: 'Try asking',
      suggestions: [
        'Our air compressor keeps tripping the thermal overload, what could it be?',
        'How often should I run preventive maintenance on a chiller?',
        'How do I calculate the MTBF of a piece of equipment?',
        'What checklist should I use for an electrical panel inspection?',
      ],
      ctaTitle: 'Liked the agent?',
      ctaDesc: 'Inside the platform, the agent already knows your equipment, work order history and parts stock — so answers get even more precise.',
      ctaButton: 'Create free account',
    },
    pricingPage: {
      badge: 'Pricing',
      titleLine1: 'A plan for every',
      titleGradient: 'stage of your operation',
      desc: 'Simple pricing, no hidden costs. Start for free and grow at your maintenance team\u2019s pace.',
      billingMonthly: 'Monthly',
      billingAnnual: 'Annual',
      billingAnnualBadge: '-20%',
      perUser: '/ user',
      perMonth: '/ month',
      custom: 'Custom',
      popularLabel: 'Most popular',
      plans: [
        {
          name: 'Starter',
          tagline: 'For small teams getting their maintenance organized.',
          priceMonthly: '$0',
          priceAnnual: '$0',
          cta: 'Start for free',
          ctaHref: '/login',
          features: [
            'Up to 3 users',
            'Up to 50 assets',
            'Unlimited work orders',
            'Offline-ready mobile app (PWA)',
            'Checklists and QR code',
            'Email support',
          ],
        },
        {
          name: 'Professional',
          tagline: 'For teams that want AI, preventive maintenance and automatic reports.',
          priceMonthly: '$49',
          priceAnnual: '$39',
          cta: 'Start for free',
          ctaHref: '/login',
          popular: true,
          features: [
            'Unlimited users',
            'Unlimited assets',
            'AI agent included',
            'Automatic preventive/predictive maintenance',
            'Automatic PDF reports',
            'MTBF, MTTR and OEE indicators',
            'Priority support',
          ],
        },
        {
          name: 'Enterprise',
          tagline: 'For multi-site operations with security and integration needs.',
          priceMonthly: 'Custom',
          priceAnnual: 'Custom',
          cta: 'Talk to sales',
          ctaHref: '/contacto',
          features: [
            'Everything in Professional',
            'SSO / SAML and advanced permissions',
            'Dedicated API integrations',
            'SLA and guided onboarding',
            'Dedicated account manager',
            'Custom contract and billing',
          ],
        },
      ],
      faqTitle: 'Frequently asked questions',
      faq: [
        { q: 'Do I need a credit card to try it?', a: 'No. The Starter plan is free forever and never asks for payment details. We only ask for a card if you choose to upgrade to Professional.' },
        { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes apply on the next billing cycle, with no data loss.' },
        { q: 'What happens if I go over the Starter asset limit?', a: 'We\u2019ll warn you before you hit the limit and suggest upgrading to Professional, which has no asset or user limits.' },
        { q: 'Is my data kept if I cancel?', a: 'We keep your data available for export for 30 days after cancellation, so you never lose your maintenance history.' },
        { q: 'How does the annual discount work?', a: 'Choosing annual billing means you pay the equivalent of 10 months instead of 12 — roughly a 20% saving versus monthly billing.' },
      ],
      ctaTitle: 'Still not sure which plan fits?',
      ctaDesc: 'Our team can help you choose the right plan for the size and complexity of your operation.',
      ctaButton: 'Talk to sales',
    },
    testimonials: {
      badge: 'Testimonials',
      titleLine1: 'What people',
      titleGradient: 'say about us',
      desc: 'Maintenance teams across several industries already rely on ManuGent every day.',
      items: [
        {
          quote: 'We cut our breakdown response time by over 30% since switching to ManuGent. The AI agent helps even junior technicians diagnose issues quickly.',
          name: 'Carlos Mendes',
          role: 'Maintenance Director, Industrial Group',
        },
        {
          quote: 'Managing work orders in spreadsheets used to be a nightmare. Now everything is centralized, with full equipment history and reports ready in seconds.',
          name: 'Sofia Ribeiro',
          role: 'Operations Manager, Food Industry',
        },
        {
          quote: 'The app keeps working even without network on the factory floor, which was essential for us. Technicians log everything on their phone and it syncs automatically.',
          name: 'Miguel Costa',
          role: 'Senior Technician, Automotive Sector',
        },
        {
          quote: 'Rollout was fast and support was there whenever we needed it. Within days the whole team was using the platform without a steep learning curve.',
          name: 'Ana Torres',
          role: 'Facilities Manager',
        },
      ],
    },
    support: {
      buttonLabel: 'Support',
      panelTitle: 'ManuGent Assistant',
      panelSubtitle: 'Get your product questions answered',
      welcomeMessage: 'Hi! 👋 I\u2019m the ManuGent AI assistant. I can help you understand how the platform works, what features it has, or how to get started. How can I help?',
      inputPlaceholder: 'Type your question...',
      send: 'Send',
      thinking: 'Typing...',
      errorMessage: 'Couldn\u2019t get a reply right now. Please try again or reach us through the Contact page.',
      disclaimer: 'AI assistant for questions about the ManuGent product.',
      close: 'Close',
    },
    cookies: {
      title: 'Your privacy',
      message: 'We use cookies to improve your experience, analyze site traffic and personalize content. By continuing, you agree to our use of cookies.',
      accept: 'Accept all',
      reject: 'Reject non-essential',
      policyLinkText: 'Cookie Policy',
    },
    cta: {
      titleLine1: 'Ready to transform',
      titleGradient: 'your maintenance?',
      desc: 'Start today with the free plan. No credit card. No commitment. Real AI included.',
      primary: 'Create free account',
      secondary: 'Book a demo',
    },
    footer: {
      brandDesc: 'Smart CMMS platform with a built-in AI agent. Industrial maintenance of the future, today.',
      groups: [
        { title: 'Product', links: ['Features', 'Pricing', 'Documentation', 'API', 'Changelog'] },
        { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact', 'Partners'] },
        { title: 'Legal', links: ['Privacy', 'Terms', 'GDPR', 'Cookies'] },
      ],
      copyright: 'All rights reserved.',
      secure: 'Safe and secure',
    },
    blog: {
      badge: 'Blog',
      title: 'News and best practices in maintenance',
      desc: 'Articles about product, industry and maintenance management best practices, written by the ManuGent team.',
      readTimeSuffix: 'read',
      views: 'views',
      likes: 'likes',
      share: 'Share',
      shareOn: 'Share on',
      copyLink: 'Copy link',
      linkCopied: 'Link copied!',
      comments: 'comments',
      comment: 'comment',
      namePlaceholder: 'Your name (optional)',
      messagePlaceholder: 'Write a comment...',
      submitComment: 'Comment',
      noComments: 'Be the first to comment on this article.',
      relatedArticles: 'Related articles',
      backToBlog: 'Back to blog',
    },
  },
}
