import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  classifyMessage,
  formatChatText,
  kindLabel,
} from '../lib/messageFormat'

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

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (d.startsWith('216') && d.length === 11) {
    return `+216 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  }
  return p.startsWith('+') ? p : `+${p}`
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-TN', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function MessageriePage() {
  const [params, setParams] = useSearchParams()
  const [phoneInput, setPhoneInput] = useState(params.get('phone') || '99 757 218')
  const [phone, setPhone] = useState(params.get('phone') || '99757218')
  const [messages, setMessages] = useState<Msg[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const titlePhone = useMemo(() => {
    const d = phone.replace(/\D/g, '')
    return formatPhone(d.startsWith('216') ? d : `216${d.slice(-8)}`)
  }, [phone])

  async function load(p: string) {
    setLoading(true)
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
        // Client phone view: only client + document messages (not dealer alerts)
        const cleaned = (data.messages || []).filter((m) => {
          const k = classifyMessage(m)
          return k === 'client' || k === 'document'
        })
        setMessages(cleaned)
        if (data.phone) setPhone(data.phone)
      }
    } catch {
      setError('Serveur messagerie injoignable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Messagerie JAC · démo'
    load(phone)
    const t = setInterval(() => load(phone), 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone])

  function onOpen(e: FormEvent) {
    e.preventDefault()
    const digits = phoneInput.replace(/\D/g, '').slice(-8)
    setParams({ phone: digits })
    setPhone(digits)
  }

  return (
    <div className="msg-shell">
      <header className="msg-top">
        <div>
          <p className="section__eyebrow">Démo serveur · JAC Messagerie</p>
          <h1>Votre boîte</h1>
          <p className="msg-top__lead">
            Les confirmations et PDF arrivent ici automatiquement — comme WhatsApp,
            sans Meta.
          </p>
        </div>
        <div className="msg-top__actions">
          <Link className="btn btn--outline" to="/admin">
            Admin
          </Link>
          <Link className="btn btn--primary" to="/devis">
            Tester un devis
          </Link>
        </div>
      </header>

      <form className="msg-phone-bar" onSubmit={onOpen}>
        <label>
          <span>Numéro</span>
          <input
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="99 757 218"
          />
        </label>
        <button className="btn btn--primary" type="submit">
          Ouvrir
        </button>
        <button
          className="btn btn--outline"
          type="button"
          onClick={() => {
            setPhoneInput('99 757 218')
            setParams({ phone: '99757218' })
            setPhone('99757218')
          }}
        >
          Youssef
        </button>
      </form>

      <section className="msg-phone">
        <div className="msg-phone__status">
          <div>
            <strong>{titlePhone}</strong>
            <span>JAC Motors Tunisie · en ligne</span>
          </div>
        </div>
        <div className="msg-phone__thread">
          {loading && !messages.length ? <p className="msg-empty">Chargement…</p> : null}
          {error ? <p className="msg-empty">{error}</p> : null}
          {!loading && !error && !messages.length ? (
            <p className="msg-empty">
              Aucun message client. Envoyez un devis pour voir l’accusé + le PDF.
            </p>
          ) : null}
          {messages.map((m) => {
            const kind = classifyMessage(m)
            return (
              <article key={m.id} className={`msg-bubble msg-bubble--${kind}`}>
                <div className="msg-bubble__kind">{kindLabel(kind)}</div>
                <div className="msg-bubble__text">
                  {formatChatText(m.body || m.caption || '')}
                </div>
                {m.type === 'document' && m.fileUrl ? (
                  <a className="msg-doc" href={m.fileUrl} target="_blank" rel="noreferrer">
                    Ouvrir le PDF · {m.fileName || 'document'}
                  </a>
                ) : null}
                <time>{formatTime(m.at)}</time>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
