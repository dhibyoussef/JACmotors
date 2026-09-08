import { Link } from 'react-router-dom'
import { useMemo, useState, type FormEvent } from 'react'
import { serviceTypes, showrooms } from '../data/content'
import {
  downloadTicket,
  generateTicketId,
  getAvailableDays,
  saveReservation,
  verifyReservation,
  type Reservation,
} from '../lib/reservations'
import {
  checkRateLimit,
  formatPhoneDisplay,
  isValidEmail,
  isValidMatricule,
  isValidTunisianPhone,
  recordSubmission,
  sanitizeEmail,
  sanitizeMatricule,
  sanitizeText,
} from '../lib/security'

type FormState = {
  matricule: string
  nom: string
  email: string
  telephone: string
  modele: 'T8' | 'T8 PRO'
  showroomId: string
  service: string
  date: string
  time: string
  consent: boolean
  /** Honeypot — must stay empty */
  website: string
}

const initial: FormState = {
  matricule: '',
  nom: '',
  email: '',
  telephone: '',
  modele: 'T8 PRO',
  showroomId: 'mghira',
  service: serviceTypes[0],
  date: '',
  time: '',
  consent: false,
  website: '',
}

type FieldErrors = Partial<Record<keyof FormState | 'form', string>>

export function ReservePage() {
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [ticket, setTicket] = useState<Reservation | null>(null)
  const [verified, setVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const days = useMemo(
    () => getAvailableDays(form.showroomId),
    [form.showroomId, ticket],
  )

  const selectedDay = days.find((d) => d.date === form.date)
  const selectedShowroom = showrooms.find((s) => s.id === form.showroomId)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'showroomId') {
        next.date = ''
        next.time = ''
      }
      if (key === 'date') next.time = ''
      return next
    })
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }))
  }

  function validate(): boolean {
    const next: FieldErrors = {}

    if (form.website.trim()) {
      next.form = 'Requête refusée.'
      setErrors(next)
      return false
    }

    const rate = checkRateLimit()
    if (!rate.ok) {
      next.form = `Trop de tentatives. Réessayez dans ${rate.retryMinutes} min.`
      setErrors(next)
      return false
    }

    if (!isValidMatricule(form.matricule)) {
      next.matricule = 'Matricule invalide (ex. 123 TU 4567)'
    }
    if (sanitizeText(form.nom, 80).length < 2) {
      next.nom = 'Nom complet requis (min. 2 caractères)'
    }
    if (!isValidEmail(form.email)) next.email = 'Adresse email invalide'
    if (!isValidTunisianPhone(form.telephone)) {
      next.telephone = 'Téléphone tunisien invalide (8 chiffres)'
    }
    if (!showrooms.some((s) => s.id === form.showroomId)) {
      next.showroomId = 'Showroom invalide'
    }
    if (!(serviceTypes as readonly string[]).includes(form.service)) {
      next.service = 'Service invalide'
    }
    if (!form.date) next.date = 'Choisissez une date'
    if (!form.time) next.time = 'Choisissez une heure'
    else if (selectedDay && !selectedDay.slots.find((s) => s.time === form.time)?.available) {
      next.time = 'Ce créneau n’est plus disponible'
    }
    if (!form.consent) {
      next.consent = 'Consentement requis pour enregistrer le ticket'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate() || submitting) return

    setSubmitting(true)
    try {
      const reservation = await saveReservation({
        id: generateTicketId(),
        matricule: sanitizeMatricule(form.matricule),
        nom: sanitizeText(form.nom, 80),
        email: sanitizeEmail(form.email),
        telephone: formatPhoneDisplay(form.telephone),
        modele: form.modele,
        showroomId: form.showroomId,
        service: form.service,
        date: form.date,
        time: form.time,
        createdAt: new Date().toISOString(),
        consentAt: new Date().toISOString(),
      })
      recordSubmission()
      const ok = await verifyReservation(reservation)
      setVerified(ok)
      setTicket(reservation)
    } catch {
      setErrors({ form: 'Impossible d’enregistrer. Vérifiez les champs et réessayez.' })
    } finally {
      setSubmitting(false)
    }
  }

  const showroomName =
    showrooms.find((s) => s.id === (ticket?.showroomId ?? form.showroomId))
      ?.name ?? ''
  const ticketShowroom = showrooms.find((s) => s.id === ticket?.showroomId)

  if (ticket) {
    return (
      <>
        <header className="page-hero">
          <p className="section__eyebrow" style={{ color: '#ff6b73' }}>
            Confirmation sécurisée
          </p>
          <h1>Ticket enregistré</h1>
          <p>
            Conservez ce ticket. Présentez-le à l’accueil et confirmez idéalement
            par téléphone.
          </p>
        </header>

        <section className="section" style={{ maxWidth: 680 }}>
          <div className="ticket-success">
            <div className="trust-row">
              <span className="trust-pill">Sans compte</span>
              <span className="trust-pill">
                {verified ? 'Sceau d’intégrité OK' : 'Ticket local'}
              </span>
              <span className="trust-pill">Données sur cet appareil</span>
            </div>

            <p className="section__eyebrow">N° de ticket</p>
            <div className="ticket-success__id">{ticket.id}</div>

            <div className="ticket-meta">
              <div>
                <span>Nom</span>
                <span>{ticket.nom}</span>
              </div>
              <div>
                <span>Matricule</span>
                <span>{ticket.matricule}</span>
              </div>
              <div>
                <span>Modèle</span>
                <span>{ticket.modele}</span>
              </div>
              <div>
                <span>Contact</span>
                <span>
                  {ticket.email} · {ticket.telephone}
                </span>
              </div>
              <div>
                <span>Lieu</span>
                <span>{showroomName}</span>
              </div>
              <div>
                <span>Service</span>
                <span>{ticket.service}</span>
              </div>
              <div>
                <span>Date &amp; heure</span>
                <span>
                  {ticket.date} · {ticket.time}
                </span>
              </div>
              {ticket.integrity && (
                <div>
                  <span>Sceau</span>
                  <span className="mono">{ticket.integrity}</span>
                </div>
              )}
            </div>

            <p className="source-note">
              Ne publiez pas ce ticket sur les réseaux. Appelez le showroom pour
              confirmer le créneau.
            </p>

            <div className="ticket-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => downloadTicket(ticket, showroomName)}
              >
                Enregistrer / imprimer
              </button>
              {ticketShowroom && (
                <a
                  className="btn btn--outline"
                  href={`tel:+216${ticketShowroom.phone.replace(/\s/g, '')}`}
                >
                  Appeler {ticketShowroom.phone}
                </a>
              )}
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => {
                  setTicket(null)
                  setForm(initial)
                  setVerified(false)
                }}
              >
                Nouvelle réservation
              </button>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <header className="page-hero">
        <p className="section__eyebrow" style={{ color: '#ff6b73' }}>
          Service atelier · protégé
        </p>
        <h1>Réserver un entretien</h1>
        <p>
          Formulaire sécurisé sans compte : validation des champs, anti-abus,
          consentement, ticket scellé stocké uniquement sur votre appareil.
        </p>
      </header>

      <section className="section">
        <div className="reserve-layout">
          <form
            className="form-card"
            onSubmit={onSubmit}
            noValidate
            autoComplete="on"
          >
            <div className="form-intro">
              <h2 className="form-title">Vos informations</h2>
              <p>
                Champs obligatoires. Les données restent en local (navigateur) —
                voir{' '}
                <Link to="/confidentialite">Confidentialité</Link>.
              </p>
            </div>

            {/* Honeypot */}
            <div className="hp" aria-hidden="true">
              <label htmlFor="website">Site web</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
              />
            </div>

            {errors.form && (
              <p className="form-banner" role="alert">
                {errors.form}
              </p>
            )}

            <fieldset className="form-grid">
              <legend className="sr-only">Identité véhicule &amp; contact</legend>

              <div className="field">
                <label htmlFor="matricule">Matricule</label>
                <input
                  id="matricule"
                  name="matricule"
                  value={form.matricule}
                  onChange={(e) => update('matricule', e.target.value)}
                  onBlur={() =>
                    update('matricule', sanitizeMatricule(form.matricule))
                  }
                  placeholder="ex. 123 TU 4567"
                  autoComplete="off"
                  inputMode="text"
                  maxLength={20}
                  spellCheck={false}
                  aria-invalid={Boolean(errors.matricule)}
                  aria-describedby={errors.matricule ? 'err-matricule' : undefined}
                />
                {errors.matricule && (
                  <p className="error" id="err-matricule" role="alert">
                    {errors.matricule}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="nom">Nom complet</label>
                <input
                  id="nom"
                  name="nom"
                  value={form.nom}
                  onChange={(e) => update('nom', e.target.value)}
                  onBlur={() => update('nom', sanitizeText(form.nom, 80))}
                  placeholder="Prénom et nom"
                  autoComplete="name"
                  maxLength={80}
                  aria-invalid={Boolean(errors.nom)}
                  aria-describedby={errors.nom ? 'err-nom' : undefined}
                />
                {errors.nom && (
                  <p className="error" id="err-nom" role="alert">
                    {errors.nom}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="email">Email de contact</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  onBlur={() => update('email', sanitizeEmail(form.email))}
                  placeholder="vous@email.com"
                  autoComplete="email"
                  maxLength={120}
                  inputMode="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'err-email' : undefined}
                />
                {errors.email && (
                  <p className="error" id="err-email" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="telephone">Téléphone (+216)</label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => update('telephone', e.target.value)}
                  onBlur={() =>
                    update('telephone', formatPhoneDisplay(form.telephone))
                  }
                  placeholder="ex. 50 512 877"
                  autoComplete="tel-national"
                  maxLength={20}
                  inputMode="tel"
                  aria-invalid={Boolean(errors.telephone)}
                  aria-describedby={errors.telephone ? 'err-tel' : undefined}
                />
                {errors.telephone && (
                  <p className="error" id="err-tel" role="alert">
                    {errors.telephone}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="modele">Modèle JAC</label>
                <select
                  id="modele"
                  name="modele"
                  value={form.modele}
                  onChange={(e) =>
                    update('modele', e.target.value as FormState['modele'])
                  }
                >
                  <option value="T8">JAC T8</option>
                  <option value="T8 PRO">JAC T8 PRO</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="service">Type d’entretien</label>
                <select
                  id="service"
                  name="service"
                  value={form.service}
                  onChange={(e) => update('service', e.target.value)}
                >
                  {serviceTypes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field full">
                <label htmlFor="showroom">Showroom / atelier</label>
                <select
                  id="showroom"
                  name="showroom"
                  value={form.showroomId}
                  onChange={(e) => update('showroomId', e.target.value)}
                >
                  {showrooms.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.city} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>

            <fieldset className="slot-block">
              <legend>Créneau disponible</legend>
              <p className="slot-hint">Lundi–samedi · horaires atelier types</p>

              <div className="date-grid" role="listbox" aria-label="Dates">
                {days.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    role="option"
                    aria-selected={form.date === d.date}
                    className={`date-chip ${form.date === d.date ? 'selected' : ''}`}
                    onClick={() => update('date', d.date)}
                  >
                    <strong>{d.weekday}</strong>
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
              {errors.date && (
                <p className="error" role="alert">
                  {errors.date}
                </p>
              )}

              {selectedDay && (
                <div className="time-block">
                  <p className="field-label">Heure</p>
                  <div className="time-row" role="listbox" aria-label="Heures">
                    {selectedDay.slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        role="option"
                        aria-selected={form.time === slot.time}
                        className={`time-chip ${form.time === slot.time ? 'selected' : ''}`}
                        disabled={!slot.available}
                        onClick={() => update('time', slot.time)}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  {errors.time && (
                    <p className="error" role="alert">
                      {errors.time}
                    </p>
                  )}
                </div>
              )}
            </fieldset>

            <label className="consent">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => update('consent', e.target.checked)}
              />
              <span>
                J’accepte le stockage local de mes données pour générer mon
                ticket d’entretien, conformément à la{' '}
                <Link to="/confidentialite">politique de confidentialité</Link>.
              </span>
            </label>
            {errors.consent && (
              <p className="error" role="alert">
                {errors.consent}
              </p>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Sécurisation…' : 'Confirmer la réservation'}
              </button>
            </div>
          </form>

          <aside className="aside-panel">
            <h3>Sécurité &amp; confiance</h3>
            <ul className="secure-list">
              <li>Validation stricte matricule, email, téléphone TN</li>
              <li>Protection anti-bots (honeypot) &amp; limite de tentatives</li>
              <li>Assainissement XSS sur le ticket exporté</li>
              <li>Sceau d’intégrité SHA-256 du ticket</li>
              <li>Aucune donnée envoyée à un serveur tiers</li>
            </ul>
            <ol>
              <li>Renseignez matricule et coordonnées</li>
              <li>Choisissez un créneau</li>
              <li>Acceptez le consentement</li>
              <li>Téléchargez / imprimez le ticket</li>
              <li>Confirmez par téléphone si besoin</li>
            </ol>
            {selectedShowroom && (
              <p className="aside-phone">
                Contact sélectionné :{' '}
                <a href={`tel:+216${selectedShowroom.phone.replace(/\s/g, '')}`}>
                  {selectedShowroom.phone}
                </a>
              </p>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}
