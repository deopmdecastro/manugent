import { Navbar } from '../components/landing/Navbar'
import { Hero } from '../components/landing/Hero'
import { StatsBar } from '../components/landing/StatsBar'
import { CompanyLogos } from '../components/landing/CompanyLogos'
import { FeaturesGrid } from '../components/landing/FeaturesGrid'
import { CTASection } from '../components/landing/CTASection'
import { Footer } from '../components/landing/Footer'

export function LandingPage() {

  return (
    <div className="l-page">
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
      <CTASection />
      <Footer />
    </div>
  )
}
