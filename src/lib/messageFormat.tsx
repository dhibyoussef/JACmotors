import type { ReactNode } from 'react'

/** Turn WhatsApp-style *bold* / _italic_ into readable React nodes */
export function formatChatText(raw: string): ReactNode[] {
  const text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/^[─\-_=]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const lines = text.split('\n')
  const nodes: ReactNode[] = []

  lines.forEach((line, i) => {
    if (!line.trim()) {
      nodes.push(<br key={`br-${i}`} />)
      return
    }
    nodes.push(
      <span key={`ln-${i}`} className="chat-line">
        {formatInline(line)}
        {i < lines.length - 1 ? <br /> : null}
      </span>,
    )
  })
  return nodes
}

function formatInline(line: string): ReactNode[] {
  // *bold* then _italic_
  const parts: ReactNode[] = []
  const re = /(\*[^*\n]+\*|_[^_\n]+_)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index))
    const token = m[0]
    const inner = token.slice(1, -1)
    if (token.startsWith('*')) {
      parts.push(<strong key={`b-${k++}`}>{inner}</strong>)
    } else {
      parts.push(<em key={`i-${k++}`}>{inner}</em>)
    }
    last = m.index + token.length
  }
  if (last < line.length) parts.push(line.slice(last))
  return parts.length ? parts : [line]
}

export type ChatKind = 'client' | 'dealer' | 'document' | 'system'

export function classifyMessage(msg: {
  type?: string
  body?: string
  caption?: string | null
  fileName?: string | null
}): ChatKind {
  if (msg.type === 'document' || msg.fileName) return 'document'
  const body = `${msg.body || ''}\n${msg.caption || ''}`
  if (/NOUVEAU LEAD|NOUVEAU RDV|PDF \/ suivi/i.test(body)) return 'dealer'
  if (/DEMANDE DE DEVIS|CONFIRMATION DE RENDEZ-VOUS|RDV ATELIER|DEMANDE REÇUE|Voici votre/i.test(body)) {
    return 'client'
  }
  return 'system'
}

export function kindLabel(kind: ChatKind): string {
  if (kind === 'client') return 'Au client'
  if (kind === 'dealer') return 'Alerte concession'
  if (kind === 'document') return 'Document PDF'
  return 'Système'
}

export function extractTitle(body: string): string {
  const lines = String(body || '')
    .split('\n')
    .map((l) => l.replace(/\*/g, '').trim())
    .filter(Boolean)
  const skip = /^(JAC MOTORS|─+)/i
  for (const l of lines) {
    if (!skip.test(l) && l.length > 3) return l.slice(0, 60)
  }
  return lines[0] || 'Message'
}
