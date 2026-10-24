import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Photo360 } from '../components/Photo360'
import { models, showrooms } from '../data/content'
import {
  DEMO,
  DEMO_360_FRAMES,
  buildDevisWhatsAppUrl,
  listVisitRequests,
  saveVisitRequest,
  type VisitMode,
  type VisitRequest,
} from '../lib/demo'
import { isValidTunisianPhone, sanitizeText } from '../lib/security'

type DevisForm = {
  modele: 'T8' | 'T8 PRO'
  showroomId: string
  nom: string
  telephone: string
  besoin: string
}

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

const devisInitial: DevisForm = {
  modele: 'T8 PRO',
  showroomId: 'clh',
  nom: '',
  telephone: '',
  besoin: 'Devis véhicule neuf',
}

function defaultVisitDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const visitInitial: VisitForm = {
  nom: '',
  telephone: '',
  email: '',
  modele: 'T8 PRO',
  showroomId: 'clh',
  date: defaultVisitDate(),
  time: '10:00',
  mode: 'showroom',
}

const visitSlots = ['09:00', '10:00', '11:30', '14:30', '16:00'] as const

export function DemoPage() {
  const [devis, setDevis] = useState<DevisForm>(devisInitial)
  const [devisError, setDevisError] = useState('')
  const [model360, setModel360] = useState<'t8' | 't8pro'>('t8pro')
  const [visit, setVisit] = useState<VisitForm>(visitInitial)
  const [visitError, setVisitError] = useState('')
  const [ticket, setTicket] = useState<VisitRequest | null>(null)
  const [history, setHistory] = useState<VisitRequest[]>(() => listVisitRequests())

  const frames = DEMO_360_FRAMES[model360]
  const modelLabel = model360 === 't8pro' ? 'JAC T8 PRO' : 'JAC T8'

  const devisShowroom = useMemo(
    () => showrooms.find((s) => s.id === devis.showroomId)?.name ?? 'Showroom',
    [devis.showroomId],
  )

  function openDevis(e: FormEvent) {
    e.preventDefault()
    setDevisError('')
    if (devis.telephone.trim() && !isValidTunisianPhone(devis.telephone)) {
      setDevisError('Téléphone tunisien invalide (ex. 50 512 877)')
      return
    }
    const url = buildDevisWhatsAppUrl({
      modele: devis.modele,
      showroom: devisShowroom,
      nom: sanitizeText(devis.nom, 80),
      telephone: devis.telephone.trim(),
      besoin: sanitizeText(devis.besoin, 120),
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function submitVisit(e: FormEvent) {
    e.preventDefault()
    setVisitError('')
    const nom = sanitizeText(visit.nom, 80)
    if (nom.length < 2) {
      setVisitError('Indiquez votre nom.')
      return
    }
    if (!isValidTunisianPhone(visit.telephone)) {
      setVisitError('Téléphone tunisien invalide (ex. 50 512 877)')
      return
    }
    if (!visit.date || !visit.time) {
      setVisitError('Choisissez une date et un créneau.')
      return
    }
    const showroom = showrooms.find((s) => s.id === visit.showroomId)
    if (!showroom) {
      setVisitError('Showroom invalide.')
      return
    }

    const saved = saveVisitRequest({
      nom,
      telephone: visit.telephone.trim(),
      email: sanitizeText(visit.email, 120),
      modele: visit.modele,
      showroomId: showroom.id,
      showroomName: showroom.name,
      date: visit.date,
      time: visit.time,
      mode: visit.mode,
    })
    setTicket(saved)
    setHistory(listVisitRequests())
  }

  return (
    <>
      <header className="page-hero demo-hero">
        <p className="section__eyebrow page-hero__eyebrow">Mode démo · tests</p>
        <h1>Testez les 4 nouveautés.</h1>
        <p className="page-hero__lead">
          Devis WhatsApp, photo 360°, visite showroom façon Kia, et option Google
          Meet — tout est cliquable pour valider le parcours avant la version finale.
        </p>
        <div className="demo-pill-row">
          <a href="#devis">01 Devis WhatsApp</a>
          <a href="#photo360">02 Photo 360</a>
          <a href="#visite">03 Visite showroom</a>
          <a href="#meet">04 Google Meet</a>
        </div>
        <p className="demo-banner">
          WhatsApp démo → <strong>{DEMO.whatsappLabel}</strong> (Etraton). Changez le
          numéro dans <code>src/lib/demo.ts</code> quand le commercial confirme.
        </p>
      </header>

      <section className="section demo-section" id="devis">
        <div className="section__head">
          <p className="section__eyebrow">01 · Devis</p>
          <h2 className="section__title">Demander un devis sur WhatsApp</h2>
          <p className="section__lead">
            Remplissez le mini-formulaire puis ouvrez WhatsApp avec un message déjà
            prêt. Sur téléphone, l’app WhatsApp s’ouvre directement.
          </p>
        </div>

        <form className="demo-card demo-form" onSubmit={openDevis}>
          <div className="demo-form__grid">
            <label>
              Modèle
              <select
                value={devis.modele}
                onChange={(e) =>
                  setDevis((d) => ({ ...d, modele: e.target.value as DevisForm['modele'] }))
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
                value={devis.showroomId}
                onChange={(e) => setDevis((d) => ({ ...d, showroomId: e.target.value }))}
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
                value={devis.nom}
                onChange={(e) => setDevis((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Prénom et nom"
              />
            </label>
            <label>
              Téléphone (optionnel)
              <input
                value={devis.telephone}
                onChange={(e) => setDevis((d) => ({ ...d, telephone: e.target.value }))}
                placeholder="ex. 50 512 877"
              />
            </label>
            <label className="demo-form__full">
              Besoin
              <select
                value={devis.besoin}
                onChange={(e) => setDevis((d) => ({ ...d, besoin: e.target.value }))}
              >
                <option>Devis véhicule neuf</option>
                <option>Devis + financement</option>
                <option>Reprise de mon véhicule</option>
                <option>Disponibilité / délai</option>
              </select>
            </label>
          </div>
          {devisError && <p className="demo-error">{devisError}</p>}
          <button type="submit" className="btn btn--whatsapp">
            Ouvrir WhatsApp — devis démo
          </button>
          <p className="demo-hint">
            Astuce test : si WhatsApp Web n’est pas connecté sur desktop, essayez depuis
            votre téléphone sur le site déployé.
          </p>
        </form>
      </section>

      <section className="section demo-section" id="photo360">
        <div className="section__head">
          <p className="section__eyebrow">02 · Photo 360</p>
          <h2 className="section__title">Tourner autour du pickup</h2>
          <p className="section__lead">
            Glissez horizontalement (ou utilisez les boutons) pour simuler une vue 360°
            avec les photos déjà dans le projet.
          </p>
        </div>

        <div className="demo-card">
          <div className="demo-360-switch">
            <button
              type="button"
              className={model360 === 't8' ? 'active' : ''}
              onClick={() => setModel360('t8')}
            >
              T8
            </button>
            <button
              type="button"
              className={model360 === 't8pro' ? 'active' : ''}
              onClick={() => setModel360('t8pro')}
            >
              T8 PRO
            </button>
          </div>
          <Photo360 frames={frames} label={modelLabel} />
        </div>
      </section>

      <section className="section demo-section" id="visite">
        <div className="section__head">
          <p className="section__eyebrow">03 · Visite showroom</p>
          <h2 className="section__title">Réserver une visite (style Kia)</h2>
          <p className="section__lead">
            Pas un entretien atelier : une visite commerciale / essai en showroom, avec
            créneau et confirmation locale (démo).
          </p>
        </div>

        {ticket ? (
          <article className="demo-card demo-ticket" id="meet">
            <p className="section__eyebrow">Confirmation démo</p>
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
                {ticket.mode === 'meet' ? 'Google Meet (visioconférence)' : 'Sur place en showroom'}
              </li>
            </ul>
            {ticket.mode === 'meet' && ticket.meetUrl && (
              <div className="demo-meet-box">
                <p>{DEMO.meetDemoNote}</p>
                <a className="btn btn--primary" href={ticket.meetUrl} target="_blank" rel="noreferrer">
                  Ouvrir Google Meet
                </a>
              </div>
            )}
            <div className="demo-ticket__actions">
              <button type="button" className="btn btn--outline" onClick={() => setTicket(null)}>
                Nouvelle visite
              </button>
              <Link className="btn btn--outline" to="/showrooms">
                Voir les showrooms
              </Link>
            </div>
          </article>
        ) : (
          <form className="demo-card demo-form" onSubmit={submitVisit}>
            <div className="demo-form__grid">
              <label>
                Nom complet
                <input
                  required
                  value={visit.nom}
                  onChange={(e) => setVisit((v) => ({ ...v, nom: e.target.value }))}
                  placeholder="Prénom et nom"
                />
              </label>
              <label>
                Téléphone
                <input
                  required
                  value={visit.telephone}
                  onChange={(e) => setVisit((v) => ({ ...v, telephone: e.target.value }))}
                  placeholder="ex. 50 512 877"
                />
              </label>
              <label>
                Email (optionnel)
                <input
                  value={visit.email}
                  onChange={(e) => setVisit((v) => ({ ...v, email: e.target.value }))}
                  placeholder="vous@email.com"
                />
              </label>
              <label>
                Modèle
                <select
                  value={visit.modele}
                  onChange={(e) =>
                    setVisit((v) => ({
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
                  value={visit.showroomId}
                  onChange={(e) => setVisit((v) => ({ ...v, showroomId: e.target.value }))}
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
                  value={visit.date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setVisit((v) => ({ ...v, date: e.target.value }))}
                />
              </label>
              <label>
                Créneau
                <select
                  value={visit.time}
                  onChange={(e) => setVisit((v) => ({ ...v, time: e.target.value }))}
                >
                  {visitSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset className="demo-mode" id="meet">
              <legend>Comment souhaitez-vous la visite ?</legend>
              <label className={visit.mode === 'showroom' ? 'active' : ''}>
                <input
                  type="radio"
                  name="visit-mode"
                  checked={visit.mode === 'showroom'}
                  onChange={() => setVisit((v) => ({ ...v, mode: 'showroom' }))}
                />
                <span>
                  <strong>En showroom</strong>
                  <small>Visite / essai sur place</small>
                </span>
              </label>
              <label className={visit.mode === 'meet' ? 'active' : ''}>
                <input
                  type="radio"
                  name="visit-mode"
                  checked={visit.mode === 'meet'}
                  onChange={() => setVisit((v) => ({ ...v, mode: 'meet' }))}
                />
                <span>
                  <strong>Google Meet</strong>
                  <small>Visioconférence commerciale (démo)</small>
                </span>
              </label>
            </fieldset>

            {visitError && <p className="demo-error">{visitError}</p>}
            <button type="submit" className="btn btn--primary">
              Confirmer la visite (démo)
            </button>
            <p className="demo-hint">
              Les demandes sont stockées localement dans votre navigateur — aucun envoi
              serveur pour l’instant.
            </p>
          </form>
        )}

        {history.length > 0 && !ticket && (
          <div className="demo-history">
            <p className="section__eyebrow">Dernières visites (cet appareil)</p>
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
      </section>

      <section className="section demo-section demo-footer-cta">
        <div>
          <p className="section__eyebrow">Ensuite</p>
          <h2>Ces flux sont prêts à tester.</h2>
          <p>
            Validez le feeling sur mobile, puis on branche le vrai numéro WhatsApp, de
            vraies photos 360°, et un calendrier Meet officiel.
          </p>
        </div>
        <div className="demo-footer-cta__actions">
          <Link className="btn btn--primary" to="/modeles">
            Retour modèles
          </Link>
          <Link className="btn btn--outline" to="/reserver">
            Entretien atelier (existant)
          </Link>
        </div>
      </section>
    </>
  )
}
