import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ReplyBox } from '../components/ReplyBox'
import { models, showrooms } from '../data/content'
import {
  CONTACT,
  buildDevisReplyText,
  buildDevisReplyWhatsAppUrl,
  buildDevisWhatsAppUrl,
  openWhatsApp,
  type DevisInput,
} from '../lib/contact'
import { isValidTunisianPhone, sanitizeText } from '../lib/security'

type DevisForm = {
  modele: 'T8' | 'T8 PRO'
  showroomId: string
  nom: string
  telephone: string
  besoin: string
}

const initial: DevisForm = {
  modele: 'T8 PRO',
  showroomId: 'clh',
  nom: '',
  telephone: '',
  besoin: 'Devis véhicule neuf',
}

export function DevisPage() {
  const [form, setForm] = useState<DevisForm>(initial)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<DevisInput | null>(null)

  const showroomName = useMemo(
    () => showrooms.find((s) => s.id === form.showroomId)?.name ?? 'Showroom',
    [form.showroomId],
  )

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const nom = sanitizeText(form.nom, 80)
    if (nom.length < 2) {
      setError('Indiquez votre nom.')
      return
    }
    if (!isValidTunisianPhone(form.telephone)) {
      setError('Téléphone tunisien invalide (ex. 99 757 218)')
      return
    }

    const payload: DevisInput = {
      modele: form.modele,
      showroom: showroomName,
      nom,
      telephone: form.telephone.trim(),
      besoin: sanitizeText(form.besoin, 120),
    }

    openWhatsApp(buildDevisWhatsAppUrl(payload))
    setSent(payload)
  }

  return (
    <>
      <header className="page-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">Devis WhatsApp</p>
            <h1>Remplissez, envoyez, c’est parti.</h1>
            <p className="page-hero__lead">
              Le formulaire prépare le message. En cliquant sur envoyer, WhatsApp s’ouvre
              vers {CONTACT.whatsappDisplay} avec votre demande déjà écrite.
            </p>
          </div>
          <div className="page-hero__aside">
            <span>Ligne WhatsApp test</span>
            <strong className="page-hero__aside-phone">{CONTACT.whatsappLabel}</strong>
            <p>{CONTACT.whatsappDisplay}</p>
          </div>
        </div>
      </header>

      <section className="section commerce">
        {sent ? (
          <article className="panel panel--ticket">
            <p className="section__eyebrow">WhatsApp ouvert</p>
            <h2>Votre devis est prêt à envoyer</h2>
            <dl className="ticket-grid">
              <div>
                <dt>Nom</dt>
                <dd>{sent.nom}</dd>
              </div>
              <div>
                <dt>Téléphone</dt>
                <dd>{sent.telephone}</dd>
              </div>
              <div>
                <dt>Modèle</dt>
                <dd>JAC {sent.modele}</dd>
              </div>
              <div>
                <dt>Showroom</dt>
                <dd>{sent.showroom}</dd>
              </div>
              <div className="ticket-grid__full">
                <dt>Besoin</dt>
                <dd>{sent.besoin}</dd>
              </div>
            </dl>
            <ReplyBox
              title="Réponse à envoyer au client"
              replyText={buildDevisReplyText(sent)}
              replyWhatsAppUrl={buildDevisReplyWhatsAppUrl(sent)}
              clientLabel={sent.telephone}
            />

            <div className="panel__actions panel__actions--row">
              <a
                className="btn btn--whatsapp"
                href={buildDevisWhatsAppUrl(sent)}
                target="_blank"
                rel="noreferrer"
              >
                Rouvrir la demande
              </a>
              <button type="button" className="btn btn--outline" onClick={() => setSent(null)}>
                Nouveau devis
              </button>
              <Link className="btn btn--primary" to="/visite">
                Réserver une visite
              </Link>
            </div>
            <p className="form-hint">
              1) Le client envoie la demande → 2) Vous renvoyez la réponse suggérée ci-dessus.
            </p>
          </article>
        ) : (
          <div className="commerce__layout">
            <form className="panel panel--form" onSubmit={onSubmit}>
              <div className="panel__head">
                <p className="section__eyebrow">Formulaire</p>
                <h2>Demande de devis</h2>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Modèle</span>
                  <select
                    value={form.modele}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        modele: e.target.value as DevisForm['modele'],
                      }))
                    }
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.name}>
                        JAC {m.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Showroom</span>
                  <select
                    value={form.showroomId}
                    onChange={(e) => setForm((f) => ({ ...f, showroomId: e.target.value }))}
                  >
                    {showrooms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Nom</span>
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    placeholder="Prénom et nom"
                    autoComplete="name"
                  />
                </label>

                <label className="field">
                  <span>Téléphone</span>
                  <input
                    required
                    value={form.telephone}
                    onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                    placeholder="ex. 99 757 218"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </label>

                <label className="field field--full">
                  <span>Besoin</span>
                  <select
                    value={form.besoin}
                    onChange={(e) => setForm((f) => ({ ...f, besoin: e.target.value }))}
                  >
                    <option>Devis véhicule neuf</option>
                    <option>Devis + financement</option>
                    <option>Reprise de mon véhicule</option>
                    <option>Disponibilité / délai</option>
                  </select>
                </label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <div className="panel__actions">
                <button type="submit" className="btn btn--whatsapp">
                  Envoyer le devis sur WhatsApp
                </button>
                <p className="form-hint">
                  Étape suivante : WhatsApp s’ouvre → vous validez l’envoi vers{' '}
                  {CONTACT.whatsappLabel}.
                </p>
              </div>
            </form>

            <aside className="panel panel--aside">
              <p className="section__eyebrow">Parcours</p>
              <h3>Simple et direct</h3>
              <ul className="aside-list">
                <li>1. Remplir le formulaire</li>
                <li>2. Cliquer sur envoyer</li>
                <li>3. WhatsApp s’ouvre avec le texte</li>
                <li>4. Vous appuyez sur Envoyer</li>
              </ul>
              <div className="aside-stack">
                <Link className="btn btn--primary" to="/visite">
                  Réserver une visite
                </Link>
                <Link className="btn btn--outline" to="/modeles">
                  Voir les modèles 360°
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  )
}
