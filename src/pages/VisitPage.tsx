import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ReplyBox } from '../components/ReplyBox'
import { showrooms } from '../data/content'
import {
  CONTACT,
  buildVisitReplyText,
  buildVisitReplyWhatsAppUrl,
  buildVisitWhatsAppUrl,
  formatVisitDate,
  getVisitDays,
  getVisitSlots,
  listVisitRequests,
  openWhatsApp,
  saveVisitRequest,
  visitModeLabel,
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

function parseMode(value: string | null): VisitMode | null {
  if (value === 'meet' || value === 'essai' || value === 'showroom') return value
  return null
}

const initial: VisitForm = {
  nom: '',
  telephone: '',
  email: '',
  modele: 'T8 PRO',
  showroomId: 'clh',
  date: '',
  time: '',
  mode: 'showroom',
}

export function VisitPage() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<VisitForm>(() => {
    const modeParam = parseMode(searchParams.get('mode'))
    const modeleParam = searchParams.get('modele')
    return {
      ...initial,
      mode: modeParam ?? 'showroom',
      modele: modeleParam === 'T8' || modeleParam === 'T8 PRO' ? modeleParam : 'T8 PRO',
    }
  })
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState<VisitRequest | null>(null)
  const [history, setHistory] = useState<VisitRequest[]>(() => listVisitRequests())
  const [sent, setSent] = useState(false)

  const days = useMemo(() => getVisitDays(form.showroomId), [form.showroomId, ticket])
  const slots = useMemo(
    () => (form.date ? getVisitSlots(form.showroomId, form.date) : []),
    [form.showroomId, form.date, ticket],
  )

  useEffect(() => {
    const modeParam = parseMode(searchParams.get('mode'))
    const modeleParam = searchParams.get('modele')
    setForm((prev) => ({
      ...prev,
      mode: modeParam ?? prev.mode,
      modele:
        modeleParam === 'T8' || modeleParam === 'T8 PRO' ? modeleParam : prev.modele,
    }))
  }, [searchParams])

  useEffect(() => {
    if (!days.length) return
    setForm((prev) => {
      const stillOk = days.some((d) => d.date === prev.date && d.availableCount > 0)
      if (stillOk) return prev
      const first = days.find((d) => d.availableCount > 0) ?? days[0]
      return { ...prev, date: first.date, time: '' }
    })
  }, [days])

  useEffect(() => {
    if (!form.date) return
    const open = slots.find((s) => !s.taken)
    setForm((prev) => {
      const currentOk = slots.some((s) => s.time === prev.time && !s.taken)
      if (currentOk) return prev
      return { ...prev, time: open?.time ?? '' }
    })
  }, [form.date, slots])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSent(false)

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
      setError('Choisissez une date et un créneau disponibles.')
      return
    }
    const showroom = showrooms.find((s) => s.id === form.showroomId)
    if (!showroom) {
      setError('Showroom invalide.')
      return
    }

    try {
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
      openWhatsApp(buildVisitWhatsAppUrl(saved))
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer la visite.')
    }
  }

  const heroCopy =
    form.mode === 'essai'
      ? {
          eyebrow: 'Essai routier',
          title: 'Prenez le volant du JAC.',
          lead: `Réservez un créneau d’essai avec permis valide. Confirmation sur WhatsApp ${CONTACT.whatsappDisplay}.`,
        }
      : form.mode === 'meet'
        ? {
            eyebrow: 'Google Meet',
            title: 'Découvrez le showroom à distance.',
            lead: `Le lien Meet part automatiquement dans le message WhatsApp ${CONTACT.whatsappDisplay}.`,
          }
        : {
            eyebrow: 'Visite showroom',
            title: 'Réservez un créneau clair.',
            lead: `Sur place, essai routier ou Google Meet — la demande part sur WhatsApp ${CONTACT.whatsappDisplay}.`,
          }

  return (
    <>
      <header className="page-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">{heroCopy.eyebrow}</p>
            <h1>{heroCopy.title}</h1>
            <p className="page-hero__lead">{heroCopy.lead}</p>
          </div>
          <div className="page-hero__aside">
            <span>Ligne WhatsApp</span>
            <strong className="page-hero__aside-phone">{CONTACT.whatsappLabel}</strong>
            <p>Toutes les demandes arrivent ici</p>
          </div>
        </div>
      </header>

      <section className="section commerce">
        {ticket ? (
          <article className="panel panel--ticket">
            <p className="section__eyebrow">
              {sent ? 'Envoyé vers WhatsApp' : 'Confirmation'}
            </p>
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
                  {formatVisitDate(ticket.date)} · {ticket.time}
                </dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{visitModeLabel(ticket.mode)}</dd>
              </div>
              {ticket.mode === 'meet' && ticket.meetUrl && (
                <div className="ticket-grid__full">
                  <dt>Lien Meet</dt>
                  <dd className="ticket-link">{ticket.meetUrl}</dd>
                </div>
              )}
            </dl>

            {ticket.mode === 'meet' && ticket.meetUrl && (
              <div className="meet-box">
                <p>
                  Le lien Meet est dans le message WhatsApp. Rouvrez WhatsApp si besoin,
                  ou démarrez une vraie réunion.
                </p>
                <a
                  className="btn btn--primary"
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noreferrer"
                >
                  Créer une réunion Meet
                </a>
              </div>
            )}

            {ticket.mode === 'essai' && (
              <div className="meet-box">
                <p>
                  Apportez votre permis de conduire valide. Le conseiller confirmera le
                  véhicule d’essai et le parcours.
                </p>
                <Link className="btn btn--primary" to="/devis">
                  Préparer un devis
                </Link>
              </div>
            )}

            <ReplyBox
              title="Réponse à envoyer au client"
              replyText={buildVisitReplyText(ticket)}
              replyWhatsAppUrl={buildVisitReplyWhatsAppUrl(ticket)}
              clientLabel={ticket.telephone}
            />

            <div className="panel__actions panel__actions--row">
              <a
                className="btn btn--whatsapp"
                href={buildVisitWhatsAppUrl(ticket)}
                target="_blank"
                rel="noreferrer"
              >
                Rouvrir la demande
              </a>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => {
                  setTicket(null)
                  setSent(false)
                  setForm((f) => ({ ...f, time: '' }))
                }}
              >
                Nouvelle visite
              </button>
            </div>
            <p className="form-hint">
              1) Le client envoie la demande → 2) Vous renvoyez la réponse suggérée.
            </p>
          </article>
        ) : (
          <div className="commerce__layout">
            <form className="panel panel--form" onSubmit={onSubmit}>
              <div className="panel__head">
                <p className="section__eyebrow">Réservation</p>
                <h2>Votre rendez-vous</h2>
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
                    onChange={(e) =>
                      setForm((v) => ({
                        ...v,
                        showroomId: e.target.value,
                        date: '',
                        time: '',
                      }))
                    }
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
              </div>

              <fieldset className="mode-picker mode-picker--triple">
                <legend>Mode de rendez-vous</legend>
                <label className={form.mode === 'showroom' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="visit-mode"
                    checked={form.mode === 'showroom'}
                    onChange={() => setForm((v) => ({ ...v, mode: 'showroom' }))}
                  />
                  <span>
                    <strong>Visite</strong>
                    <small>Découverte showroom</small>
                  </span>
                </label>
                <label className={form.mode === 'essai' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="visit-mode"
                    checked={form.mode === 'essai'}
                    onChange={() => setForm((v) => ({ ...v, mode: 'essai' }))}
                  />
                  <span>
                    <strong>Essai routier</strong>
                    <small>Permis requis</small>
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
                    <small>À distance</small>
                  </span>
                </label>
              </fieldset>

              <div className="calendar-block">
                <div className="calendar-block__head">
                  <p className="section__eyebrow">Calendrier</p>
                  <h3>Choisissez une date disponible</h3>
                  <p>Les dimanches sont fermés. Les créneaux barrés sont déjà pris.</p>
                </div>

                <div className="date-chip-row" role="listbox" aria-label="Dates disponibles">
                  {days.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      role="option"
                      aria-selected={form.date === d.date}
                      className={`date-chip ${form.date === d.date ? 'selected' : ''}`}
                      disabled={d.availableCount === 0}
                      onClick={() => setForm((v) => ({ ...v, date: d.date, time: '' }))}
                    >
                      <strong>{d.dayName}</strong>
                      <span>{d.dayNum}</span>
                      <em>{d.availableCount} libres</em>
                    </button>
                  ))}
                </div>

                {form.date && (
                  <>
                    <p className="calendar-block__day">{formatVisitDate(form.date)}</p>
                    <div className="time-chip-row" role="listbox" aria-label="Créneaux">
                      {slots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          role="option"
                          aria-selected={form.time === s.time}
                          className={`time-chip ${form.time === s.time ? 'selected' : ''}`}
                          disabled={s.taken}
                          onClick={() => setForm((v) => ({ ...v, time: s.time }))}
                        >
                          {s.time}
                          {s.taken ? ' · pris' : ''}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {error && <p className="form-error">{error}</p>}

              <div className="panel__actions">
                <button type="submit" className="btn btn--whatsapp" disabled={!form.time}>
                  {form.mode === 'essai'
                    ? 'Envoyer l’essai sur WhatsApp'
                    : form.mode === 'meet'
                      ? 'Envoyer le Meet sur WhatsApp'
                      : 'Envoyer la visite sur WhatsApp'}
                </button>
                <p className="form-hint">
                  {form.mode === 'meet'
                    ? 'Le message inclura automatiquement le lien Google Meet.'
                    : form.mode === 'essai'
                      ? 'Le message précise l’essai routier et le permis requis.'
                      : `La demande part vers ${CONTACT.whatsappDisplay}.`}
                </p>
              </div>
            </form>

            <aside className="panel panel--aside">
              <p className="section__eyebrow">Comment ça marche</p>
              <h3>3 étapes simples</h3>
              <ul className="aside-list">
                <li>Remplissez vos infos</li>
                <li>Choisissez visite, essai ou Meet</li>
                <li>Date + créneau libre</li>
                <li>WhatsApp s’ouvre avec le message prêt</li>
              </ul>
              {history.length > 0 && (
                <div className="history-mini">
                  <p className="section__eyebrow">Dernières demandes</p>
                  <ul>
                    {history.slice(0, 3).map((h) => (
                      <li key={h.id}>
                        <strong>{h.id}</strong>
                        <span>
                          {h.modele} · {h.date} {h.time} · {visitModeLabel(h.mode)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="aside-stack">
                <Link className="btn btn--primary" to="/devis">
                  Demander un devis
                </Link>
                <Link className="btn btn--ghost-dark" to="/modeles">
                  Voir en 360°
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  )
}
