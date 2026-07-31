import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePersistentState } from './usePersistentState'

export interface BlogComment {
  id: string
  author: string
  message: string
  createdAt: string
}

interface PostEngagement {
  liked: boolean
  likeCount: number
  viewCount: number
  comments: BlogComment[]
}

type EngagementStore = Record<string, PostEngagement>

const STORAGE_KEY = 'manugent:blog-engagement'

const BASE_LIKES: Record<string, number> = {
  'agente-ia-diagnostico-avarias': 128,
  'mtbf-mttr-oee-indicadores': 94,
  'caso-cliente-reducao-paragem-34': 76,
  'manutencao-offline-pwa': 61,
  'ia-generativa-manutencao-industrial': 143,
  'nfc-vs-qr-code-ativos': 52,
}

const BASE_VIEWS: Record<string, number> = {
  'agente-ia-diagnostico-avarias': 2140,
  'mtbf-mttr-oee-indicadores': 1780,
  'caso-cliente-reducao-paragem-34': 1420,
  'manutencao-offline-pwa': 980,
  'ia-generativa-manutencao-industrial': 2510,
  'nfc-vs-qr-code-ativos': 860,
}

function emptyEntry(slug: string): PostEngagement {
  return {
    liked: false,
    likeCount: BASE_LIKES[slug] ?? 0,
    viewCount: BASE_VIEWS[slug] ?? 0,
    comments: [],
  }
}

/** Estatísticas de um post sem side-effects, para uso em listagens (grelha do blog). */
export function useBlogStats(slug: string) {
  const [store] = usePersistentState<EngagementStore>(STORAGE_KEY, {})
  const entry = store[slug] ?? emptyEntry(slug)
  return { likeCount: entry.likeCount, viewCount: entry.viewCount, commentCount: entry.comments.length }
}

/** Hook completo de interação para a página de um post individual. */
export function useBlogEngagement(slug: string) {
  const [store, setStore] = usePersistentState<EngagementStore>(STORAGE_KEY, {})
  const [hasCountedView, setHasCountedView] = useState(false)

  const entry = useMemo<PostEngagement>(() => store[slug] ?? emptyEntry(slug), [store, slug])

  // Regista uma visualização única por sessão do browser para este post.
  useEffect(() => {
    if (!slug || hasCountedView) return
    setHasCountedView(true)
    setStore(prev => {
      const current = prev[slug] ?? emptyEntry(slug)
      return { ...prev, [slug]: { ...current, viewCount: current.viewCount + 1 } }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const toggleLike = useCallback(() => {
    setStore(prev => {
      const current = prev[slug] ?? emptyEntry(slug)
      const liked = !current.liked
      return {
        ...prev,
        [slug]: {
          ...current,
          liked,
          likeCount: Math.max(0, current.likeCount + (liked ? 1 : -1)),
        },
      }
    })
  }, [slug, setStore])

  const addComment = useCallback((author: string, message: string) => {
    const trimmedMessage = message.trim()
    const trimmedAuthor = author.trim() || 'Anónimo'
    if (!trimmedMessage) return

    const comment: BlogComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: trimmedAuthor,
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
    }

    setStore(prev => {
      const current = prev[slug] ?? emptyEntry(slug)
      return { ...prev, [slug]: { ...current, comments: [...current.comments, comment] } }
    })
  }, [slug, setStore])

  return {
    liked: entry.liked,
    likeCount: entry.likeCount,
    viewCount: entry.viewCount,
    comments: entry.comments,
    toggleLike,
    addComment,
  }
}
