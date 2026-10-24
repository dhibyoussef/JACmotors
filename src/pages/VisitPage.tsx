import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { showrooms } from '../data/content'
import {
  CONTACT,
  listVisitRequests,
  saveVisitRequest,
  type VisitMode,
  type VisitRequest,
} from '../lib/contact'
import { isValidTunisianPhone, sanitizeText } from '../lib/security'

type VisitForm = {
  nom: string
  telephone: string
  email: string
  modele: 'T8' | 'T8 PRO'
  showroomId: string
  date: string
  time: string
  mode: VisitMode
}

function defaultVisitDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const visitSlots = ['09:00', '10:00', '11:30', '14:30', '16:00'] as const

const initial: VisitForm = {
  nom: '',
  telephone: '',
  email: '',
  modele: 'T8 PRO',
  showroomId: 'clh',
  date: defaultVisitDate(),
  time: '10:00',
  mode: 'showroom',
}

export function VisitPage() {
  const [form, setForm] = useState<VisitForm>(initial)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState<VisitRequest | null>(null)
  const [history, setHistory] = useState<VisitRequest[]>(() => listVisitRequests())

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
    if (!form.date || !form.time) {
      setError('Choisissez une date et un créneau.')
      return
    }
    const showroom = showrooms.find((s) => s.id === form.showroomId)
    if (!showroom) {
      setError('Showroom invalide.')
      return
    }

    const saved = saveVisitRequest({
      nom,
      telephone: form.telephone.trim(),
      email: sanitizeText(form.email, 120),
      modele: form.modele,
      showroomId: showroom.id,
      showroomName: showroom.name,
      date: form.date,
      time: form.time,
      mode: form.mode,
    })
    setTicket(saved)
    setHistory(listVisitRequests())
  }

  return (
    <>
      <header className="page-hero demo-hero">
        <p className="section__eyebrow page-hero__eyebrow">Visite showroom</p>
        <h1>Réservez une visite.</h1>
        <p className="page-hero__lead">
          Visite commerciale ou essai en showroom — ou échange en visioconférence Google
          Meet avec un conseiller.
        </p>
      </header>

      <section className="section demo-section">
        {ticket ? (
          <article className="demo-card demo-ticket">
            <p className="section__eyebrow">Confirmation</p>
            <h3>{ticket.id}</h3>
            <ul>
              <li>
                <strong>Nom</strong> {ticket.nom}
              </li>
              <li>
                <strong>Modèle</strong> JAC {ticket.modele}
              </li>
              <li>
                <strong>Showroom</strong> {ticket.showroomName}
              </li>
              <li>
                <strong>Quand</strong> {ticket.date} · {ticket.time}
              </li>
              <li>
                <strong>Mode</strong>{' '}
                {ticket.mode === 'meet'
                  ? 'Google Meet (visioconférence)'
                  : 'Sur place en showroom'}
              </li>
            </ul>
            {ticket.mode === 'meet' && ticket.meetUrl && (
              <div className="demo-meet-box">
                <p>{CONTACT.meetNote}</p>
                <a
                  className="btn btn--primary"
                  href={ticket.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir Google Meet
                </a>
              </div>
            )}
            <div className="demo-ticket__actions">
              <button type="button" className="btn btn--outline" onClick={() => setTicket(null)}>
                Nouvelle visite
              </button>
              <a
                className="btn btn--whatsapp"
                href={`https://wa.me/${CONTACT.whatsappE164}?text=${encodeURIComponent(
                  `Bonjour, je confirme ma visite ${ticket.id} (${ticket.date} ${ticket.time}) pour le JAC ${ticket.modele}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Confirmer sur WhatsApp
              </a>
            </div>
          </article>
        ) : (
          <form className="demo-card demo-form" onSubmit={onSubmit}>
            <div className="demo-form__grid">
              <label>
                Nom complet
                <input
                  required
                  value={form.nom}
                  onChange={(e) => setForm((v) => ({ ...v, nom: e.target.value }))}
                  placeholder="Prénom et nom"
                />
              </label>
              <label>
                Téléphone
                <input
                  required
                  value={form.telephone}
                  onChange={(e) => setForm((v) => ({ ...v, telephone: e.target.value }))}
                  placeholder="ex. 99 757 218"
                />
              </label>
              <label>
                Email (optionnel)
                <input
                  value={form.email}
                  onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
                  placeholder="vous@email.com"
                />
              </label>
              <label>
                Modèle
                <select
                  value={form.modele}
                  onChange={(e) =>
                    setForm((v) => ({
                      ...v,
                      modele: e.target.value as VisitForm['modele'],
                    }))
                  }
                >
                  <option value="T8">JAC T8</option>
                  <option value="T8 PRO">JAC T8 PRO</option>
                </select>
              </label>
              <label>
                Showroom
                <select
                  value={form.showroomId}
                  onChange={(e) => setForm((v) => ({ ...v, showroomId: e.target.value }))}
                >
                  {showrooms
                    .filter((s) => s.type !== 'atelier')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.city}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  required
                  value={form.date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))}
                />
              </label>
              <label>
                Créneau
                <select
                  value={form.time}
                  onChange={(e) => setForm((v) => ({ ...v, time: e.target.value }))}
                >
                  {visitSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset className="demo-mode">
              <legend>Comment souhaitez-vous la visite ?</legend>
              <label className={form.mode === 'showroom' ? 'active' : ''}>
                <input
                  type="radio"
                  name="visit-mode"
                  checked={form.mode === 'showroom'}
                  onChange={() => setForm((v) => ({ ...v, mode: 'showroom' }))}
                />
                <span>
                  <strong>En showroom</strong>
                  <small>Visite / essai sur place</small>
                </span>
              </label>
              <label className={form.mode === 'meet' ? 'active' : ''}>
                <input
                  type="radio"
                  name="visit-mode"
                  checked={form.mode === 'meet'}
                  onChange={() => setForm((v) => ({ ...v, mode: 'meet' }))}
                />
                <span>
                  <strong>Google Meet</strong>
                  <small>Visioconférence avec un conseiller</small>
                </span>
              </label>
            </fieldset>

            {error && <p className="demo-error">{error}</p>}
            <button type="submit" className="btn btn--primary">
              Confirmer la visite
            </button>
            <p className="demo-hint">
              Après confirmation, vous pouvez aussi prévenir le showroom sur WhatsApp{' '}
              {CONTACT.whatsappDisplay}.
            </p>
          </form>
        )}

        {history.length > 0 && !ticket && (
          <div className="demo-history">
            <p className="section__eyebrow">Vos dernières demandes</p>
            <ul>
              {history.slice(0, 3).map((h) => (
                <li key={h.id}>
                  <strong>{h.id}</strong>
                  <span>
                    {h.modele} · {h.date} {h.time} ·{' '}
                    {h.mode === 'meet' ? 'Meet' : 'Showroom'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="demo-footer-cta">
          <div>
            <p className="section__eyebrow">Besoin d’un prix ?</p>
            <h2>Demandez un devis WhatsApp.</h2>
            <p>Réponse directe sur votre téléphone.</p>
          </div>
          <Link className="btn btn--whatsapp" to="/devis">
            Demander un devis
          </Link>
        </div>
      </section>
    </>
  )
}
