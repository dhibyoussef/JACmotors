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
