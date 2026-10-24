/** Demo configuration — replace WhatsApp number before real launch */

export const DEMO = {
  /** Etraton Tunis — change when sales confirms the real WhatsApp inbox */
  whatsappE164: '21650512877',
  whatsappLabel: '50 512 877',
  meetDemoNote:
    'Mode démo : le lien Meet ci-dessous ouvre Google Meet pour créer une vraie réunion de test.',
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
    'Je souhaite un devis (DEMO site) :',
    `• Modèle : JAC ${input.modele}`,
    `• Showroom : ${input.showroom}`,
    input.nom.trim() ? `• Nom : ${input.nom.trim()}` : null,
    input.telephone.trim() ? `• Téléphone : ${input.telephone.trim()}` : null,
    input.besoin.trim() ? `• Besoin : ${input.besoin.trim()}` : null,
    '',
    'Merci de me recontacter.',
  ].filter((line): line is string => line != null)

  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${DEMO.whatsappE164}?text=${text}`
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

const VISIT_KEY = 'jac_demo_visits_v1'

function randomId(): string {
  const n = Math.random().toString(36).slice(2, 8).toUpperCase()
  const d = new Date()
  const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `VISITE-${day}-${n}`
}

/** Demo Meet helper — opens Google Meet “new meeting” so testers can try the product */
export function demoMeetCreateUrl(): string {
  return 'https://meet.google.com/new'
}

export function saveVisitRequest(
  input: Omit<VisitRequest, 'id' | 'createdAt' | 'meetUrl'> & { mode: VisitMode },
): VisitRequest {
  const visit: VisitRequest = {
    ...input,
    id: randomId(),
    createdAt: new Date().toISOString(),
    meetUrl: input.mode === 'meet' ? demoMeetCreateUrl() : null,
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

/** Frames for the demo 360 — real multi-angle assets when available */
export const DEMO_360_FRAMES: Record<'t8' | 't8pro', string[]> = {
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
