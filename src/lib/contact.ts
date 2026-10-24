/** Commercial contact, WhatsApp messages & visit calendar */

export const CONTACT = {
  /** Personal test inbox — all devis / visite / meet messages go here */
  whatsappE164: '21699757218',
  whatsappLabel: '99 757 218',
  whatsappDisplay: '+216 99 757 218',
  meetNote:
    'Le lien Google Meet est inclus dans le message WhatsApp. Ouvrez WhatsApp pour l’envoyer / le recevoir.',
} as const

export const VISIT_SLOTS = ['09:00', '10:00', '11:30', '14:30', '16:00'] as const

export type DevisInput = {
  modele: 'T8' | 'T8 PRO'
  showroom: string
  nom: string
  telephone: string
  besoin: string
}

function waUrl(lines: Array<string | null | undefined>): string {
  const text = encodeURIComponent(
    lines.filter((line): line is string => line != null && line !== '').join('\n'),
  )
  return `https://wa.me/${CONTACT.whatsappE164}?text=${text}`
}

export function buildDevisWhatsAppUrl(input: DevisInput): string {
  return waUrl([
    'Bonjour JAC Motors Tunisie 👋',
    'Je souhaite un devis :',
    `• Modèle : JAC ${input.modele}`,
    `• Showroom : ${input.showroom}`,
    `• Nom : ${input.nom.trim()}`,
    `• Téléphone : ${input.telephone.trim()}`,
    `• Besoin : ${input.besoin.trim()}`,
    '',
    'Merci de me recontacter.',
  ])
}

export function quickWhatsAppUrl(message?: string): string {
  return waUrl([
    message?.trim() || 'Bonjour JAC Motors Tunisie, je souhaite plus d’informations.',
  ])
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
const BOOKED_KEY = 'jac_visit_booked_v1'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function randomId(): string {
  const n = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `VISITE-${toDateKey(new Date()).replace(/-/g, '')}-${n}`
}

/** Stable Meet-style link embedded in WhatsApp (test / placeholder room code) */
export function meetUrlFromId(id: string): string {
  const raw = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().padEnd(12, 'x')
  const a = raw.slice(0, 3)
  const b = raw.slice(3, 7)
  const c = raw.slice(7, 10)
  return `https://meet.google.com/${a}-${b}-${c}`
}

export function buildVisitWhatsAppUrl(visit: VisitRequest): string {
  const when = formatVisitDate(visit.date)
  const modeLabel =
    visit.mode === 'meet' ? 'Google Meet (visioconférence)' : 'Sur place en showroom'

  return waUrl([
    'Bonjour JAC Motors Tunisie 👋',
    'Je réserve une visite :',
    `• Réf. : ${visit.id}`,
    `• Nom : ${visit.nom}`,
    `• Téléphone : ${visit.telephone}`,
    visit.email ? `• Email : ${visit.email}` : null,
    `• Modèle : JAC ${visit.modele}`,
    `• Showroom : ${visit.showroomName}`,
    `• Date : ${when}`,
    `• Heure : ${visit.time}`,
    `• Mode : ${modeLabel}`,
    visit.mode === 'meet' && visit.meetUrl ? `• Lien Google Meet : ${visit.meetUrl}` : null,
    '',
    'Merci de confirmer la disponibilité.',
  ])
}

export function formatVisitDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-TN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export type VisitDay = {
  date: string
  label: string
  dayName: string
  dayNum: string
  availableCount: number
}

function readBooked(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BOOKED_KEY) || '[]') as string[]
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function writeBooked(keys: string[]) {
  localStorage.setItem(BOOKED_KEY, JSON.stringify(keys.slice(-80)))
}

function slotKey(showroomId: string, date: string, time: string) {
  return `${showroomId}|${date}|${time}`
}

export function isVisitSlotTaken(showroomId: string, date: string, time: string): boolean {
  return readBooked().includes(slotKey(showroomId, date, time))
}

export function getVisitDays(showroomId: string, count = 12): VisitDay[] {
  const days: VisitDay[] = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  // start from tomorrow
  cursor.setDate(cursor.getDate() + 1)

  while (days.length < count) {
    // skip Sundays
    if (cursor.getDay() !== 0) {
      const date = toDateKey(cursor)
      const availableCount = VISIT_SLOTS.filter(
        (t) => !isVisitSlotTaken(showroomId, date, t),
      ).length
      days.push({
        date,
        label: formatVisitDate(date),
        dayName: cursor.toLocaleDateString('fr-TN', { weekday: 'short' }),
        dayNum: String(cursor.getDate()),
        availableCount,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function getVisitSlots(showroomId: string, date: string) {
  return VISIT_SLOTS.map((time) => ({
    time,
    taken: isVisitSlotTaken(showroomId, date, time),
  }))
}

export function saveVisitRequest(
  input: Omit<VisitRequest, 'id' | 'createdAt' | 'meetUrl'> & { mode: VisitMode },
): VisitRequest {
  if (isVisitSlotTaken(input.showroomId, input.date, input.time)) {
    throw new Error('Ce créneau n’est plus disponible. Choisissez un autre horaire.')
  }

  const id = randomId()
  const visit: VisitRequest = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    meetUrl: input.mode === 'meet' ? meetUrlFromId(id) : null,
  }

  try {
    const prev = JSON.parse(localStorage.getItem(VISIT_KEY) || '[]') as VisitRequest[]
    const next = [visit, ...prev].slice(0, 20)
    localStorage.setItem(VISIT_KEY, JSON.stringify(next))
    writeBooked([...readBooked(), slotKey(visit.showroomId, visit.date, visit.time)])
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

export function openWhatsApp(url: string) {
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    window.location.href = url
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
