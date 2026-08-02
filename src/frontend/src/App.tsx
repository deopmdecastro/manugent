import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ContactAdminPage } from './pages/ContactAdminPage'
import { DocumentationPage } from './pages/static/DocumentationPage'
import { DocGuidePage } from './pages/static/DocGuidePage'
import { ApiPage } from './pages/static/ApiPage'
import { ChangelogPage } from './pages/static/ChangelogPage'
import { AboutPage } from './pages/static/AboutPage'
import { FeaturesPage } from './pages/static/FeaturesPage'
import { AiDemoPage } from './pages/AiDemoPage'
import { PricingPage } from './pages/PricingPage'
import { SuperAdminPage } from './pages/SuperAdminPage'
import { EmpresaAdminPage } from './pages/EmpresaAdminPage'
import { BlogPage } from './pages/static/BlogPage'
import { BlogPostPage } from './pages/static/BlogPostPage'
import { CareersPage } from './pages/static/CareersPage'
import { ContactPage } from './pages/static/ContactPage'
import { PartnersPage } from './pages/static/PartnersPage'
import { SuccessStoriesPage } from './pages/static/SuccessStoriesPage'
import { HelpCenterPage } from './pages/static/HelpCenterPage'
import { PrivacyPage } from './pages/static/PrivacyPage'
import { TermsPage } from './pages/static/TermsPage'
import { GdprPage } from './pages/static/GdprPage'
import { CookiesPage } from './pages/static/CookiesPage'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { CookieConsent } from './components/landing/CookieConsent'

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueci-password" element={<ForgotPasswordPage />} />
            <Route path="/contactar-administrador" element={<ContactAdminPage />} />
            <Route path="/documentacao" element={<DocumentationPage />} />
            <Route path="/documentacao/:slug" element={<DocGuidePage />} />
            <Route path="/api-docs" element={<ApiPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/funcionalidades" element={<FeaturesPage />} />
            <Route path="/ia" element={<AiDemoPage />} />
            <Route path="/precos" element={<PricingPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/carreiras" element={<CareersPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/parceiros" element={<PartnersPage />} />
            <Route path="/casos-de-sucesso" element={<SuccessStoriesPage />} />
            <Route path="/central-de-ajuda" element={<HelpCenterPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/gdpr" element={<GdprPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/superadmin" element={<SuperAdminPage />} />
            <Route path="/admin-empresa" element={<EmpresaAdminPage />} />
            <Route path="/react/index.html" element={<Navigate to="/landing" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
