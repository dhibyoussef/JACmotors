import { Link, useLocation } from 'react-router-dom'

/** Conversion dock — mobile only, hidden on pages with primary WhatsApp send */
export function MobileDock() {
  const { pathname } = useLocation()
  const hide =
    pathname === '/devis' || pathname === '/visite' || pathname === '/reserver'
  if (hide) return null

  return (
    <nav className="mobile-dock" aria-label="Actions rapides">
      <Link className="mobile-dock__btn mobile-dock__btn--ghost" to="/visite?mode=essai">
        Essai
      </Link>
      <Link className="mobile-dock__btn mobile-dock__btn--primary" to="/devis">
        Devis WhatsApp
      </Link>
    </nav>
  )
}
