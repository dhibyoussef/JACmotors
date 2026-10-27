import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
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
import {
  authStaff,
  createAppointment,
  createUser,
  dashboardStats,
  dbHealth,
  initDb,
  listAppointments,
  listClients,
  listDocuments,
  listLeadsDb,
  listUsers,
  loginStaff,
  updateAppointmentStatus,
  upsertClient,
} from './lib/db.mjs'
import { n8nStatus } from './lib/n8n.mjs'
import { sendDocumentMessage, sendTextMessage, whatsappStatus } from './lib/whatsapp.mjs'
import {
  importOutboxOnce,
  listConversations,
  listMessages,
  recordMessage,
} from './lib/messenger.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 8787)
const PDF_DELAY_MS = Number(process.env.PDF_DELAY_MS || 90_000)
const DEALER_E164 = (process.env.WHATSAPP_DEALER_E164 || '21699757218').replace(/\D/g, '')
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${PORT}`

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
)
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Trop de requêtes — réessayez dans une minute.' },
  }),
)
app.use(
  '/api/leads/',
  rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Limite devis/visite atteinte — patientez un instant.' },
  }),
)
app.use(
  '/api/admin/login',
  rateLimit({
    windowMs: 15 * 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Trop de tentatives de connexion.' },
  }),
)

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

app.get('/api/health', async (_req, res) => {
  const db = await dbHealth()
  res.json({
    ok: true,
    service: 'jacmotors-automation',
    whatsapp: whatsappStatus(),
    n8n: n8nStatus(),
    database: db,
    pdfDelayMs: PDF_DELAY_MS,
    publicBaseUrl: PUBLIC_BASE_URL,
    uptimeSec: Math.round(process.uptime()),
  })
})

/** Demo self-test: health + optional sample leads (messagerie mode). */
async function runDemoTestAll({ runFlows = false } = {}) {
  const checks = []
  const push = (id, label, ok, detail, link) => {
    checks.push({ id, label, ok: Boolean(ok), detail, link })
  }

  const db = await dbHealth()
  const wa = whatsappStatus()
  const n8n = n8nStatus()
  push(
    'health',
    'API health',
    true,
    `mode=${wa.mode} · pdfDelayMs=${PDF_DELAY_MS}`,
    `${PUBLIC_BASE_URL}/api/health`,
  )
  push(
    'database',
    'Postgres',
    db.ok,
    db.ok
      ? `leads=${db.leads} clients=${db.clients} docs=${db.documents}`
      : db.error || 'DB down',
    `${PUBLIC_BASE_URL}/db/`,
  )
  push(
    'whatsapp',
    'Messaging channel',
    true,
    wa.tokenSet
      ? 'Cloud API tokens set (live WhatsApp)'
      : 'DEMO messagerie — tokens empty; later → real WhatsApp',
    `${PUBLIC_BASE_URL}/messagerie?phone=99757218`,
  )
  push(
    'n8n-config',
    'n8n webhook base',
    Boolean(n8n.webhookBase),
    n8n.webhookBase || 'missing',
    `${PUBLIC_BASE_URL}/n8n/`,
  )

  // Public page probes (same origin via PUBLIC_BASE_URL)
  const pages = [
    ['page-home', 'Home', '/'],
    ['page-devis', 'Devis', '/devis'],
    ['page-visite', 'Visite', '/visite'],
    ['page-messagerie', 'Messagerie', '/messagerie'],
    ['page-admin', 'Admin', '/admin'],
    ['page-test', 'Test guide', '/test'],
    ['page-cms', 'CMS', '/cms/admin/'],
    ['page-n8n', 'n8n UI', '/n8n/'],
  ]
  for (const [id, label, pathName] of pages) {
    try {
      const res = await fetch(`${PUBLIC_BASE_URL}${pathName}`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(12_000),
      })
      push(id, label, res.ok, `HTTP ${res.status}`, `${PUBLIC_BASE_URL}${pathName}`)
    } catch (err) {
      push(
        id,
        label,
        false,
        err instanceof Error ? err.message : 'fetch failed',
        `${PUBLIC_BASE_URL}${pathName}`,
      )
    }
  }

  let sample = null
  if (runFlows) {
    const phone = '99757218'
    const stamp = Date.now().toString().slice(-5)
    try {
      const devisRes = await fetch(`http://127.0.0.1:${PORT}/api/leads/devis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: `Demo Test ${stamp}`,
          telephone: phone,
          modele: 'T8 PRO',
          showroom: 'SHOWROOM CLH MOTORS',
          besoin: 'Auto test devis',
          couleurId: 'blanc',
          optionIds: ['couvre-benne'],
        }),
      })
      const devis = await devisRes.json()
      push(
        'flow-devis',
        'Devis ACK + PDF',
        devisRes.ok && devis.ok,
        devis.ok
          ? `ref=${devis.leadId} · pdf scheduled`
          : devis.error || `HTTP ${devisRes.status}`,
        devis.pdfUrl || `${PUBLIC_BASE_URL}/messagerie?phone=${phone}`,
      )
      sample = { devis }
    } catch (err) {
      push('flow-devis', 'Devis ACK + PDF', false, err instanceof Error ? err.message : 'fail')
    }

    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      const date = tomorrow.toISOString().slice(0, 10)
      const visRes = await fetch(`http://127.0.0.1:${PORT}/api/leads/visite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: `Demo Meet ${stamp}`,
          telephone: phone,
          modele: 'T8 PRO',
          showroomId: 'clh',
          showroomName: 'SHOWROOM CLH MOTORS',
          date,
          time: '10:00',
          mode: 'meet',
        }),
      })
      const vis = await visRes.json()
      push(
        'flow-visite',
        'Visite Meet ACK',
        visRes.ok && vis.ok,
        vis.ok ? `ref=${vis.leadId} · meet=${vis.meetUrl || 'n/a'}` : vis.error || 'fail',
        `${PUBLIC_BASE_URL}/messagerie?phone=${phone}`,
      )
    } catch (err) {
      push('flow-visite', 'Visite Meet ACK', false, err instanceof Error ? err.message : 'fail')
    }

    try {
      const intRes = await fetch(`http://127.0.0.1:${PORT}/api/leads/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: `Demo 360 ${stamp}`,
          telephone: phone,
          modele: 'T8',
          source: '360',
        }),
      })
      const interest = await intRes.json()
      push(
        'flow-360',
        '360 interest ACK',
        intRes.ok && interest.ok,
        interest.ok ? `ref=${interest.leadId}` : interest.error || 'fail',
        `${PUBLIC_BASE_URL}/messagerie?phone=${phone}`,
      )
    } catch (err) {
      push('flow-360', '360 interest ACK', false, err instanceof Error ? err.message : 'fail')
    }

    try {
      const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@jacmotors.tn',
          password: 'JacMotors2026!',
        }),
      })
      const login = await loginRes.json()
      push(
        'admin-login',
        'Admin login',
        loginRes.ok && login.ok,
        login.ok ? `role=${login.user?.role || 'admin'}` : login.error || 'fail',
        `${PUBLIC_BASE_URL}/admin`,
      )
    } catch (err) {
      push('admin-login', 'Admin login', false, err instanceof Error ? err.message : 'fail')
    }
  }

  const ok = checks.every((c) => c.ok)
  return {
    ok,
    demo: true,
    baseUrl: PUBLIC_BASE_URL,
    checkedAt: new Date().toISOString(),
    checks,
    sample,
    messageriePhone: '99757218',
    note: runFlows
      ? 'DEMO auto test ran sample devis/visite/360 into JAC Messagerie. Later → real WhatsApp.'
      : 'Readiness only (add ?run=1 or POST to create sample leads).',
  }
}

