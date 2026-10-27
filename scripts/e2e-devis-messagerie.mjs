import puppeteer from 'puppeteer-core'
import fs from 'fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1'
const outDir = '/opt/cursor/artifacts/screenshots'
fs.mkdirSync(outDir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1100'],
  defaultViewport: { width: 1440, height: 1100 },
})

const page = await browser.newPage()
const phone = '99 757 218'
const uniqueName = `Youssef Flow ${Date.now().toString().slice(-4)}`

async function setField(spanText, value) {
  const handle = await page.evaluateHandle(
    (spanText) => {
      const spans = [...document.querySelectorAll('label.field span, .field > span')]
      const span = spans.find((s) => (s.textContent || '').trim() === spanText)
      return span?.parentElement?.querySelector('input, select, textarea') || null
    },
    spanText,
  )
  const el = handle.asElement()
  if (!el) throw new Error(`field not found: ${spanText}`)
  await el.click({ clickCount: 3 })
  await el.type(value, { delay: 15 })
}

console.log('1) open /devis')
await page.goto(`${BASE}/devis`, { waitUntil: 'networkidle0', timeout: 60000 })
await page.waitForSelector('form.panel--form', { timeout: 20000 })
await setField('Nom', uniqueName)
await setField('WhatsApp (Tunisie)', phone)
await page.screenshot({ path: `${outDir}/flow-devis-form.png` })

console.log('2) submit devis')
await Promise.all([
  page.click('button.btn--whatsapp[type="submit"]'),
  page.waitForFunction(
    () => /Merci|ouverture de votre messagerie|messagerie/i.test(document.body.innerText || ''),
    { timeout: 25000 },
  ),
])
await page.screenshot({ path: `${outDir}/flow-devis-success.png` })

console.log('3) wait redirect to /messagerie')
await page.waitForFunction(() => location.pathname.includes('/messagerie'), {
  timeout: 15000,
})
await page.waitForSelector('.wa-chat', { timeout: 20000 })
await new Promise((r) => setTimeout(r, 1200))
await page.screenshot({ path: `${outDir}/flow-messagerie-ack.png` })

const before = await page.evaluate(() => ({
  url: location.href,
  bubbles: document.querySelectorAll('.wa-bubble').length,
  hasStrong: !!document.querySelector('.wa-bubble__text strong'),
  hasRaw: /\*JAC MOTORS|\*DEMANDE/.test(document.body.innerText || ''),
  awaiting: /PDF professionnel arrive|en train d’écrire/i.test(document.body.innerText || ''),
  sample: (document.querySelectorAll('.wa-bubble__text')[
    document.querySelectorAll('.wa-bubble__text').length - 1
  ]?.innerText || '').slice(0, 180),
}))
console.log('ack state', before)

const ref = new URL(before.url).searchParams.get('ref') || ''
console.log('4) wait for PDF for', ref)
const pdfReady = await page
  .waitForFunction(
    (ref) =>
      [...document.querySelectorAll('.wa-bubble--doc, .wa-doc')].some((el) =>
        (el.textContent || '').includes(ref),
      ) ||
      [...document.querySelectorAll('.wa-bubble')].some(
        (el) =>
          (el.textContent || '').includes(ref) &&
          ((el.textContent || '').includes('devis.pdf') ||
            el.querySelector('.wa-doc')),
      ),
    { timeout: 30000 },
    ref,
  )
  .then(() => true)
  .catch(() => false)

await new Promise((r) => setTimeout(r, 1000))
await page.screenshot({ path: `${outDir}/flow-messagerie-pdf.png` })

const after = await page.evaluate((ref) => ({
  bubbles: document.querySelectorAll('.wa-bubble').length,
  docs: document.querySelectorAll('.wa-doc').length,
  hasRaw: /\*JAC MOTORS|\*DEMANDE/.test(document.body.innerText || ''),
  banner: (document.querySelector('.wa-banner')?.innerText || '').slice(0, 180),
  awaitingGone: !/PDF professionnel arrive|en train d’écrire/i.test(
    document.body.innerText || '',
  ),
  focusedDoc: [...document.querySelectorAll('.wa-doc__meta strong')]
    .map((n) => n.textContent || '')
    .find((t) => t.includes(ref)) || '',
}), ref)
console.log('pdf state', { pdfReady, ...after })

if (!before.bubbles || before.hasRaw || !before.hasStrong) {
  console.error('FAIL: formatting / bubbles broken on ack')
  process.exit(1)
}
if (!pdfReady || !after.focusedDoc) {
  console.error('FAIL: PDF bubble for this devis did not arrive')
  process.exit(1)
}

console.log('PASS devis → messagerie → PDF')
await browser.close()
