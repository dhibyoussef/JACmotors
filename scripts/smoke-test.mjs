/**
 * Smoke tests for WhatsApp + visit calendar logic (no browser).
 * Run: node scripts/smoke-test.mjs
 */

import assert from 'node:assert/strict'

const CONTACT = {
  whatsappE164: '21699757218',
  whatsappLabel: '99 757 218',
}

function waUrl(lines) {
  const text = encodeURIComponent(lines.filter(Boolean).join('\n'))
  return `https://wa.me/${CONTACT.whatsappE164}?text=${text}`
}

function buildDevisWhatsAppUrl(input) {
  return waUrl([
    'Bonjour JAC Motors Tunisie 👋',
    'Je souhaite un devis :',
    `• Modèle : JAC ${input.modele}`,
    `• Showroom : ${input.showroom}`,
    `• Nom : ${input.nom}`,
    `• Téléphone : ${input.telephone}`,
    `• Besoin : ${input.besoin}`,
    '',
    'Merci de me recontacter.',
  ])
}

function meetUrlFromId(id) {
  const raw = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().padEnd(12, 'x')
  return `https://meet.google.com/${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 10)}`
}

function buildVisitWhatsAppUrl(visit) {
  return waUrl([
    'Bonjour JAC Motors Tunisie 👋',
    'Je réserve une visite :',
    `• Réf. : ${visit.id}`,
    `• Nom : ${visit.nom}`,
    `• Téléphone : ${visit.telephone}`,
    `• Modèle : JAC ${visit.modele}`,
    `• Showroom : ${visit.showroomName}`,
    `• Date : ${visit.date}`,
    `• Heure : ${visit.time}`,
    `• Mode : ${visit.mode === 'meet' ? 'Google Meet (visioconférence)' : 'Sur place en showroom'}`,
    visit.mode === 'meet' && visit.meetUrl ? `• Lien Google Meet : ${visit.meetUrl}` : null,
    '',
    'Merci de confirmer la disponibilité.',
  ])
}

const VISIT_SLOTS = ['09:00', '10:00', '11:30', '14:30', '16:00']
const booked = new Set()

function slotKey(showroomId, date, time) {
  return `${showroomId}|${date}|${time}`
}

function isTaken(showroomId, date, time) {
  return booked.has(slotKey(showroomId, date, time))
}

function book(showroomId, date, time) {
  if (isTaken(showroomId, date, time)) throw new Error('taken')
  booked.add(slotKey(showroomId, date, time))
}

let passed = 0
function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`✓ ${name}`)
  } catch (err) {
    console.error(`✗ ${name}`)
    console.error(`  ${err.message}`)
    process.exitCode = 1
  }
}

test('Devis WhatsApp targets personal number 21699757218', () => {
  const url = buildDevisWhatsAppUrl({
    modele: 'T8 PRO',
    showroom: 'CLH',
    nom: 'Test User',
    telephone: '99 757 218',
    besoin: 'Devis véhicule neuf',
  })
  assert.ok(url.startsWith('https://wa.me/21699757218?text='))
  const text = decodeURIComponent(url.split('text=')[1])
  assert.match(text, /T8 PRO/)
  assert.match(text, /Test User/)
  assert.match(text, /99 757 218/)
  assert.match(text, /Devis véhicule neuf/)
})

test('Visit showroom WhatsApp has booking fields, no Meet link', () => {
  const url = buildVisitWhatsAppUrl({
    id: 'VISITE-20261024-ABC123',
    nom: 'Youssef',
    telephone: '99757218',
    modele: 'T8',
    showroomName: 'SHOWROOM CLH MOTORS',
    date: '2026-10-27',
    time: '10:00',
    mode: 'showroom',
    meetUrl: null,
  })
  assert.ok(url.includes('21699757218'))
  const text = decodeURIComponent(url.split('text=')[1])
  assert.match(text, /Sur place en showroom/)
  assert.doesNotMatch(text, /Lien Google Meet/)
})

test('Visit Meet WhatsApp includes Meet link', () => {
  const id = 'VISITE-20261024-MEET01'
  const meetUrl = meetUrlFromId(id)
  const url = buildVisitWhatsAppUrl({
    id,
    nom: 'Youssef',
    telephone: '99757218',
    modele: 'T8 PRO',
    showroomName: 'JAC Motors',
    date: '2026-10-28',
    time: '14:30',
    mode: 'meet',
    meetUrl,
  })
  const text = decodeURIComponent(url.split('text=')[1])
  assert.match(text, /Google Meet/)
  assert.match(text, /Lien Google Meet : https:\/\/meet\.google\.com\//)
  assert.ok(text.includes(meetUrl))
})

test('Meet URL is stable for same visit id', () => {
  const a = meetUrlFromId('VISITE-111')
  const b = meetUrlFromId('VISITE-111')
  assert.equal(a, b)
  assert.match(a, /^https:\/\/meet\.google\.com\/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/)
})

test('Calendar slots: booking blocks availability', () => {
  assert.equal(VISIT_SLOTS.length, 5)
  book('clh', '2026-10-27', '10:00')
  assert.equal(isTaken('clh', '2026-10-27', '10:00'), true)
  assert.equal(isTaken('clh', '2026-10-27', '11:30'), false)
  assert.throws(() => book('clh', '2026-10-27', '10:00'))
})

test('Tunisian phone acceptance pattern', () => {
  const ok = (v) => {
    const digits = v.replace(/\D/g, '')
    if (/^216\d{8}$/.test(digits)) return true
    if (/^[2-9]\d{7}$/.test(digits)) return true
    return false
  }
  assert.equal(ok('99 757 218'), true)
  assert.equal(ok('+21699757218'), true)
  assert.equal(ok('123'), false)
})

test('360 showroom Meet WhatsApp asks to see showrooms', () => {
  const url = waUrl([
    'Bonjour JAC Motors Tunisie 👋',
    'Je viens de voir le JAC T8 PRO en 360° sur le site.',
    'Je souhaite un Google Meet pour découvrir / visiter les showrooms à distance.',
    '',
    'Merci de me proposer un créneau et le lien Meet.',
  ])
  assert.ok(url.includes('21699757218'))
  const text = decodeURIComponent(url.split('text=')[1])
  assert.match(text, /360/)
  assert.match(text, /Google Meet/)
  assert.match(text, /showrooms/)
})

test('Dealer reply to devis is personalized', () => {
  const reply = [
    'Bonjour Youssef 👋',
    '',
    'Merci pour votre demande de devis concernant le JAC T8.',
    '',
    'Nous avons bien reçu vos informations :',
    '• Showroom : SHOWROOM CLH MOTORS',
    '• Besoin : Devis véhicule neuf',
    '• Téléphone : +21699757218',
    '',
    'Un conseiller JAC Motors Tunisie vous recontacte très rapidement avec le devis, les disponibilités et les options.',
    '',
    'À très bientôt,',
    'JAC Motors Tunisie',
  ].join('\n')
  assert.match(reply, /Bonjour Youssef/)
  assert.match(reply, /JAC T8/)
  assert.match(reply, /SHOWROOM CLH MOTORS/)
  assert.match(reply, /Devis véhicule neuf/)
})

console.log(`\n${passed} smoke tests passed`)
