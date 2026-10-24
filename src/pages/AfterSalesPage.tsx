import { Link } from 'react-router-dom'
import { CONTACT, quickWhatsAppUrl } from '../lib/contact'

const PILLARS = [
  {
    title: 'Garantie constructeur',
    text: 'Couverture selon conditions JAC Tunisie. Le détail exact (durée, pièces, exclusions) se confirme en showroom ou atelier.',
  },
  {
    title: 'Pièces d’origine',
    text: 'Commande et disponibilité via le réseau local. Votre conseiller vous indique délai et référence avant intervention.',
  },
  {
    title: 'Entretien atelier',
    text: 'Vidange, freinage, diagnostic, climatisation — réservez un créneau atelier en quelques clics.',
  },
]

const SERVICES = [
  'Entretien périodique',
  'Vidange & filtres',
  'Freinage',
  'Diagnostic électronique',
  'Climatisation',
  'Pièces & accessoires',
]

export function AfterSalesPage() {
  return (
    <>
      <header className="page-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">Après-vente JAC</p>
            <h1>La route continue après la livraison.</h1>
            <p className="page-hero__lead">
              Garantie, pièces et entretien atelier — le même réseau Tunisie qui vous a
              accompagné pour le devis et la visite.
            </p>
          </div>
          <div className="page-hero__aside">
            <span>Ligne WhatsApp</span>
            <strong className="page-hero__aside-phone">{CONTACT.whatsappLabel}</strong>
            <p>Questions SAV · pièces · RDV atelier</p>
          </div>
        </div>
      </header>

      <section className="section aftersales">
        <div className="section__head">
          <p className="section__eyebrow">Ce que nous couvrons</p>
          <h2 className="section__title">Trois piliers. Une seule exigence.</h2>
        </div>
        <div className="aftersales__grid">
          {PILLARS.map((item) => (
            <article className="aftersales__card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section aftersales-services">
        <div className="section__head section__head--row">
          <div>
            <p className="section__eyebrow">Atelier El Mghira</p>
            <h2 className="section__title">Interventions courantes</h2>
          </div>
          <p className="section__lead">
            Réservez un créneau atelier ou écrivez sur WhatsApp pour une estimation.
          </p>
        </div>
        <ul className="aftersales__tags">
          {SERVICES.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="aftersales__actions">
          <Link className="btn btn--primary" to="/reserver">
            Réserver un entretien
          </Link>
          <a
            className="btn btn--whatsapp"
            href={quickWhatsAppUrl(
              'Bonjour JAC Motors Tunisie, j’ai une question après-vente / pièces / garantie.',
            )}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp SAV
          </a>
          <Link className="btn btn--outline" to="/showrooms">
            Voir l’atelier
          </Link>
        </div>
      </section>

      <section className="commerce-band commerce-band--flush">
        <div className="commerce-band__copy">
          <p className="section__eyebrow">Toujours le même fil</p>
          <h2>Devis, visite, puis entretien</h2>
          <p>
            Un parcours cohérent — du premier regard sur le T8 PRO jusqu’au suivi atelier.
          </p>
        </div>
        <div className="commerce-band__actions">
          <Link className="btn btn--primary" to="/devis">
            Demander un devis
          </Link>
          <Link className="btn btn--ghost-dark" to="/visite">
            Réserver une visite
          </Link>
        </div>
      </section>
    </>
  )
}
