/** Commercial contact & booking helpers */

export const CONTACT = {
  whatsappE164: '21699757218',
  whatsappLabel: '99 757 218',
  whatsappDisplay: '+216 99 757 218',
  meetNote:
    'Le bouton ouvre Google Meet pour démarrer ou rejoindre votre visioconférence avec un conseiller.',
} as const

export type DevisInput = {
  modele: 'T8' | 'T8 PRO'
  showroom: string
  nom: string
  telephone: string
  besoin: string
}

export function buildDevisWhatsAppUrl(input: DevisInput): string {
  const lines = [
    'Bonjour JAC Motors Tunisie 👋',
    'Je souhaite un devis :',
    `• Modèle : JAC ${input.modele}`,
    `• Showroom : ${input.showroom}`,
    input.nom.trim() ? `• Nom : ${input.nom.trim()}` : null,
    input.telephone.trim() ? `• Téléphone : ${input.telephone.trim()}` : null,
    input.besoin.trim() ? `• Besoin : ${input.besoin.trim()}` : null,
    '',
    'Merci de me recontacter.',
  ].filter((line): line is string => line != null)

  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${CONTACT.whatsappE164}?text=${text}`
}

export function quickWhatsAppUrl(message?: string): string {
  const text = encodeURIComponent(
    message?.trim() || 'Bonjour JAC Motors Tunisie, je souhaite plus d’informations.',
  )
  return `https://wa.me/${CONTACT.whatsappE164}?text=${text}`
}

export type VisitMode = 'showroom' | 'meet'

export type VisitRequest = {
  id: string
  nom: string
  telephone: string
  email: string
  modele: 'T8' | 'T8 PRO'
  showroomId: string
  showroomName: string
  date: string
  time: string
  mode: VisitMode
  meetUrl: string | null
  createdAt: string
}

const VISIT_KEY = 'jac_visits_v1'

function randomId(): string {
  const n = Math.random().toString(36).slice(2, 8).toUpperCase()
  const d = new Date()
  const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `VISITE-${day}-${n}`
}

export function meetCreateUrl(): string {
  return 'https://meet.google.com/new'
}

export function saveVisitRequest(
  input: Omit<VisitRequest, 'id' | 'createdAt' | 'meetUrl'> & { mode: VisitMode },
): VisitRequest {
  const visit: VisitRequest = {
    ...input,
    id: randomId(),
    createdAt: new Date().toISOString(),
    meetUrl: input.mode === 'meet' ? meetCreateUrl() : null,
  }

  try {
    const prev = JSON.parse(localStorage.getItem(VISIT_KEY) || '[]') as VisitRequest[]
    const next = [visit, ...prev].slice(0, 20)
    localStorage.setItem(VISIT_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota / private mode */
  }

  return visit
}

export function listVisitRequests(): VisitRequest[] {
  try {
    return JSON.parse(localStorage.getItem(VISIT_KEY) || '[]') as VisitRequest[]
  } catch {
    return []
  }
}

/** Multi-angle frames for the interactive 360 viewer */
export const MODEL_360_FRAMES: Record<'t8' | 't8pro', string[]> = {
  t8: [
    '/images/jac/t8-a.jpg',
    '/images/jac/t8-b.jpg',
    '/images/jac/t8-c.jpg',
    '/images/jac/t8-d.jpg',
    '/images/jac/t8-e.jpg',
    '/images/jac/t8-f.jpg',
  ],
  t8pro: [
    '/images/jac/t8pro-1.jpg',
    '/images/jac/t8pro-2.jpg',
    '/images/jac/t8pro-3.jpg',
    '/images/jac/t8pro-6.jpg',
    '/images/jac/t8pro-8.jpg',
    '/images/jac/t8pro-13.jpg',
    '/images/jac/t8pro-14.jpg',
    '/images/jac/cn-t8pro-a.jpg',
    '/images/jac/cn-t8pro-b.jpg',
    '/images/jac/t8pro-e.jpg',
    '/images/jac/t8pro-f.jpg',
    '/images/jac/t8pro-g.jpg',
  ],
}
