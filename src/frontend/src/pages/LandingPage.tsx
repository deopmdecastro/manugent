import { useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Navbar } from '../components/landing/Navbar'
import { Hero } from '../components/landing/Hero'
import { StatsBar } from '../components/landing/StatsBar'
import { CompanyLogos } from '../components/landing/CompanyLogos'
import { FeaturesGrid } from '../components/landing/FeaturesGrid'
import { Testimonials } from '../components/landing/Testimonials'
import { CTASection } from '../components/landing/CTASection'
import { Footer } from '../components/landing/Footer'
import { SupportWidget } from '../components/landing/SupportWidget'

export function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const pageElement = pageRef.current
    if (!pageElement) return

    const revealElements = Array.from(pageElement.querySelectorAll<HTMLElement>('.l-reveal'))
    const showElement = (element: HTMLElement) => element.classList.add('l-in-view')

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(showElement)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            showElement(entry.target as HTMLElement)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )

    revealElements.forEach(element => {
      const rect = element.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) showElement(element)
      else observer.observe(element)
    })
    pageElement.classList.add('l-reveal-ready')

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={pageRef} className="l-page" data-theme={theme}>
      {/* Ambient background layer: noise + slow-drifting particles */}
      <div className="l-noise" aria-hidden="true" />
      <div className="l-particles" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`l-particle l-particle-${(i % 4) + 1}`} />
        ))}
      </div>

      <Navbar />
      <Hero />
      <StatsBar />
      <CompanyLogos />
      <FeaturesGrid />
      <Testimonials />
      <CTASection />
      <Footer />
      <SupportWidget />
    </div>
  )
}
