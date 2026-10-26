/**
 * Demo seed — realistic Tunisie data so admin + workflows look fully alive.
 * Creates staff, clients, devis PDFs per model/color, visite/Meet/360, checkups.
 */
import { toE164, PAINT_COLORS, QUOTE_OPTIONS } from './catalog.mjs'
import {
  dealerLeadText,
  devisAckText,
  devisPdfCaption,
  enrichDevisLead,
  visitAckText,
} from './messages.mjs'
import { buildDevisPdf } from './pdf.mjs'
import { enqueueJob } from './queue.mjs'
import { newId, PDF_DIR, saveLead } from './store.mjs'
import {
  createAppointment,
  dashboardStats,
  ensureStaffRoles,
  upsertClient,
} from './db.mjs'
import { sendDocumentMessage, sendTextMessage } from './whatsapp.mjs'

const DEALER_E164 = (process.env.WHATSAPP_DEALER_E164 || '21699757218').replace(/\D/g, '')
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:8787'

const CLIENTS = [
  {
    nom: 'Youssef Ben Ali',
    telephone: '98 100 201',
    email: 'youssef.benali@demo.tn',
    modele: 'T8 PRO',
    matricule: '185 TU 4521',
    notes: 'Intéressé financement · suivi devis',
  },
  {
    nom: 'Amira Trabelsi',
    telephone: '97 220 330',
    email: 'amira.t@demo.tn',
    modele: 'T8',
    matricule: '210 TU 7788',
    notes: 'Client SAV atelier El Mghira',
  },
  {
    nom: 'Karim Gharbi',
    telephone: '55 441 122',
    email: 'karim.gharbi@demo.tn',
    modele: 'T8 PRO',
    matricule: '123 TU 4567',
    notes: 'Essai effectué · en attente devis final',
  },
  {
    nom: 'Sara Mansouri',
    telephone: '22 334 455',
    email: 'sara.m@demo.tn',
    modele: 'T8 PRO',
    matricule: '456 TU 8899',
    notes: 'Google Meet prévu',
  },
  {
    nom: 'Hedi Jebali',
    telephone: '50 512 877',
    email: 'hedi.j@demo.tn',
    modele: 'T8',
    matricule: '301 TU 1200',
    notes: 'Check-up freinage',
  },
  {
    nom: 'Nour Belhaj',
    telephone: '58 554 765',
    email: 'nour.b@demo.tn',
    modele: 'T8 PRO',
    matricule: '177 TU 3344',
    notes: 'Vue 360° · rappel commercial',
  },
  {
    nom: 'Mehdi Karray',
    telephone: '29 402 200',
    email: 'mehdi.k@demo.tn',
    modele: 'T8',
    matricule: '512 TU 6677',
    notes: 'Entretien 10 000 km',
  },
  {
    nom: 'Lina Bouaziz',
    telephone: '79 731 328',
    email: 'lina.b@demo.tn',
    modele: 'T8 PRO',
    matricule: '640 TU 9911',
    notes: 'Devis couleur Rouge JAC',
  },
]

function nextDate(offsetDays, hourLabel) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  while (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return {
    date: d.toISOString().slice(0, 10),
    time: hourLabel,
  }
}

