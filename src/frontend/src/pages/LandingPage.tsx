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
