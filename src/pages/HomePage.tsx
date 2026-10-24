import { Link } from 'react-router-dom'
import { models } from '../data/content'
import { QUOTE_PACKAGES, type QuoteModel } from '../lib/quotes'

export function HomePage() {
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
          <h1>Le pickup qui prend la route au sérieux.</h1>
          <p className="home-hero__lead">
            4×4 diesel, double cabine et confort premium. Découvrez le JAC T8 PRO,
            disponible en Tunisie à partir de <strong>105 000 DT</strong>.
          </p>
          <div className="home-hero__actions">
            <Link className="btn btn--primary" to="/modeles#t8pro">
              Découvrir le T8 PRO
            </Link>
            <Link className="btn btn--whatsapp" to="/devis">
              Devis WhatsApp
            </Link>
            <Link className="btn btn--ghost home-hero__action-secondary" to="/visite">
              Réserver une visite
            </Link>
          </div>
          <div className="hero-trust">
            <span>2.0 CTI Diesel</span>
            <span>4×4</span>
            <span>105 000 DT · prix indicatif</span>
          </div>
        </div>
        <div className="hero-scroll">
          Faire défiler <span>↓</span>
        </div>
      </section>

      <section className="home-strip" aria-label="Points clés">
        <article>
          <span className="home-strip__label">L’offre signature</span>
          <strong>105 000 DT</strong>
          <p>Prix indicatif du T8 PRO Double Cabine 2.0 L CTI Diesel 4×4.</p>
        </article>
        <article>
          <span className="home-strip__label">La puissance utile</span>
          <strong>320 Nm</strong>
          <p>Du couple à bas régime pour travailler, voyager et sortir des sentiers.</p>
        </article>
        <article>
          <span className="home-strip__label">Le réseau local</span>
          <strong>4 points</strong>
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
            <p>Prix catalogue, specs et financement — message WhatsApp déjà prêt.</p>
            <Link className="text-link" to="/devis">
              Ouvrir le devis <span>↗</span>
            </Link>
          </li>
          <li>
            <span>03</span>
            <h3>Réservez</h3>
            <p>Visite showroom ou Google Meet — créneau clair, confirmation rapide.</p>
            <Link className="text-link" to="/visite">
              Choisir un créneau <span>↗</span>
            </Link>
          </li>
        </ol>
      </section>

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
          {models.map((model) => {
            const quote = QUOTE_PACKAGES[model.name as QuoteModel]
            return (
              <article className="model-feature" key={model.id}>
                <div
                  className="model-feature__image"
                  style={{ backgroundImage: `url(${model.heroImage})` }}
                  role="img"
                  aria-label={`JAC ${model.name}`}
                >
                  <span>{model.drive}</span>
                  {quote && <em className="model-feature__price">{quote.priceLabel}</em>}
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
            <Link className="btn btn--primary" to="/visite">
              Planifier une visite
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

      <section className="commerce-band">
        <div className="commerce-band__copy">
          <p className="section__eyebrow">Contact commercial</p>
          <h2>Devis, visite ou entretien</h2>
          <p>
            Demandez un prix, réservez une visite showroom / Google Meet, ou confiez
            votre pickup à l’atelier.
          </p>
        </div>
        <div className="commerce-band__actions">
          <Link className="btn btn--primary" to="/devis">
            Demander un devis
          </Link>
          <Link className="btn btn--ghost-dark" to="/visite">
            Réserver une visite
          </Link>
          <Link className="btn btn--ghost-dark" to="/reserver">
            Entretien atelier
          </Link>
        </div>
      </section>
    </>
  )
}
