import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

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
  return p
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

  const titlePhone = useMemo(() => formatPhone(phone.startsWith('216') ? phone : `216${phone.replace(/\D/g, '').slice(-8)}`), [phone])

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
        setMessages(data.messages || [])
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
    const t = setInterval(() => load(phone), 4000)
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
          <p className="section__eyebrow">Démo serveur · sans Meta</p>
          <h1>JAC Messagerie</h1>
          <p className="msg-top__lead">
            Alternative WhatsApp pour la démo : les ACK, PDF et RDV arrivent ici
            automatiquement.
          </p>
        </div>
        <Link className="btn btn--outline" to="/admin">
          Admin
        </Link>
      </header>

      <form className="msg-phone-bar" onSubmit={onOpen}>
        <label>
          <span>Numéro (Tunisie)</span>
          <input
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="99 757 218"
          />
        </label>
        <button className="btn btn--primary" type="submit">
          Ouvrir la boîte
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
          <strong>{titlePhone}</strong>
          <span>Canal · JAC Messagerie</span>
        </div>
        <div className="msg-phone__thread">
          {loading && !messages.length ? <p className="msg-empty">Chargement…</p> : null}
          {error ? <p className="msg-empty">{error}</p> : null}
          {!loading && !error && !messages.length ? (
            <p className="msg-empty">
              Aucun message encore. Envoyez un devis / visite / check-up — le message
              apparaît ici.
            </p>
          ) : null}
          {messages.map((m) => (
            <article
              key={m.id}
              className={`msg-bubble ${m.type === 'document' ? 'is-doc' : ''}`}
            >
              <pre>{m.body || m.caption || ''}</pre>
              {m.type === 'document' && m.fileUrl ? (
                <a className="msg-doc" href={m.fileUrl} target="_blank" rel="noreferrer">
                  📄 {m.fileName || 'Ouvrir le PDF'}
                </a>
              ) : null}
              <time>{formatTime(m.at)}</time>
            </article>
          ))}
        </div>
      </section>

      <p className="msg-hint">
        Plus tard, les mêmes messages pourront partir sur WhatsApp Cloud API — la
        messagerie serveur reste le journal de démo.
      </p>
    </div>
  )
}
