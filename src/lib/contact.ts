import {
  QUOTE_PACKAGES,
  devisRef,
  formatDt,
  wantsFinancing,
  type QuoteModel,
} from './quotes'

/** Commercial contact, WhatsApp messages & visit calendar */

export const CONTACT = {
  /** Personal test inbox — all devis / visite / meet messages go here */
  whatsappE164: '21699757218',
  whatsappLabel: '99 757 218',
  whatsappDisplay: '+216 99 757 218',
  siteUrl: 'https://jacmotors-two.vercel.app',
  meetNote:
    'Le lien Google Meet est inclus dans le message WhatsApp. Ouvrez WhatsApp pour l’envoyer / le recevoir.',
} as const

export const VISIT_SLOTS = ['09:00', '10:00', '11:30', '14:30', '16:00'] as const

export type DevisInput = {
  modele: QuoteModel
  showroom: string
  nom: string
  telephone: string
  besoin: string
}

function toWhatsAppE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (/^216\d{8}$/.test(digits)) return digits
  if (/^[2-9]\d{7}$/.test(digits)) return `216${digits}`
  return null
}

function waUrl(
  lines: Array<string | null | undefined>,
  toE164: string = CONTACT.whatsappE164,
): string {
  const text = encodeURIComponent(
    lines.filter((line): line is string => line != null && line !== '').join('\n'),
  )
  return `https://wa.me/${toE164}?text=${text}`
}

function pack(modele: QuoteModel) {
  return QUOTE_PACKAGES[modele]
}

/** Client → dealer : structured devis request */
export function buildDevisRequestText(input: DevisInput): string {
  const q = pack(input.modele)
  return [
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    '*DEMANDE DE DEVIS*',
    '',
    'Bonjour JAC Motors Tunisie,',
    'Je souhaite recevoir un *devis détaillé avec prix* :',
    '',
    '*Client*',
    `• Nom : ${input.nom.trim()}`,
    `• Téléphone : ${input.telephone.trim()}`,
    `• Showroom : ${input.showroom}`,
    `• Besoin : ${input.besoin.trim()}`,
    '',
    '*Véhicule demandé*',
    `• Modèle : *JAC ${input.modele}*`,
    `• Version : ${q.version}`,
    `• Transmission : ${q.drive}`,
    `• Motorisation : ${q.engine}`,
    `• Prix catalogue indicatif : *${q.priceLabel}*`,
    '',
    'Merci de me renvoyer le devis complet (prix, options, disponibilité' +
      (wantsFinancing(input.besoin) ? ', financement' : '') +
      ').',
  ].join('\n')
}

export function buildDevisWhatsAppUrl(input: DevisInput): string {
  return waUrl(buildDevisRequestText(input).split('\n'))
}

/**
 * Dealer → client : professional indicative quote (price, specs, financing, next steps)
 * WhatsApp formatting: *bold*
 */
