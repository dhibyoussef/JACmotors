const FAQS = [
  {
    q: 'Le devis WhatsApp est-il contractuel ?',
    a: 'Non. C’est un devis indicatif avec prix catalogue, specs et exemples de financement. Le prix final, le stock et les options se confirment en showroom avec un conseiller JAC.',
  },
  {
    q: 'Puis-je financer le JAC T8 / T8 PRO ?',
    a: 'Oui. Sur la demande « Devis + financement », le message inclut des exemples de mensualités. L’étude de dossier se fait en showroom selon votre profil.',
  },
  {
    q: 'Visite showroom ou Google Meet ?',
    a: 'Les deux. Sur place pour essayer le véhicule, ou en Google Meet pour découvrir les showrooms à distance après la vue 360° — le lien Meet est dans le message WhatsApp.',
  },
  {
    q: 'Quels showrooms sont couverts ?',
    a: 'Le réseau Tunisie : Tunis (siège / CLH), Ben Arous et atelier El Mghira. Appelez avant de vous déplacer pour confirmer horaires et disponibilité.',
  },
  {
    q: 'Combien de temps pour une réponse ?',
    a: 'Les messages partent vers la ligne WhatsApp test (+216 99 757 218). Un conseiller vous recontacte rapidement avec devis, créneau ou confirmation de visite.',
  },
]

export function FaqSection() {
  return (
    <section className="section faq" id="faq">
      <div className="section__head">
        <p className="section__eyebrow">Questions fréquentes</p>
        <h2 className="section__title">Tout est clair avant d’écrire.</h2>
        <p className="section__lead">
          Les réponses que les clients demandent avant un devis ou une visite JAC.
        </p>
      </div>
      <div className="faq__list">
        {FAQS.map((item) => (
          <details className="faq__item" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
