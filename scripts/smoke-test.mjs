/**
 * Smoke tests for WhatsApp + visit calendar logic (no browser).
 * Run: node scripts/smoke-test.mjs
 */

import assert from 'node:assert/strict'

const CONTACT = {
  whatsappE164: '21699757218',
  whatsappLabel: '99 757 218',
}

function waUrl(lines, to = CONTACT.whatsappE164) {
  const text = encodeURIComponent(lines.filter(Boolean).join('\n'))
  return `https://wa.me/${to}?text=${text}`
}

function meetUrlFromId(id) {
  const raw = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().padEnd(12, 'x')
  return `https://meet.google.com/${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 10)}`
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

test('Dealer inbox number is personal WhatsApp', () => {
  assert.equal(CONTACT.whatsappE164, '21699757218')
})

test('Visit Meet WhatsApp includes Meet link', () => {
  const id = 'VISITE-20261024-MEET01'
  const meetUrl = meetUrlFromId(id)
  const url = waUrl([
    '*DEMANDE GOOGLE MEET — SHOWROOM*',
    `• Réf. : *${id}*`,
    `• Lien Meet proposé : ${meetUrl}`,
  ])
  const text = decodeURIComponent(url.split('text=')[1])
  assert.match(text, /GOOGLE MEET/)
  assert.ok(text.includes(meetUrl))
})

test('Meet URL is stable for same visit id', () => {
  const a = meetUrlFromId('VISITE-111')
  const b = meetUrlFromId('VISITE-111')
  assert.equal(a, b)
})

test('Calendar slots: booking blocks availability', () => {
  assert.equal(VISIT_SLOTS.length, 5)
  book('clh', '2026-10-27', '10:00')
  assert.equal(isTaken('clh', '2026-10-27', '10:00'), true)
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

console.log(`\n${passed} smoke tests passed`)
