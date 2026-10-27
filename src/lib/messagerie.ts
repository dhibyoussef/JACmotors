/** Helpers to deep-link into the on-server JAC Messagerie (WhatsApp demo) */

export function phoneDigits(phone: string): string {
  return String(phone || '').replace(/\D/g, '').slice(-8)
}

export function messageriePath(
  phone: string,
  opts?: { from?: string; ref?: string },
): string {
  const q = new URLSearchParams({ phone: phoneDigits(phone) || '99757218' })
  if (opts?.from) q.set('from', opts.from)
  if (opts?.ref) q.set('ref', opts.ref)
  return `/messagerie?${q.toString()}`
}

export function formatWaPhone(phone: string): string {
  const d = String(phone || '').replace(/\D/g, '')
  const local = d.startsWith('216') ? d.slice(3) : d.slice(-8)
  if (local.length === 8) {
    return `+216 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
  }
  return phone.startsWith('+') ? phone : `+${phone}`
}
