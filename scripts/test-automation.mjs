/**
 * Automation workflow tests (dry-run WhatsApp + PDF schedule).
 * Run with server up: node scripts/test-automation.mjs
 * Or: npm run test:api (starts ephemeral checks via fetch; server must listen).
 */

import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const PORT = 8799
const BASE = `http://127.0.0.1:${PORT}`

let passed = 0
function test(name, fn) {
  return fn()
    .then(() => {
      passed += 1
      console.log(`✓ ${name}`)
    })
    .catch((e) => {
      console.error(`✗ ${name}: ${e.message}`)
      process.exitCode = 1
    })
}

const child = spawn(process.execPath, ['server/index.mjs'], {
  env: {
    ...process.env,
    PORT: String(PORT),
    PDF_DELAY_MS: '1500',
    WHATSAPP_DRY_RUN: '1',
    PUBLIC_BASE_URL: BASE,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`)
      if (res.ok) return
    } catch {
      /* retry */
    }
    await sleep(150)
  }
  throw new Error('server did not become ready')
}

try {
  await waitReady()

  await test('health reports messagerie/whatsapp channel', async () => {
    const res = await fetch(`${BASE}/api/health`)
    const data = await res.json()
    assert.equal(data.ok, true)
    assert.ok(['messagerie', 'dry-run', 'cloud-api'].includes(data.whatsapp.mode))
  })

  await test('devis ack + pdf schedule (no second manual reply)', async () => {
    const res = await fetch(`${BASE}/api/leads/devis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: 'Youssef Test',
        telephone: '99 757 218',
        modele: 'T8 PRO',
        showroom: 'SHOWROOM CLH MOTORS',
        besoin: 'Devis véhicule neuf',
        couleurId: 'blanc',
        optionIds: ['couvre-benne'],
      }),
    })
    const data = await res.json()
    assert.equal(res.status, 200)
    assert.equal(data.ok, true)
    assert.ok(data.leadId.startsWith('DEV-'))
    assert.equal(data.ackSent, true)
    assert.ok(data.pdfUrl.includes('/api/pdfs/'))
    assert.ok(data.pdfScheduledAt)

    const pdfRes = await fetch(data.pdfUrl)
    assert.equal(pdfRes.status, 200)
    assert.match(pdfRes.headers.get('content-type') || '', /pdf/)
  })

  await test('visite meet ack auto', async () => {
    const res = await fetch(`${BASE}/api/leads/visite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: 'Client Meet',
        telephone: '99757218',
        modele: 'T8 PRO',
        showroomId: 'clh',
        showroomName: 'SHOWROOM CLH MOTORS',
        date: '2026-11-03',
        time: '10:00',
        mode: 'meet',
      }),
    })
    const data = await res.json()
    assert.equal(data.ok, true)
    assert.ok(data.meetUrl)
    assert.equal(data.ackSent, true)
  })

  await test('360 interest lead', async () => {
    const res = await fetch(`${BASE}/api/leads/interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: 'Client 360',
        telephone: '+21699757218',
        modele: 'T8',
        source: '360',
      }),
    })
    const data = await res.json()
    assert.equal(data.ok, true)
    assert.equal(data.ackSent, true)
  })

  console.log(`\n${passed} automation tests passed`)
} finally {
  child.kill('SIGTERM')
}
