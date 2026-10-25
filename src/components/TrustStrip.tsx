const ITEMS = [
  { title: 'Devis PDF auto', text: 'Confirmation puis document tamponné' },
  { title: 'Couleur & options', text: 'Inclus dans le dossier client' },
  { title: 'Essai / Meet', text: 'WhatsApp automatique au client' },
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
