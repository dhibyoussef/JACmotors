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
      <header className="page-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">Visite showroom</p>
            <h1>Venez découvrir le pickup.</h1>
            <p className="page-hero__lead">
              Réservez une visite commerciale ou un essai — sur place, ou en
              visioconférence Google Meet.
            </p>
          </div>
          <div className="page-hero__aside">
            <span>Deux façons</span>
            <strong className="page-hero__aside-phone">Showroom</strong>
            <p>ou Google Meet avec un conseiller</p>
          </div>
        </div>
      </header>

      <section className="section commerce">
        {ticket ? (
          <article className="panel panel--ticket">
            <p className="section__eyebrow">Confirmation</p>
            <h2>{ticket.id}</h2>
            <dl className="ticket-grid">
              <div>
                <dt>Nom</dt>
                <dd>{ticket.nom}</dd>
              </div>
              <div>
                <dt>Modèle</dt>
                <dd>JAC {ticket.modele}</dd>
              </div>
              <div>
                <dt>Showroom</dt>
                <dd>{ticket.showroomName}</dd>
              </div>
              <div>
                <dt>Quand</dt>
                <dd>
                  {ticket.date} · {ticket.time}
                </dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>
                  {ticket.mode === 'meet'
                    ? 'Google Meet'
                    : 'Sur place en showroom'}
                </dd>
              </div>
            </dl>

            {ticket.mode === 'meet' && ticket.meetUrl && (
              <div className="meet-box">
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

            <div className="panel__actions panel__actions--row">
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
          <div className="commerce__layout">
            <form className="panel panel--form" onSubmit={onSubmit}>
              <div className="panel__head">
                <p className="section__eyebrow">Réservation</p>
                <h2>Votre visite</h2>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Nom complet</span>
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm((v) => ({ ...v, nom: e.target.value }))}
                    placeholder="Prénom et nom"
                    autoComplete="name"
                  />
                </label>
                <label className="field">
                  <span>Téléphone</span>
                  <input
                    required
                    value={form.telephone}
                    onChange={(e) => setForm((v) => ({ ...v, telephone: e.target.value }))}
                    placeholder="ex. 99 757 218"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </label>
                <label className="field">
                  <span>Email (optionnel)</span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
                    placeholder="vous@email.com"
                    autoComplete="email"
                  />
                </label>
                <label className="field">
                  <span>Modèle</span>
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
                <label className="field field--full">
                  <span>Showroom</span>
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
                <label className="field">
                  <span>Date</span>
                  <input
                    type="date"
                    required
                    value={form.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Créneau</span>
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

              <fieldset className="mode-picker">
                <legend>Mode de visite</legend>
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
                    <small>Visioconférence conseiller</small>
                  </span>
                </label>
              </fieldset>

              {error && <p className="form-error">{error}</p>}

              <div className="panel__actions">
                <button type="submit" className="btn btn--primary">
                  Confirmer la visite
                </button>
                <p className="form-hint">
                  Après confirmation, vous pouvez prévenir le showroom sur WhatsApp{' '}
                  {CONTACT.whatsappDisplay}.
                </p>
              </div>
            </form>

            <aside className="panel panel--aside">
              <p className="section__eyebrow">Conseil</p>
              <h3>Préparez votre visite</h3>
              <ul className="aside-list">
                <li>Choisissez T8 ou T8 PRO</li>
                <li>Indiquez un créneau réaliste</li>
                <li>Sur place : essai & découverte</li>
                <li>Meet : échange commercial à distance</li>
              </ul>
              {history.length > 0 && (
                <div className="history-mini">
                  <p className="section__eyebrow">Dernières demandes</p>
                  <ul>
                    {history.slice(0, 3).map((h) => (
                      <li key={h.id}>
                        <strong>{h.id}</strong>
                        <span>
                          {h.modele} · {h.date} · {h.mode === 'meet' ? 'Meet' : 'Showroom'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="aside-stack">
                <Link className="btn btn--whatsapp" to="/devis">
                  Demander un devis
                </Link>
                <Link className="btn btn--outline" to="/showrooms">
                  Voir les showrooms
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  )
}
