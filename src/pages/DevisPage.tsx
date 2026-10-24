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
      <header className="page-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">Devis WhatsApp</p>
            <h1>Votre devis, en un message.</h1>
            <p className="page-hero__lead">
              Indiquez votre modèle et votre besoin. WhatsApp s’ouvre avec un message
              prêt à envoyer au conseiller.
            </p>
          </div>
          <div className="page-hero__aside">
            <span>Ligne WhatsApp</span>
            <strong className="page-hero__aside-phone">{CONTACT.whatsappLabel}</strong>
            <p>{CONTACT.whatsappDisplay}</p>
          </div>
        </div>
      </header>

      <section className="section commerce">
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
                <span>Nom (optionnel)</span>
                <input
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  placeholder="Prénom et nom"
                  autoComplete="name"
                />
              </label>

              <label className="field">
                <span>Téléphone (optionnel)</span>
                <input
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
                Envoyer sur WhatsApp
              </button>
              <p className="form-hint">
                Message prérempli — vous pouvez le modifier avant l’envoi.
              </p>
            </div>
          </form>

          <aside className="panel panel--aside">
            <p className="section__eyebrow">Pourquoi WhatsApp ?</p>
            <h3>Réponse directe du conseiller</h3>
            <ul className="aside-list">
              <li>Devis personnalisé selon votre modèle</li>
              <li>Infos stock, délai et financement</li>
              <li>Pas de compte à créer</li>
              <li>Échange sur votre téléphone</li>
            </ul>
            <div className="aside-stack">
              <Link className="btn btn--primary" to="/visite">
                Réserver une visite
              </Link>
              <Link className="btn btn--outline" to="/modeles">
                Voir les modèles
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
