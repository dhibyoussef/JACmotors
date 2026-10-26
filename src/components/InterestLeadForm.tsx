import { useState, type FormEvent } from 'react'
import { submitInterestLead } from '../lib/api'
import { isValidTunisianPhone, sanitizeText } from '../lib/security'

type Props = {
  modele: 'T8' | 'T8 PRO'
  source: '360' | 'showroom' | 'meet'
  title?: string
}

export function InterestLeadForm({
  modele,
  source,
  title = 'Recevoir un Google Meet / rappel WhatsApp',
}: Props) {
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ leadId: string; mode: string } | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const cleanNom = sanitizeText(nom, 80)
    if (cleanNom.length < 2) {
      setError('Indiquez votre nom.')
      return
    }
    if (!isValidTunisianPhone(telephone)) {
      setError('Téléphone tunisien invalide (ex. 99 757 218)')
      return
    }
    setSubmitting(true)
    const result = await submitInterestLead({
      nom: cleanNom,
      telephone: telephone.trim(),
      modele,
      source,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDone({ leadId: result.data.leadId, mode: result.data.whatsapp.mode })
  }

  if (done) {
    return (
      <div className="interest-form interest-form--done">
        <p className="section__eyebrow">Demande envoyée</p>
        <strong>Merci — confirmation WhatsApp en cours.</strong>
        <p>
          Réf. {done.leadId}. Un conseiller JAC vous recontacte pour le Meet / la visite.
        </p>
      </div>
    )
  }

  return (
    <form className="interest-form" onSubmit={onSubmit}>
      <div>
        <p className="section__eyebrow">Après la vue 360°</p>
        <strong>{title}</strong>
        <p>Indiquez votre WhatsApp — le message part automatiquement, sans second envoi manuel.</p>
      </div>
      <div className="interest-form__fields">
        <label className="field">
          <span>Nom</span>
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Prénom et nom"
            autoComplete="name"
          />
        </label>
        <label className="field">
          <span>WhatsApp</span>
          <input
            required
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="ex. 99 757 218"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
        <button type="submit" className="btn btn--whatsapp" disabled={submitting}>
          {submitting ? 'Envoi…' : 'Recevoir mon rappel'}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </form>
  )
}
