import { showrooms } from '../data/content'

export function ShowroomsPage() {
  return (
    <>
      <header className="page-hero showroom-hero">
        <p className="section__eyebrow page-hero__eyebrow">Le réseau JAC en Tunisie</p>
        <h1>Votre prochaine route commence ici.</h1>
        <p className="page-hero__lead">Un réseau de proximité pour découvrir la gamme, obtenir un conseil précis ou confier votre pickup à nos ateliers.</p>
        <div className="network-stats"><span><strong>{showrooms.length}</strong> points de contact</span><span><strong>4</strong> zones desservies</span><span><strong>1</strong> équipe dédiée</span></div>
      </header>

      <section className="section showroom-section">
        <div className="section__head showroom-section__head"><div><p className="section__eyebrow">À proximité de Tunis</p><h2 className="section__title">Le réseau, en vrai.</h2></div><p className="section__lead">Coordonnées communiquées pour préparer votre visite. Appelez avant de vous déplacer pour confirmer l’accueil et les horaires.</p></div>
        <div className="showroom-list showroom-grid">
          {showrooms.map((s, index) => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name}, ${s.address}, Tunisie`)}`
            return <article className="showroom-item showroom-card" key={s.id}>
              <div className="showroom-card__top"><span className="showroom-index">0{index + 1}</span><span className="badge">{s.type === 'atelier' ? 'Atelier' : s.type === 'siege' ? 'Siège' : 'Showroom'}</span></div>
              <p className="city">{s.city}</p><h3>{s.name}</h3><p className="showroom-address">{s.address}</p>
              <div className="showroom-card__details"><span>{s.hours}</span>{s.rating != null && s.reviewCount != null && <span className="rating">★ {s.rating.toFixed(1)} <small>({s.reviewCount})</small></span>}</div>
              <div className="showroom-item__contact"><a href={`tel:+216${s.phone.replace(/\s/g, '')}`}><strong>{s.phone}</strong><span>Appeler le point de contact</span></a><a className="btn btn--dark" href={mapsUrl} target="_blank" rel="noreferrer">Itinéraire ↗</a></div>
            </article>
          })}
        </div>
      </section>

      <section className="network-cta"><div><p className="section__eyebrow">Un doute sur la bonne adresse ?</p><h2>Parlons de votre projet.</h2></div><a className="btn btn--primary" href="tel:+21650512877">Appeler JAC Motors</a></section>
    </>
  )
}
