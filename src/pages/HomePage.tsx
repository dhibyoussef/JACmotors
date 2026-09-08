import { Link } from 'react-router-dom'
import { models } from '../data/content'

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="home-hero__media" aria-hidden />
        <div className="home-hero__content">
          <p className="home-hero__brand">
            JAC MOTORS
            <em>TUNISIE</em>
          </p>
          <h1>Pickups 4×4 T8 &amp; T8 PRO. Entretien en un clic.</h1>
          <p className="home-hero__lead">
            Photos et fiches issues du site officiel JAC. Réservez un entretien
            sans créer de compte — ticket téléchargeable.
          </p>
          <div className="home-hero__actions">
            <Link className="btn btn--primary" to="/reserver">
              Réserver un entretien
            </Link>
            <Link className="btn btn--ghost" to="/modeles">
              Voir T8 &amp; T8 PRO
            </Link>
          </div>
          <div className="hero-trust">
            <span>Photos officielles JAC</span>
            <span>Formulaire sécurisé</span>
            <span>Sans compte · ticket local</span>
          </div>
        </div>
      </section>

      <div className="home-strip">
        <article>
          <strong>T8 / T8 PRO</strong>
          <p>Véhicules JAC réels — photos officielles constructeur.</p>
        </article>
        <article>
          <strong>4 points</strong>
          <p>Tunis, Ben Arous, atelier El Mghira.</p>
        </article>
        <article>
          <strong>Sans login</strong>
          <p>Formulaire + ticket enregistrable.</p>
        </article>
      </div>

      <section className="section">
        <div className="section__head">
          <p className="section__eyebrow">Gamme Tunisie</p>
          <h2 className="section__title">JAC Pickup</h2>
          <p className="section__lead">
            Contenu aligné sur{' '}
            <a href="https://jacen.jac.com.cn/models/t8pro/" target="_blank" rel="noreferrer">
              jacen.jac.com.cn
            </a>{' '}
            et{' '}
            <a href="https://pickup.jac.com.cn/" target="_blank" rel="noreferrer">
              pickup.jac.com.cn
            </a>
            .
          </p>
        </div>

        {models.map((m) => (
          <article className="model-row" key={m.id}>
            <div
              className="model-row__visual"
              style={{ backgroundImage: `url(${m.heroImage})` }}
              role="img"
              aria-label={`JAC ${m.name}`}
            />
            <div className="model-row__meta">
              <span className="tag">{m.drive}</span>
              <h3>{m.name}</h3>
              <p>{m.tagline}</p>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <Link className="btn btn--dark" to={`/modeles#${m.id}`}>
                  Fiche modèle
                </Link>
                <a
                  className="btn btn--outline"
                  href={m.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Site officiel
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="cta-band">
        <div>
          <h2>Besoin d’un entretien ?</h2>
          <p>Choisissez une date — recevez votre ticket immédiatement.</p>
        </div>
        <Link className="btn btn--primary" to="/reserver">
          Prendre rendez-vous
        </Link>
      </div>
    </>
  )
}
