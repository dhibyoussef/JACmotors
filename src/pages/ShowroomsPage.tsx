import { showrooms } from '../data/content'

export function ShowroomsPage() {
  return (
    <>
      <header className="page-hero">
        <p className="section__eyebrow" style={{ color: '#ff6b73' }}>
          Réseau Tunisie
        </p>
        <h1>Showrooms &amp; atelier</h1>
        <p>
          Points de contact JAC en Tunisie (pas de site JAC.tn officiel).
          Coordonnées et notes Google telles que communiquées.
        </p>
      </header>

      <section className="section">
        <div className="showroom-list">
          {showrooms.map((s) => (
            <article className="showroom-item" key={s.id}>
              <div>
                <span className="badge">
                  {s.type === 'atelier'
                    ? 'Atelier'
                    : s.type === 'siege'
                      ? 'Siège'
                      : 'Showroom'}
                </span>
                <p className="city">{s.city}</p>
                <h3>{s.name}</h3>
                <p>{s.address}</p>
                <p>{s.hours}</p>
                {s.rating != null && s.reviewCount != null && (
                  <p>
                    ★ {s.rating.toFixed(1)} · {s.reviewCount} avis Google
                  </p>
                )}
              </div>
              <div className="showroom-item__contact">
                <a href={`tel:+216${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>
                <p>Appeler</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
