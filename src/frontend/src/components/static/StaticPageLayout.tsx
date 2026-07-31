import { type ReactNode, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Navbar } from '../landing/Navbar'
import { Footer } from '../landing/Footer'

interface StaticPageLayoutProps {
  badge?: string
  title: ReactNode
  desc?: string
  children: ReactNode
  /** Narrower content column, good for legal/prose pages. Defaults to true. */
  narrow?: boolean
}

export function StaticPageLayout({ badge, title, desc, children, narrow = true }: StaticPageLayoutProps) {
  const { theme } = useTheme()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="l-page static-page" data-theme={theme}>
      <div className="l-noise" aria-hidden="true" />
      <div className="l-particles" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`l-particle l-particle-${(i % 4) + 1}`} />
        ))}
      </div>

      <Navbar />

      <header className="static-hero">
        {badge && <span className="badge badge-primary static-hero-badge">{badge}</span>}
        <h1 className="static-hero-title">{title}</h1>
        {desc && <p className="static-hero-desc">{desc}</p>}
      </header>

      <main className={`static-content${narrow ? ' static-content-narrow' : ''}`}>
        {children}
      </main>

      <Footer />
    </div>
  )
}
