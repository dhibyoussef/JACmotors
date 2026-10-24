import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CONTACT, quickWhatsAppUrl } from '../lib/contact'

export function Layout() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

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
      '/showrooms': 'Showrooms · JAC Tunisie',
      '/avis': 'Avis clients · JAC Tunisie',
      '/confidentialite': 'Confidentialité · JAC Tunisie',
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
          <span className="nav__burger" data-open={open} />
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
            <NavLink to="/reserver">Entretien</NavLink>
          </li>
          <li>
            <NavLink to="/devis" className="nav__cta nav__cta--whatsapp">
              Devis
            </NavLink>
          </li>
        </ul>
      </header>

      <main id="contenu">
        <Outlet />
      </main>

      <a
        className="whatsapp-fab"
        href={quickWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${CONTACT.whatsappDisplay}`}
      >
        WhatsApp
      </a>

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
                <NavLink to="/showrooms">Showrooms</NavLink>
              </li>
              <li>
                <NavLink to="/avis">Avis</NavLink>
              </li>
              <li>
                <NavLink to="/confidentialite">Confidentialité</NavLink>
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
