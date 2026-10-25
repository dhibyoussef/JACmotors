const FAQS = [
  {
    q: 'Comment fonctionne le devis PDF ?',
    a: 'Vous remplissez le formulaire (modèle, couleur, options). Une confirmation WhatsApp part tout de suite sur votre numéro. Ensuite, le serveur envoie automatiquement un devis PDF professionnel tamponné JAC — plus besoin d’un second message manuel.',
  },
  {
    q: 'Puis-je choisir une couleur et des options ?',
    a: 'Oui. Sur la page Devis, sélectionnez une teinte et des accessoires. Ils sont inclus dans le dossier et dans le PDF automatique.',
  },
  {
    q: 'Visite, essai routier ou Google Meet ?',
    a: 'Les trois. La confirmation WhatsApp part automatiquement au client ; le concessionnaire est notifié en parallèle. Pour le Meet, le lien est inclus.',
  },
  {
    q: 'La vue 360° envoie-t-elle un message ?',
    a: 'Oui. Après la vue 360°, laissez votre WhatsApp : un rappel / intérêt Meet part automatiquement, sans ouvrir WhatsApp à la main.',
  },
  {
    q: 'Quels showrooms sont couverts ?',
    a: 'Le réseau Tunisie : Tunis (siège / CLH), Ben Arous et atelier El Mghira. Carte et itinéraires sont sur la page Showrooms.',
  },
  {
    q: 'Et après l’achat ?',
    a: 'La page Après-vente couvre garantie, pièces et entretien atelier.',
  },
]

export function FaqSection() {
  return (
    <section className="section faq" id="faq">
      <div className="section__head">
        <p className="section__eyebrow">Questions fréquentes</p>
        <h2 className="section__title">Tout est clair avant d’écrire.</h2>
        <p className="section__lead">
          Devis PDF automatique, essai, Meet et 360° — le parcours WhatsApp sans double message.
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
