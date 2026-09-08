import { timeSlots, showrooms, serviceTypes } from '../data/content'
import {
  escapeHtml,
  integrityStamp,
  sanitizeEmail,
  sanitizeMatricule,
  sanitizePhone,
  sanitizeText,
} from './security'

export type Reservation = {
  id: string
  matricule: string
  nom: string
  email: string
  telephone: string
  modele: 'T8' | 'T8 PRO'
  showroomId: string
  service: string
  date: string
  time: string
  createdAt: string
  consentAt: string
  integrity?: string
}

const STORAGE_KEY = 'jac-tn-reservations-v2'
const BOOKED_KEY = 'jac-tn-booked-slots-v2'
const MAX_STORED = 30

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function generateTicketId() {
  const d = new Date()
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const rand =
    globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 8).toUpperCase() ??
    Math.random().toString(36).slice(2, 10).toUpperCase()
  return `JAC-${stamp}-${rand}`
}

function payloadForIntegrity(r: Omit<Reservation, 'integrity'>) {
  return [
    r.id,
    r.matricule,
    r.nom,
    r.email,
    r.telephone,
    r.modele,
    r.showroomId,
    r.service,
    r.date,
    r.time,
    r.createdAt,
  ].join('|')
}

export function getReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Reservation[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r) =>
        typeof r?.id === 'string' &&
        typeof r?.matricule === 'string' &&
        typeof r?.email === 'string',
    )
  } catch {
    return []
  }
}

export async function saveReservation(
  reservation: Omit<Reservation, 'integrity'>,
): Promise<Reservation> {
  const cleaned: Omit<Reservation, 'integrity'> = {
    ...reservation,
    matricule: sanitizeMatricule(reservation.matricule),
    nom: sanitizeText(reservation.nom, 80),
    email: sanitizeEmail(reservation.email),
    telephone: sanitizePhone(reservation.telephone),
    service: sanitizeText(reservation.service, 60),
  }

  if (!showrooms.some((s) => s.id === cleaned.showroomId)) {
    throw new Error('Showroom invalide')
  }
  if (cleaned.modele !== 'T8' && cleaned.modele !== 'T8 PRO') {
    throw new Error('Modèle invalide')
  }
  if (!(serviceTypes as readonly string[]).includes(cleaned.service)) {
    throw new Error('Service invalide')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned.date)) {
    throw new Error('Date invalide')
  }
  if (!(timeSlots as readonly string[]).includes(cleaned.time)) {
    throw new Error('Heure invalide')
  }

  const integrity = await integrityStamp(payloadForIntegrity(cleaned))
  const withSeal: Reservation = { ...cleaned, integrity }

  const all = getReservations().filter((r) => r.id !== withSeal.id)
  all.unshift(withSeal)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_STORED)))

  const booked = getBookedSlots()
  const key = `${cleaned.date}|${cleaned.time}|${cleaned.showroomId}`
  if (!booked.includes(key)) {
    booked.push(key)
    localStorage.setItem(BOOKED_KEY, JSON.stringify(booked.slice(-200)))
  }

  return withSeal
}

function getBookedSlots(): string[] {
  try {
    const raw = localStorage.getItem(BOOKED_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export async function verifyReservation(r: Reservation): Promise<boolean> {
  if (!r.integrity) return false
  const stamp = await integrityStamp(payloadForIntegrity(r))
  return stamp === r.integrity
}

export type DayAvailability = {
  date: string
  label: string
  weekday: string
  slots: { time: string; available: boolean }[]
}

export function getAvailableDays(
  showroomId: string,
  count = 12,
): DayAvailability[] {
  if (!showrooms.some((s) => s.id === showroomId)) return []

  const booked = getBookedSlots()
  const days: DayAvailability[] = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1)
    if (cursor.getDay() === 0) continue

    const iso = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`
    const slots = timeSlots.map((time) => {
      const key = `${iso}|${time}|${showroomId}`
      return { time, available: !booked.includes(key) }
    })

    days.push({
      date: iso,
      label: cursor.toLocaleDateString('fr-TN', {
        day: 'numeric',
        month: 'long',
      }),
      weekday: cursor.toLocaleDateString('fr-TN', { weekday: 'short' }),
      slots,
    })
  }

  return days
}

export function downloadTicket(reservation: Reservation, showroomName: string) {
  const sealed = reservation.integrity
    ? `<div class="row"><span>Sceau</span><span>${escapeHtml(reservation.integrity)}</span></div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="robots" content="noindex"/>
<title>Ticket ${escapeHtml(reservation.id)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@500;700&display=swap');
  body{font-family:Manrope,system-ui,sans-serif;background:#f2f2f2;margin:0;padding:32px;color:#0b0d10}
  .ticket{max-width:480px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:28px 32px;position:relative}
  .ticket::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;background:#E30613}
  .brand{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:.06em;margin:0}
  .sub{color:#666;font-size:13px;margin:4px 0 20px}
  .id{font-family:ui-monospace,monospace;background:#0b0d10;color:#fff;display:inline-block;padding:8px 12px;font-size:14px;letter-spacing:.04em}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#888;margin:24px 0 8px}
  .row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #eee;font-size:14px}
  .row span:last-child{font-weight:700;text-align:right;word-break:break-word}
  .footer{margin-top:28px;font-size:12px;color:#777;line-height:1.5}
  .warn{margin-top:12px;padding:10px;background:#f7f8fa;font-size:11px;color:#555}
  @media print{body{background:#fff;padding:0}.ticket{border:none}}
</style>
</head>
<body>
  <div class="ticket">
    <p class="brand">JAC MOTORS</p>
    <p class="sub">Tunisie · Ticket d’entretien sécurisé</p>
    <div class="id">${escapeHtml(reservation.id)}</div>
    <h2>Client</h2>
    <div class="row"><span>Nom</span><span>${escapeHtml(reservation.nom)}</span></div>
    <div class="row"><span>Matricule</span><span>${escapeHtml(reservation.matricule)}</span></div>
    <div class="row"><span>Modèle</span><span>${escapeHtml(reservation.modele)}</span></div>
    <div class="row"><span>Email</span><span>${escapeHtml(reservation.email)}</span></div>
    <div class="row"><span>Téléphone</span><span>${escapeHtml(reservation.telephone)}</span></div>
    <h2>Rendez-vous</h2>
    <div class="row"><span>Showroom / atelier</span><span>${escapeHtml(showroomName)}</span></div>
    <div class="row"><span>Service</span><span>${escapeHtml(reservation.service)}</span></div>
    <div class="row"><span>Date</span><span>${escapeHtml(reservation.date)}</span></div>
    <div class="row"><span>Heure</span><span>${escapeHtml(reservation.time)}</span></div>
    ${sealed}
    <p class="footer">Présentez ce ticket à l’accueil. Émis le ${escapeHtml(new Date(reservation.createdAt).toLocaleString('fr-TN'))}.</p>
    <p class="warn">Document nominatif. Ne partagez pas votre ticket en ligne. JAC Motors Tunisie — données stockées localement sur votre appareil.</p>
  </div>
  <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${reservation.id.replace(/[^A-Z0-9-]/gi, '')}.html`
  a.rel = 'noopener'
  a.click()
  window.open(url, '_blank', 'noopener,noreferrer,width=560,height=720')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
