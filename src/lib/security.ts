/** Client-side hardening for forms & display (XSS / abuse / PII hygiene). */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function sanitizeText(raw: string, max = 120): string {
  return raw
    .replace(CONTROL_CHARS, '')
    .replace(/[<>`"\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

/** Tunisian plate styles e.g. 123 TU 4567 / 123TU4567 / RS 1234 */
export function sanitizeMatricule(raw: string): string {
  return raw
    .toUpperCase()
    .replace(CONTROL_CHARS, '')
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20)
}

export function isValidMatricule(value: string): boolean {
  const v = sanitizeMatricule(value)
  if (v.length < 5 || v.length > 20) return false
  // at least one letter and one digit
  return /[A-Z]/.test(v) && /\d/.test(v)
}

export function sanitizeEmail(raw: string): string {
  return raw.replace(CONTROL_CHARS, '').trim().toLowerCase().slice(0, 120)
}

export function isValidEmail(value: string): boolean {
  const v = sanitizeEmail(value)
  // pragmatic RFC-inspired check — no consecutive dots, no leading/trailing dots
  return (
    v.length >= 6 &&
    v.length <= 120 &&
    /^[a-z0-9](?:[a-z0-9._%+-]{0,63}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/i.test(
      v,
    ) &&
    !v.includes('..')
  )
}

export function sanitizePhone(raw: string): string {
  return raw.replace(CONTROL_CHARS, '').replace(/[^\d+\s]/g, '').trim().slice(0, 20)
}

/** Accepts TN mobile/landline: 8 digits local, optional +216 */
export function isValidTunisianPhone(value: string): boolean {
  const digits = sanitizePhone(value).replace(/\s/g, '')
  if (/^\+216\d{8}$/.test(digits)) return true
  if (/^216\d{8}$/.test(digits)) return true
  if (/^[2-9]\d{7}$/.test(digits)) return true
  return false
}

export function formatPhoneDisplay(value: string): string {
  const digits = sanitizePhone(value).replace(/\D/g, '')
  const local = digits.startsWith('216') ? digits.slice(3) : digits
  if (local.length === 8) {
    return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
  }
  return sanitizePhone(value)
}

const RATE_KEY = 'jac-tn-rate'
const MAX_PER_HOUR = 5

export function checkRateLimit(): { ok: true } | { ok: false; retryMinutes: number } {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const stamps: number[] = raw ? (JSON.parse(raw) as number[]) : []
    const hourAgo = Date.now() - 60 * 60 * 1000
    const recent = stamps.filter((t) => t > hourAgo)
    if (recent.length >= MAX_PER_HOUR) {
      const oldest = Math.min(...recent)
      const retryMinutes = Math.ceil((oldest + 60 * 60 * 1000 - Date.now()) / 60000)
      return { ok: false, retryMinutes: Math.max(1, retryMinutes) }
    }
    return { ok: true }
  } catch {
    return { ok: true }
  }
}

export function recordSubmission() {
  try {
    const raw = sessionStorage.getItem(RATE_KEY)
    const stamps: number[] = raw ? (JSON.parse(raw) as number[]) : []
    const hourAgo = Date.now() - 60 * 60 * 1000
    const recent = stamps.filter((t) => t > hourAgo)
    recent.push(Date.now())
    sessionStorage.setItem(RATE_KEY, JSON.stringify(recent))
  } catch {
    /* ignore quota */
  }
}

/** Simple integrity stamp — detects localStorage tampering of ticket fields */
export async function integrityStamp(payload: string): Promise<string> {
  const data = new TextEncoder().encode(`jac-tn-v1|${payload}`)
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16)
  }
  // fallback non-crypto environments
  let h = 0
  for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(8, '0')
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return '•••'
  const visible = user.slice(0, Math.min(2, user.length))
  return `${visible}•••@${domain}`
}
