import { useEffect } from 'react'

/**
 * Adds `.l-in-view` to any `.l-reveal` element once it scrolls into the
 * viewport. Runs once per mount (landing page), respects prefers-reduced-motion.
 */
export function useScrollReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = document.querySelectorAll('.l-reveal')

    if (prefersReduced) {
      els.forEach(el => el.classList.add('l-in-view'))
      return
    }

    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('l-in-view')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}
