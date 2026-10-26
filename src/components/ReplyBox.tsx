import { useState } from 'react'

type Props = {
  title?: string
  replyText: string
  replyWhatsAppUrl: string | null
  clientLabel?: string
}

export function ReplyBox({
  title = 'Réponse suggérée au client',
  replyText,
  replyWhatsAppUrl,
  clientLabel,
}: Props) {
  const [copied, setCopied] = useState(false)

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(replyText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="reply-box">
      <div className="reply-box__head">
        <p className="section__eyebrow">Réponse JAC</p>
        <h3>{title}</h3>
        <p>
          Message à renvoyer au client
          {clientLabel ? ` (${clientLabel})` : ''} après sa demande.
        </p>
      </div>
      <pre className="reply-box__text">{replyText}</pre>
      <div className="reply-box__actions">
        <button type="button" className="btn btn--outline" onClick={copyReply}>
          {copied ? 'Copié ✓' : 'Copier la réponse'}
        </button>
        {replyWhatsAppUrl && (
          <a
            className="btn btn--whatsapp"
            href={replyWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
          >
            Envoyer la réponse sur WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
