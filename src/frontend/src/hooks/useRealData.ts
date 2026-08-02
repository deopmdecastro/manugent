// ============================================================================
// ManuGent — Real Data Hooks
// Consome os endpoints reais do servidor em vez de dados fictícios.
// ============================================================================

import { useEffect, useState } from 'react'
import { apiClient } from '../services/apiClient'

// ── /api/stats ───────────────────────────────────────────────────────────────

export interface RealStats {
  workOrders: {
    open: number
    inProgress: number
    urgent: number
    completed: number
    total: number
  }
  equipment: {
    total: number
    active: number
  }
  notifications: {
    unread: number
  }
}

export function useRealStats(): RealStats | null {
  const [stats, setStats] = useState<RealStats | null>(null)

  useEffect(() => {
    apiClient<RealStats>('/api/stats')
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  return stats
}

// ── /api/testimonials ────────────────────────────────────────────────────────

export interface RealTestimonial {
  id: string
  name: string
  role: string
  company: string
  text: string
  rating: number
  approved: boolean
  featured: boolean
  createdAt: string
}

export function useRealTestimonials(): RealTestimonial[] | null {
  const [items, setItems] = useState<RealTestimonial[] | null>(null)

  useEffect(() => {
    apiClient<{ items: RealTestimonial[] }>('/api/testimonials')
      .then(data => setItems(data.items))
      .catch(() => setItems(null))
  }, [])

  return items
}
