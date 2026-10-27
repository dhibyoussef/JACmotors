import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  classifyMessage,
  formatChatText,
} from '../lib/messageFormat'
import { formatWaPhone, phoneDigits } from '../lib/messagerie'

type Msg = {
  id: string
  type: string
  body?: string
  caption?: string | null
  fileName?: string | null
  fileUrl?: string | null
  at: string
  from?: string
  to?: string
}

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

function dayKey(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-TN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function timeOnly(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('fr-TN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function matchesRef(msg: Msg, ref: string) {
  if (!ref) return false
  const hay = `${msg.body || ''}\n${msg.caption || ''}\n${msg.fileName || ''}`
  return hay.includes(ref)
}

export function MessageriePage() {
  const [params, setParams] = useSearchParams()
  const initialPhone = phoneDigits(params.get('phone') || '99757218') || '99757218'
  const fromFlow = params.get('from') || ''
  const focusRef = params.get('ref') || ''

  const [phoneInput, setPhoneInput] = useState(
    params.get('phone') ? formatWaPhone(params.get('phone') || '') : '99 757 218',
  )
  const [phone, setPhone] = useState(initialPhone)
  const [messages, setMessages] = useState<Msg[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [awaitingPdf, setAwaitingPdf] = useState(fromFlow === 'devis')
  const [justArrived, setJustArrived] = useState(false)
  const [tick, setTick] = useState(0)
  const threadRef = useRef<HTMLDivElement>(null)
  const knownIds = useRef<Set<string>>(new Set())

  const titlePhone = useMemo(() => formatWaPhone(phone), [phone])

  async function load(p: string, silent = false) {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${API_BASE}/api/messenger/public?phone=${encodeURIComponent(p)}`,
      )
      const data = (await res.json()) as {
        ok: boolean
        messages?: Msg[]
        phone?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        setError(data.error || 'Messagerie indisponible')
        setMessages([])
      } else {
        const cleaned = (data.messages || []).filter((m) => {
          const k = classifyMessage(m)
          return k === 'client' || k === 'document'
        })

        const prev = knownIds.current
        const newcomers = cleaned.filter((m) => !prev.has(m.id))
        if (prev.size && newcomers.length) {
          setJustArrived(true)
          window.setTimeout(() => setJustArrived(false), 2500)
        }
        knownIds.current = new Set(cleaned.map((m) => m.id))

        setMessages(cleaned)
        if (data.phone) setPhone(phoneDigits(data.phone) || p)

        if (focusRef) {
          const hasFocusedPdf = cleaned.some(
            (m) =>
              (classifyMessage(m) === 'document' || m.type === 'document') &&
              matchesRef(m, focusRef),
          )
          const hasFocusedAck = cleaned.some((m) => matchesRef(m, focusRef))
          setAwaitingPdf(Boolean(fromFlow === 'devis' && hasFocusedAck && !hasFocusedPdf))
        } else if (fromFlow === 'devis') {
          const lastAck = [...cleaned]
            .reverse()
            .find((m) => /DEMANDE DE DEVIS REÇUE/i.test(m.body || ''))
          if (lastAck) {
            const ackAt = new Date(lastAck.at).getTime()
            const laterPdf = cleaned.some(
              (m) =>
                (classifyMessage(m) === 'document' || m.type === 'document') &&
                new Date(m.at).getTime() >= ackAt - 1000,
            )
            setAwaitingPdf(!laterPdf)
          }
        }
      }
    } catch {
      setError('Serveur messagerie injoignable')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'WhatsApp · JAC Motors Tunisie'
    load(phone)
    const interval = setInterval(() => load(phone, true), awaitingPdf ? 1500 : 4000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, awaitingPdf])

  useEffect(() => {
    if (!awaitingPdf) return
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [awaitingPdf])

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, awaitingPdf, justArrived])

  function onOpen(e: FormEvent) {
    e.preventDefault()
    const digits = phoneDigits(phoneInput)
    setParams({ phone: digits, ...(fromFlow ? { from: fromFlow } : {}), ...(focusRef ? { ref: focusRef } : {}) })
    setPhone(digits)
    knownIds.current = new Set()
  }

  const flowLabel =
    fromFlow === 'devis'
      ? 'Confirmation devis reçue'
      : fromFlow === 'visite' || fromFlow === 'meet' || fromFlow === 'essai'
        ? 'Confirmation rendez-vous'
        : fromFlow === '360'
          ? 'Demande 360° reçue'
          : fromFlow === 'checkup'
            ? 'RDV atelier enregistré'
            : ''

  let lastDay = ''

  return (
    <div className="wa-app">
      <div className="wa-stage">
        <aside className="wa-side">
          <div className="wa-side__head">
            <div className="wa-avatar wa-avatar--jac">J</div>
            <div>
              <strong>JAC Messagerie</strong>
              <span>Démo WhatsApp serveur</span>
            </div>
          </div>
          <form className="wa-side__search" onSubmit={onOpen}>
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Numéro WhatsApp"
              aria-label="Numéro"
            />
            <button type="submit">Ouvrir</button>
          </form>
          <button
            type="button"
            className="wa-conv is-on"
            onClick={() => {
              setPhoneInput('99 757 218')
              setParams({ phone: '99757218', from: fromFlow || 'devis', ...(focusRef ? { ref: focusRef } : {}) })
              setPhone('99757218')
            }}
          >
            <div className="wa-avatar">Y</div>
            <div className="wa-conv__meta">
              <strong>{titlePhone}</strong>
              <em>JAC Motors Tunisie · conversation active</em>
            </div>
          </button>
          <div className="wa-side__links">
            <Link to="/devis">Nouveau devis</Link>
            <Link to="/visite">Visite / Meet</Link>
            <Link to="/admin">Admin</Link>
            <Link to="/">Site</Link>
          </div>
        </aside>

        <section className="wa-chat">
          <header className="wa-chat__head">
            <div className="wa-chat__identity">
              <div className="wa-avatar wa-avatar--jac">J</div>
              <div>
                <strong>JAC Motors Tunisie</strong>
                <span className="wa-online">
                  {awaitingPdf ? 'en train d’écrire…' : 'en ligne'}
                </span>
              </div>
            </div>
            <div className="wa-chat__actions">
              {focusRef ? <span className="wa-chip">Réf. {focusRef}</span> : null}
              <Link className="wa-mini-btn" to="/devis">
                Devis
              </Link>
            </div>
          </header>

          {flowLabel ? (
            <div className={`wa-banner${justArrived ? ' is-pulse' : ''}`}>
              <strong>{flowLabel}</strong>
              <span>
                {awaitingPdf
                  ? `Le PDF professionnel arrive automatiquement… (${tick}s)`
                  : 'Tous les messages de cette demande sont dans le fil ci-dessous.'}
              </span>
            </div>
          ) : null}

          <div className="wa-thread" ref={threadRef}>
            {loading && !messages.length ? (
              <p className="wa-empty">Ouverture de la conversation…</p>
            ) : null}
            {error ? <p className="wa-empty">{error}</p> : null}
            {!loading && !error && !messages.length ? (
              <p className="wa-empty">
                Aucun message encore. Envoyez un devis pour voir la confirmation + le PDF.
              </p>
            ) : null}

            {messages.map((m) => {
              const kind = classifyMessage(m)
              const day = dayKey(m.at)
              const showDay = day !== lastDay
              lastDay = day
              const focused = focusRef && matchesRef(m, focusRef)
              const isDoc = kind === 'document' || m.type === 'document'
              return (
                <div key={m.id}>
                  {showDay ? <div className="wa-day">{day}</div> : null}
                  <article
                    className={`wa-bubble wa-bubble--in${isDoc ? ' wa-bubble--doc' : ''}${focused ? ' is-focus' : ''}`}
                  >
                    <div className="wa-bubble__text">
                      {formatChatText(m.body || m.caption || '')}
                    </div>
                    {isDoc && m.fileUrl ? (
                      <a
                        className="wa-doc"
                        href={m.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="wa-doc__icon">PDF</span>
                        <span className="wa-doc__meta">
                          <strong>{m.fileName || 'Document JAC'}</strong>
                          <em>Appuyer pour ouvrir</em>
                        </span>
                      </a>
                    ) : null}
                    <footer className="wa-bubble__foot">
                      <time>{timeOnly(m.at)}</time>
                      <span className="wa-ticks" aria-hidden="true">
                        ✓✓
                      </span>
                    </footer>
                  </article>
                </div>
              )
            })}

            {awaitingPdf ? (
              <div className="wa-typing">
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>

          <footer className="wa-composer">
            <div className="wa-composer__input">
              Réponses automatiques JAC — lecture seule (démo)
            </div>
            <button type="button" className="wa-composer__send" disabled>
              ➤
            </button>
          </footer>
        </section>
      </div>
    </div>
  )
}
