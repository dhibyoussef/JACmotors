const ITEMS = [
  { title: 'Prix catalogue', text: 'Affiché dès le devis WhatsApp' },
  { title: 'Financement', text: 'Exemples de mensualités inclus' },
  { title: 'Visite / Meet', text: 'Créneaux clairs, lien Meet auto' },
  { title: 'Réseau local', text: 'Tunis · Ben Arous · El Mghira' },
]

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Engagements JAC Tunisie">
      <div className="trust-strip__inner">
        {ITEMS.map((item) => (
          <article key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
