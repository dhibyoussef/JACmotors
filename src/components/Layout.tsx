import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

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
            <NavLink to="/showrooms">Showrooms</NavLink>
          </li>
          <li>
            <NavLink to="/avis">Avis</NavLink>
          </li>
          <li>
            <NavLink to="/reserver" className="nav__cta">
              Réserver
            </NavLink>
          </li>
        </ul>
      </header>

      <main id="contenu">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">JAC MOTORS</div>
            <p>
              Vitrine Tunisie — pickups T8 &amp; T8 PRO. Photos / fiches :{' '}
              <a
                href="https://jacen.jac.com.cn/"
                target="_blank"
                rel="noopener noreferrer"
              >
                jacen.jac.com.cn
              </a>
              . Réservation atelier sécurisée, sans compte.
            </p>
            <div className="footer-badges">
              <span>HTTPS recommandé</span>
              <span>Données locales</span>
              <span>Sans tracking</span>
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
                <NavLink to="/reserver">Entretien</NavLink>
              </li>
              <li>
                <NavLink to="/showrooms">Showrooms</NavLink>
              </li>
              <li>
                <NavLink to="/avis">Avis Google</NavLink>
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
                <a href="tel:+21650512877">Etraton · 50 512 877</a>
              </li>
              <li>
                <a href="tel:+21679731328">CLH Motors · 79 731 328</a>
              </li>
              <li>
                <a href="tel:+21658554765">Ben Arous · 58 554 765</a>
              </li>
              <li>
                <a href="tel:+21629402200">El Mghira · 29 402 200</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__copy">
          <span>© {new Date().getFullYear()} JAC Motors Tunisie</span>
          <span>Site informatif · max. 6 pages · non affilié au site CN hors contenus cités</span>
        </div>
      </footer>
    </div>
  )
}
