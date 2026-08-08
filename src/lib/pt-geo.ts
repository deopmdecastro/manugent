// ── Geografia de Portugal: Distritos, Concelhos e Regiões Autónomas ────────
// Usado pelo motor de busca global para permitir pesquisar edifícios por
// distrito mesmo quando só temos guardado o concelho/cidade, e para
// auto-preencher o campo `distrito` a partir do `concelho`/`city` ao
// criar/editar edifícios.
//
// Nota: lista abrangente dos 308 concelhos + regiões autónomas (Açores e
// Madeira). Pode conter pequenas imprecisões de fronteira administrativa,
// mas cobre bem o objetivo de pesquisa/normalização.

export const DISTRITOS_CONCELHOS: Record<string, string[]> = {
  Aveiro: [
    'Águeda', 'Albergaria-a-Velha', 'Anadia', 'Arouca', 'Aveiro',
    'Castelo de Paiva', 'Espinho', 'Estarreja', 'Ílhavo', 'Mealhada',
    'Murtosa', 'Oliveira de Azeméis', 'Oliveira do Bairro', 'Ovar',
    'Santa Maria da Feira', 'São João da Madeira', 'Sever do Vouga',
    'Vagos', 'Vale de Cambra',
  ],
  Beja: [
    'Aljustrel', 'Almodôvar', 'Alvito', 'Barrancos', 'Beja',
    'Castro Verde', 'Cuba', 'Ferreira do Alentejo', 'Mértola', 'Moura',
    'Odemira', 'Ourique', 'Serpa', 'Vidigueira',
  ],
  Braga: [
    'Amares', 'Barcelos', 'Braga', 'Cabeceiras de Basto',
    'Celorico de Basto', 'Esposende', 'Fafe', 'Guimarães',
    'Póvoa de Lanhoso', 'Terras de Bouro', 'Vieira do Minho',
    'Vila Nova de Famalicão', 'Vila Verde', 'Vizela',
  ],
  Bragança: [
    'Alfândega da Fé', 'Bragança', 'Carrazeda de Ansiães',
    'Freixo de Espada à Cinta', 'Macedo de Cavaleiros',
    'Miranda do Douro', 'Mirandela', 'Mogadouro',
    'Torre de Moncorvo', 'Vila Flor', 'Vimioso', 'Vinhais',
  ],
  'Castelo Branco': [
    'Belmonte', 'Castelo Branco', 'Covilhã', 'Fundão', 'Idanha-a-Nova',
    'Oleiros', 'Penamacor', 'Proença-a-Nova', 'Sertã', 'Vila de Rei',
    'Vila Velha de Ródão',
  ],
  Coimbra: [
    'Arganil', 'Cantanhede', 'Coimbra', 'Condeixa-a-Nova',
    'Figueira da Foz', 'Góis', 'Lousã', 'Mira', 'Miranda do Corvo',
    'Montemor-o-Velho', 'Oliveira do Hospital', 'Pampilhosa da Serra',
    'Penacova', 'Penela', 'Soure', 'Tábua', 'Vila Nova de Poiares',
  ],
  Évora: [
    'Alandroal', 'Arraiolos', 'Borba', 'Estremoz', 'Évora',
    'Montemor-o-Novo', 'Mora', 'Mourão', 'Portel', 'Redondo',
    'Reguengos de Monsaraz', 'Vendas Novas', 'Viana do Alentejo',
    'Vila Viçosa',
  ],
  Faro: [
    'Albufeira', 'Alcoutim', 'Aljezur', 'Castro Marim', 'Faro',
    'Lagoa', 'Lagos', 'Loulé', 'Monchique', 'Olhão', 'Portimão',
    'São Brás de Alportel', 'Silves', 'Tavira', 'Vila do Bispo',
    'Vila Real de Santo António',
  ],
  Guarda: [
    'Aguiar da Beira', 'Almeida', 'Celorico da Beira',
    'Figueira de Castelo Rodrigo', 'Fornos de Algodres', 'Gouveia',
    'Guarda', 'Manteigas', 'Mêda', 'Pinhel', 'Sabugal', 'Seia',
    'Trancoso', 'Vila Nova de Foz Côa',
  ],
  Leiria: [
    'Alcobaça', 'Alvaiázere', 'Ansião', 'Batalha', 'Bombarral',
    'Caldas da Rainha', 'Castanheira de Pêra', 'Figueiró dos Vinhos',
    'Leiria', 'Marinha Grande', 'Nazaré', 'Óbidos', 'Pedrógão Grande',
    'Peniche', 'Pombal', 'Porto de Mós',
  ],
  Lisboa: [
    'Alenquer', 'Amadora', 'Arruda dos Vinhos', 'Azambuja', 'Cadaval',
    'Cascais', 'Lisboa', 'Loures', 'Lourinhã', 'Mafra', 'Odivelas',
    'Oeiras', 'Sintra', 'Sobral de Monte Agraço', 'Torres Vedras',
    'Vila Franca de Xira',
  ],
  Portalegre: [
    'Alter do Chão', 'Arronches', 'Avis', 'Campo Maior',
    'Castelo de Vide', 'Crato', 'Elvas', 'Fronteira', 'Gavião',
    'Marvão', 'Monforte', 'Nisa', 'Ponte de Sor', 'Portalegre',
    'Sousel',
  ],
  Porto: [
    'Amarante', 'Baião', 'Felgueiras', 'Gondomar', 'Lousada', 'Maia',
    'Marco de Canaveses', 'Matosinhos', 'Paços de Ferreira', 'Paredes',
    'Penafiel', 'Porto', 'Póvoa de Varzim', 'Santo Tirso', 'Trofa',
    'Valongo', 'Vila do Conde', 'Vila Nova de Gaia',
  ],
  Santarém: [
    'Abrantes', 'Alcanena', 'Almeirim', 'Alpiarça', 'Benavente',
    'Cartaxo', 'Chamusca', 'Constância', 'Coruche', 'Entroncamento',
    'Ferreira do Zêzere', 'Golegã', 'Mação', 'Ourém', 'Rio Maior',
    'Salvaterra de Magos', 'Santarém', 'Sardoal', 'Tomar',
    'Torres Novas', 'Vila Nova da Barquinha',
  ],
  Setúbal: [
    'Alcácer do Sal', 'Alcochete', 'Almada', 'Barreiro', 'Grândola',
    'Moita', 'Montijo', 'Palmela', 'Santiago do Cacém', 'Seixal',
    'Sesimbra', 'Setúbal', 'Sines',
  ],
  'Viana do Castelo': [
    'Arcos de Valdevez', 'Caminha', 'Melgaço', 'Monção',
    'Paredes de Coura', 'Ponte da Barca', 'Ponte de Lima', 'Valença',
    'Viana do Castelo', 'Vila Nova de Cerveira',
  ],
  'Vila Real': [
    'Alijó', 'Boticas', 'Chaves', 'Mesão Frio', 'Mondim de Basto',
    'Montalegre', 'Murça', 'Peso da Régua', 'Ribeira de Pena',
    'Sabrosa', 'Santa Marta de Penaguião', 'Valpaços',
    'Vila Pouca de Aguiar', 'Vila Real',
  ],
  Viseu: [
    'Armamar', 'Carregal do Sal', 'Castro Daire', 'Cinfães', 'Lamego',
    'Mangualde', 'Moimenta da Beira', 'Mortágua', 'Nelas',
    'Oliveira de Frades', 'Penalva do Castelo', 'Penedono', 'Resende',
    'Santa Comba Dão', 'São João da Pesqueira', 'São Pedro do Sul',
    'Sátão', 'Sernancelhe', 'Tabuaço', 'Tarouca', 'Tondela',
    'Vila Nova de Paiva', 'Viseu', 'Vouzela',
  ],
  Açores: [
    'Angra do Heroísmo', 'Calheta (São Jorge)', 'Corvo', 'Horta',
    'Lagoa (Açores)', 'Lajes das Flores', 'Lajes do Pico', 'Madalena',
    'Nordeste', 'Ponta Delgada', 'Povoação', 'Praia da Vitória',
    'Ribeira Grande', 'Santa Cruz da Graciosa', 'Santa Cruz das Flores',
    'São Roque do Pico', 'Velas', 'Vila do Porto', 'Vila Franca do Campo',
  ],
  Madeira: [
    'Calheta (Madeira)', 'Câmara de Lobos', 'Funchal', 'Machico',
    'Ponta do Sol', 'Porto Moniz', 'Porto Santo', 'Ribeira Brava',
    'Santa Cruz', 'Santana', 'São Vicente',
  ],
}