export function buildDevisReplyText(input: DevisInput, ref = devisRef()): string {
  const firstName = input.nom.trim().split(/\s+/)[0] || input.nom.trim()
  const q = pack(input.modele)
  const financing = wantsFinancing(input.besoin)
  let section = 1

  const lines: Array<string | null> = [
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    '*DEVIS PROFESSIONNEL*',
    `Réf. : *${ref}*`,
    `Date : ${new Date().toLocaleDateString('fr-TN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    '',
    `Bonjour *${firstName}*,`,
    '',
    `Merci pour votre demande. Voici votre *devis indicatif complet* pour le *JAC ${input.modele}* :`,
    '',
    `*${section++}) Véhicule*`,
    `• Marque : JAC Motors`,
    `• Modèle : *JAC ${input.modele}*`,
    `• Version : ${q.version}`,
    `• Transmission : ${q.drive}`,
    `• Motorisation : ${q.engine}`,
    `• État : Véhicule neuf`,
    '',
    `*${section++}) Prix Tunisie*`,
    `• Prix catalogue : *${q.priceLabel}*`,
    `• Montant de référence : *${formatDt(q.priceFromDt)}*`,
    '• Devise : Dinars tunisiens (DT)',
    '• Hors options / accessoires / frais éventuels',
    `• Disponibilité : ${q.availability}`,
    `• Garantie : ${q.warranty}`,
    '',
    `*${section++}) Inclus dans l’offre*`,
    ...q.included.map((item) => `• ${item}`),
    '',
    `*${section++}) Points forts*`,
    ...q.highlights.map((h) => `• ${h}`),
    '',
    `*${section++}) Caractéristiques techniques*`,
    ...q.specs.map((s) => `• ${s}`),
    '',
    `*${section++}) Votre dossier*`,
    `• Showroom : ${input.showroom}`,
    `• Besoin : ${input.besoin.trim()}`,
    `• Téléphone : ${input.telephone.trim()}`,
    `• Client : ${input.nom.trim()}`,
  ]

  if (financing) {
    lines.push(
      '',
      `*${section++}) Financement (exemples indicatifs)*`,
      `• Prix de référence : *${formatDt(q.priceFromDt)}*`,
      ...q.financingExamples.map(
        (ex) =>
          `• Ex. apport ~${ex.apportPct}% · ${ex.durationMonths} mois → *~${formatDt(ex.monthlyFromDt)}/mois*`,
      ),
      '• Étude de dossier personnalisée en showroom',
      '• Apport, durée et mensualité selon profil & organisme',
      '• Simulation définitive avec le conseiller',
    )
  }

  lines.push(
    '',
    `*${section++}) Prochaines étapes*`,
    '1. Confirmer ce devis avec un conseiller JAC',
    '2. Réserver une visite showroom ou un Google Meet',
    '3. Choisir options / couleur / équipements',
    '4. Finaliser commande ou financement en showroom',
    '',
    '*Liens utiles*',
    `• Site : ${CONTACT.siteUrl}`,
    `• Demande devis : ${CONTACT.siteUrl}/devis`,
    `• Modèles 360° : ${CONTACT.siteUrl}/modeles`,
    `• Visite / Meet : ${CONTACT.siteUrl}/visite`,
    '',
    `*Note* : ${q.note}`,
    '*Validité* : 7 jours',
    '*Mention* : devis indicatif, non contractuel — prix, options et stock à confirmer en showroom.',
    '',
    'Restant à votre disposition,',
    '*JAC Motors Tunisie*',
    `WhatsApp : ${CONTACT.whatsappDisplay}`,
  )

  return lines.filter((l): l is string => l != null).join('\n')
}

export function buildDevisReplyWhatsAppUrl(input: DevisInput): string | null {
  const client = toWhatsAppE164(input.telephone)
  if (!client) return null
  return waUrl(buildDevisReplyText(input).split('\n'), client)
}

export function quickWhatsAppUrl(message?: string): string {
  return waUrl([
    message?.trim() || 'Bonjour JAC Motors Tunisie, je souhaite plus d’informations.',
  ])
}

/** From the 360° viewer — ask for a Google Meet to discover showrooms */
export function buildShowroomMeetWhatsAppUrl(modele: 'T8' | 'T8 PRO'): string {
  return waUrl([
    'Bonjour JAC Motors Tunisie 👋',
    `Je viens de voir le JAC ${modele} en 360° sur le site.`,
    'Je souhaite un Google Meet pour découvrir / visiter les showrooms à distance.',
    '',
    'Merci de me proposer un créneau et le lien Meet.',
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
  const q = pack(visit.modele)
  const isMeet = visit.mode === 'meet'

  return waUrl([
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    isMeet ? '*DEMANDE GOOGLE MEET — SHOWROOM*' : '*DEMANDE DE VISITE SHOWROOM*',
    '',
    'Bonjour JAC Motors Tunisie,',
    isMeet
      ? 'Je souhaite un Google Meet pour découvrir les showrooms :'
      : 'Je souhaite réserver une visite showroom :',
    '',
    '*Réservation*',
    `• Réf. : *${visit.id}*`,
    `• Date : *${when}*`,
    `• Heure : *${visit.time}*`,
    `• Mode : ${isMeet ? 'Google Meet (visioconférence)' : 'Sur place en showroom'}`,
    isMeet && visit.meetUrl ? `• Lien Meet proposé : ${visit.meetUrl}` : null,
    '',
    '*Client*',
    `• Nom : ${visit.nom}`,
    `• Téléphone : ${visit.telephone}`,
    visit.email ? `• Email : ${visit.email}` : null,
    '',
    '*Véhicule & showroom*',
    `• Modèle : *JAC ${visit.modele}*`,
    `• Version : ${q.version}`,
    `• Prix indicatif : *${q.priceLabel}*`,
    `• Showroom : ${visit.showroomName}`,
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

/** Suggested dealer reply to a visit / Meet request */
export function buildVisitReplyText(visit: VisitRequest): string {
  const firstName = visit.nom.trim().split(/\s+/)[0] || visit.nom.trim()
  const when = formatVisitDate(visit.date)
  const q = pack(visit.modele)
  const isMeet = visit.mode === 'meet'

  return [
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    isMeet ? '*CONFIRMATION GOOGLE MEET*' : '*CONFIRMATION DE VISITE*',
    `Réf. : *${visit.id}*`,
    '',
    `Bonjour *${firstName}*,`,
    '',
    isMeet
      ? `Merci pour votre demande de Google Meet concernant le *JAC ${visit.modele}*.`
      : `Merci pour votre demande de visite showroom concernant le *JAC ${visit.modele}*.`,
    '',
    '*Détails confirmés*',
    `• Showroom : ${visit.showroomName}`,
    `• Date : *${when}*`,
    `• Heure : *${visit.time}*`,
    `• Modèle : JAC ${visit.modele} (${q.version})`,
    `• Prix indicatif : *${q.priceLabel}*`,
    isMeet && visit.meetUrl ? `• Lien Google Meet : ${visit.meetUrl}` : null,
    '',
    isMeet
      ? 'Nous restons disponibles pour ajuster le créneau. Merci d’arriver 5 minutes avant le Meet.'
      : 'Nous vous accueillons volontiers. Merci d’arriver 10 minutes avant l’heure prévue.',
    '',
    '*Besoin d’un devis écrit ?*',
    `→ ${CONTACT.siteUrl}/devis`,
    '',
    'À bientôt,',
    '*JAC Motors Tunisie*',
    `WhatsApp : ${CONTACT.whatsappDisplay}`,
  ]
    .filter((line): line is string => line != null)
    .join('\n')
}

export function buildVisitReplyWhatsAppUrl(visit: VisitRequest): string | null {
  const client = toWhatsAppE164(visit.telephone)
  if (!client) return null
  return waUrl(buildVisitReplyText(visit).split('\n'), client)
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
