import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { showrooms } from '../data/content'
import { submitVisiteLead } from '../lib/api'
import {
  CONTACT,
  formatVisitDate,
  getVisitDays,
  getVisitSlots,
  listVisitRequests,
  meetUrlFromId,
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

type TicketState = VisitRequest & {
  automationMode?: string
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
  const [ticket, setTicket] = useState<TicketState | null>(null)
  const [history, setHistory] = useState<VisitRequest[]>(() => listVisitRequests())
  const [submitting, setSubmitting] = useState(false)

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

  async function onSubmit(e: FormEvent) {
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
      setError('Choisissez une date et un créneau disponibles.')
      return
    }
    const showroom = showrooms.find((s) => s.id === form.showroomId)
    if (!showroom) {
      setError('Showroom invalide.')
      return
    }

    setSubmitting(true)
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

      const api = await submitVisiteLead({
        nom: saved.nom,
        telephone: saved.telephone,
        email: saved.email,
        modele: saved.modele,
        showroomId: saved.showroomId,
        showroomName: saved.showroomName,
        date: saved.date,
        time: saved.time,
        mode: saved.mode,
        meetUrl: saved.meetUrl ?? meetUrlFromId(saved.id),
      })

      if (!api.ok) {
        setError(api.error)
        setSubmitting(false)
        return
      }

      setTicket({
        ...saved,
        id: api.data.leadId || saved.id,
        meetUrl: api.data.meetUrl ?? saved.meetUrl,
        automationMode: api.data.whatsapp.mode,
      })
      setHistory(listVisitRequests())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer la visite.')
    } finally {
      setSubmitting(false)
    }
  }

  const heroCopy =
    form.mode === 'essai'
      ? {
          eyebrow: 'Essai routier',
          title: 'Prenez le volant du JAC.',
          lead: 'Réservez un créneau d’essai. Confirmation WhatsApp automatique sur votre numéro.',
        }
      : form.mode === 'meet'
        ? {
            eyebrow: 'Google Meet',
            title: 'Découvrez le showroom à distance.',
            lead: 'Le lien Meet et la confirmation partent automatiquement sur WhatsApp.',
          }
        : {
            eyebrow: 'Visite showroom',
            title: 'Réservez un créneau clair.',
            lead: 'Visite, essai ou Meet — confirmation automatique sur votre WhatsApp.',
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
            <span>Workflow JAC</span>
            <strong className="page-hero__aside-phone">Auto WhatsApp</strong>
            <p>Confirmation client · alerte concessionnaire</p>
          </div>
        </div>
      </header>

      <section className="section commerce">
        {ticket ? (
          <article className="panel panel--ticket panel--success-flow">
            <p className="section__eyebrow">Rendez-vous enregistré</p>
            <h2>{ticket.id}</h2>
            <p className="success-flow__lead">
              Confirmation envoyée automatiquement sur WhatsApp{' '}
              <strong>{ticket.telephone}</strong>. Pas de second message manuel à renvoyer.
            </p>
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
                <p>Le lien Meet est inclus dans le WhatsApp de confirmation.</p>
                <a
                  className="btn btn--primary"
                  href={ticket.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir le lien Meet
                </a>
              </div>
            )}

            {ticket.mode === 'essai' && (
              <div className="meet-box">
                <p>Apportez votre permis de conduire valide le jour de l’essai.</p>
                <Link className="btn btn--primary" to="/devis">
                  Demander un devis PDF
                </Link>
              </div>
            )}

            <div className="panel__actions panel__actions--row">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => {
                  setTicket(null)
                  setForm((f) => ({ ...f, time: '' }))
                }}
              >
                Nouveau rendez-vous
              </button>
              <Link className="btn btn--primary" to="/devis">
                Demander un devis
              </Link>
            </div>
            <p className="form-hint">
              Mode WhatsApp : <strong>{ticket.automationMode || 'api'}</strong>
              {ticket.automationMode === 'dry-run'
                ? ' — configurez WHATSAPP_TOKEN pour l’envoi réel.'
                : ''}
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
                  <span>WhatsApp (Tunisie)</span>
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
                <button
                  type="submit"
                  className="btn btn--whatsapp"
                  disabled={!form.time || submitting}
                >
                  {submitting ? 'Envoi…' : 'Confirmer sur WhatsApp'}
                </button>
                <p className="form-hint">
                  Le message part automatiquement vers votre numéro — plus besoin d’ouvrir
                  WhatsApp manuellement ({CONTACT.whatsappLabel} notifié côté JAC).
                </p>
              </div>
            </form>

            <aside className="panel panel--aside">
              <p className="section__eyebrow">Comment ça marche</p>
              <h3>Automatisé de bout en bout</h3>
              <ul className="aside-list">
                <li>Vous remplissez le formulaire</li>
                <li>Confirmation WhatsApp au client</li>
                <li>Alerte au concessionnaire</li>
                <li>Meet : lien inclus automatiquement</li>
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
                  Demander un devis PDF
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
