import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CONTACT, quickWhatsAppUrl } from '../lib/contact'
import { MobileDock } from './MobileDock'

export function Layout() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  /** Hide FAB on pages that already have a primary WhatsApp send CTA */
  const hideFab =
    location.pathname === '/devis' ||
    location.pathname === '/visite' ||
    location.pathname === '/'

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24 || !isHome)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'JAC Motors Tunisie',
      '/modeles': 'Modèles T8 & T8 PRO · JAC Tunisie',
      '/devis': 'Demander un devis · JAC Tunisie',
      '/visite': 'Visite showroom · JAC Tunisie',
      '/reserver': 'Réserver un entretien · JAC Tunisie',
      '/apres-vente': 'Après-vente & check-up · JAC Tunisie',
      '/showrooms': 'Showrooms · JAC Tunisie',
      '/avis': 'Avis clients · JAC Tunisie',
      '/confidentialite': 'Confidentialité · JAC Tunisie',
      '/admin': 'Admin · JAC Tunisie',
    }
    document.title = titles[location.pathname] ?? 'JAC Motors Tunisie'
  }, [location.pathname])

  return (
    <div className="site">
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>

      <header className={`nav ${solid || !isHome ? 'nav--solid' : 'nav--hero'}`}>
        <NavLink to="/" className="nav__brand" aria-label="JAC Motors Tunisie — Accueil">
          JAC MOTORS
          <span>TN</span>
        </NavLink>

        <button
          type="button"
          className="nav__toggle"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`nav__burger${open ? ' is-open' : ''}`} />
        </button>

        <ul id="nav-menu" className={`nav__links ${open ? 'open' : ''}`}>
          <li>
            <NavLink to="/modeles">Modèles</NavLink>
          </li>
          <li>
            <NavLink to="/visite">Visite</NavLink>
          </li>
          <li>
            <NavLink to="/showrooms">Showrooms</NavLink>
          </li>
          <li className="nav__item--desktop">
            <NavLink to="/avis">Avis</NavLink>
          </li>
          <li className="nav__item--desktop">
            <NavLink to="/apres-vente">Après-vente</NavLink>
          </li>
          <li>
            <NavLink to="/devis" className="nav__cta">
              Devis
            </NavLink>
          </li>
        </ul>
      </header>

      <main id="contenu">
        <Outlet />
      </main>

      <MobileDock />

      {!hideFab && (
        <a
          className="whatsapp-fab"
          href={quickWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp ${CONTACT.whatsappDisplay}`}
          title={`WhatsApp ${CONTACT.whatsappDisplay}`}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true" width="22" height="22">
            <path
              fill="currentColor"
              d="M16.04 4C9.4 4 4 9.3 4 15.82c0 2.1.56 4.14 1.62 5.94L4 28l6.44-1.68A12.05 12.05 0 0 0 16.04 28C22.68 28 28 22.7 28 16.18S22.68 4 16.04 4zm7.02 17.1c-.3.84-1.74 1.54-2.42 1.64-.62.1-1.4.14-2.26-.14-.52-.16-1.18-.38-2.04-.74-3.58-1.54-5.9-5.14-6.08-5.38-.18-.24-1.46-1.94-1.46-3.7s.92-2.62 1.26-2.98c.3-.34.72-.5 1.14-.5h.34c.34 0 .52.02.74.56l1.06 2.56c.1.24.16.46.04.74-.12.28-.2.44-.4.68-.18.22-.38.5-.54.66-.18.18-.36.38-.16.74.2.36.9 1.48 1.94 2.4 1.34 1.18 2.46 1.54 2.84 1.72.38.18.6.14.82-.12.24-.28.98-1.14 1.24-1.54.26-.4.52-.32.86-.18.34.14 2.16 1.02 2.52 1.2.38.18.62.28.72.44.08.16.08.92-.22 1.76z"
            />
          </svg>
          <span>WhatsApp</span>
        </a>
      )}

      <footer className="footer">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">JAC MOTORS</div>
            <p>
              Vitrine Tunisie — pickups T8 &amp; T8 PRO. Devis WhatsApp, visite showroom,
              entretien atelier.
            </p>
            <div className="footer-badges">
              <span>WhatsApp {CONTACT.whatsappLabel}</span>
              <span>Visite & Meet</span>
              <span>Entretien atelier</span>
            </div>
          </div>
          <div>
            <h3>Navigation</h3>
            <ul>
              <li>
                <NavLink to="/">Accueil</NavLink>
              </li>
              <li>
                <NavLink to="/modeles">Modèles</NavLink>
              </li>
              <li>
                <NavLink to="/devis">Devis WhatsApp</NavLink>
              </li>
              <li>
                <NavLink to="/visite">Visite showroom</NavLink>
              </li>
              <li>
                <NavLink to="/reserver">Entretien</NavLink>
              </li>
              <li>
                <NavLink to="/apres-vente">Après-vente</NavLink>
              </li>
              <li>
                <NavLink to="/showrooms">Showrooms</NavLink>
              </li>
              <li>
                <NavLink to="/avis">Avis</NavLink>
              </li>
              <li>
                <NavLink to="/confidentialite">Confidentialité</NavLink>
              </li>
              <li>
                <NavLink to="/admin">Espace admin</NavLink>
              </li>
            </ul>
          </div>
          <div>
            <h3>Contact</h3>
            <ul>
              <li>
                <a
                  href={quickWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp · {CONTACT.whatsappLabel}
                </a>
              </li>
              <li>
                <a href={`tel:+${CONTACT.whatsappE164}`}>
                  Appeler · {CONTACT.whatsappLabel}
                </a>
              </li>
              <li>
                <a href="tel:+21650512877">Etraton · 50 512 877</a>
              </li>
              <li>
                <a href="tel:+21679731328">CLH Motors · 79 731 328</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__copy">
          <span>© {new Date().getFullYear()} JAC Motors Tunisie</span>
          <span>T8 &amp; T8 PRO · réseau Tunisie</span>
        </div>
      </footer>
    </div>
  )
}