// ── Normalização (sem acentos, minúsculas, sem pontuação) ─────────────────

export function normalizePt(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Índices derivados (construídos uma única vez) ──────────────────────────

const CONCELHO_TO_DISTRITO = new Map<string, string>()
const DISTRITO_NORMALIZED = new Map<string, string>()

for (const [distrito, concelhos] of Object.entries(DISTRITOS_CONCELHOS)) {
  DISTRITO_NORMALIZED.set(normalizePt(distrito), distrito)
  for (const concelho of concelhos) {
    CONCELHO_TO_DISTRITO.set(normalizePt(concelho), distrito)
  }
}

/**
 * Dado um nome de concelho (ou cidade, já que muitas cidades == concelho em
 * Portugal), devolve o distrito/região autónoma correspondente.
 */
export function lookupDistrito(concelhoOrCity: string | null | undefined): string | null {
  if (!concelhoOrCity) return null
  const key = normalizePt(concelhoOrCity)
  return CONCELHO_TO_DISTRITO.get(key) ?? null
}

/**
 * Devolve true se o texto corresponde (exata ou parcialmente, sem acentos)
 * a um nome de distrito/região autónoma conhecido.
 */
export function matchDistrito(text: string): string | null {
  const key = normalizePt(text)
  if (DISTRITO_NORMALIZED.has(key)) return DISTRITO_NORMALIZED.get(key)!
  // Correspondência parcial: "porto" dentro de "distrito do porto", etc.
  for (const [norm, original] of DISTRITO_NORMALIZED) {
    if (norm.includes(key) || key.includes(norm)) return original
  }
  return null
}

/** Lista de concelhos pertencentes a um distrito/região (nomes originais). */
export function concelhosDoDistrito(distrito: string): string[] {
  return DISTRITOS_CONCELHOS[distrito] ?? []
}

export function listDistritos(): string[] {
  return Object.keys(DISTRITOS_CONCELHOS)
}

export function listConcelhos(): string[] {
  return Object.values(DISTRITOS_CONCELHOS).flat()
}
