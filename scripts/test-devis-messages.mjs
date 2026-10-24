/**
 * Automated professional devis message tests + sample output.
 * Run: node scripts/test-devis-messages.mjs
 *
 * Note: WhatsApp cannot be sent server-side without Business API.
 * This validates message quality and prints wa.me URLs ready to open.
 */

import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'

const CONTACT = {
  whatsappE164: '21699757218',
  whatsappDisplay: '+216 99 757 218',
  siteUrl: 'https://jacmotors-two.vercel.app',
}

const QUOTE = {
  'T8 PRO': {
    priceFromDt: 105_000,
    priceLabel: '105 000 DT',
    version: 'Double Cabine · 2.0 L CTI Diesel · 4×4',
    drive: 'RWD / 4WD · boîte 6MT',
    engine: '2.0 CTI Diesel · 139 ch · 320 Nm',
    highlights: [
      'Design Rome Shield · jantes 18″',
      'Phares xénon + LED DRL',
      'Sellerie cuir · écran 7″',
      'Caméra de recul / 360° HD',
      'ESP Bosch · airbags · TPMS',
    ],
    specs: [
      'Dimensions : 5325 × 1880 × 1830 mm',
      'Empattement : 3090 mm',
      'Bennette : 1520 × 1520 × 470 mm',
      'Pneus : 265/60 R18',
      'Réservoir : 76 L',
    ],
    included: [
      'Prix catalogue indicatif véhicule neuf',
      'Garantie constructeur selon conditions JAC Tunisie',
      'Présentation / essai showroom sur RDV',
      'Étude financement possible (selon profil)',
    ],
    financingExamples: [
      { apportPct: 30, durationMonths: 48, monthlyFromDt: 1_620 },
      { apportPct: 40, durationMonths: 60, monthlyFromDt: 1_180 },
    ],
  },
  T8: {
    priceFromDt: 95_000,
    priceLabel: 'à partir de 95 000 DT',
    version: 'Pickup double cabine',
    drive: '4×2 / 4×4 (selon version)',
    engine: 'Motorisation selon configuration Tunisie',
    highlights: ['Double cabine', 'Versions 4×2 et 4×4'],
    specs: ['Carrosserie : pickup double cabine'],
    included: ['Garantie constructeur selon conditions JAC Tunisie'],
    financingExamples: [
      { apportPct: 30, durationMonths: 48, monthlyFromDt: 1_450 },
    ],
  },
}

function formatDt(amount) {
  return `${amount.toLocaleString('fr-TN')} DT`
}

function buildReply(input) {
  const q = QUOTE[input.modele]
  const firstName = input.nom.trim().split(/\s+/)[0]
  const financing = /financ/i.test(input.besoin)
  let section = 1
  const lines = [
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    '*DEVIS PROFESSIONNEL*',
    'Réf. : *DEV-TEST-001*',
    'Date : 24 octobre 2026',
    '',
    `Bonjour *${firstName}*,`,
    '',
    `Merci pour votre demande. Voici votre *devis indicatif complet* pour le *JAC ${input.modele}* :`,
    '',
    `*${section++}) Véhicule*`,
    '• Marque : JAC Motors',
    `• Modèle : *JAC ${input.modele}*`,
    `• Version : ${q.version}`,
    `• Transmission : ${q.drive}`,
    `• Motorisation : ${q.engine}`,
    '• État : Véhicule neuf',
    '',
    `*${section++}) Prix Tunisie*`,
    `• Prix catalogue : *${q.priceLabel}*`,
    `• Montant de référence : *${formatDt(q.priceFromDt)}*`,
    '• Devise : Dinars tunisiens (DT)',
    '• Hors options / accessoires / frais éventuels',
    '',
    `*${section++}) Inclus dans l’offre*`,
    ...q.included.map((h) => `• ${h}`),
    '',
    `*${section++}) Points forts*`,
    ...q.highlights.map((h) => `• ${h}`),
    '',
    `*${section++}) Caractéristiques techniques*`,
    ...q.specs.map((s) => `• ${s}`),
    '',
    `*${section++}) Votre dossier*`,
    `• Showroom : ${input.showroom}`,
    `• Besoin : ${input.besoin}`,
    `• Téléphone : ${input.telephone}`,
    `• Client : ${input.nom}`,
  ]
  if (financing) {
    lines.push(
      '',
      `*${section++}) Financement (exemples indicatifs)*`,
      `• Prix de référence : *${formatDt(q.priceFromDt)}*`,
      ...q.financingExamples.map(
        (ex) =>
          `• Ex. apport ~${ex.apportPct}% · ${ex.durationMonths} mois → *~${formatDt(ex.monthlyFromDt)}/mois*`,
      ),
      '• Étude de dossier personnalisée en showroom',
      '• Apport, durée et mensualité selon profil & organisme',
    )
  }
  lines.push(
    '',
    `*${section++}) Prochaines étapes*`,
    '1. Confirmer ce devis avec un conseiller JAC',
    '2. Réserver une visite showroom ou un Google Meet',
    '3. Choisir options / couleur / équipements',
    '4. Finaliser commande ou financement en showroom',
    '',
    `• Site : ${CONTACT.siteUrl}`,
    `• Demande devis : ${CONTACT.siteUrl}/devis`,
    '',
    '*Validité* : 7 jours',
    '*Mention* : devis indicatif, non contractuel — prix, options et stock à confirmer en showroom.',
    '',
    '*JAC Motors Tunisie*',
    `WhatsApp : ${CONTACT.whatsappDisplay}`,
  )
  return lines.join('\n')
}

