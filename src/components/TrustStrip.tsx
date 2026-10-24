const ITEMS = [
  { title: 'Prix catalogue', text: 'Affiché dès le devis WhatsApp' },
  { title: 'Couleur & options', text: 'Teinte et accessoires inclus' },
  { title: 'Essai / Meet', text: 'Créneaux clairs, lien Meet auto' },
  { title: 'Après-vente', text: 'Garantie · pièces · atelier' },
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
