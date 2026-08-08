// ── Fuzzy Search & Spell Correction for ManuGent ──────────────────────────
// Provides Levenshtein-based fuzzy matching, spell correction for common
// commands, and entity disambiguation — all in Portuguese context.

// ── Types ──────────────────────────────────────────────────────────────────

export interface FuzzyMatch<T = string> {
  item: T
  score: number        // 0-1, higher = better match
  distance: number     // raw edit distance
}

export interface DisambiguationResult<T = string> {
  exact: T | null
  candidates: FuzzyMatch<T>[]
  suggestion: string   // human-readable suggestion text
  needsConfirmation: boolean
}

export interface SpellCorrection {
  original: string
  corrected: string
  confidence: number   // 0-1
  suggestion: string   // "Quis dizer 'X'?"
}

// ── Levenshtein Distance ───────────────────────────────────────────────────

export function levenshteinDistance(a: string, b: string): number {
  const alen = a.length
  const blen = b.length

  // Use two rows for O(min(n,m)) space
  const matrix: number[] = Array.from({ length: blen + 1 }, (_, i) => i)

  for (let i = 1; i <= alen; i++) {
    let prevDiagonal = matrix[0]
    matrix[0] = i
    for (let j = 1; j <= blen; j++) {
      const temp = matrix[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j] = Math.min(
        matrix[j] + 1,        // deletion
        matrix[j - 1] + 1,    // insertion
        prevDiagonal + cost    // substitution
      )
      prevDiagonal = temp
    }
  }

  return matrix[blen]
}

// ── Normalização sem acentos (para tolerar "sao joao" == "São João") ──────

