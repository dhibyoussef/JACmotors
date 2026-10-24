import { Link } from 'react-router-dom'
import { showrooms } from '../data/content'
import { CONTACT, quickWhatsAppUrl } from '../lib/contact'

export function ShowroomsPage() {
  return (
    <>
      <header className="page-hero showroom-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">Le réseau JAC en Tunisie</p>
            <h1>Votre prochaine route commence ici.</h1>
            <p className="page-hero__lead">
              Un réseau de proximité pour découvrir la gamme, obtenir un conseil précis
              ou confier votre pickup à nos ateliers.
            </p>
          </div>
          <div className="page-hero__aside">
            <span>Ligne WhatsApp</span>
            <strong className="page-hero__aside-phone">{CONTACT.whatsappLabel}</strong>
            <p>{CONTACT.whatsappDisplay} · showrooms &amp; rendez-vous</p>
          </div>
        </div>
      </header>

      <section className="stats-strip" aria-label="Indicateurs réseau">
        <div className="stats-strip__inner">
          <div>
            <strong>{showrooms.length}</strong>
            <span>Points de contact</span>
          </div>
          <div>
            <strong>4</strong>
            <span>Zones desservies</span>
          </div>
          <div>
            <strong>1</strong>
            <span>Équipe dédiée</span>
          </div>
        </div>
      </section>

      <section className="section showroom-section">
        <div className="section__head showroom-section__head">
          <div>
            <p className="section__eyebrow">À proximité de Tunis</p>
            <h2 className="section__title">Le réseau, en vrai.</h2>
          </div>
          <p className="section__lead">
            Coordonnées communiquées pour préparer votre visite. Appelez avant de vous
            déplacer pour confirmer l’accueil et les horaires.
          </p>
        </div>

        <div className="showroom-grid">
          {showrooms.map((s, index) => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${s.name}, ${s.address}, Tunisie`,
            )}`
            return (
              <article className="showroom-card" key={s.id}>
                <div className="showroom-card__top">
                  <span className="showroom-index">0{index + 1}</span>
                  <span className="badge">
                    {s.type === 'atelier'
                      ? 'Atelier'
                      : s.type === 'siege'
                        ? 'Siège'
                        : 'Showroom'}
                  </span>
                </div>
                <p className="city">{s.city}</p>
                <h3>{s.name}</h3>
                <p className="showroom-address">{s.address}</p>
                <div className="showroom-card__details">
                  <span>{s.hours}</span>
                  {s.rating != null && s.reviewCount != null && (
                    <span className="rating">
                      ★ {s.rating.toFixed(1)} <small>({s.reviewCount})</small>
                    </span>
                  )}
                </div>
                <div className="showroom-card__footer">
                  <a href={`tel:+216${s.phone.replace(/\s/g, '')}`}>
                    <strong>{s.phone}</strong>
                    <span>Appeler</span>
                  </a>
                  <a className="btn btn--dark" href={mapsUrl} target="_blank" rel="noreferrer">
                    Itinéraire ↗
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="commerce-band commerce-band--flush">
        <div className="commerce-band__copy">
          <p className="section__eyebrow">Un doute sur la bonne adresse ?</p>
          <h2>Parlons de votre projet</h2>
          <p>WhatsApp ou visite showroom — on vous oriente vers le bon point de contact.</p>
        </div>
        <div className="commerce-band__actions">
          <a
            className="btn btn--whatsapp"
            href={quickWhatsAppUrl('Bonjour, je souhaite des infos sur un showroom JAC.')}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp {CONTACT.whatsappLabel}
          </a>
          <Link className="btn btn--primary" to="/visite">
            Réserver une visite
          </Link>
          <Link className="btn btn--ghost-dark" to="/devis">
            Demander un devis
          </Link>
        </div>
      </section>
    </>
  )
}
