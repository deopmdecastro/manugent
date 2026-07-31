import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePersistentState } from '../../hooks/usePersistentState'

type ConsentValue = 'accepted' | 'rejected' | null

export function CookieConsent() {
  const { t } = useLanguage()
  const [consent, setConsent] = usePersistentState<ConsentValue>('manugent-cookie-consent', null)

  if (consent) return null

  return (
    <div className="l-cookie-banner" role="dialog" aria-label={t.cookies.title}>
      <div className="l-cookie-banner-inner">
        <div className="l-cookie-banner-icon" aria-hidden="true">
          <i className="fas fa-cookie-bite" />
        </div>
        <div className="l-cookie-banner-copy">
          <strong>{t.cookies.title}</strong>
          <p>
            {t.cookies.message}{' '}
            <Link to="/cookies" className="l-cookie-banner-link">
              {t.cookies.policyLinkText}
            </Link>
          </p>
        </div>
        <div className="l-cookie-banner-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setConsent('rejected')}>
            {t.cookies.reject}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setConsent('accepted')}>
            {t.cookies.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
