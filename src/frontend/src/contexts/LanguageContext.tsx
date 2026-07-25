import { createContext, useContext, type ReactNode } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { landingTranslations, type Language, type LandingTranslations } from '../i18n/landing'

type LanguageContextValue = {
  language: Language
  toggleLanguage: () => void
  setLanguage: (lang: Language) => void
  t: LandingTranslations
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'pt',
  toggleLanguage: () => {},
  setLanguage: () => {},
  t: landingTranslations.pt,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = usePersistentState<Language>('manugent-language', 'pt')

  const toggleLanguage = () => setLanguage(current => (current === 'pt' ? 'en' : 'pt'))

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t: landingTranslations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
