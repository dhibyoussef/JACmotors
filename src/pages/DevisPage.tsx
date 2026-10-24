import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { models, showrooms } from '../data/content'
import { CONTACT, buildDevisWhatsAppUrl } from '../lib/contact'
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

  const showroomName = useMemo(
    () => showrooms.find((s) => s.id === form.showroomId)?.name ?? 'Showroom',
    [form.showroomId],
  )

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.telephone.trim() && !isValidTunisianPhone(form.telephone)) {
      setError('Téléphone tunisien invalide (ex. 99 757 218)')
      return
    }
    const url = buildDevisWhatsAppUrl({
      modele: form.modele,
      showroom: showroomName,
      nom: sanitizeText(form.nom, 80),
      telephone: form.telephone.trim(),
      besoin: sanitizeText(form.besoin, 120),
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <header className="page-hero demo-hero">
        <p className="section__eyebrow page-hero__eyebrow">Devis WhatsApp</p>
        <h1>Obtenez votre devis rapidement.</h1>
        <p className="page-hero__lead">
          Choisissez votre modèle et votre showroom, puis envoyez votre demande
          directement sur WhatsApp au {CONTACT.whatsappDisplay}.
        </p>
      </header>

      <section className="section demo-section">
        <form className="demo-card demo-form" onSubmit={onSubmit}>
          <div className="demo-form__grid">
            <label>
              Modèle
              <select
                value={form.modele}
                onChange={(e) =>
                  setForm((f) => ({ ...f, modele: e.target.value as DevisForm['modele'] }))
                }
              >
                {models.map((m) => (
                  <option key={m.id} value={m.name}>
                    JAC {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Showroom
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
            <label>
              Nom (optionnel)
              <input
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Prénom et nom"
              />
            </label>
            <label>
              Téléphone (optionnel)
              <input
                value={form.telephone}
                onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                placeholder="ex. 99 757 218"
              />
            </label>
            <label className="demo-form__full">
              Besoin
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
          {error && <p className="demo-error">{error}</p>}
          <button type="submit" className="btn btn--whatsapp">
            Envoyer sur WhatsApp
          </button>
          <p className="demo-hint">
            WhatsApp s’ouvre avec un message déjà préparé. Vous pouvez le modifier avant
            l’envoi.
          </p>
        </form>

        <div className="demo-footer-cta" style={{ borderTop: 'none', paddingTop: '2rem' }}>
          <div>
            <p className="section__eyebrow">Ensuite</p>
            <h2>Préférez une visite en showroom ?</h2>
            <p>Réservez un créneau sur place ou en visioconférence Google Meet.</p>
          </div>
          <div className="demo-footer-cta__actions">
            <Link className="btn btn--primary" to="/visite">
              Réserver une visite
            </Link>
            <Link className="btn btn--outline" to="/modeles">
              Voir les modèles
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
