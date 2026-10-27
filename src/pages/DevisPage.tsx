import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCms } from '../cms/CmsProvider'
import { models } from '../data/content'
import { delayLabel, submitDevisLead } from '../lib/api'
import { CONTACT, buildDevisRequestText, type DevisInput } from '../lib/contact'
import { messageriePath } from '../lib/messagerie'
import { priceLabelFor } from '../lib/cms'
import {
  QUOTE_PACKAGES,
  colorById,
  optionLabels,
  stockBadgeClass,
} from '../lib/quotes'
import { isValidTunisianPhone, sanitizeText } from '../lib/security'

type DevisForm = {
  modele: 'T8' | 'T8 PRO'
  showroomId: string
  nom: string
  telephone: string
  besoin: string
  couleurId: string
  optionIds: string[]
}

type SentState = {
  payload: DevisInput
  leadId: string
  pdfUrl: string
  pdfDelayMs: number
  whatsappMode: string
}

const initial: DevisForm = {
  modele: 'T8 PRO',
  showroomId: 'clh',
  nom: '',
  telephone: '',
  besoin: 'Devis véhicule neuf',
  couleurId: 'blanc',
  optionIds: [],
}

export function DevisPage() {
  const navigate = useNavigate()
  const cms = useCms()
  const showrooms = cms.showrooms
  const [form, setForm] = useState<DevisForm>(initial)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<SentState | null>(null)
  const [openingChat, setOpeningChat] = useState(false)

  useEffect(() => {
    if (!sent) return
    setOpeningChat(true)
    const path = messageriePath(sent.payload.telephone, {
      from: 'devis',
      ref: sent.leadId,
    })
    const t = window.setTimeout(() => navigate(path), 1200)
    return () => window.clearTimeout(t)
  }, [sent, navigate])

  const showroomName = useMemo(
    () => showrooms.find((s) => s.id === form.showroomId)?.name ?? 'Showroom',
    [form.showroomId],
  )

  const quote = QUOTE_PACKAGES[form.modele]
  const selectedColor = colorById(form.couleurId)

  const previewPayload = useMemo<DevisInput>(
    () => ({
      modele: form.modele,
      showroom: showroomName,
      nom: form.nom.trim() || 'Client',
      telephone: form.telephone.trim() || CONTACT.whatsappDisplay,
      besoin: form.besoin,
      couleurId: form.couleurId,
      optionIds: form.optionIds,
    }),
    [
      form.besoin,
      form.couleurId,
      form.modele,
      form.nom,
      form.optionIds,
      form.telephone,
      showroomName,
    ],
  )

  function toggleOption(id: string) {
    setForm((f) => ({
      ...f,
      optionIds: f.optionIds.includes(id)
        ? f.optionIds.filter((x) => x !== id)
        : [...f.optionIds, id],
    }))
  }

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

    const payload: DevisInput = {
      modele: form.modele,
      showroom: showroomName,
      nom,
      telephone: form.telephone.trim(),
      besoin: sanitizeText(form.besoin, 120),
      couleurId: form.couleurId,
      optionIds: form.optionIds,
    }

    setSubmitting(true)
    const result = await submitDevisLead({
      ...payload,
      showroom: showroomName,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSent({
      payload,
      leadId: result.data.leadId,
      pdfUrl: result.data.pdfUrl,
      pdfDelayMs: result.data.pdfDelayMs,
      whatsappMode: result.data.whatsapp.mode,
    })
  }

  return (
    <>
      <header className="page-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">Devis automatisé</p>
            <h1>Demandez. Recevez le PDF. C’est tout.</h1>
            <p className="page-hero__lead">
              Choisissez modèle, couleur et options. Vous recevez d’abord une confirmation
              WhatsApp, puis le devis PDF professionnel est envoyé automatiquement sur votre
              numéro.
            </p>
          </div>
          <div className="page-hero__aside">
            <span>Workflow JAC</span>
            <strong className="page-hero__aside-phone">PDF auto</strong>
            <p>Confirmation → document tamponné · WhatsApp client</p>
          </div>
        </div>
      </header>

      <section className="section commerce">
        {sent ? (
          <article className="panel panel--ticket panel--success-flow">
            <p className="section__eyebrow">Demande enregistrée</p>
            <h2>Merci — ouverture de votre messagerie…</h2>
            <p className="success-flow__lead">
              Confirmation envoyée sur <strong>{sent.payload.telephone}</strong>. Le PDF
              tamponné suivra automatiquement sous environ{' '}
              <strong>{delayLabel(sent.pdfDelayMs)}</strong>.
              {openingChat
                ? ' Nous ouvrons votre conversation WhatsApp démo maintenant.'
                : null}
            </p>

            <ol className="success-flow__steps">
              <li>
                <strong>1 · Maintenant</strong>
                <span>Confirmation dans la messagerie</span>
              </li>
              <li>
                <strong>2 · Sous peu</strong>
                <span>PDF devis automatique</span>
              </li>
              <li>
                <strong>3 · Ensuite</strong>
                <span>Un conseiller peut préciser stock / essai</span>
              </li>
            </ol>

            <dl className="ticket-grid">
              <div>
                <dt>Référence</dt>
                <dd>{sent.leadId}</dd>
              </div>
              <div>
                <dt>Modèle</dt>
                <dd>JAC {sent.payload.modele}</dd>
              </div>
              <div>
                <dt>Prix indicatif</dt>
                <dd>{priceLabelFor(sent.payload.modele, cms.priceByModel)}</dd>
              </div>
              <div>
                <dt>Couleur</dt>
                <dd>{colorById(sent.payload.couleurId ?? '')?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Options</dt>
                <dd>
                  {optionLabels(sent.payload.optionIds ?? []).join(', ') ||
                    'Aucune sélectionnée'}
                </dd>
              </div>
              <div>
                <dt>Showroom</dt>
                <dd>{sent.payload.showroom}</dd>
              </div>
            </dl>

            <div className="panel__actions panel__actions--row">
              <Link
                className="btn btn--whatsapp"
                to={messageriePath(sent.payload.telephone, {
                  from: 'devis',
                  ref: sent.leadId,
                })}
              >
                Ouvrir la messagerie maintenant
              </Link>
              <a className="btn btn--outline" href={sent.pdfUrl} target="_blank" rel="noreferrer">
                Télécharger le PDF
              </a>
              <button
                type="button"
                className="btn btn--ghost-dark"
                onClick={() => {
                  setOpeningChat(false)
                  setSent(null)
                }}
              >
                Nouvelle demande
              </button>
            </div>
            <p className="form-hint">
              Canal : <strong>{sent.whatsappMode}</strong>
              {sent.whatsappMode === 'messagerie' || sent.whatsappMode === 'dry-run'
                ? ' — messagerie serveur (démo WhatsApp). Branchez WHATSAPP_TOKEN pour l’API réelle.'
                : ' — messages et PDF partent via l’API WhatsApp Business.'}
            </p>
          </article>
        ) : (
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
                  <span>Nom</span>
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    placeholder="Prénom et nom"
                    autoComplete="name"
                  />
                </label>

                <label className="field">
                  <span>WhatsApp (Tunisie)</span>
                  <input
                    required
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

              <fieldset className="color-picker">
                <legend>Couleur souhaitée</legend>
                <div className="color-picker__row" role="radiogroup" aria-label="Couleur">
                  {quote.colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={form.couleurId === c.id}
                      className={`color-swatch ${form.couleurId === c.id ? 'selected' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                      onClick={() => setForm((f) => ({ ...f, couleurId: c.id }))}
                    >
                      <span
                        className={c.light ? 'color-swatch__check light' : 'color-swatch__check'}
                      >
                        {form.couleurId === c.id ? '✓' : ''}
                      </span>
                      <em>{c.name}</em>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="option-picker">
                <legend>Options / accessoires</legend>
                <div className="option-picker__grid">
                  {quote.options.map((opt) => {
                    const checked = form.optionIds.includes(opt.id)
                    return (
                      <label
                        key={opt.id}
                        className={`option-chip ${checked ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOption(opt.id)}
                        />
                        <span>
                          <strong>{opt.label}</strong>
                          <small>{opt.detail}</small>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {error && <p className="form-error">{error}</p>}

              <div className="panel__actions">
                <button type="submit" className="btn btn--whatsapp" disabled={submitting}>
                  {submitting ? 'Envoi en cours…' : 'Recevoir mon devis PDF'}
                </button>
                <p className="form-hint">
                  Pas de second message manuel. Confirmation immédiate, puis PDF automatique
                  sur votre WhatsApp.
                </p>
              </div>
              <div className="devis-sticky-cta" aria-hidden="false">
                <button type="submit" className="btn btn--whatsapp" disabled={submitting}>
                  {submitting ? 'Envoi…' : 'Recevoir mon devis PDF'}
                </button>
              </div>
            </form>

            <aside className="panel panel--aside quote-card">
              <div className="quote-card__top">
                <p className="section__eyebrow">Aperçu devis</p>
                <span className={stockBadgeClass(quote.stock)}>{quote.stockLabel}</span>
              </div>
              <h3>JAC {form.modele}</h3>
              <div className="quote-card__price">
                <span>Prix catalogue</span>
                <strong>{priceLabelFor(form.modele, cms.priceByModel)}</strong>
              </div>
              <p className="quote-card__version">{quote.version}</p>

              {selectedColor && (
                <div className="quote-card__color">
                  <span
                    className="quote-card__color-dot"
                    style={{ backgroundColor: selectedColor.hex }}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{selectedColor.name}</strong>
                    <span>Teinte demandée</span>
                  </div>
                </div>
              )}

              {form.optionIds.length > 0 && (
                <ul className="quote-card__options">
                  {optionLabels(form.optionIds).map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              )}

              <ul className="aside-list">
                <li>PDF tamponné JAC généré par le serveur</li>
                <li>Confirmation WhatsApp automatique</li>
                <li>Envoi différé du document au client</li>
                <li>Notification dealer en parallèle</li>
              </ul>
              <details className="preview-details">
                <summary>Voir le résumé dossier</summary>
                <pre className="reply-box__text reply-box__text--compact">
                  {buildDevisRequestText(previewPayload)}
                </pre>
              </details>
              <div className="aside-stack">
                <Link className="btn btn--primary" to="/visite?mode=essai">
                  Réserver un essai
                </Link>
                <Link className="btn btn--ghost-dark" to="/modeles">
                  Voir les modèles 360°
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  )
}
