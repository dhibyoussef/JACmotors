import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { toE164 } from './lib/catalog.mjs'
import {
  dealerLeadText,
  devisAckText,
  devisPdfCaption,
  enrichDevisLead,
  visitAckText,
} from './lib/messages.mjs'
import { buildDevisPdf } from './lib/pdf.mjs'
import { enqueueJob, listJobs, restoreJobs, setJobHandler } from './lib/queue.mjs'
import {
  DATA_DIR,
  PDF_DIR,
  initStore,
  listLeads,
  newId,
  saveLead,
} from './lib/store.mjs'
import { sendDocumentMessage, sendTextMessage, whatsappStatus } from './lib/whatsapp.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 8787)
const PDF_DELAY_MS = Number(process.env.PDF_DELAY_MS || 90_000)
const DEALER_E164 = (process.env.WHATSAPP_DEALER_E164 || '21699757218').replace(/\D/g, '')
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${PORT}`

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

function bad(res, status, message) {
  return res.status(status).json({ ok: false, error: message })
}

function isValidTnPhone(value) {
  return Boolean(toE164(value))
}

setJobHandler(async (job) => {
  if (job.type !== 'send_devis_pdf') return
  const { lead, filePath, fileName } = job.payload
  const client = toE164(lead.telephone)
  if (!client) throw new Error('Invalid client phone on delayed job')
  await sendDocumentMessage(client, filePath, {
    fileName,
    caption: devisPdfCaption(lead),
  })
  console.log(`[workflow] PDF sent to ${client} for ${lead.ref}`)
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'jacmotors-automation',
    whatsapp: whatsappStatus(),
    pdfDelayMs: PDF_DELAY_MS,
    publicBaseUrl: PUBLIC_BASE_URL,
    uptimeSec: Math.round(process.uptime()),
  })
})

app.get('/api/admin/leads', async (_req, res) => {
  res.json({ ok: true, leads: await listLeads(100) })
})

app.get('/api/admin/jobs', async (_req, res) => {
  res.json({ ok: true, jobs: await listJobs(100) })
})

app.get('/api/pdfs/:name', (req, res) => {
  const safe = path.basename(req.params.name)
  const file = path.join(PDF_DIR, safe)
  if (!existsSync(file)) return bad(res, 404, 'PDF introuvable')
  res.setHeader('Content-Type', 'application/pdf')
  res.sendFile(file)
})

/** DEVIS workflow: ack now → PDF later (no second manual reply) */
app.post('/api/leads/devis', async (req, res) => {
  try {
    const body = req.body || {}
    const nom = String(body.nom || '').trim()
    const telephone = String(body.telephone || '').trim()
    const modele = body.modele === 'T8' ? 'T8' : 'T8 PRO'
    if (nom.length < 2) return bad(res, 400, 'Indiquez votre nom.')
    if (!isValidTnPhone(telephone)) {
      return bad(res, 400, 'Téléphone tunisien invalide (ex. 99 757 218)')
    }

    const ref = newId('DEV')
    const enriched = enrichDevisLead(
      {
        modele,
        showroom: String(body.showroom || 'Showroom').slice(0, 120),
        nom,
        telephone,
        besoin: String(body.besoin || 'Devis véhicule neuf').slice(0, 120),
        couleurId: body.couleurId,
        optionIds: Array.isArray(body.optionIds) ? body.optionIds.slice(0, 8) : [],
      },
      ref,
    )

    const { filePath, fileName } = await buildDevisPdf(enriched, PDF_DIR)
    const client = toE164(telephone)
    const lead = {
      id: ref,
      type: 'devis',
      ...enriched,
      pdfFileName: fileName,
      pdfUrl: `${PUBLIC_BASE_URL}/api/pdfs/${encodeURIComponent(fileName)}`,
      createdAt: new Date().toISOString(),
      status: 'ack_sent',
    }
    await saveLead(lead)

    // 1) Immediate acknowledgment to CLIENT (replaces old second manual message)
    await sendTextMessage(client, devisAckText(lead))

    // 2) Notify dealer inbox
    await sendTextMessage(DEALER_E164, dealerLeadText(lead))

    // 3) Schedule professional PDF to CLIENT after delay
    const runAt = new Date(Date.now() + PDF_DELAY_MS).toISOString()
    await enqueueJob({
      id: `JOB-${ref}`,
      type: 'send_devis_pdf',
      status: 'pending',
      runAt,
      createdAt: new Date().toISOString(),
      payload: { lead, filePath, fileName },
    })

    res.json({
      ok: true,
      leadId: ref,
      pdfUrl: lead.pdfUrl,
      ackSent: true,
      pdfScheduledAt: runAt,
      pdfDelayMs: PDF_DELAY_MS,
      whatsapp: whatsappStatus(),
      message:
        'Demande reçue. Un message de confirmation part au client ; le PDF suivi automatiquement.',
    })
  } catch (err) {
    console.error(err)
    bad(res, 500, err instanceof Error ? err.message : 'Erreur serveur devis')
  }
})

/** VISITE / ESSAI / MEET workflow — auto ack to client + dealer notify */
app.post('/api/leads/visite', async (req, res) => {
  try {
    const body = req.body || {}
    const nom = String(body.nom || '').trim()
    const telephone = String(body.telephone || '').trim()
    const modele = body.modele === 'T8' ? 'T8' : 'T8 PRO'
    const mode =
      body.mode === 'meet' || body.mode === 'essai' ? body.mode : 'showroom'
    if (nom.length < 2) return bad(res, 400, 'Indiquez votre nom.')
    if (!isValidTnPhone(telephone)) {
      return bad(res, 400, 'Téléphone tunisien invalide (ex. 99 757 218)')
    }
    if (!body.date || !body.time) return bad(res, 400, 'Choisissez date et créneau.')

    const ref = newId('VISITE')
    const meetUrl =
      mode === 'meet'
        ? body.meetUrl ||
          `https://meet.google.com/${ref.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 3)}-${ref
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase()
            .slice(3, 7)}-${ref.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(7, 10)}`
        : null

    const lead = {
      id: ref,
      type: mode === 'meet' ? 'meet' : mode === 'essai' ? 'essai' : 'visite',
      nom,
      telephone,
      email: String(body.email || '').slice(0, 120),
      modele,
      showroom: String(body.showroomName || body.showroom || 'Showroom').slice(0, 120),
      showroomId: String(body.showroomId || ''),
      date: String(body.date),
      time: String(body.time),
      mode,
      meetUrl,
      createdAt: new Date().toISOString(),
      status: 'ack_sent',
    }
    await saveLead(lead)

    const client = toE164(telephone)
    await sendTextMessage(
      client,
      visitAckText({
        nom: lead.nom,
        modele: lead.modele,
        mode: lead.mode,
        date: lead.date,
        time: lead.time,
        showroomName: lead.showroom,
        ref: lead.id,
        meetUrl: lead.meetUrl,
      }),
    )
    await sendTextMessage(DEALER_E164, dealerLeadText(lead))

    res.json({
      ok: true,
      leadId: ref,
      meetUrl: lead.meetUrl,
      ackSent: true,
      whatsapp: whatsappStatus(),
      message: 'Rendez-vous enregistré. Confirmation WhatsApp envoyée au client.',
    })
  } catch (err) {
    console.error(err)
    bad(res, 500, err instanceof Error ? err.message : 'Erreur serveur visite')
  }
})

/** 360 / showroom interest quick lead */
app.post('/api/leads/interest', async (req, res) => {
  try {
    const body = req.body || {}
    const nom = String(body.nom || '').trim()
    const telephone = String(body.telephone || '').trim()
    const modele = body.modele === 'T8' ? 'T8' : 'T8 PRO'
    const source = String(body.source || '360').slice(0, 40)
    if (nom.length < 2) return bad(res, 400, 'Indiquez votre nom.')
    if (!isValidTnPhone(telephone)) {
      return bad(res, 400, 'Téléphone tunisien invalide (ex. 99 757 218)')
    }

    const ref = newId('INT')
    const lead = {
      id: ref,
      type: source,
      nom,
      telephone,
      modele,
      showroom: String(body.showroom || '').slice(0, 120),
      createdAt: new Date().toISOString(),
      status: 'ack_sent',
    }
    await saveLead(lead)

    const client = toE164(telephone)
    const ack = [
      '*JAC MOTORS TUNISIE*',
      '────────────────',
      '*DEMANDE REÇUE*',
      '',
      `Bonjour *${nom.split(/\s+/)[0]}*,`,
      '',
      source === '360'
        ? `Merci pour votre intérêt après la vue 360° du *JAC ${modele}*.`
        : `Merci pour votre intérêt concernant le *JAC ${modele}*.`,
      'Un conseiller vous recontacte sous peu pour un Google Meet ou une visite showroom.',
      '',
      `Réf. : *${ref}*`,
      '',
      '*JAC Motors Tunisie*',
    ].join('\n')

    await sendTextMessage(client, ack)
    await sendTextMessage(DEALER_E164, dealerLeadText(lead))

    res.json({
      ok: true,
      leadId: ref,
      ackSent: true,
      whatsapp: whatsappStatus(),
    })
  } catch (err) {
    console.error(err)
    bad(res, 500, err instanceof Error ? err.message : 'Erreur serveur interest')
  }
})

// Serve built frontend when present (always-on single process)
if (existsSync(DIST)) {
  app.use(express.static(DIST))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(DIST, 'index.html'))
  })
}

await initStore()
await restoreJobs()

app.listen(PORT, () => {
  console.log(`JAC automation server on http://127.0.0.1:${PORT}`)
  console.log(`WhatsApp mode: ${whatsappStatus().mode}`)
  console.log(`PDF delay: ${PDF_DELAY_MS}ms`)
  console.log(`Data dir: ${DATA_DIR}`)
})
