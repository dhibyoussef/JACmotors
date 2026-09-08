import { Link } from 'react-router-dom'
import { models } from '../data/content'

export function ModelsPage() {
  return (
    <>
      <header className="page-hero">
        <p className="section__eyebrow" style={{ color: '#ff6b73' }}>
          Photos officielles JAC
        </p>
        <h1>T8 &amp; T8 PRO</h1>
        <p>
          Images et spécifications provenant de JAC Motors (
          <a
            href="https://jacen.jac.com.cn/models/t8pro/"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#fff', textDecoration: 'underline' }}
          >
            jacen.jac.com.cn
          </a>
          ) et Jianghuai Pickup.
        </p>
      </header>

      <div className="model-detail">
        {models.map((m) => (
          <section className="model-panel" key={m.id} id={m.id}>
            <div
              className="model-panel__hero"
              style={{ backgroundImage: `url(${m.heroImage})` }}
            >
              <div className="model-panel__hero-inner">
                <p className="section__eyebrow" style={{ color: '#ff6b73' }}>
                  {m.highlight}
                </p>
                <h2>{m.name}</h2>
                <p style={{ maxWidth: '46ch', marginTop: '0.5rem' }}>{m.tagline}</p>
              </div>
            </div>

            <div className="model-body">
              <div className="gallery">
                {m.gallery.map((src) => (
                  <img key={src} src={src} alt={`JAC ${m.name}`} loading="lazy" />
                ))}
              </div>

              {m.engines.length > 0 && (
                <>
                  <p className="section__eyebrow" style={{ marginTop: '1.5rem' }}>
                    Motorisations (fiche officielle)
                  </p>
                  <ul className="engine-list">
                    {m.engines.map((e) => (
                      <li key={e.name}>
                        <strong>{e.name}</strong>
                        <span>{e.detail}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <dl className="specs">
                {m.specs.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="feature-list">
                {m.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              <p className="source-note">{m.sourceNote}</p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link className="btn btn--primary" to="/reserver">
                  Réserver un entretien {m.name}
                </Link>
                <a
                  className="btn btn--outline"
                  href={m.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Voir sur le site JAC
                </a>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
