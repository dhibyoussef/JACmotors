import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { writeOutbox } from './store.mjs'

/**
 * WhatsApp Cloud API sender.
 * If WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing → dry-run outbox files.
 *
 * Official docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

function config() {
  return {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    dryRun: process.env.WHATSAPP_DRY_RUN === '1' || !process.env.WHATSAPP_TOKEN,
  }
}

export function whatsappStatus() {
  const c = config()
  return {
    mode: c.dryRun ? 'dry-run' : 'cloud-api',
    phoneNumberIdSet: Boolean(c.phoneNumberId),
    tokenSet: Boolean(c.token),
  }
}

async function graph(pathname, init = {}) {
  const c = config()
  const url = `https://graph.facebook.com/${c.apiVersion}/${pathname}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${c.token}`,
      ...(init.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText
    throw new Error(`WhatsApp API error: ${msg}`)
  }
  return data
}

export async function sendTextMessage(toE164, body) {
  const c = config()
  const stamp = Date.now()
  if (c.dryRun) {
    const file = await writeOutbox(
      `${stamp}-text-${toE164}.json`,
      { type: 'text', to: toE164, body, at: new Date().toISOString() },
    )
    console.log(`[whatsapp:dry-run] text → ${toE164} (${file})`)
    return { dryRun: true, file }
  }

  return graph(`${c.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toE164,
      type: 'text',
      text: { preview_url: false, body },
    }),
  })
}

async function uploadDocument(filePath, fileName) {
  const c = config()
  const bytes = await readFile(filePath)
  const form = new FormData()
  form.append('messaging_product', 'whatsapp')
  form.append('type', 'application/pdf')
  form.append('file', new Blob([bytes], { type: 'application/pdf' }), fileName)

  return graph(`${c.phoneNumberId}/media`, {
    method: 'POST',
    body: form,
  })
}

export async function sendDocumentMessage(toE164, filePath, { fileName, caption }) {
  const c = config()
  const stamp = Date.now()
  if (c.dryRun) {
    const file = await writeOutbox(
      `${stamp}-document-${toE164}.json`,
      {
        type: 'document',
        to: toE164,
        filePath,
        fileName,
        caption,
        at: new Date().toISOString(),
      },
    )
    console.log(`[whatsapp:dry-run] document → ${toE164} (${path.basename(filePath)})`)
    return { dryRun: true, file }
  }

  const uploaded = await uploadDocument(filePath, fileName)
  const mediaId = uploaded.id
  if (!mediaId) throw new Error('WhatsApp media upload returned no id')

  return graph(`${c.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toE164,
      type: 'document',
      document: {
        id: mediaId,
        filename: fileName,
        caption: caption?.slice(0, 1024) || undefined,
      },
    }),
  })
}