app.get('/api/demo/test-all', async (req, res) => {
  try {
    const runFlows = String(req.query.run || '') === '1'
    const report = await runDemoTestAll({ runFlows })
    res.status(report.ok ? 200 : 503).json(report)
  } catch (err) {
    bad(res, 500, err instanceof Error ? err.message : 'Demo test failed')
  }
})

app.post('/api/demo/test-all', async (req, res) => {
  try {
    const runFlows = String(req.query.run || '1') !== '0'
    const report = await runDemoTestAll({ runFlows })
    res.status(report.ok ? 200 : 503).json(report)
  } catch (err) {
    bad(res, 500, err instanceof Error ? err.message : 'Demo test failed')
  }
})

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : String(req.headers['x-admin-token'] || '')
    const user = await authStaff(token)
    if (!user) return bad(res, 401, 'Session admin invalide. Reconnectez-vous.')
    req.admin = user
    next()
  } catch (err) {
    bad(res, 500, err instanceof Error ? err.message : 'Auth error')
  }
}

app.post('/api/admin/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim()
    const password = String(req.body?.password || '')
    const session = await loginStaff(email, password)
    if (!session) return bad(res, 401, 'Email ou mot de passe incorrect.')
    res.json({ ok: true, ...session })
  } catch (err) {
    bad(res, 500, err instanceof Error ? err.message : 'Login error')
  }
})

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ ok: true, user: req.admin })
})

app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
  res.json({ ok: true, stats: await dashboardStats() })
})

