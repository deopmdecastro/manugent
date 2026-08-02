// ============================================================================
// ManuGent — Blog Posts from the real database (via /api/blog)
// Substitutes the static src/frontend/src/data/blogPosts.ts by consuming the
// blog_posts table seeded by scripts/seed-demo-data.mjs.
// ============================================================================

import { useEffect, useState } from 'react'
import { apiClient } from '../services/apiClient'
import type { BlogPost } from '../data/blogPosts'

// ── Raw row shape from GET /api/blog ────────────────────────────────────────
interface ApiBlogRow {
  id: string
  slug: string
  title: string
  category: string | null
  excerpt: string | null
  content: string | null
  author: string | null
  read_time_min: number
  published: boolean
  views: number
  cover_gradient: string | null
  published_at: string
  created_at: string
}

// ── Map tailwind gradient classes to CSS gradients ──────────────────────────
const GRADIENT_MAP: Record<string, string> = {
  'from-blue-500 to-cyan-400': 'linear-gradient(135deg, #3b82f6, #22d3ee)',
  'from-purple-500 to-pink-400': 'linear-gradient(135deg, #a855f7, #f472b6)',
  'from-emerald-500 to-teal-400': 'linear-gradient(135deg, #10b981, #2dd4bf)',
  'from-orange-500 to-amber-400': 'linear-gradient(135deg, #f97316, #fbbf24)',
  'from-indigo-500 to-blue-400': 'linear-gradient(135deg, #6366f1, #60a5fa)',
  'from-rose-500 to-red-400': 'linear-gradient(135deg, #f43f5e, #f87171)',
  'from-cyan-500 to-blue-400': 'linear-gradient(135deg, #06b6d4, #60a5fa)',
  'from-violet-500 to-purple-400': 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  'from-teal-500 to-emerald-400': 'linear-gradient(135deg, #14b8a6, #34d399)',
  'from-amber-500 to-orange-400': 'linear-gradient(135deg, #f59e0b, #fb923c)',
  'from-red-500 to-rose-400': 'linear-gradient(135deg, #ef4444, #fb7185)',
  'from-blue-500 to-indigo-400': 'linear-gradient(135deg, #3b82f6, #818cf8)',
}

const CATEGORY_ICONS: Record<string, string> = {
  'Produto': 'fa-solid fa-brain',
  'Indicadores': 'fa-solid fa-chart-line',
  'Casos de Estudo': 'fa-solid fa-industry',
  'Tendências': 'fa-solid fa-microchip',
  'Tecnologia': 'fa-solid fa-tag',
  'Boas Práticas': 'fa-solid fa-list-check',
  'Gestão': 'fa-solid fa-briefcase',
  'Segurança': 'fa-solid fa-shield-halved',
  'Negócio': 'fa-solid fa-coins',
}

function splitParagraphs(content: string | null): string[] {
  if (!content) return []
  return content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function mapApiPost(p: ApiBlogRow): BlogPost {
  const category = p.category || 'Geral'
  const readTimeMin = p.read_time_min || 5
  const paragraphs = splitParagraphs(p.content)
  const gradientClass = p.cover_gradient || ''
  return {
    slug: p.slug,
    category: { pt: category, en: category },
    title: { pt: p.title, en: p.title },
    excerpt: { pt: p.excerpt || '', en: p.excerpt || '' },
    content: { pt: paragraphs, en: paragraphs },
    author: p.author || 'Equipa ManuGent',
    date: formatDate(p.published_at || p.created_at),
    readTime: { pt: `${readTimeMin} min`, en: `${readTimeMin} min` },
    coverIcon: CATEGORY_ICONS[category] || 'fa-solid fa-newspaper',
    coverGradient: GRADIENT_MAP[gradientClass] || 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  }
}

// ── Hook: list posts ────────────────────────────────────────────────────────
export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient<{ posts: ApiBlogRow[] }>('/api/blog')
      .then(data => setPosts((data.posts || []).map(mapApiPost)))
      .catch(err => setError(err instanceof Error ? err.message : 'Erro ao carregar blog'))
  }, [])

  return { posts, error }
}

// ── Hook: single post by slug ───────────────────────────────────────────────
export function useBlogPost(slug: string | undefined) {
  const { posts, error } = useBlogPosts()
  const post = posts?.find(p => p.slug === slug) ?? null
  return { post, posts, error }
}

