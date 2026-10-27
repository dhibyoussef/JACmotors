#!/usr/bin/env node
/** Visual + flow QA across key routes (desktop + mobile) */
import puppeteer from 'puppeteer-core'
import fs from 'fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1'
const out = '/opt/cursor/artifacts/screenshots'
fs.mkdirSync(out, { recursive: true })

const routes = [
  '/',
  '/devis',
  '/modeles',
  '/visite',
  '/showrooms',
  '/apres-vente',
  '/avis',
  '/messagerie?phone=99757218',
  '/admin',
]

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1100'],
  defaultViewport: { width: 1440, height: 1100 },
})
const page = await browser.newPage()
const report = []

function ok(cond, label, detail = '') {
  report.push({ ok: !!cond, label, detail })
  console.log(`${cond ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`)
}

for (const route of routes) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 500))
  const file = `qa-${route.replace(/[/?=&]/g, '_').replace(/^_|_$/g, '') || 'home'}.png`
  await page.screenshot({ path: `${out}/${file}` })
  const meta = await page.evaluate(() => {
    const body = document.body
    const style = getComputedStyle(body)
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim()?.slice(0, 90) || '',
      hasAnnounce: !!document.querySelector('.cms-announce'),
      overflowX: style.overflowX,
      rawStars: /\*JAC MOTORS|\*DEMANDE/.test(body.innerText || ''),
      // only count truly failed loads (complete but 0×0), ignore still-decoding frames
      brokenImgs: [...document.images].filter(
        (img) => img.complete && img.naturalWidth === 0,
      ).length,
    }
  })
  ok(meta.title.length > 3, `${route} has title`, meta.title)
  if (route !== '/messagerie?phone=99757218' && route !== '/admin') {
    ok(Boolean(meta.h1), `${route} has h1`, meta.h1)
  }
  ok(!meta.rawStars, `${route} no raw WhatsApp stars`)
  ok(meta.brokenImgs === 0, `${route} images loaded`, `broken=${meta.brokenImgs}`)
}

// CMS live home checks
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.waitForSelector('.home-hero', { timeout: 15000 })
const cms = await page.evaluate(() => ({
  live: !!document.querySelector('.cms-dot.is-live'),
  announce: document.querySelector('.cms-announce em')?.textContent || '',
  faq: document.querySelectorAll('.faq__item').length,
}))
ok(cms.live || cms.announce, 'CMS announce/live present', cms.announce.slice(0, 60))
ok(cms.faq >= 3, 'FAQ items rendered', String(cms.faq))

// Mobile home
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.screenshot({ path: `${out}/qa-home-mobile.png` })
const mobile = await page.evaluate(() => ({
  dock: !!document.querySelector('.mobile-dock'),
  menu: !!document.querySelector('.nav__toggle'),
}))
ok(mobile.dock, 'Mobile dock visible on home')
ok(mobile.menu, 'Mobile nav toggle present')

// Devis → messagerie smoke (desktop)
await page.setViewport({ width: 1440, height: 1100, isMobile: false })
await page.goto(`${BASE}/devis`, { waitUntil: 'networkidle0' })
await page.evaluate(() => {
  const set = (label, value) => {
    const span = [...document.querySelectorAll('label.field span')].find(
      (s) => s.textContent?.trim() === label,
    )
    const input = span?.parentElement?.querySelector('input')
    if (!input) return
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
  set('Nom', 'QA Visual')
  set('WhatsApp (Tunisie)', '99 757 218')
})
await page.click('button.btn--whatsapp[type="submit"]')
await page.waitForFunction(() => location.pathname.includes('/messagerie'), { timeout: 20000 })
await new Promise((r) => setTimeout(r, 1200))
await page.screenshot({ path: `${out}/qa-devis-redirect.png` })
const chat = await page.evaluate(() => ({
  wa: !!document.querySelector('.wa-chat'),
  strong: !!document.querySelector('.wa-bubble__text strong'),
  raw: /\*JAC MOTORS|\*DEMANDE/.test(document.body.innerText || ''),
}))
ok(chat.wa, 'Redirected to WhatsApp UI')
ok(chat.strong && !chat.raw, 'Chat formatting clean')

await browser.close()

const failed = report.filter((r) => !r.ok)
console.log(`\nQA ${report.length - failed.length}/${report.length} checks passed`)
if (failed.length) {
  console.error('Failures:', failed)
  process.exit(1)
}
console.log('PASS visual QA')