async function seedDevisForSelection({
  nom,
  telephone,
  modele,
  couleurId,
  optionIds,
  showroom,
  besoin,
  sendPdfNow = true,
}) {
  const ref = newId('DEV')
  const enriched = enrichDevisLead(
    {
      modele,
      showroom,
      nom,
      telephone,
      besoin,
      couleurId,
      optionIds,
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
    status: sendPdfNow ? 'pdf_sent' : 'ack_sent',
  }
  await saveLead(lead)
  await sendTextMessage(client, devisAckText(lead))
  await sendTextMessage(DEALER_E164, dealerLeadText(lead))
  if (sendPdfNow) {
    await sendDocumentMessage(client, filePath, {
      fileName,
      caption: devisPdfCaption(lead),
    })
  } else {
    await enqueueJob({
      id: `JOB-${ref}`,
      type: 'send_devis_pdf',
      status: 'pending',
      runAt: new Date(Date.now() + 8_000).toISOString(),
      createdAt: new Date().toISOString(),
      payload: { lead, filePath, fileName },
    })
  }
  return lead
}

async function seedVisite(input) {
  const ref = newId(input.mode === 'meet' ? 'MEET' : input.mode === 'essai' ? 'ESSAI' : 'VISITE')
  const meetUrl =
    input.mode === 'meet'
      ? `https://meet.google.com/jac-${ref.slice(-6).toLowerCase()}`
      : null
  const lead = {
    id: ref,
    type: input.mode === 'meet' ? 'meet' : input.mode === 'essai' ? 'essai' : 'visite',
    nom: input.nom,
    telephone: input.telephone,
    email: input.email || '',
    modele: input.modele,
    showroom: input.showroom,
    date: input.date,
    time: input.time,
    mode: input.mode,
    meetUrl,
    createdAt: new Date().toISOString(),
    status: 'ack_sent',
  }
  await saveLead(lead)
  await sendTextMessage(
    toE164(input.telephone),
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
  return lead
}

async function seedInterest(input) {
  const ref = newId('INT')
  const lead = {
    id: ref,
    type: '360',
    nom: input.nom,
    telephone: input.telephone,
    modele: input.modele,
    showroom: input.showroom || '',
    createdAt: new Date().toISOString(),
    status: 'ack_sent',
  }
  await saveLead(lead)
  const first = input.nom.split(/\s+/)[0]
  await sendTextMessage(
    toE164(input.telephone),
    [
      '*JAC MOTORS TUNISIE*',
      '────────────────',
      '*DEMANDE REÇUE*',
      '',
      `Bonjour *${first}*,`,
      '',
      `Merci pour votre intérêt après la vue 360° du *JAC ${input.modele}*.`,
      'Un conseiller vous recontacte sous peu pour un Google Meet ou une visite showroom.',
      '',
      `Réf. : *${ref}*`,
      '',
      '*JAC Motors Tunisie*',
    ].join('\n'),
  )
  await sendTextMessage(DEALER_E164, dealerLeadText(lead))
  return lead
}

export async function seedDemo({ force = false } = {}) {
  const staff = await ensureStaffRoles()
  const clients = []
  for (const c of CLIENTS) {
    clients.push(await upsertClient(c))
  }

  // Devis PDF for each model × each color (and a few option packs)
  const devis = []
  const optionPacks = [
    [],
    ['couvre-benne'],
    ['barres', 'tapis'],
    ['alarme', 'couvre-benne'],
    QUOTE_OPTIONS.map((o) => o.id),
  ]
  const showrooms = ['CLH Motors', 'Immeuble Etraton', 'Showroom Ben Arous', 'Atelier El Mghira']
  let i = 0
  for (const modele of ['T8', 'T8 PRO']) {
    for (const color of PAINT_COLORS) {
      const client = CLIENTS[i % CLIENTS.length]
      const options = optionPacks[i % optionPacks.length]
      const lead = await seedDevisForSelection({
        nom: client.nom,
        telephone: client.telephone,
        modele,
        couleurId: color.id,
        optionIds: options,
        showroom: showrooms[i % showrooms.length],
        besoin: i % 2 === 0 ? 'Devis véhicule neuf' : 'Devis + financement',
        sendPdfNow: true,
      })
      devis.push({
        id: lead.id,
        modele,
        couleur: color.name,
        options: options.length,
        pdfUrl: lead.pdfUrl,
      })
      i += 1
    }
  }

  // One pending delayed PDF job (shows in File WhatsApp)
  const pendingClient = CLIENTS[0]
  const pending = await seedDevisForSelection({
    nom: pendingClient.nom,
    telephone: pendingClient.telephone,
    modele: 'T8 PRO',
    couleurId: 'rouge',
    optionIds: ['couvre-benne', 'alarme'],
    showroom: 'CLH Motors',
    besoin: 'Devis véhicule neuf',
    sendPdfNow: false,
  })

  const d1 = nextDate(1, '10:00')
  const d2 = nextDate(2, '14:00')
  const d3 = nextDate(3, '11:30')
  const d4 = nextDate(4, '15:30')
  const d5 = nextDate(5, '08:30')

  const visites = [
    await seedVisite({
      nom: 'Sara Mansouri',
      telephone: '22 334 455',
      email: 'sara.m@demo.tn',
      modele: 'T8 PRO',
      showroom: 'CLH Motors',
      mode: 'meet',
      ...d1,
    }),
    await seedVisite({
      nom: 'Karim Gharbi',
      telephone: '55 441 122',
      modele: 'T8 PRO',
      showroom: 'Immeuble Etraton',
      mode: 'essai',
      ...d2,
    }),
    await seedVisite({
      nom: 'Youssef Ben Ali',
      telephone: '98 100 201',
      modele: 'T8',
      showroom: 'Showroom Ben Arous',
      mode: 'showroom',
      ...d3,
    }),
  ]

  const interests = [
    await seedInterest({
      nom: 'Nour Belhaj',
      telephone: '58 554 765',
      modele: 'T8 PRO',
      showroom: '360 homepage',
    }),
    await seedInterest({
      nom: 'Lina Bouaziz',
      telephone: '79 731 328',
      modele: 'T8',
      showroom: '360 modèles',
    }),
  ]

  const appointments = []
  const rdvSpecs = [
    {
      nom: 'Amira Trabelsi',
      telephone: '97 220 330',
      modele: 'T8',
      matricule: '210 TU 7788',
      type: 'checkup',
      showroom: 'Atelier El Mghira',
      status: 'confirmed',
      notes: 'Freinage + diagnostic',
      ...d1,
    },
    {
      nom: 'Hedi Jebali',
      telephone: '50 512 877',
      modele: 'T8',
      matricule: '301 TU 1200',
      type: 'entretien',
      showroom: 'Atelier El Mghira',
      status: 'pending',
      notes: 'Vidange 10 000 km',
      ...d2,
    },
    {
      nom: 'Mehdi Karray',
      telephone: '29 402 200',
      modele: 'T8',
      matricule: '512 TU 6677',
      type: 'diagnostic',
      showroom: 'Atelier El Mghira',
      status: 'confirmed',
      notes: 'Voyant moteur',
      ...d4,
    },
    {
      nom: 'Karim Gharbi',
      telephone: '55 441 122',
      modele: 'T8 PRO',
      matricule: '123 TU 4567',
      type: 'checkup',
      showroom: 'Atelier El Mghira',
      status: 'pending',
      notes: 'Check-up complet avant reprise',
      ...d5,
    },
  ]

  for (const spec of rdvSpecs) {
    try {
      const a = await createAppointment(spec)
      // align status if create defaults to pending
      if (spec.status && spec.status !== a.status) {
        const { updateAppointmentStatus } = await import('./db.mjs')
        appointments.push(await updateAppointmentStatus(a.id, spec.status))
      } else {
        appointments.push(a)
      }
      await sendTextMessage(
        toE164(spec.telephone),
        [
          '*JAC MOTORS TUNISIE*',
          '────────────────',
          '*RDV ATELIER / CHECK-UP*',
          '',
          `Bonjour *${spec.nom.split(/\s+/)[0]}*,`,
          '',
          'Votre demande de rendez-vous est enregistrée :',
          `• Réf. : *${appointments.at(-1).id}*`,
          `• Date : *${spec.date}*`,
          `• Heure : *${spec.time}*`,
          `• Matricule : ${spec.matricule}`,
          '',
          'Un conseiller confirmera sous peu.',
          '',
          '*JAC Motors Tunisie*',
        ].join('\n'),
      )
    } catch (err) {
      // slot may already exist from prior seed — ignore unique conflicts
      if (!/unique|duplicate/i.test(String(err?.message || err))) throw err
    }
  }

  const stats = await dashboardStats()
  return {
    force,
    staff: staff.map((u) => ({ email: u.email, role: u.role, nom: u.nom })),
    clients: clients.length,
    devisPdfs: devis.length,
    devisSample: devis.slice(0, 4),
    pendingPdfJob: pending.id,
    visites: visites.map((v) => ({ id: v.id, mode: v.mode, meetUrl: v.meetUrl || null })),
    interests: interests.map((x) => x.id),
    appointments: appointments.length,
    stats,
    logins: [
      { role: 'admin', email: 'admin@jacmotors.tn', password: 'JacMotors2026!' },
      { role: 'sub_admin', email: 'subadmin@jacmotors.tn', password: 'JacMotors2026!' },
      { role: 'under_admin', email: 'underadmin@jacmotors.tn', password: 'JacMotors2026!' },
    ],
  }
}
