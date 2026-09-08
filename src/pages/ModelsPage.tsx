import { Link } from 'react-router-dom'
import { models } from '../data/content'

export function ModelsPage() {
  return (
    <>
      <header className="page-hero models-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">La gamme pickup</p>
            <h1>Conçus pour aller plus loin.</h1>
            <p className="page-hero__lead">
              Deux caractères. Une même exigence JAC : capacité, confort et présence sur toutes les routes tunisiennes.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary" href="#t8pro">Découvrir T8 PRO</a>
              <Link className="btn btn--ghost" to="/reserver">Parler à un conseiller</Link>
            </div>
          </div>
          <div className="page-hero__aside">
            <span>Prix indicatif Tunisie</span>
            <strong>105 000 <small>DT</small></strong>
            <p>T8 PRO Double Cabine · 2.0 L CTI Diesel · 4×4</p>
          </div>
        </div>
      </header>

      <nav className="model-switcher" aria-label="Choisir un modèle">
        {models.map((m, index) => (
          <a href={`#${m.id}`} key={m.id}>
            <span>0{index + 1}</span>
            <strong>JAC {m.name}</strong>
            <small>{m.drive}</small>
          </a>
        ))}
      </nav>

      <div className="model-detail">
        {models.map((m) => (
          <section className="model-panel" key={m.id} id={m.id}>
            <div className="model-panel__hero" style={{ backgroundImage: `url(${m.heroImage})` }}>
              <div className="model-panel__hero-inner">
                <p className="section__eyebrow">{m.highlight}</p>
                <h2>{m.name}</h2>
                <p className="model-panel__tagline">{m.tagline}</p>
                <div className="model-panel__hero-meta"><span>{m.drive}</span><span>Double cabine</span><span>JAC Motors</span></div>
              </div>
            </div>

            <div className="model-body">
              <div className="model-body__intro">
                <div>
                  <p className="section__eyebrow">L’essentiel en un regard</p>
                  <h3>Une présence qui travaille dur.</h3>
                </div>
                <p>Des proportions solides, une cabine pensée pour le quotidien et une capacité prête pour les projets qui comptent.</p>
              </div>

              <div className="gallery gallery--featured">
                {m.gallery.map((src, index) => <img key={src} src={src} alt={`JAC ${m.name} — vue ${index + 1}`} loading="lazy" />)}
              </div>

              <div className="model-data-grid">
                {m.engines.length > 0 && <div className="engine-card"><p className="section__eyebrow">Motorisations officielles</p>{m.engines.map((e) => <div className="engine-row" key={e.name}><strong>{e.name}</strong><span>{e.detail}</span></div>)}</div>}
                <div className="spec-card"><p className="section__eyebrow">Repères techniques</p><dl className="specs">{m.specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl></div>
              </div>

              <div className="feature-band"><p className="section__eyebrow">Équipement & confiance</p><ul className="feature-list">{m.features.map((f) => <li key={f}>{f}</li>)}</ul></div>
              <p className="source-note">{m.sourceNote}</p>
              <div className="model-actions"><Link className="btn btn--primary" to="/reserver">Réserver un essai ou entretien</Link><a className="btn btn--outline" href={m.officialUrl} target="_blank" rel="noreferrer">Fiche officielle JAC ↗</a></div>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