app.get('/api/admin/leads', requireAdmin, async (_req, res) => {
  try {
    const dbLeads = await listLeadsDb(200)
    return res.json({ ok: true, source: 'postgres', leads: dbLeads })
  } catch {
    res.json({ ok: true, source: 'file', leads: await listLeads(100) })
  }
})

app.get('/api/admin/clients', requireAdmin, async (_req, res) => {
  res.json({ ok: true, clients: await listClients(300) })
})

app.post('/api/admin/clients', requireAdmin, async (req, res) => {
  try {
    const nom = String(req.body?.nom || '').trim()
    const telephone = String(req.body?.telephone || '').trim()
    if (nom.length < 2) return bad(res, 400, 'Nom requis.')
    if (!isValidTnPhone(telephone)) return bad(res, 400, 'Téléphone invalide.')
    const client = await upsertClient({
      nom,
      telephone,
      email: req.body?.email,
      modele: req.body?.modele,
      matricule: req.body?.matricule,
      notes: req.body?.notes,
    })
    res.json({ ok: true, client })
  } catch (err) {
    bad(res, 500, err instanceof Error ? err.message : 'Client error')
  }
})

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  res.json({ ok: true, users: await listUsers() })
})

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    if (req.admin.role !== 'admin') return bad(res, 403, 'Réservé aux administrateurs.')
    const nom = String(req.body?.nom || '').trim()
    const email = String(req.body?.email || '').trim()
    if (nom.length < 2 || !email.includes('@')) return bad(res, 400, 'Nom et email requis.')
    const allowedRoles = new Set(['admin', 'sub_admin', 'under_admin', 'conseiller'])
    const role = allowedRoles.has(String(req.body?.role || ''))
      ? String(req.body.role)
      : 'under_admin'
    const user = await createUser({
      nom,
      email,
      password: String(req.body?.password || 'JacMotors2026!'),
      role,
    })
    res.json({ ok: true, user })
  } catch (err) {
    bad(res, 500, err instanceof Error ? err.message : 'User error')
  }
})

/** Demo seed — fills staff / clients / leads / RDV / PDFs (idempotent-ish) */
app.post('/api/admin/seed-demo', requireAdmin, async (req, res) => {
  try {
    if (req.admin.role !== 'admin') return bad(res, 403, 'Réservé aux administrateurs.')
    const { seedDemo } = await import('./lib/seed-demo.mjs')
    const result = await seedDemo({ force: Boolean(req.body?.force) })
    res.json({ ok: true, ...result })
  } catch (err) {
    bad(res, 500, err instanceof Error ? err.message : 'Seed error')
  }
})

app.get('/api/admin/appointments', requireAdmin, async (req, res) => {
  res.json({
    ok: true,
    appointments: await listAppointments({
      from: req.query.from || null,
      to: req.query.to || null,
    }),
  })
})

app.post('/api/admin/appointments', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {}
    const nom = String(body.nom || '').trim()
    const telephone = String(body.telephone || '').trim()
    if (nom.length < 2) return bad(res, 400, 'Nom requis.')
    if (!isValidTnPhone(telephone)) return bad(res, 400, 'Téléphone invalide.')
    if (!body.date || !body.time) return bad(res, 400, 'Date et heure requises.')
    const appointment = await createAppointment(body)
    res.json({ ok: true, appointment })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Appointment error'
    if (/unique|duplicate/i.test(msg)) {
      return bad(res, 409, 'Ce créneau est déjà pris.')
    }
    bad(res, 500, msg)
  }
})

app.patch('/api/admin/appointments/:id', requireAdmin, async (req, res) => {
  try {
    const status = String(req.body?.status || '')
    if (!['pending', 'confirmed', 'done', 'cancelled'].includes(status)) {
      return bad(res, 400, 'Statut invalide.')
    }
    const appointment = await updateAppointmentStatus(req.params.id, status)
    if (!appointment) return bad(res, 404, 'RDV introuvable.')
    res.json({ ok: true, appointment })
  } catch (err) {
    bad(res, 500, err instanceof Error ? err.message : 'Update error')
  }
})

app.get('/api/admin/documents', requireAdmin, async (_req, res) => {
  res.json({ ok: true, documents: await listDocuments(200) })
})

app.get('/api/admin/jobs', requireAdmin, async (_req, res) => {
  res.json({ ok: true, jobs: await listJobs(100) })
})

/** On-server fake messagerie (demo inbox — no Meta required) */
app.get('/api/messenger/conversations', requireAdmin, async (_req, res) => {
  res.json({ ok: true, conversations: await listConversations() })
})

