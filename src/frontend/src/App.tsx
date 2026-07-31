import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ContactAdminPage } from './pages/ContactAdminPage'
import { DocumentationPage } from './pages/static/DocumentationPage'
import { ApiPage } from './pages/static/ApiPage'
import { ChangelogPage } from './pages/static/ChangelogPage'
import { AboutPage } from './pages/static/AboutPage'
import { BlogPage } from './pages/static/BlogPage'
import { CareersPage } from './pages/static/CareersPage'
import { ContactPage } from './pages/static/ContactPage'
import { PartnersPage } from './pages/static/PartnersPage'
import { PrivacyPage } from './pages/static/PrivacyPage'
import { TermsPage } from './pages/static/TermsPage'
import { GdprPage } from './pages/static/GdprPage'
import { CookiesPage } from './pages/static/CookiesPage'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

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
            <Route path="/api" element={<ApiPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/carreiras" element={<CareersPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/parceiros" element={<PartnersPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/gdpr" element={<GdprPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/react/index.html" element={<Navigate to="/landing" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
