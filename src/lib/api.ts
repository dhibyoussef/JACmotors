/** Automation API client — devis / visite / interest leads */

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as T & { ok?: boolean; error?: string }
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data.error || `Erreur ${res.status}` }
    }
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      error:
        'Serveur d’automation injoignable. Démarrez `npm run dev:api` ou le service Docker, puis réessayez.',
    }
  }
}

export type DevisLeadResponse = {
  ok: true
  leadId: string
  pdfUrl: string
  ackSent: boolean
  pdfScheduledAt: string
  pdfDelayMs: number
  message: string
  whatsapp: { mode: string }
}

export type VisiteLeadResponse = {
  ok: true
  leadId: string
  meetUrl: string | null
  ackSent: boolean
  message: string
  whatsapp: { mode: string }
}

export type InterestLeadResponse = {
  ok: true
  leadId: string
  ackSent: boolean
  whatsapp: { mode: string }
}

export function submitDevisLead(payload: {
  nom: string
  telephone: string
  modele: 'T8' | 'T8 PRO'
  showroom: string
  besoin: string
  couleurId?: string
  optionIds?: string[]
}) {
  return postJson<DevisLeadResponse>('/api/leads/devis', payload)
}

export function submitVisiteLead(payload: {
  nom: string
  telephone: string
  email?: string
  modele: 'T8' | 'T8 PRO'
  showroomId: string
  showroomName: string
  date: string
  time: string
  mode: 'showroom' | 'meet' | 'essai'
  meetUrl?: string | null
}) {
  return postJson<VisiteLeadResponse>('/api/leads/visite', payload)
}

export function submitInterestLead(payload: {
  nom: string
  telephone: string
  modele: 'T8' | 'T8 PRO'
  source: '360' | 'showroom' | 'meet'
  showroom?: string
}) {
  return postJson<InterestLeadResponse>('/api/leads/interest', payload)
}

export function delayLabel(ms: number): string {
  const sec = Math.round(ms / 1000)
  if (sec < 90) return `${sec} secondes`
  const min = Math.round(sec / 60)
  return `${min} minute${min > 1 ? 's' : ''}`
}
