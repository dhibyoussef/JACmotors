import { Link } from 'react-router-dom'
import { models } from '../data/content'

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="home-hero__media" aria-hidden="true" />
        <div className="home-hero__content">
          <p className="home-hero__kicker">JAC MOTORS · TUNISIE / 2026</p>
          <p className="home-hero__brand">T8 <em>PRO</em></p>
          <h1>Le pickup qui prend la route au sérieux.</h1>
          <p className="home-hero__lead">
            4×4 diesel, double cabine et confort premium. Découvrez le JAC T8 PRO,
            disponible en Tunisie à partir de 105 000 DT.
          </p>
          <div className="home-hero__actions">
            <Link className="btn btn--primary" to="/modeles#t8pro">Découvrir le T8 PRO</Link>
            <Link className="btn btn--ghost" to="/reserver">Réserver un essai</Link>
          </div>
          <div className="hero-trust">
            <span>2.0 CTI Diesel</span><span>4×4</span><span>105 000 DT · prix indicatif</span>
          </div>
        </div>
        <div className="hero-scroll">Faire défiler <span>↓</span></div>
      </section>

      <section className="home-strip">
        <article><strong>105 000 DT</strong><p>Prix indicatif T8 PRO Double Cabine 2.0 L CTI Diesel 4×4 neuve.</p></article>
        <article><strong>139 ch</strong><p>320 Nm de couple pour travailler, voyager et sortir des sentiers battus.</p></article>
        <article><strong>4 points</strong><p>Showrooms et atelier à Tunis, Ben Arous et El Mghira.</p></article>
      </section>

      <section className="section home-intro">
        <div className="section__head">
          <p className="section__eyebrow">La gamme JAC en Tunisie</p>
          <h2 className="section__title">Pensé pour le terrain. Fini pour la ville.</h2>
          <p className="section__lead">Un pickup robuste, une cabine accueillante et la sérénité d’un réseau local. Comparez les deux silhouettes JAC et choisissez votre prochaine aventure.</p>
        </div>
        <div className="model-feature-grid">
          {models.map((model) => (
            <article className="model-feature" key={model.id}>
              <div className="model-feature__image" style={{ backgroundImage: `url(${model.heroImage})` }} role="img" aria-label={`JAC ${model.name}`}>
                <span>{model.drive}</span>
              </div>
              <div className="model-feature__body">
                <p className="section__eyebrow">{model.id === 't8pro' ? 'Le choix premium' : 'L’essentiel JAC'}</p>
                <h3>{model.name}</h3>
                <p>{model.tagline}</p>
                <Link className="text-link" to={`/modeles#${model.id}`}>Voir la fiche <span>↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-spec-banner">
        <div className="home-spec-banner__copy">
          <p className="section__eyebrow">T8 PRO · 2.0 CTI DIESEL</p>
          <h2>La force utile,<br />sans compromis.</h2>
          <p>Un moteur diesel 2.0 L, une boîte manuelle 6 rapports et 220 mm de garde au sol. Le T8 PRO est prêt pour vos trajets quotidiens comme pour les routes moins simples.</p>
          <Link className="btn btn--primary" to="/reserver">Planifier un essai</Link>
        </div>
        <div className="home-spec-banner__stats">
          <div><strong>320</strong><span>Nm de couple</span></div>
          <div><strong>220</strong><span>mm de garde au sol</span></div>
          <div><strong>1,2</strong><span>m de gué max.</span></div>
        </div>
      </section>

      <section className="cta-band">
        <div><p className="section__eyebrow">Après-vente JAC</p><h2>Votre prochain rendez-vous commence ici.</h2><p>Choisissez votre atelier, votre créneau et recevez un ticket de confirmation.</p></div>
        <Link className="btn btn--primary" to="/reserver">Prendre rendez-vous</Link>
      </section>
    </>
  )
}
