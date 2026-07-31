export interface DocGuideSection {
  heading: string
  body: string[]
  steps?: string[]
}

export interface DocGuide {
  slug: string
  icon: string
  title: string
  desc: string
  intro: string[]
  sections: DocGuideSection[]
}

export const DOC_GUIDES: DocGuide[] = [
  {
    slug: 'primeiros-passos',
    icon: 'fa-rocket',
    title: 'Primeiros passos',
    desc: 'Cria a tua conta, configura a organização e convida a equipa em poucos minutos.',
    intro: [
      'Este guia acompanha-te desde a criação da conta até à primeira ordem de serviço registada na plataforma, sem passos técnicos desnecessários.',
    ],
    sections: [
      {
        heading: '1. Criar a organização',
        body: [
          'Ao criares a tua conta, o ManuGent gera automaticamente uma organização onde ficam associados todos os teus ativos, ordens de serviço, clientes e utilizadores.',
          'Podes editar o nome da organização, o logótipo e os dados de faturação a qualquer momento nas definições da conta.',
        ],
      },
      {
        heading: '2. Convidar a equipa',
        body: [
          'Na secção de Utilizadores, convida os teus técnicos, supervisores e administradores por email. Cada convite gera um link de acesso válido por 7 dias.',
        ],
        steps: [
          'Acede a Definições → Utilizadores → Convidar',
          'Introduz o email e escolhe o papel (técnico, supervisor ou administrador)',
          'Opcionalmente, associa o utilizador a uma equipa já existente',
          'Confirma o convite — o utilizador recebe um email com o link de ativação',
        ],
      },
      {
        heading: '3. Criar equipas',
        body: [
          'As equipas agrupam técnicos por turno, área ou especialidade, facilitando a atribuição automática de ordens de serviço e a análise de desempenho por equipa.',
        ],
      },
      {
        heading: '4. Registar o primeiro ativo',
        body: [
          'Com a equipa convidada, o passo seguinte é registar o primeiro equipamento. Consulta o guia de Gestão de ativos para o processo completo.',
        ],
      },
      {
        heading: 'Próximos passos',
        body: [
          'Depois de teres a organização, a equipa e os primeiros ativos configurados, está tudo pronto para criar a primeira ordem de serviço e experimentar o Agente de IA para acelerar o diagnóstico de avarias.',
        ],
      },
    ],
  },
  {
    slug: 'gestao-de-ativos',
    icon: 'fa-boxes-stacked',
    title: 'Gestão de ativos',
    desc: 'Regista equipamentos, hierarquias e histórico completo de manutenção.',
    intro: [
      'Os ativos são o centro da plataforma: cada ordem de serviço, achado técnico e relatório fica associado a um equipamento específico, construindo automaticamente o seu histórico de manutenção.',
    ],
    sections: [
      {
        heading: 'Registar um equipamento',
        body: [
          'Cada equipamento fica associado a um cliente e tem um código único, nome, marca, modelo, número de série e localização.',
        ],
        steps: [
          'Acede a Ativos → Novo equipamento',
          'Seleciona o cliente ou instalação a que pertence',
          'Preenche o código, nome e dados técnicos (marca, modelo, série)',
          'Define a criticidade — normal, alta ou crítica — que influencia a priorização de ordens de serviço',
          'Guarda: o equipamento fica imediatamente disponível para associar a ordens de serviço',
        ],
      },
      {
        heading: 'Criticidade e estado',
        body: [
          'A criticidade de um ativo determina a urgência com que as suas avarias são tratadas e influencia a priorização automática usada pelo Agente de IA e pelas notificações.',
          'O estado do equipamento (ativo, em manutenção, fora de serviço) fica visível em toda a plataforma e é atualizado automaticamente quando uma ordem corretiva é aberta ou fechada.',
        ],
      },
      {
        heading: 'Hierarquias de ativos',
        body: [
          'Equipamentos podem ser organizados hierarquicamente — por exemplo, uma linha de produção com várias máquinas, cada uma com os seus próprios componentes críticos — o que facilita a análise de fiabilidade ao nível certo de detalhe.',
        ],
      },
      {
        heading: 'Histórico completo de manutenção',
        body: [
          'Cada equipamento tem uma vista dedicada com todas as ordens de serviço associadas, achados técnicos registados, relatórios emitidos e o tempo total investido em intervenções.',
          'Este histórico é o que alimenta os indicadores MTBF e MTTR de cada ativo, calculados automaticamente pela plataforma.',
        ],
      },
      {
        heading: 'Identificação física com NFC ou QR Code',
        body: [
          'Para acelerar o registo de intervenções no terreno, associa uma etiqueta NFC ou QR Code a cada ativo — consulta o guia de NFC & QR Codes para o processo de associação.',
        ],
      },
    ],
  },
  {
    slug: 'ordens-de-servico',
    icon: 'fa-screwdriver-wrench',
    title: 'Ordens de serviço',
    desc: 'Cria, atribui e acompanha ordens corretivas e preventivas em tempo real.',
    intro: [
      'As ordens de serviço são o registo central de qualquer intervenção de manutenção, desde uma ronda de inspeção agendada até a uma avaria crítica reportada por um cliente.',
    ],
    sections: [
      {
        heading: 'Tipos de ordem de serviço',
        body: [
          'O ManuGent suporta oito tipos de ordem, cobrindo tanto manutenção planeada como não planeada:',
        ],
        steps: [
          'Preventiva — manutenção agendada com base em periodicidade',
          'Inspeção — verificação técnica programada',
          'Ronda — percurso de verificação por múltiplos ativos',
          'Checklist — lista de verificação estruturada',
          'Corretiva — reparação de uma avaria identificada',
          'Avaria (breakdown) — paragem não planeada de um equipamento',
          'Emergência — intervenção urgente com prioridade máxima',
          'Pedido de cliente — solicitação recebida através do portal do cliente',
        ],
      },
      {
        heading: 'Criar e atribuir uma ordem',
        body: [
          'Ao criar uma ordem, seleciona o equipamento, o tipo e a equipa ou técnico responsável. Ordens preventivas, de inspeção, ronda e checklist podem ser agendadas com antecedência.',
          'A atribuição pode ser manual ou sugerida automaticamente pelo Agente de IA com base na disponibilidade e especialidade da equipa.',
        ],
      },
      {
        heading: 'Ciclo de vida de uma ordem',
        body: [
          'Uma ordem percorre um conjunto de estados que refletem o seu progresso real: aberta, agendada, em curso, em pausa, à espera de material, à espera do cliente, concluída ou cancelada.',
          'Cada mudança de estado gera notificações automáticas para os intervenientes relevantes — supervisores, técnicos e, quando aplicável, o cliente.',
        ],
      },
      {
        heading: 'Registo de tempo',
        body: [
          'Cada técnico pode juntar-se a uma ordem, iniciar, pausar, retomar e terminar o registo de tempo diretamente na aplicação, garantindo que o tempo efetivo de intervenção fica sempre correto — mesmo com múltiplos técnicos na mesma ordem.',
        ],
      },
      {
        heading: 'Achados técnicos',
        body: [
          'Durante uma intervenção, o técnico pode registar achados — como um defeito, uma medição fora dos limites ou uma falha — que ficam associados à ordem e ao histórico do equipamento, e que podem despoletar automaticamente a abertura de uma nova ordem corretiva.',
        ],
      },
      {
        heading: 'Relatórios e orçamentos',
        body: [
          'No fecho de uma ordem, é possível gerar um relatório em PDF para o cliente, e, quando a intervenção exige peças ou custos adicionais, criar um orçamento que o cliente pode consultar e aprovar diretamente no portal do cliente.',
        ],
      },
    ],
  },
  {
    slug: 'agente-de-ia',
    icon: 'fa-robot',
    title: 'Agente de IA',
    desc: 'Como o técnico digital sugere diagnósticos e planos de intervenção.',
    intro: [
      'O Agente de IA do ManuGent funciona como um assistente conversacional que compreende linguagem natural sobre a tua operação de manutenção — ativos, ordens de serviço, técnicos e clientes.',
    ],
    sections: [
      {
        heading: 'Como funciona',
        body: [
          'O agente cruza o pedido do utilizador com o histórico de manutenção, os dados dos equipamentos e sinais recentes para sugerir causas prováveis de avaria e ações de diagnóstico recomendadas.',
          'Todas as entidades da plataforma — equipamentos, técnicos, utilizadores, clientes e ordens de serviço — podem ser pesquisadas e referidas diretamente na conversa.',
        ],
      },
      {
        heading: 'Tolerância a erros e desambiguação',
        body: [
          'O motor de pesquisa interno tolera erros ortográficos e variações de escrita, encontrando o equipamento ou a ordem certa mesmo que o nome não esteja escrito de forma exata.',
          'Quando existe ambiguidade — por exemplo, dois equipamentos com nomes semelhantes — o agente pergunta qual deles o utilizador pretende, em vez de assumir uma resposta.',
        ],
      },
      {
        heading: 'Criar ordens por linguagem natural',
        body: [
          'É possível pedir ao agente, em português corrente, para criar uma ordem de serviço — por exemplo "cria uma OT corretiva para o compressor 3, avaria elétrica" — e o agente preenche progressivamente os campos necessários, confirmando os dados antes de submeter.',
        ],
      },
      {
        heading: 'Confirmação antes de ações críticas',
        body: [
          'Para ações com impacto real, como criar, alterar ou cancelar uma ordem de serviço, o agente pede sempre confirmação explícita antes de executar, evitando alterações acidentais causadas por interpretações incorretas.',
        ],
      },
    ],
  },
  {
    slug: 'nfc-qr-codes',
    icon: 'fa-qrcode',
    title: 'NFC & QR Codes',
    desc: 'Associa etiquetas físicas aos ativos para leitura instantânea no terreno.',
    intro: [
      'Identificar fisicamente cada ativo com uma etiqueta NFC ou QR Code elimina a necessidade de procurar manualmente o equipamento na aplicação — basta aproximar o telemóvel ou apontar a câmara.',
    ],
    sections: [
      {
        heading: 'Escolher a tecnologia certa',
        body: [
          'Códigos QR são económicos e fáceis de imprimir, mas degradam-se com sujidade, calor ou exposição solar direta. Etiquetas NFC são mais resistentes e permitem leitura por aproximação, mesmo com luvas de trabalho, a um custo unitário mais elevado.',
          'Uma abordagem híbrida — NFC em equipamentos críticos ou de difícil acesso, QR Code no restante parque de ativos — costuma ser a mais eficiente em custo.',
        ],
      },
      {
        heading: 'Associar uma etiqueta a um ativo',
        body: [
          'A associação é feita diretamente na ficha do equipamento, sem necessidade de configuração adicional no dispositivo.',
        ],
        steps: [
          'Abre a ficha do equipamento em Ativos',
          'Seleciona "Associar etiqueta"',
          'Aproxima a etiqueta NFC do telemóvel, ou lê o código QR gerado pela plataforma para o imprimir',
          'A etiqueta fica associada de forma permanente ao equipamento, mesmo que este seja movido de local',
        ],
      },
      {
        heading: 'Leitura no terreno',
        body: [
          'No terreno, o técnico aproxima o telemóvel da etiqueta NFC ou digitaliza o QR Code com a câmara para abrir de imediato a ficha do equipamento, com o histórico completo e a opção de criar uma nova ordem de serviço em segundos.',
          'Esta leitura funciona mesmo sem rede, graças à arquitetura offline da aplicação — os dados sincronizam automaticamente assim que a ligação for reposta.',
        ],
      },
    ],
  },
  {
    slug: 'integracoes-api',
    icon: 'fa-plug',
    title: 'Integrações & API',
    desc: 'Liga o ManuGent a ERPs, sensores IoT e outras ferramentas da tua stack.',
    intro: [
      'A API REST do ManuGent permite integrar a plataforma com o teu ERP, sensores IoT ou ferramentas internas, mantendo os dados de manutenção sincronizados com o resto da tua stack.',
    ],
    sections: [
      {
        heading: 'Autenticação',
        body: [
          'Todos os pedidos à API são autenticados através de uma chave pessoal ou de organização, enviada no cabeçalho Authorization. Consulta a referência da API para exemplos completos de pedidos.',
        ],
      },
      {
        heading: 'Endpoints principais',
        body: [
          'A API expõe endpoints para gerir ativos, ordens de serviço, indicadores (MTBF, MTTR, OEE) e utilizadores, seguindo convenções REST previsíveis. A lista completa de endpoints, métodos e exemplos está disponível na referência da API.',
        ],
      },
      {
        heading: 'Portal do cliente',
        body: [
          'Para integrações voltadas para clientes finais, o ManuGent disponibiliza endpoints dedicados ao portal do cliente — permitindo consultar o histórico de equipamentos, pedir novas intervenções, ver relatórios em PDF e aprovar orçamentos diretamente a partir de um sistema externo.',
        ],
      },
      {
        heading: 'Notificações e eventos',
        body: [
          'Mudanças de estado numa ordem de serviço — como a conclusão de uma intervenção ou a aprovação de um orçamento — geram notificações que podem ser consultadas via API, permitindo construir integrações reativas com o teu ERP ou sistema de tickets.',
        ],
      },
      {
        heading: 'Limites de utilização',
        body: [
          'A API está sujeita a um limite de 120 pedidos por minuto por chave de API. Se a tua integração precisar de um limite mais elevado, contacta a equipa comercial.',
        ],
      },
    ],
  },
]

export function getDocGuideBySlug(slug: string | undefined): DocGuide | undefined {
  return DOC_GUIDES.find(guide => guide.slug === slug)
}
