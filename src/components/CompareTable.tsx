import { Link } from 'react-router-dom'
import { useCms } from '../cms/CmsProvider'
import { priceLabelFor } from '../lib/cms'
import { QUOTE_PACKAGES } from '../lib/quotes'

export function CompareTable() {
  const cms = useCms()
  const rows = [
    {
      label: 'Prix indicatif',
      t8: priceLabelFor('T8', cms.priceByModel),
      pro: priceLabelFor('T8 PRO', cms.priceByModel),
    },
    {
      label: 'Version',
      t8: QUOTE_PACKAGES.T8.version,
      pro: QUOTE_PACKAGES['T8 PRO'].version,
    },
    {
      label: 'Transmission',
      t8: QUOTE_PACKAGES.T8.drive,
      pro: QUOTE_PACKAGES['T8 PRO'].drive,
    },
    {
      label: 'Motorisation',
      t8: 'Selon config Tunisie',
      pro: QUOTE_PACKAGES['T8 PRO'].engine,
    },
    {
      label: 'Stock',
      t8: QUOTE_PACKAGES.T8.stockLabel,
      pro: QUOTE_PACKAGES['T8 PRO'].stockLabel,
    },
    { label: 'Positionnement', t8: 'Essentiel / utilitaire', pro: 'Premium / lifestyle' },
    { label: 'Équipement', t8: 'Base réseau Tunisie', pro: 'Cuir · 360° · jantes 18″' },
  ]

  return (
    <section className="section compare" id="comparer">
      <div className="section__head section__head--row">
        <div>
          <p className="section__eyebrow">Comparatif{cms.live ? ' · CMS' : ''}</p>
          <h2 className="section__title">T8 ou T8 PRO ?</h2>
        </div>
        <p className="section__lead">
          Deux pickups JAC pour la Tunisie. Choisissez selon l’usage — le devis WhatsApp
          confirme prix et stock.
        </p>
      </div>

      <div className="compare__table-wrap">
        <table className="compare__table">
          <thead>
            <tr>
              <th scope="col">Critère</th>
              <th scope="col">JAC T8</th>
              <th scope="col">JAC T8 PRO</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.t8}</td>
                <td>{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="compare__actions">
        <Link className="btn btn--outline" to="/modeles#t8">
          Voir le T8
        </Link>
        <Link className="btn btn--primary" to="/modeles#t8pro">
          Voir le T8 PRO
        </Link>
        <Link className="btn btn--whatsapp" to="/devis">
          Demander un devis
        </Link>
      </div>
    </section>
  )
}