export function stripDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function normalizeForSearch(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Normalised Score ───────────────────────────────────────────────────────

export function fuzzyScore(query: string, target: string): number {
  const q = normalizeForSearch(query)
  const t = normalizeForSearch(target)

  if (q === t) return 1.0
  if (t.includes(q)) return 0.95
  if (q.includes(t)) return 0.9

  // Substring partial match (e.g. "joa" in "joão pedro")
  const qWords = q.split(/\s+/)
  const tWords = t.split(/\s+/)

  let wordMatchScore = 0
  for (const qw of qWords) {
    for (const tw of tWords) {
      const dist = levenshteinDistance(qw, tw)
      const maxLen = Math.max(qw.length, tw.length)
      const score = 1 - dist / maxLen

      // Boost very short queries that match prefix
      if (tw.startsWith(qw)) {
        wordMatchScore = Math.max(wordMatchScore, 0.92 + (qw.length / tw.length) * 0.08)
      } else if (score > 0.6) {
        wordMatchScore = Math.max(wordMatchScore, score * 0.88)
      }
    }
  }

  if (wordMatchScore > 0) return wordMatchScore

  // Full string fuzzy with prefix bonus
  const dist = levenshteinDistance(q, t)
  const maxLen = Math.max(q.length, t.length)
  let score = 1 - dist / maxLen

  if (t.startsWith(q)) {
    score = Math.max(score, 0.85 + (q.length / t.length) * 0.15)
  }

  return Math.max(0, score)
}

// ── Fuzzy Search over a List ───────────────────────────────────────────────

export function fuzzySearch<T>(
  query: string,
  items: T[],
  keyFn: (item: T) => string,
  threshold = 0.5,
  maxResults = 5
): FuzzyMatch<T>[] {
  const results: FuzzyMatch<T>[] = []

  for (const item of items) {
    const key = keyFn(item)
    const score = fuzzyScore(query, key)
    if (score >= threshold) {
      results.push({
        item,
        score,
        distance: levenshteinDistance(normalizeForSearch(query), normalizeForSearch(key)),
      })
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.distance - b.distance)
    .slice(0, maxResults)
}

// ── Disambiguation ─────────────────────────────────────────────────────────

export function disambiguate<T>(
  query: string,
  items: T[],
  keyFn: (item: T) => string,
  threshold = 0.5
): DisambiguationResult<T> {
  const exact = query.toLowerCase().trim()
  const exactMatch = items.find(item => keyFn(item).toLowerCase() === exact)

  if (exactMatch) {
    return {
      exact: exactMatch,
      candidates: [],
      suggestion: '',
      needsConfirmation: false,
    }
  }

  const candidates = fuzzySearch(query, items, keyFn, threshold)

  if (candidates.length === 0) {
    return {
      exact: null,
      candidates: [],
      suggestion: `Não encontrei "${query}". Pode ser mais específico?`,
      needsConfirmation: true,
    }
  }

  if (candidates.length === 1 && candidates[0].score >= 0.9) {
    return {
      exact: candidates[0].item,
      candidates,
      suggestion: `Refere-se a "${keyFn(candidates[0].item)}"?`,
      needsConfirmation: false,
    }
  }

  // Multiple candidates — needs user to pick
  const names = candidates.map((c, i) => `${i + 1}. ${keyFn(c.item)}`)
  return {
    exact: null,
    candidates,
    suggestion: `Encontrei vários:\n${names.join('\n')}\nQual pretende?`,
    needsConfirmation: true,
  }
}

// ── Spell Correction: Common Command Typos ─────────────────────────────────

const COMMAND_CORRECTIONS: Record<string, string> = {
  // OT / Work Order
  'oy': 'criar ot',
  'ori': 'criar ot',
  'oriar': 'criar ot',
  'ordem': 'criar ot',
  'orddem': 'criar ot',
  'ordemm': 'criar ot',
  'ordm': 'criar ot',
  'ord': 'criar ot',
  'ott': 'ot',
  'abri': 'abrir',
  'abrir ot': 'consultar ot',
  'fexar': 'fechar ot',
  'fexar ot': 'fechar ot',
  'feixar': 'fechar ot',
  'fechr': 'fechar',
  'mostra': 'consultar',
  'mostrar': 'consultar',
  'ver': 'consultar',
  'lista': 'consultar',
  'listar': 'consultar',
  'onde esta': 'consultar',

  // Equipment
  'equipamento': 'equipamento',
  'equip': 'equipamento',
  'compreçor': 'compressor',
  'compresor': 'compressor',
  'compressor': 'compressor',
  'gerador': 'gerador',
  'motor': 'motor',
  'bomba': 'bomba',

  // Technicians
  'tecnico': 'técnico',
  'tecnic': 'técnico',
  'tecn': 'técnico',
  'joa': 'joão',
  'joao': 'joão',
  'pedr': 'pedro',
  'migue': 'miguel',

  // Clients
  'cliente': 'cliente',
  'client': 'cliente',

  // Status
  'aberta': 'aberta',
  'aberto': 'aberto',
  'fexado': 'fechado',
  'fexada': 'fechada',
  'execuçao': 'execução',
  'execucao': 'execução',
  'pendente': 'pendente',

  // Maintenance
  'manutençao': 'manutenção',
  'manutencao': 'manutenção',
  'manut': 'manutenção',
  'preventiva': 'preventiva',
  'preventiv': 'preventiva',
  'corretiva': 'corretiva',
  'correctiva': 'corretiva',

  // Stock / Material
  'stock': 'stock',
  'material': 'material',
  'peca': 'peça',
  'peças': 'peças',
  'rolamento': 'rolamento',
  'rolament': 'rolamento',

  // Calendar
  'agenda': 'calendário',
  'agendar': 'calendário',
  'calendario': 'calendário',

  // Checklists
  'checklist': 'checklist',
  'chcklist': 'checklist',
  'cklist': 'checklist',
  'ronda': 'checklist',

  // Incidents
  'incidente': 'incidente',
  'acidente': 'incidente',
  'ocorrencia': 'incidente',
  'ocorrência': 'incidente',

  // Purchase
  'compra': 'compra',
  'compras': 'compras',
  'encomenda': 'compra',
  'pedido': 'compra',

  // Quotes
  'orçamento': 'orçamento',
  'orcamento': 'orçamento',
  'orcam': 'orçamento',
  'fatura': 'orçamento',

  // Reports
  'relatorio': 'relatório',
  'relatório': 'relatório',
  'kpi': 'relatório',
  'indicadores': 'relatório',
  'dashboard': 'relatório',

  // Buildings
  'edificio': 'edifício',
  'edifício': 'edifício',
  'edifcio': 'edifício',
  'predio': 'edifício',
  'prédio': 'edifício',
}

const INTENT_PATTERNS: Array<{ regex: RegExp; intent: string; entity?: string }> = [
  { regex: /\bcriar?\s*(ot|ordem|nova|novo)?\b/i, intent: 'criar_ot' },
  { regex: /\b(abrir|abri)\s*(ot|ordem)?\b/i, intent: 'abrir_ot' },
  { regex: /\b(fechar|fexar|fechr|encerrar)\s*(ot|ordem)?\b/i, intent: 'fechar_ot' },
  { regex: /\b(consultar|ver|mostrar?)\s*(ot|ordem)?\b/i, intent: 'consultar_ot' },
  { regex: /\b(procurar|buscar|pesquisar)\s*(ot|ordem)?\b/i, intent: 'pesquisar_ot' },
  { regex: /\bcriar?\s*preventiva\b/i, intent: 'criar_preventiva' },
  { regex: /\bconsultar\s*(equipamento|stock|técnico|técnicos|cliente)\b/i, intent: 'consultar_entidade' },
  { regex: /\b(preciso|falta|stock|material|peça)\b/i, intent: 'consultar_stock' },
  { regex: /\b(histórico|historico|historia)\b/i, intent: 'consultar_historico' },
  { regex: /\b(orçamento|orcamento|orçar|faturar)\b/i, intent: 'criar_orcamento' },
  { regex: /\b(compra|pedido|encomenda)\b/i, intent: 'criar_compra' },
  { regex: /\b(checklist|ronda|inspeção|inspecao)\b/i, intent: 'criar_checklist' },
  { regex: /\b(incidente|acidente|ocorrência|ocorrencia)\b/i, intent: 'criar_incidente' },
  { regex: /\b(relatório|relatorio|kpi|indicadores)\b/i, intent: 'gerar_relatorio' },
  { regex: /\b(ajuda|help|socorro|perdido)\b/i, intent: 'pedir_ajuda' },
]

export interface NLPResult {
  original: string
  corrected: string
  intents: string[]
  entityHints: string[]  // e.g. ["compressor", "linha 3"]
  corrections: SpellCorrection[]
  wasCorrected: boolean
}

export function processWithCorrections(input: string): NLPResult {
  const original = input.trim()
  let corrected = original.toLowerCase()

  const corrections: SpellCorrection[] = []

  // Apply known word corrections
  const words = corrected.split(/\s+/)
  const correctedWords = words.map(word => {
    const correction = COMMAND_CORRECTIONS[word]
    if (correction) {
      corrections.push({
        original: word,
        corrected: correction,
        confidence: 0.95,
        suggestion: `Quis dizer "${correction}"?`,
      })
      return correction
    }
    return word
  })

  corrected = correctedWords.join(' ')

  // Detect intents
  const intents: string[] = []
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.regex.test(corrected)) {
      intents.push(pattern.intent)
    }
  }

  // Extract entity hints (capitalised words or quoted strings)
  const entityHints: string[] = []
  const quotedMatches = original.match(/"([^"]+)"/g)
  if (quotedMatches) {
    entityHints.push(...quotedMatches.map(m => m.replace(/"/g, '')))
  }

  // Also extract after "para" or "do"/"da" as potential entity hints
  const paraMatch = corrected.match(/\b(?:para|do|da|no|na)\s+(\S+(?:\s+\S+){0,3})/gi)
  if (paraMatch) {
    entityHints.push(...paraMatch.map(m => m.replace(/^(para|do|da|no|na)\s+/i, '')))
  }

  return {
    original,
    corrected,
    intents,
    entityHints,
    corrections,
    wasCorrected: corrected !== original.toLowerCase(),
  }
}

// ── Utility: Build a human-readable context prefix from NLP ──────────────────

export function buildNLPContextPrefix(nlp: NLPResult): string {
  const parts: string[] = []

  if (nlp.wasCorrected) {
    const corrText = nlp.corrections
      .map(c => `- "${c.original}" → "${c.corrected}"`)
      .join('\n')
    parts.push(`[NOTA: O utilizador escreveu com erros. Correções aplicadas:\n${corrText}]`)
  }

  if (nlp.intents.length > 0) {
    parts.push(`[Intenção detectada: ${nlp.intents.join(', ')}]`)
  }

  if (nlp.entityHints.length > 0) {
    parts.push(`[Entidades mencionadas: ${nlp.entityHints.join(', ')}]`)
  }

  return parts.join('\n')
}

// ── Database-powered fuzzy search processors ────────────────────────────────

// These will be completed in server.ts integration
export interface SearchableEntity {
  id: string
  name: string
  [key: string]: unknown
}

export function findBestMatch<T extends SearchableEntity>(
  query: string,
  entities: T[],
  field: keyof T = 'name' as keyof T
): DisambiguationResult<T> {
  return disambiguate(query, entities, (item) => String(item[field] ?? ''))
}

// ── Motor de busca multi-campo (endereços, IDs, palavras-chave, etc.) ─────
// Pensado para o "motor de busca global": cada registo tem vários campos
// (nome, endereço, cidade, distrito, código, etc.), cada um com um peso, e
// a query pode ter várias palavras que precisam de aparecer em qualquer
// campo, em qualquer ordem, com tolerância a erros/acentos.

export interface WeightedField {
  value: string | null | undefined
  weight?: number // default 1
}

export interface MultiFieldResult<T> {
  item: T
  score: number
  matchedFields: string[]
}

/**
 * Divide a query em tokens e verifica, para cada token, se aparece (exato,
 * como prefixo, ou por fuzzy match) em algum dos campos fornecidos. Cada
 * campo contribui com o seu peso ao score final. Devolve 0 se nenhum token
 * tiver correspondência mínima aceitável — bom para IDs curtos ("OT-102"),
 * localidades ("vila nova de gaia"), técnicos ("joao"), etc.
 */
export function multiFieldScore(
  query: string,
  fields: Record<string, WeightedField>
): { score: number; matchedFields: string[] } {
  const qNorm = normalizeForSearch(query)
  if (!qNorm) return { score: 0, matchedFields: [] }
  const tokens = qNorm.split(' ').filter(Boolean)

  let total = 0
  let maxPossible = 0
  const matchedFields: string[] = []

  for (const [fieldName, field] of Object.entries(fields)) {
    const weight = field.weight ?? 1
    maxPossible += weight
    const raw = field.value
    if (!raw) continue
    const fNorm = normalizeForSearch(String(raw))
    if (!fNorm) continue

    // Correspondência exacta da query completa neste campo — pontuação máxima.
    if (fNorm === qNorm) {
      total += weight * 1.0
      matchedFields.push(fieldName)
      continue
    }
    if (fNorm.includes(qNorm)) {
      total += weight * 0.95
      matchedFields.push(fieldName)
      continue
    }

    // Verifica token a token (para queries com várias palavras, por
    // exemplo "compressor linha 3" ou "joao vila nova de gaia").
    let tokenHits = 0
    for (const tok of tokens) {
      if (fNorm.includes(tok)) {
        tokenHits += 1
      } else {
        // fuzzy: aceita pequenos erros de escrita por token
        const words = fNorm.split(' ')
        const best = Math.max(...words.map(w => 1 - levenshteinDistance(tok, w) / Math.max(tok.length, w.length, 1)))
        if (best >= 0.72) tokenHits += best
      }
    }
    if (tokenHits > 0) {
      const ratio = tokenHits / tokens.length
      total += weight * ratio * 0.85
      matchedFields.push(fieldName)
    }
  }

  const score = maxPossible > 0 ? Math.min(1, total / maxPossible) : 0
  return { score, matchedFields }
}

/**
 * Busca multi-campo sobre uma lista de itens, cada um mapeado para os seus
 * campos pesquisáveis (com pesos). Ordena por score e devolve os melhores.
 */
export function multiFieldSearch<T>(
  query: string,
  items: T[],
  fieldsFn: (item: T) => Record<string, WeightedField>,
  threshold = 0.15,
  maxResults = 20
): MultiFieldResult<T>[] {
  const results: MultiFieldResult<T>[] = []
  for (const item of items) {
    const { score, matchedFields } = multiFieldScore(query, fieldsFn(item))
    if (score >= threshold) {
      results.push({ item, score, matchedFields })
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults)
}
