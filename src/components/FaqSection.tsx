import { useCms } from '../cms/CmsProvider'

const FALLBACK = [
  {
    question: 'Comment fonctionne le devis PDF ?',
    answer:
      'Vous remplissez le formulaire (modèle, couleur, options). Une confirmation WhatsApp part tout de suite sur votre numéro. Ensuite, le serveur envoie automatiquement un devis PDF professionnel tamponné JAC — plus besoin d’un second message manuel.',
  },
  {
    question: 'Puis-je choisir une couleur et des options ?',
    answer:
      'Oui. Sur la page Devis, sélectionnez une teinte et des accessoires. Ils sont inclus dans le dossier et dans le PDF automatique.',
  },
  {
    question: 'Visite, essai routier ou Google Meet ?',
    answer:
      'Les trois. La confirmation WhatsApp part automatiquement au client ; le concessionnaire est notifié en parallèle. Pour le Meet, le lien est inclus.',
  },
  {
    question: 'La vue 360° envoie-t-elle un message ?',
    answer:
      'Oui. Après la vue 360°, laissez votre WhatsApp : un rappel / intérêt Meet part automatiquement, sans ouvrir WhatsApp à la main.',
  },
  {
    question: 'Quels showrooms sont couverts ?',
    answer:
      'Le réseau Tunisie : Tunis (siège / CLH), Ben Arous et atelier El Mghira. Carte et itinéraires sont sur la page Showrooms.',
  },
  {
    question: 'Et après l’achat ?',
    answer: 'La page Après-vente couvre garantie, pièces et entretien atelier.',
  },
]

export function FaqSection() {
  const cms = useCms()
  const items = cms.faqs.length
    ? cms.faqs.map((f) => ({ question: f.question, answer: f.answer }))
    : FALLBACK

  return (
    <section className="section faq" id="faq">
      <div className="section__head">
        <p className="section__eyebrow">
          Questions fréquentes{cms.live ? ' · CMS' : ''}
        </p>
        <h2 className="section__title">Tout est clair avant d’écrire.</h2>
        <p className="section__lead">
          Devis PDF automatique, essai, Meet et 360° — le parcours WhatsApp sans double
          message. Éditez ces réponses dans le CMS Directus.
        </p>
      </div>
      <div className="faq__list">
        {items.map((item) => (
          <details className="faq__item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
