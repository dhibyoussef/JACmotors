import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ReplyBox } from '../components/ReplyBox'
import { models, showrooms } from '../data/content'
import {
  CONTACT,
  buildDevisReplyText,
  buildDevisReplyWhatsAppUrl,
  buildDevisRequestText,
  buildDevisWhatsAppUrl,
  openWhatsApp,
  type DevisInput,
} from '../lib/contact'
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
  const [form, setForm] = useState<DevisForm>(initial)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<DevisInput | null>(null)

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

    const payload: DevisInput = {
      modele: form.modele,
      showroom: showroomName,
      nom,
      telephone: form.telephone.trim(),
      besoin: sanitizeText(form.besoin, 120),
      couleurId: form.couleurId,
      optionIds: form.optionIds,
    }

    openWhatsApp(buildDevisWhatsAppUrl(payload))
    setSent(payload)
  }

  return (
    <>
      <header className="page-hero">
        <div className="page-hero__grid">
          <div>
            <p className="section__eyebrow page-hero__eyebrow">Devis WhatsApp</p>
            <h1>Prix, couleur, options — prêts à envoyer.</h1>
            <p className="page-hero__lead">
              Composez un devis professionnel avec catalogue, teinte, accessoires et
              financement. WhatsApp s’ouvre vers {CONTACT.whatsappDisplay}.
            </p>
          </div>
          <div className="page-hero__aside">
            <span>Ligne WhatsApp</span>
            <strong className="page-hero__aside-phone">{CONTACT.whatsappLabel}</strong>
            <p>{CONTACT.whatsappDisplay} · devis &amp; réponses clients</p>
          </div>
        </div>
      </header>

      <section className="section commerce">
        {sent ? (
          <article className="panel panel--ticket">
            <p className="section__eyebrow">WhatsApp ouvert</p>
            <h2>Devis professionnel prêt</h2>
            <dl className="ticket-grid">
              <div>
                <dt>Nom</dt>
                <dd>{sent.nom}</dd>
              </div>
              <div>
                <dt>Téléphone</dt>
                <dd>{sent.telephone}</dd>
              </div>
              <div>
                <dt>Modèle</dt>
                <dd>JAC {sent.modele}</dd>
              </div>
              <div>
                <dt>Prix indicatif</dt>
                <dd>{QUOTE_PACKAGES[sent.modele].priceLabel}</dd>
              </div>
              <div>
                <dt>Couleur</dt>
                <dd>{colorById(sent.couleurId ?? '')?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Options</dt>
                <dd>
                  {optionLabels(sent.optionIds ?? []).join(', ') || 'Aucune sélectionnée'}
                </dd>
              </div>
              <div>
                <dt>Showroom</dt>
                <dd>{sent.showroom}</dd>
              </div>
              <div>
                <dt>Besoin</dt>
                <dd>{sent.besoin}</dd>
              </div>
              <div className="ticket-grid__full">
                <dt>Version</dt>
                <dd>{QUOTE_PACKAGES[sent.modele].version}</dd>
              </div>
            </dl>
            <ReplyBox
              title="Devis complet à renvoyer au client"
              replyText={buildDevisReplyText(sent)}
              replyWhatsAppUrl={buildDevisReplyWhatsAppUrl(sent)}
              clientLabel={sent.telephone}
            />

            <div className="panel__actions panel__actions--row">
              <a
                className="btn btn--whatsapp"
                href={buildDevisWhatsAppUrl(sent)}
                target="_blank"
                rel="noreferrer"
              >
                Rouvrir la demande
              </a>
              <button type="button" className="btn btn--outline" onClick={() => setSent(null)}>
                Nouveau devis
              </button>
              <Link className="btn btn--primary" to="/visite?mode=essai">
                Réserver un essai
              </Link>
            </div>
            <p className="form-hint">
              1) Le client envoie la demande → 2) Vous renvoyez la réponse suggérée ci-dessus.
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
                  <span>Téléphone</span>
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
                      <span className={c.light ? 'color-swatch__check light' : 'color-swatch__check'}>
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
                <button type="submit" className="btn btn--whatsapp">
                  Envoyer le devis sur WhatsApp
                </button>
                <p className="form-hint">
                  Étape suivante : WhatsApp s’ouvre → vous validez l’envoi vers{' '}
                  {CONTACT.whatsappLabel}.
                </p>
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
                <strong>{quote.priceLabel}</strong>
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

              <div className="finance-teaser">
                <p className="finance-teaser__label">Financement indicatif</p>
                <ul>
                  {quote.financingExamples.map((ex) => (
                    <li key={`${ex.apportPct}-${ex.durationMonths}`}>
                      <strong>
                        ~{ex.monthlyFromDt.toLocaleString('fr-TN')} DT
                        <small>/mois</small>
                      </strong>
                      <span>
                        apport ~{ex.apportPct}% · {ex.durationMonths} mois
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="finance-teaser__note">
                  Choisissez « Devis + financement » pour l’inclure dans WhatsApp.
                </p>
              </div>
              <ul className="aside-list">
                <li>Prix catalogue inclus dans le message</li>
                <li>Couleur + options sélectionnées</li>
                <li>Specs + points forts</li>
                <li>Financement si demandé</li>
                <li>Réponse pro prête après envoi</li>
              </ul>
              <details className="preview-details">
                <summary>Voir le texte WhatsApp</summary>
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
