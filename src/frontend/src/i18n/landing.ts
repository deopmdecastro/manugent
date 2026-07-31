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
    items: { title: string; desc: string }[]
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
}

export const landingTranslations: Record<Language, LandingTranslations> = {
  pt: {
    nav: {
      links: [
        { label: 'Funcionalidades', href: '/landing#features' },
        { label: 'Módulos', href: '/landing#modules' },
        { label: 'IA', href: '/landing#ai' },
        { label: 'Preços', href: '/landing#pricing' },
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
        { title: 'Agente IA Inteligente', desc: 'Diagnóstico e recomendações em tempo real com GPT-4o e Llama 3. O teu especialista de manutenção sempre disponível, 24/7.' },
        { title: 'Ordens de Serviço Inteligentes', desc: 'Criação automática de OTs corretivas com base em medições. Tracking de tempo, notificações e mudanças de estado em tempo real.' },
        { title: 'KPIs em Tempo Real', desc: 'MTBF, MTTR, OEE e compliance num dashboard vivo. Toma decisões com dados, não com feeling.' },
        { title: 'NFC & QR Codes', desc: 'Scan instantâneo de equipamentos com o telemóvel. Histórico completo, manuais e checklists em segundos.' },
        { title: 'Relatórios Automáticos', desc: 'Geração de PDFs profissionais com um clique. Relatórios de intervenção prontos para cliente e auditoria.' },
        { title: 'Mobile & Offline', desc: 'PWA completa. Funciona sem rede — sincroniza automaticamente quando voltas online. Tablet e smartphone.' },
      ],
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
  },
  en: {
    nav: {
      links: [
        { label: 'Features', href: '/landing#features' },
        { label: 'Modules', href: '/landing#modules' },
        { label: 'AI', href: '/landing#ai' },
        { label: 'Pricing', href: '/landing#pricing' },
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
        { title: 'Smart AI Agent', desc: 'Real-time diagnosis and recommendations with GPT-4o and Llama 3. Your maintenance expert, always available, 24/7.' },
        { title: 'Smart Work Orders', desc: 'Automatic creation of corrective work orders based on measurements. Time tracking, notifications and real-time status changes.' },
        { title: 'Real-Time KPIs', desc: 'MTBF, MTTR, OEE and compliance in a live dashboard. Make decisions with data, not gut feeling.' },
        { title: 'NFC & QR Codes', desc: 'Instant equipment scanning with your phone. Full history, manuals and checklists in seconds.' },
        { title: 'Automatic Reports', desc: 'Professional PDF generation with one click. Intervention reports ready for clients and audits.' },
        { title: 'Mobile & Offline', desc: 'Full PWA. Works without a network — syncs automatically when you\u2019re back online. Tablet and smartphone.' },
      ],
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
  },
}
