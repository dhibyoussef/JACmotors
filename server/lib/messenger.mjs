/**
 * Fake on-server messagerie (demo inbox).
 * Every WhatsApp dry-run / send is also stored here so staff & demos
 * can open a chat UI without Meta Cloud API.
 */
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { OUTBOX_DIR } from './store.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MSG_DIR = path.resolve(__dirname, '../data/messenger')
const MSG_FILE = path.join(MSG_DIR, 'messages.json')

async function ensure() {
  await mkdir(MSG_DIR, { recursive: true })
}

async function loadAll() {
  await ensure()
  try {
    return JSON.parse(await readFile(MSG_FILE, 'utf8'))
  } catch {
    return []
  }
}

async function saveAll(list) {
  await ensure()
  await writeFile(MSG_FILE, JSON.stringify(list.slice(0, 2000), null, 2), 'utf8')
}

function normalizePhone(phone) {
  const d = String(phone || '').replace(/\D/g, '')
  if (/^216\d{8}$/.test(d)) return d
  if (/^[2-9]\d{7}$/.test(d)) return `216${d}`
  return d || 'unknown'
}

export async function recordMessage(input) {
  const list = await loadAll()
  const msg = {
    id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    direction: input.direction || 'outbound',
    channel: input.channel || 'jac-messagerie',
    to: normalizePhone(input.to),
    from: input.from || 'JAC Motors Tunisie',
    type: input.type || 'text',
    body: input.body || input.caption || '',
    caption: input.caption || null,
    fileName: input.fileName || null,
    fileUrl: input.fileUrl || null,
    meta: input.meta || {},
    at: input.at || new Date().toISOString(),
  }
  list.unshift(msg)
  await saveAll(list)
  return msg
}

export async function listMessages({ phone, limit = 200 } = {}) {
  const list = await loadAll()
  const filtered = phone
    ? list.filter((m) => m.to === normalizePhone(phone) || m.from === normalizePhone(phone))
    : list
  return filtered.slice(0, limit)
}

export async function listConversations() {
  const list = await loadAll()
  const map = new Map()
  for (const m of list) {
    const key = m.to || 'unknown'
    if (!map.has(key)) {
      map.set(key, {
        phone: key,
        lastAt: m.at,
        lastPreview: (m.body || m.caption || m.fileName || '').slice(0, 120),
        count: 1,
        hasDocument: m.type === 'document',
      })
    } else {
      const c = map.get(key)
      c.count += 1
      if (m.type === 'document') c.hasDocument = true
    }
  }
  return [...map.values()].sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt)))
}

/** Import legacy outbox JSON files once into messagerie */
export async function importOutboxOnce() {
  const existing = await loadAll()
  if (existing.length > 0) return { imported: 0, total: existing.length }
  let imported = 0
  try {
    const files = await readdir(OUTBOX_DIR)
    const rows = []
    for (const name of files) {
      if (!name.endsWith('.json')) continue
      try {
        const raw = JSON.parse(await readFile(path.join(OUTBOX_DIR, name), 'utf8'))
        const to = normalizePhone(raw.to)
        rows.push({
          id: `MSG-OUT-${name.replace(/\.json$/, '')}`,
          direction: 'outbound',
          channel: 'jac-messagerie',
          to,
          from: 'JAC Motors Tunisie',
          type: raw.type || 'text',
          body: raw.body || raw.caption || '',
          caption: raw.caption || null,
          fileName: raw.fileName || null,
          fileUrl: raw.fileName
            ? `${process.env.PUBLIC_BASE_URL || ''}/api/pdfs/${encodeURIComponent(raw.fileName)}`
            : null,
          meta: { source: 'outbox', file: name },
          at: raw.at || new Date().toISOString(),
        })
        imported += 1
      } catch {
        /* skip bad file */
      }
    }
    rows.sort((a, b) => String(b.at).localeCompare(String(a.at)))
    await saveAll(rows)
  } catch {
    /* no outbox dir */
  }
  return { imported, total: imported }
}