app.get('/api/messenger/messages', requireAdmin, async (req, res) => {
  const phone = req.query.phone ? String(req.query.phone) : null
  res.json({ ok: true, messages: await listMessages({ phone, limit: 300 }) })
})

/** Public demo phone view — client opens /messagerie?phone=99757218 */
app.get('/api/messenger/public', async (req, res) => {
  const raw = String(req.query.phone || DEALER_E164)
  const phone = toE164(raw) || String(raw).replace(/\D/g, '')
  const messages = await listMessages({ phone, limit: 100 })
  res.json({
    ok: true,
    phone,
    channel: 'jac-messagerie',
    messages: [...messages].reverse(),
  })
})

app.post('/api/messenger/import-outbox', requireAdmin, async (_req, res) => {
  res.json({ ok: true, ...(await importOutboxOnce()) })
})

app.post('/api/messenger/demo-ping', requireAdmin, async (req, res) => {
  const phone = toE164(req.body?.telephone || DEALER_E164) || DEALER_E164
  const msg = await recordMessage({
    to: phone,
    type: 'text',
    body: [
      '*JAC MESSAGERIE (démo)*',
      '',
      `Bonjour *${String(req.body?.nom || 'Youssef').split(/\s+/)[0]}*,`,
      '',
      'Ceci est un message de test sur la messagerie installée sur le serveur.',
      'Pas besoin de WhatsApp / Meta pour la démo.',
      '',
      '*JAC Motors Tunisie*',
    ].join('\n'),
  })
  res.json({ ok: true, message: msg })
})

/** Public checkup booking (client picks a date) */
app.post('/api/appointments/public', async (req, res) => {
  try {
    const body = req.body || {}
    const nom = String(body.nom || '').trim()
    const telephone = String(body.telephone || '').trim()
    if (nom.length < 2) return bad(res, 400, 'Indiquez votre nom.')
    if (!isValidTnPhone(telephone)) {
      return bad(res, 400, 'Téléphone tunisien invalide (ex. 99 757 218)')
    }
    if (!body.date || !body.time) return bad(res, 400, 'Choisissez une date et un créneau.')
    const appointment = await createAppointment({
      ...body,
      type: body.type || 'checkup',
      status: 'pending',
    })
    await sendTextMessage(
      toE164(telephone),
      [
        '*JAC MOTORS TUNISIE*',
        '────────────────',
        '*RDV ATELIER / CHECK-UP*',
        '',
        `Bonjour *${nom.split(/\s+/)[0]}*,`,
        '',
        'Votre demande de rendez-vous est enregistrée :',
        `• Réf. : *${appointment.id}*`,
        `• Date : *${appointment.date}*`,
        `• Heure : *${appointment.time}*`,
        appointment.matricule ? `• Matricule : ${appointment.matricule}` : null,
        '',
        'Un conseiller confirmera sous peu.',
        '',
        '*JAC Motors Tunisie*',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    await sendTextMessage(
      DEALER_E164,
      `*NOUVEAU RDV ATELIER*\n${appointment.id}\n${appointment.nom} · ${appointment.telephone}\n${appointment.date} ${appointment.time}`,
    )
    res.json({ ok: true, appointment })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur RDV'
    if (/unique|duplicate/i.test(msg)) return bad(res, 409, 'Ce créneau est déjà pris.')
    bad(res, 500, msg)
  }
})

app.get('/api/appointments/slots', async (req, res) => {
  const date = String(req.query.date || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad(res, 400, 'Date invalide.')
  const slots = ['08:30', '10:00', '11:30', '14:00', '15:30', '17:00']
  const taken = await listAppointments({ from: date, to: date })
  const busy = new Set(
    taken.filter((a) => a.status !== 'cancelled').map((a) => a.time),
  )
  res.json({
    ok: true,
    date,
    slots: slots.map((time) => ({ time, taken: busy.has(time) })),
  })
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
try {
  const db = await initDb()
  console.log(`[db] ready ${db.databaseUrl}`)
} catch (err) {
  console.error('[db] init failed — file store only', err?.message || err)
}
try {
  const imp = await importOutboxOnce()
  console.log(`[messenger] ready (imported ${imp.imported}, total ${imp.total})`)
} catch (err) {
  console.error('[messenger] init failed', err?.message || err)
}
await restoreJobs()

app.listen(PORT, () => {
  console.log(`JAC automation server on http://127.0.0.1:${PORT}`)
  console.log(`Messaging: ${whatsappStatus().mode} → /messagerie`)
  console.log(`PDF delay: ${PDF_DELAY_MS}ms`)
  console.log(`n8n webhooks: ${n8nStatus().webhookBase}`)
  console.log(`Data dir: ${DATA_DIR}`)
})
