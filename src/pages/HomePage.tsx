import { Link } from 'react-router-dom'
import { useCms } from '../cms/CmsProvider'
import { CompareTable } from '../components/CompareTable'
import { FaqSection } from '../components/FaqSection'
import { TrustStrip } from '../components/TrustStrip'
import { models, reviews } from '../data/content'
import { modelWithCms, priceLabelFor } from '../lib/cms'
import { QUOTE_PACKAGES, stockBadgeClass, type QuoteModel } from '../lib/quotes'

const highlightReviews = reviews.filter((r) => r.rating >= 4).slice(0, 3)

export function HomePage() {
  const cms = useCms()
  const liveModels = models.map((m) => modelWithCms(m, cms.vehicles))
  const proPrice = priceLabelFor('T8 PRO', cms.priceByModel)

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__media" aria-hidden="true" />
        <div className="home-hero__content">
          <p className="home-hero__kicker">
            <span className="pill-dot" aria-hidden="true" />
            JAC MOTORS · TUNISIE
          </p>
          <p className="home-hero__brand">
            T8 <em>PRO</em>
          </p>
          <h1>{cms.settings.hero_title}</h1>
          <p className="home-hero__lead">
            {cms.settings.hero_lead}{' '}
            Prix indicatif <strong>{proPrice}</strong>.
          </p>
          <div className="home-hero__actions">
            <Link className="btn btn--primary" to="/modeles#t8pro">
              Découvrir le T8 PRO
            </Link>
            <Link className="btn btn--whatsapp" to="/devis">
              Devis WhatsApp
            </Link>
            <Link
              className="btn btn--ghost home-hero__action-secondary"
              to="/visite?mode=essai"
            >
              Essai routier
            </Link>
          </div>
          <div className="hero-trust">
            <span>2.0 CTI Diesel</span>
            <span>4×4</span>
            <span>{proPrice} · prix indicatif</span>
            <span>Essai sur RDV</span>
          </div>
        </div>
        <div className="hero-scroll">
          Faire défiler <span>↓</span>
        </div>
      </section>

      <TrustStrip />

      <section className="home-strip" aria-label="Points clés">
        <article>
          <span className="home-strip__label">L’offre signature</span>
          <strong>{proPrice.replace(/^à partir de\s+/i, '')}</strong>
          <p>Prix indicatif du T8 PRO Double Cabine 2.0 L CTI Diesel 4×4.</p>
        </article>
        <article>
          <span className="home-strip__label">La puissance utile</span>
          <strong>320 Nm</strong>
          <p>Du couple à bas régime pour travailler, voyager et sortir des sentiers.</p>
        </article>
        <article>
          <span className="home-strip__label">Le réseau local</span>
          <strong>{cms.showrooms.length || 4} points</strong>
          <p>Showrooms et atelier à Tunis, Ben Arous et El Mghira.</p>
        </article>
      </section>

      <section className="section journey">
        <div className="section__head section__head--row">
          <div>
            <p className="section__eyebrow">Parcours client</p>
            <h2 className="section__title">Simple. Clair. WhatsApp.</h2>
          </div>
          <p className="section__lead">
            Trois étapes pour passer de la découverte à un rendez-vous concret avec JAC
            Motors Tunisie.
          </p>
        </div>
        <ol className="journey__grid">
          <li>
            <span>01</span>
            <h3>Explorez</h3>
            <p>Comparez T8 &amp; T8 PRO, ouvrez la vue 360° et les fiches techniques.</p>
            <Link className="text-link" to="/modeles">
              Voir les modèles <span>↗</span>
            </Link>
          </li>
          <li>
            <span>02</span>
            <h3>Demandez un devis</h3>
            <p>Confirmation WhatsApp, puis PDF professionnel envoyé automatiquement.</p>
            <Link className="text-link" to="/devis">
              Ouvrir le devis <span>↗</span>
            </Link>
          </li>
          <li>
            <span>03</span>
            <h3>Réservez</h3>
            <p>Visite, essai routier ou Google Meet — créneau clair, confirmation rapide.</p>
            <Link className="text-link" to="/visite">
              Choisir un créneau <span>↗</span>
            </Link>
          </li>
        </ol>
      </section>

      <section className="section home-intro">
        <div className="section__head">
          <p className="section__eyebrow">La gamme JAC en Tunisie</p>
          <h2 className="section__title">Pensé pour le terrain. Fini pour la ville.</h2>
          <p className="section__lead">
            Un pickup robuste, une cabine accueillante et la sérénité d’un réseau local.
            Comparez les deux silhouettes JAC.
          </p>
        </div>
        <div className="model-feature-grid">
          {liveModels.map((model) => {
            const quote = QUOTE_PACKAGES[model.name as QuoteModel]
            const price = priceLabelFor(model.name as QuoteModel, cms.priceByModel)
            return (
              <article className="model-feature" key={model.id}>
                <div
                  className="model-feature__image"
                  style={{ backgroundImage: `url(${model.heroImage})` }}
                  role="img"
                  aria-label={`JAC ${model.name}`}
                >
                  <span>{model.drive}</span>
                  {quote && (
                    <em className={`model-feature__stock ${stockBadgeClass(quote.stock)}`}>
                      {quote.stockLabel}
                    </em>
                  )}
                  {quote && <em className="model-feature__price">{price}</em>}
                </div>
                <div className="model-feature__body">
                  <p className="section__eyebrow">
                    {model.id === 't8pro' ? 'Le choix premium' : 'L’essentiel JAC'}
                  </p>
                  <h3>{model.name}</h3>
                  <p>{model.tagline}</p>
                  <div className="model-feature__footer">
                    <Link className="text-link" to={`/modeles#${model.id}`}>
                      Voir la fiche <span>↗</span>
                    </Link>
                    <Link className="btn btn--outline btn--sm" to="/devis">
                      Devis
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <CompareTable />

      <section className="home-spec-banner">
        <div className="home-spec-banner__copy">
          <p className="section__eyebrow">T8 PRO · 2.0 CTI DIESEL</p>
          <h2>
            La force utile,
            <br />
            sans compromis.
          </h2>
          <p>
            Un moteur diesel 2.0 L, une boîte manuelle 6 rapports et 220 mm de garde au
            sol. Prêt pour le quotidien comme pour les routes moins simples.
          </p>
          <div className="home-hero__actions">
            <Link className="btn btn--primary" to="/visite?mode=essai">
              Planifier un essai
            </Link>
            <Link className="btn btn--ghost" to="/modeles#t8pro">
              Voir en 360°
            </Link>
          </div>
        </div>
        <div className="home-spec-banner__stats">
          <div>
            <strong>320</strong>
            <span>Nm de couple</span>
          </div>
          <div>
            <strong>220</strong>
            <span>mm de garde au sol</span>
          </div>
          <div>
            <strong>1,2</strong>
            <span>m de gué max.</span>
          </div>
        </div>
      </section>

      {highlightReviews.length > 0 && (
        <section className="section social-proof">
          <div className="section__head section__head--row">
            <div>
              <p className="section__eyebrow">Avis clients</p>
              <h2 className="section__title">Ce que dit le réseau.</h2>
            </div>
            <Link className="text-link" to="/avis">
              Voir tous les avis <span>↗</span>
            </Link>
          </div>
          <div className="social-proof__grid">
            {highlightReviews.map((r) => (
              <article className="social-proof__card" key={r.id}>
                <div className="stars" aria-label={`${r.rating} sur 5`}>
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </div>
                <p>“{r.text.length > 160 ? `${r.text.slice(0, 160)}…` : r.text}”</p>
                <footer>
                  <strong>{r.author}</strong>
                  <span>
                    {r.location} · {r.date}
                  </span>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="home-proof">
        <div className="home-proof__mark">
          JAC<span>+</span>
        </div>
        <div>
          <p className="section__eyebrow">Un accompagnement qui continue</p>
          <h2>
            Du premier regard
            <br />
            au dernier kilomètre.
          </h2>
        </div>
        <p className="home-proof__copy">
          Découvrez votre modèle, demandez un devis WhatsApp et planifiez votre visite
          dans le réseau JAC Motors Tunisie.
        </p>
        <Link className="text-link text-link--light" to="/showrooms">
          Explorer le réseau <span>↗</span>
        </Link>
      </section>

      <FaqSection />

      <section className="commerce-band">
        <div className="commerce-band__copy">
          <p className="section__eyebrow">Contact commercial</p>
          <h2>Devis, essai ou après-vente</h2>
          <p>
            Demandez un prix avec couleur et options, réservez un essai, ou confiez
            votre pickup à l’atelier.
          </p>
        </div>
        <div className="commerce-band__actions">
          <Link className="btn btn--primary" to="/devis">
            Demander un devis
          </Link>
          <Link className="btn btn--ghost-dark" to="/visite?mode=essai">
            Essai routier
          </Link>
          <Link className="btn btn--ghost-dark" to="/apres-vente">
            Après-vente
          </Link>
        </div>
      </section>
    </>
  )
}
