import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT, quickWhatsAppUrl } from '../lib/contact'
import { bookPublicAppointment, fetchSlots, type Slot } from '../lib/adminApi'
import { isValidTunisianPhone, sanitizeMatricule, sanitizeText } from '../lib/security'

const PILLARS = [
  {
    title: 'Garantie constructeur',
    text: 'Couverture selon conditions JAC Tunisie. Le détail exact (durée, pièces, exclusions) se confirme en showroom ou atelier.',
  },
  {
    title: 'Pièces d’origine',
    text: 'Commande et disponibilité via le réseau local. Votre conseiller vous indique délai et référence avant intervention.',
  },
  {
    title: 'Entretien atelier',
    text: 'Vidange, freinage, diagnostic, climatisation — réservez un créneau atelier en quelques clics.',
  },
]

const SERVICES = [
  'Entretien périodique',
  'Vidange & filtres',
  'Freinage',
  'Diagnostic électronique',
  'Climatisation',
  'Pièces & accessoires',
]

function nextOpenDays(count = 14) {
  const out: string[] = []
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  while (out.length < count) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day === 0) continue // skip Sunday
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function labelDay(iso: string) {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-TN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return iso
  }
}

export function AfterSalesPage() {
  const days = useMemo(() => nextOpenDays(12), [])
  const [date, setDate] = useState(days[0] || '')
  const [slots, setSlots] = useState<Slot[]>([])
  const [time, setTime] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [doneId, setDoneId] = useState('')
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    matricule: '',
    modele: 'T8 PRO',
    notes: '',
  })

  useEffect(() => {
    if (!date) return
    let cancelled = false
    ;(async () => {
      setLoadingSlots(true)
      setError('')
      const result = await fetchSlots(date)
      if (cancelled) return
      setLoadingSlots(false)
      if (!result.ok) {
        setSlots([])
        setError(result.error)
        return
      }
      setSlots(result.slots)
      const firstFree = result.slots.find((s) => !s.taken)?.time || ''
      setTime(firstFree)
    })()
    return () => {
      cancelled = true
    }
  }, [date])

  async function onBook(e: FormEvent) {
    e.preventDefault()
    setError('')
    setDoneId('')
    const nom = sanitizeText(form.nom, 80)
    if (nom.length < 2) {
      setError('Indiquez votre nom.')
      return
    }
    if (!isValidTunisianPhone(form.telephone)) {
      setError('Téléphone tunisien invalide (ex. 99 757 218)')
      return
    }
    if (!date || !time) {
      setError('Choisissez une date et un créneau.')
      return
    }
    setSubmitting(true)
    const result = await bookPublicAppointment({
      nom,
      telephone: form.telephone.trim(),
      matricule: sanitizeMatricule(form.matricule) || undefined,
      modele: form.modele,
      type: 'checkup',
      showroom: 'Atelier El Mghira',
      date,
      time,
      notes: sanitizeText(form.notes, 200) || undefined,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDoneId(result.appointment.id)
    setForm({ nom: '', telephone: '', matricule: '', modele: 'T8 PRO', notes: '' })
  }

  return (
    <>
      <header className="page-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">Après-vente JAC</p>
            <h1>La route continue après la livraison.</h1>
            <p className="page-hero__lead">
              Garantie, pièces et check-up atelier — choisissez une date, un conseiller
              confirme, WhatsApp vous tient informé.
            </p>
          </div>
          <div className="page-hero__aside">
            <span>Ligne WhatsApp</span>
            <strong className="page-hero__aside-phone">{CONTACT.whatsappLabel}</strong>
            <p>Questions SAV · pièces · RDV atelier</p>
          </div>
        </div>
      </header>

      <section className="section aftersales">
        <div className="section__head">
          <p className="section__eyebrow">Ce que nous couvrons</p>
          <h2 className="section__title">Trois piliers. Une seule exigence.</h2>
        </div>
        <div className="aftersales__grid">
          {PILLARS.map((item) => (
            <article className="aftersales__card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section aftersales-services" id="checkup">
        <div className="section__head section__head--row">
          <div>
            <p className="section__eyebrow">Atelier El Mghira</p>
            <h2 className="section__title">Réserver un check-up</h2>
          </div>
          <p className="section__lead">
            Sélectionnez une date, un créneau, et votre véhicule — l’équipe confirme sous
            peu.
          </p>
        </div>

        <ul className="aftersales__tags">
          {SERVICES.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        {doneId ? (
          <div className="checkup-success">
            <p className="section__eyebrow">Demande enregistrée</p>
            <h3>Merci — votre RDV atelier est en attente de confirmation.</h3>
            <p>
              Référence <strong>{doneId}</strong>. Un message WhatsApp de confirmation
              part au client (mode dry-run tant que l’API WhatsApp n’est pas branchée).
            </p>
            <div className="aftersales__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setDoneId('')}
              >
                Prendre un autre créneau
              </button>
              <Link className="btn btn--outline" to="/showrooms">
                Voir l’atelier
              </Link>
            </div>
          </div>
        ) : (
          <form className="checkup-card form-card" onSubmit={onBook}>
            <div className="checkup-card__dates" role="listbox" aria-label="Dates disponibles">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="option"
                  aria-selected={d === date}
                  className={`checkup-day${d === date ? ' is-active' : ''}`}
                  onClick={() => setDate(d)}
                >
                  {labelDay(d)}
                </button>
              ))}
            </div>

            <div className="checkup-card__slots">
              <p className="field-label">Créneaux du {labelDay(date)}</p>
              {loadingSlots ? <p className="checkup-hint">Chargement des créneaux…</p> : null}
              <div className="checkup-slots">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={s.taken}
                    className={`checkup-slot${time === s.time ? ' is-active' : ''}${
                      s.taken ? ' is-taken' : ''
                    }`}
                    onClick={() => setTime(s.time)}
                  >
                    {s.time}
                    {s.taken ? ' · pris' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Nom</span>
                <input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Téléphone</span>
                <input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="99 757 218"
                  required
                />
              </label>
              <label className="field">
                <span>Modèle</span>
                <select
                  value={form.modele}
                  onChange={(e) => setForm({ ...form, modele: e.target.value })}
                >
                  <option>T8 PRO</option>
                  <option>T8</option>
                </select>
              </label>
              <label className="field">
                <span>Matricule</span>
                <input
                  value={form.matricule}
                  onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                  placeholder="123 TU 4567"
                />
              </label>
              <label className="field field--full">
                <span>Motif / notes</span>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Bruit freinage, entretien 10 000 km…"
                />
              </label>
            </div>

            {error ? <p className="field error">{error}</p> : null}

            <div className="aftersales__actions">
              <button className="btn btn--primary" type="submit" disabled={submitting}>
                {submitting ? 'Envoi…' : 'Confirmer le check-up'}
              </button>
              <a
                className="btn btn--whatsapp"
                href={quickWhatsAppUrl(
                  'Bonjour JAC Motors Tunisie, j’ai une question après-vente / pièces / garantie.',
                )}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp SAV
              </a>
              <Link className="btn btn--outline" to="/reserver">
                Autre type d’entretien
              </Link>
            </div>
          </form>
        )}
      </section>

      <section className="commerce-band commerce-band--flush">
        <div className="commerce-band__copy">
          <p className="section__eyebrow">Toujours le même fil</p>
          <h2>Devis, visite, puis entretien</h2>
          <p>
            Un parcours cohérent — du premier regard sur le T8 PRO jusqu’au suivi atelier.
          </p>
        </div>
        <div className="commerce-band__actions">
          <Link className="btn btn--primary" to="/devis">
            Demander un devis
          </Link>
          <Link className="btn btn--ghost-dark" to="/visite">
            Réserver une visite
          </Link>
        </div>
      </section>
    </>
  )
}
