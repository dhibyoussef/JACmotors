import { Link } from 'react-router-dom'
import { useCms } from '../cms/CmsProvider'
import { CompareTable } from '../components/CompareTable'
import { InterestLeadForm } from '../components/InterestLeadForm'
import { Photo360 } from '../components/Photo360'
import { models as staticModels } from '../data/content'
import { MODEL_360_FRAMES } from '../lib/contact'
import { modelWithCms, priceLabelFor } from '../lib/cms'
import { QUOTE_PACKAGES, stockBadgeClass, type QuoteModel } from '../lib/quotes'

export function ModelsPage() {
  const cms = useCms()
  const models = staticModels.map((m) => modelWithCms(m, cms.vehicles))
  const proPrice = priceLabelFor('T8 PRO', cms.priceByModel)
  const proDigits = proPrice.replace(/[^\d\s]/g, '').trim() || '105 000'

  return (
    <>
      <header className="page-hero models-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">
              La gamme pickup{cms.live ? ' · CMS' : ''}
            </p>
            <h1>Conçus pour aller plus loin.</h1>
            <p className="page-hero__lead">
              Deux caractères. Une même exigence JAC : capacité, confort et présence sur
              toutes les routes tunisiennes.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary" href="#t8pro">
                Découvrir T8 PRO
              </a>
              <Link className="btn btn--ghost" to="/devis">
                Demander un devis
              </Link>
              <Link className="btn btn--ghost" to="/visite">
                Réserver une visite
              </Link>
            </div>
          </div>
          <div className="page-hero__aside">
            <span>Prix indicatif Tunisie</span>
            <strong>
              {proDigits} <small>DT</small>
            </strong>
            <p>T8 PRO Double Cabine · 2.0 L CTI Diesel · 4×4</p>
          </div>
        </div>
      </header>

      <nav className="model-switcher" aria-label="Choisir un modèle">
        {models.map((m, index) => (
          <a href={`#${m.id}`} key={m.id} className="model-switcher__item">
            <span>0{index + 1}</span>
            <strong>JAC {m.name}</strong>
            <small>{m.drive}</small>
          </a>
        ))}
      </nav>

      <div className="model-detail">
        {models.map((m) => {
          const frames = MODEL_360_FRAMES[m.id as 't8' | 't8pro'] ?? []
          const quote = QUOTE_PACKAGES[m.name as QuoteModel]
          const price = priceLabelFor(m.name as QuoteModel, cms.priceByModel)
          return (
            <section className="model-panel" key={m.id} id={m.id}>
              <div
                className="model-panel__hero"
                style={{ backgroundImage: `url(${m.heroImage})` }}
              >
                <div className="model-panel__hero-inner">
                  <p className="section__eyebrow">{m.highlight}</p>
                  <h2>{m.name}</h2>
                  <p className="model-panel__tagline">{m.tagline}</p>
                  <div className="model-panel__hero-meta">
                    <span>{m.drive}</span>
                    <span>Double cabine</span>
                    {quote && <span className="meta-price">{price}</span>}
                    {quote && (
                      <span className={stockBadgeClass(quote.stock)}>{quote.stockLabel}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="model-body">
                <div className="model-body__intro">
                  <div>
                    <p className="section__eyebrow">L’essentiel en un regard</p>
                    <h3>Une présence qui travaille dur.</h3>
                  </div>
                  <p>
                    Des proportions solides, une cabine pensée pour le quotidien et une
                    capacité prête pour les projets qui comptent.
                  </p>
                </div>

                {frames.length > 0 && (
                  <div className="model-360-block">
                    <div className="model-360-block__head">
                      <div>
                        <p className="section__eyebrow">Vue 360° + showroom</p>
                        <h3>Explorez le JAC {m.name} en 360°</h3>
                      </div>
                      <p>
                        Ensuite, demandez un Google Meet pour découvrir les showrooms
                        avec un conseiller.
                      </p>
                    </div>
                    <Photo360 frames={frames} label={`JAC ${m.name}`} />
                    <div className="model-360-cta">
                      <div>
                        <strong>Envie de voir le showroom en vrai (ou en vidéo) ?</strong>
                        <p>
                          Laissez votre WhatsApp — confirmation automatique. Ou réservez un
                          créneau Meet / visite.
                        </p>
                      </div>
                      <div className="model-360-cta__actions">
                        <Link
                          className="btn btn--primary"
                          to={`/visite?mode=meet&modele=${encodeURIComponent(m.name)}`}
                        >
                          Meet — choisir un créneau
                        </Link>
                        <Link className="btn btn--outline" to="/devis">
                          Devis PDF auto
                        </Link>
                      </div>
                      <InterestLeadForm
                        modele={m.name as 'T8' | 'T8 PRO'}
                        source="360"
                        title={`Rappel WhatsApp après le 360° JAC ${m.name}`}
                      />
                    </div>
                  </div>
                )}

                <div className="gallery gallery--featured">
                  {m.gallery.map((src, index) => (
                    <img
                      key={src}
                      src={src}
                      alt={`JAC ${m.name} — vue ${index + 1}`}
                      loading="lazy"
                    />
                  ))}
                </div>

                <div className="model-data-grid">
                  {m.engines.length > 0 && (
                    <div className="engine-card">
                      <p className="section__eyebrow">Motorisations officielles</p>
                      {m.engines.map((e) => (
                        <div className="engine-row" key={e.name}>
                          <strong>{e.name}</strong>
                          <span>{e.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="spec-card">
                    <p className="section__eyebrow">Repères techniques</p>
                    <dl className="specs">
                      {m.specs.map((s) => (
                        <div key={s.label}>
                          <dt>{s.label}</dt>
                          <dd>{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <div className="feature-band">
                  <p className="section__eyebrow">Équipement & confiance</p>
                  <ul className="feature-list">
                    {m.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>

                {quote && (
                  <div className="model-config">
                    <div>
                      <p className="section__eyebrow">Configurer le devis</p>
                      <h3>Couleurs & options</h3>
                      <p>
                        Choisissez teinte et accessoires dans le devis WhatsApp — le
                        message part déjà structuré.
                      </p>
                    </div>
                    <div className="model-config__swatches" aria-hidden="true">
                      {quote.colors.map((c) => (
                        <span
                          key={c.id}
                          className="model-config__dot"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <ul className="model-config__options">
                      {quote.options.map((o) => (
                        <li key={o.id}>{o.label}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="source-note">{m.sourceNote}</p>
                <div className="model-actions">
                  <Link
                    className="btn btn--primary"
                    to={`/visite?mode=essai&modele=${encodeURIComponent(m.name)}`}
                  >
                    Essai routier
                  </Link>
                  <Link className="btn btn--whatsapp" to="/devis">
                    Devis WhatsApp
                  </Link>
                  <Link className="btn btn--outline" to="/visite">
                    Visite showroom
                  </Link>
                  <a
                    className="btn btn--outline"
                    href={m.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fiche officielle JAC ↗
                  </a>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <CompareTable />
    </>
  )
}
