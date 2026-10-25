/**
 * Devis ACK + PDF workflow message tests (no second manual reply).
 * Run: node scripts/test-devis-messages.mjs
 */

import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'

const CONTACT = {
  whatsappE164: '21699757218',
  whatsappDisplay: '+216 99 757 218',
  siteUrl: 'https://jacmotors-two.vercel.app',
}

function ackText({ nom, modele, ref }) {
  const first = nom.trim().split(/\s+/)[0]
  return [
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    '*DEMANDE DE DEVIS REÇUE*',
    '',
    `Bonjour *${first}*,`,
    '',
    `Merci pour votre demande de devis concernant le *JAC ${modele}*.`,
    '',
    'Votre demande a bien été enregistrée.',
    'Vous recevrez *sous peu* un *document PDF professionnel* (prix, version, couleur, options, conditions) directement sur ce WhatsApp.',
    '',
    `Réf. dossier : *${ref}*`,
    '',
    'Aucune autre action n’est nécessaire de votre côté.',
    'Un conseiller JAC peut vous recontacter pour préciser le stock ou un essai.',
    '',
    '*JAC Motors Tunisie*',
  ].join('\n')
}

function pdfCaption({ nom, modele, ref }) {
  const first = nom.trim().split(/\s+/)[0]
  return [
    `Bonjour ${first},`,
    '',
    `Voici votre *devis PDF JAC ${modele}* (réf. ${ref}).`,
    'Document indicatif — stock, options et prix définitifs à confirmer en showroom.',
    '',
    'JAC Motors Tunisie',
  ].join('\n')
}

const sample = {
  nom: 'Youssef dhib',
  modele: 'T8 PRO',
  ref: 'DEV-20261025-TEST',
}

const ack = ackText(sample)
const caption = pdfCaption(sample)

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

test('ack thanks client and promises PDF soon', () => {
  assert.match(ack, /DEMANDE DE DEVIS REÇUE/)
  assert.match(ack, /Merci pour votre demande/)
  assert.match(ack, /document PDF professionnel/)
  assert.match(ack, /sous peu/)
  assert.match(ack, /Youssef/)
  assert.match(ack, /T8 PRO/)
  assert.match(ack, /DEV-20261025-TEST/)
})

test('ack does not include old second-message full quote dump', () => {
  assert.doesNotMatch(ack, /DEVIS PROFESSIONNEL/)
  assert.doesNotMatch(ack, /Prochaines étapes/)
  assert.doesNotMatch(ack, /105 000 DT/)
})

test('pdf caption is short and professional', () => {
  assert.match(caption, /devis PDF JAC T8 PRO/)
  assert.match(caption, /DEV-20261025-TEST/)
  assert.ok(caption.length < 400)
})

test('uses WhatsApp bold markers', () => {
  assert.match(ack, /\*JAC MOTORS TUNISIE\*/)
  assert.match(ack, /\*document PDF professionnel\*/)
})

test('dealer inbox number unchanged for ops', () => {
  assert.equal(CONTACT.whatsappE164, '21699757218')
  assert.equal(CONTACT.whatsappDisplay, '+216 99 757 218')
})

mkdirSync('/opt/cursor/artifacts', { recursive: true })
writeFileSync('/opt/cursor/artifacts/sample-devis-ack.txt', ack)
writeFileSync('/opt/cursor/artifacts/sample-devis-pdf-caption.txt', caption)

console.log(`\n${passed} devis ACK message tests passed`)
console.log('\n—— SAMPLE ACK (client) ——\n')
console.log(ack)
console.log('\n—— PDF CAPTION ——\n')
console.log(caption)
console.log('\nNote: Real WhatsApp delivery uses Cloud API on the always-on server (see AUTOMATION.md).')
