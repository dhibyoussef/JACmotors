/** Fire-and-forget notify to n8n production webhooks */

const N8N_WEBHOOK_BASE = (
  process.env.N8N_WEBHOOK_BASE || 'http://127.0.0.1/n8n/webhook'
).replace(/\/$/, '')

export function n8nStatus() {
  return { webhookBase: N8N_WEBHOOK_BASE }
}

export async function notifyN8n(path, payload) {
  const url = `${N8N_WEBHOOK_BASE}/${path.replace(/^\//, '')}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-From-JAC-API': '1',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    console.log(`[n8n] ${path} → ${res.status}`)
    return { ok: res.ok, status: res.status, body: text.slice(0, 300) }
  } catch (err) {
    console.error(`[n8n] ${path} failed`, err?.message || err)
    return { ok: false, error: String(err?.message || err) }
  }
}