function buildRequest(input) {
  const q = QUOTE[input.modele]
  return [
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    '*DEMANDE DE DEVIS*',
    '',
    'Bonjour JAC Motors Tunisie,',
    'Je souhaite recevoir un *devis détaillé avec prix* :',
    '',
    '*Client*',
    `• Nom : ${input.nom}`,
    `• Téléphone : ${input.telephone}`,
    `• Showroom : ${input.showroom}`,
    `• Besoin : ${input.besoin}`,
    '',
    '*Véhicule demandé*',
    `• Modèle : *JAC ${input.modele}*`,
    `• Version : ${q.version}`,
    `• Prix catalogue indicatif : *${q.priceLabel}*`,
    '',
    'Merci de me renvoyer le devis complet (prix, options, disponibilité, financement).',
  ].join('\n')
}

const sample = {
  modele: 'T8 PRO',
  showroom: 'SHOWROOM CLH MOTORS',
  nom: 'Youssef dhib',
  telephone: '+21699757218',
  besoin: 'Devis + financement',
}

const reply = buildReply(sample)
const request = buildRequest(sample)
const requestUrl = `https://wa.me/${CONTACT.whatsappE164}?text=${encodeURIComponent(request)}`
const replyUrl = `https://wa.me/21699757218?text=${encodeURIComponent(reply)}`

let passed = 0
function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`✓ ${name}`)
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`)
    process.exitCode = 1
  }
}

test('includes price 105 000 DT', () => {
  assert.match(reply, /105 000 DT/)
  assert.match(request, /105 000 DT/)
})
test('includes financing section with monthly examples', () => {
  assert.match(reply, /Financement/)
  assert.match(reply, /mensualité/)
  assert.match(reply, /1[\s\u202f]?620/)
  assert.match(reply, /\/mois/)
})
test('includes vehicle version and engine', () => {
  assert.match(reply, /2\.0 L CTI Diesel/)
  assert.match(reply, /320 Nm/)
})
test('includes professional sections', () => {
  assert.match(reply, /DEVIS PROFESSIONNEL/)
  assert.match(reply, /Prix Tunisie/)
  assert.match(reply, /Inclus dans/)
  assert.match(reply, /Points forts/)
  assert.match(reply, /Caractéristiques techniques/)
  assert.match(reply, /Prochaines étapes/)
  assert.match(reply, /Validité/)
})
test('uses WhatsApp bold markers', () => {
  assert.match(reply, /\*JAC MOTORS TUNISIE\*/)
  assert.match(reply, /\*Youssef\*/)
  assert.match(reply, /\*105 000 DT\*/)
})
test('targets client number in reply URL', () => {
  assert.ok(replyUrl.startsWith('https://wa.me/21699757218?text='))
  assert.ok(decodeURIComponent(replyUrl).includes('105 000 DT'))
})
test('request URL targets dealer inbox with price', () => {
  assert.ok(requestUrl.startsWith(`https://wa.me/${CONTACT.whatsappE164}?text=`))
  assert.ok(decodeURIComponent(requestUrl).includes('105 000 DT'))
})
test('reply is substantially richer than old thin message', () => {
  assert.ok(reply.length > 900, `expected long devis, got ${reply.length}`)
  assert.ok(!reply.includes('En attendant, vous pouvez aussi'))
})

mkdirSync('/opt/cursor/artifacts', { recursive: true })
writeFileSync('/opt/cursor/artifacts/sample-devis-reply.txt', reply)
writeFileSync('/opt/cursor/artifacts/sample-devis-request.txt', request)
writeFileSync('/opt/cursor/artifacts/sample-devis-urls.txt', [
  'REQUEST (client → dealer):',
  requestUrl,
  '',
  'REPLY (dealer → client):',
  replyUrl,
  '',
  'Full texts: sample-devis-reply.txt / sample-devis-request.txt',
].join('\n'))

console.log(`\n${passed} devis message tests passed`)
console.log('\n—— SAMPLE DEVIS REPLY ——\n')
console.log(reply)
console.log('\n—— END ——')
console.log('\nNote: Real WhatsApp delivery still requires tapping Send in WhatsApp (or WhatsApp Business API).')
console.log('Artifacts: /opt/cursor/artifacts/sample-devis-reply.txt')
console.log('Open reply URL to prefill WhatsApp:')
console.log(replyUrl.slice(0, 100) + '...')
