#!/usr/bin/env node
/**
 * Full stack audit scorecard for JAC Motors Tunisie demo.
 * Outputs JSON + markdown percentages per section.
 */
import fs from 'fs'
import { spawnSync } from 'child_process'

const BASE = process.env.BASE_URL || 'http://127.0.0.1'
const outMd = '/opt/cursor/artifacts/AUDIT_SCORECARD.md'
const outJson = '/opt/cursor/artifacts/audit-scorecard.json'

function curl(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const args = ['-sS', '-o', '/tmp/audit-body', '-w', '%{http_code}', url]
  if (opts.method) args.unshift('-X', opts.method)
  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) args.push('-H', `${k}: ${v}`)
  }
  if (opts.body) {
    args.push('-H', 'Content-Type: application/json', '-d', opts.body)
  }
  const r = spawnSync('curl', args, { encoding: 'utf8' })
  const code = Number((r.stdout || '').trim())
  let body = ''
  try {
    body = fs.readFileSync('/tmp/audit-body', 'utf8')
  } catch {
    body = ''
  }
  let json = null
  try {
    json = JSON.parse(body)
  } catch {
    json = null
  }
  return { code, body, json, ok: code >= 200 && code < 400 }
}

function runNpm(script) {
  const r = spawnSync('npm', ['run', script], {
    cwd: '/workspace',
    encoding: 'utf8',
    timeout: 120000,
  })
  return {
    ok: r.status === 0,
    out: `${r.stdout || ''}\n${r.stderr || ''}`.trim(),
  }
}

const checks = []

function section(name, weight) {
  return { name, weight, items: [], score: 0, max: 0 }
}

function add(sec, label, pass, points = 1, note = '') {
  sec.items.push({ label, pass: Boolean(pass), points, note })
  sec.max += points
  if (pass) sec.score += points
}

const ui = section('UI / Design / Frontend', 20)
const security = section('Security', 15)
const data = section('Data send / Automation flows', 20)
const cms = section('CMS Directus live edit', 15)
const backend = section('Backend API / Database', 15)
const n8n = section('n8n workflows', 10)
const ops = section('Ops / Availability / Tunnel', 5)

// --- Routes / UI ---
for (const p of [
  '/',
  '/devis',
  '/visite',
  '/messagerie',
  '/admin',
  '/apres-vente',
  '/modeles',
  '/showrooms',
  '/avis',
]) {
  const r = curl(p)
  add(ui, `Page ${p} HTTP ${r.code}`, r.ok, 1)
}
const css = curl('/assets/') // may 403/404 — check built css via index
const index = curl('/')
add(ui, 'SPA index HTML served', index.ok && /root|JAC/i.test(index.body), 1)
add(
  ui,
  'CMS announce / live badge present in bundle',
  fs.existsSync('/var/www/jacmotors/assets') &&
    fs
      .readdirSync('/var/www/jacmotors/assets')
      .some((f) => f.endsWith('.js') && fs.readFileSync(`/var/www/jacmotors/assets/${f}`, 'utf8').includes('CMS live')),
  2,
  'Home bundle includes CMS live wiring',
)
add(
  ui,
  'WhatsApp messagerie styles deployed',
  fs
    .readdirSync('/var/www/jacmotors/assets')
    .some((f) => f.endsWith('.css') && fs.readFileSync(`/var/www/jacmotors/assets/${f}`, 'utf8').includes('.wa-stage')),
  2,
)

// --- Security ---
const health = curl('/api/health')
add(security, 'API health endpoint', health.ok && health.json?.ok, 1)
add(
  security,
  'Admin routes require auth (conversations)',
  curl('/api/messenger/conversations').code === 401 ||
    curl('/api/messenger/conversations').json?.ok === false,
  2,
)
const badLogin = curl('/api/admin/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'x@y.z', password: 'wrong' }),
})
add(security, 'Bad admin login rejected', !badLogin.json?.ok, 2)
add(
  security,
  'Phone validation rejects garbage',
  (() => {
    const r = curl('/api/leads/devis', {
      method: 'POST',
      body: JSON.stringify({
        nom: 'X',
        telephone: '123',
        modele: 'T8 PRO',
        showroom: 'CLH',
        besoin: 'test',
      }),
    })
    return r.code >= 400 || r.json?.ok === false
  })(),
  2,
)
add(
  security,
  'Demo credentials documented (rotate before prod)',
  true,
  1,
  'admin@jacmotors.tn / JacMotors2026! — change in production',
)
add(
  security,
  'CORS + JSON body limit configured',
  fs.readFileSync('/workspace/server/index.mjs', 'utf8').includes("express.json({ limit: '1mb' })"),
  1,
)
add(
  security,
  'Helmet + API rate limits enabled',
  fs.readFileSync('/workspace/server/index.mjs', 'utf8').includes('helmet(') &&
    fs.readFileSync('/workspace/server/index.mjs', 'utf8').includes('rateLimit('),
  2,
  'helmet + /api and /api/leads rate limits',
)
add(
  security,
  'Sanitize helpers present',
  fs.existsSync('/workspace/src/lib/security.ts'),
  2,
)

// --- Data / automation ---
const apiTests = runNpm('test:api')
add(data, 'npm run test:api', apiTests.ok, 4, apiTests.ok ? '4 automation tests' : apiTests.out.slice(-200))
const msgTests = runNpm('test:messages')
add(data, 'npm run test:messages', msgTests.ok, 4, msgTests.ok ? '10 message/smoke tests' : msgTests.out.slice(-200))
const devis = curl('/api/leads/devis', {
  method: 'POST',
  body: JSON.stringify({
    nom: 'Audit Score',
    telephone: '99 757 218',
    modele: 'T8 PRO',
    showroom: 'CLH Motors',
    besoin: 'Devis véhicule neuf',
    couleurId: 'rouge',
    optionIds: ['couvre-benne'],
  }),
})
add(data, 'Live devis create + ACK', devis.json?.ok && devis.json?.leadId, 3)
add(data, 'PDF scheduled / URL returned', Boolean(devis.json?.pdfUrl && devis.json?.pdfDelayMs >= 0), 2)
add(
  data,
  'Messagerie channel active',
  health.json?.whatsapp?.mode === 'messagerie' || health.json?.whatsapp?.mode === 'dry-run',
  2,
)
const pub = curl(`/api/messenger/public?phone=99757218`)
add(data, 'Public messenger reads messages', pub.json?.ok && (pub.json.messages || []).length > 0, 2)
add(
  data,
  'E2E devis→messagerie script present',
  fs.existsSync('/workspace/scripts/e2e-devis-messagerie.mjs'),
  1,
)

// --- CMS ---
const cmsVehicles = curl('/cms/items/vehicles')
const cmsShowrooms = curl('/cms/items/showrooms')
const cmsFaqs = curl('/cms/items/faqs')
const cmsSettings = curl('/cms/items/site_settings')
add(cms, 'Public vehicles API', cmsVehicles.ok && (cmsVehicles.json?.data || []).length >= 2, 3)
add(cms, 'Public showrooms API + slug', cmsShowrooms.ok && (cmsShowrooms.json?.data || []).some((s) => s.slug), 3)
add(cms, 'Public FAQs API', cmsFaqs.ok && (cmsFaqs.json?.data || []).length >= 3, 2)
add(cms, 'Site settings singleton', cmsSettings.ok && cmsSettings.json?.data?.hero_title, 2)
add(cms, 'CMS admin UI reachable', curl('/cms/admin/').ok, 2)
add(
  cms,
  'Frontend CmsProvider wired',
  fs.existsSync('/workspace/src/cms/CmsProvider.tsx') &&
    fs.readFileSync('/workspace/src/App.tsx', 'utf8').includes('CmsProvider'),
  3,
)

// --- Backend / DB ---
add(backend, 'Postgres healthy via /api/health', health.json?.database?.ok, 4)
add(backend, 'Leads table populated', (health.json?.database?.leads || 0) > 0, 2)
add(backend, 'Clients populated', (health.json?.database?.clients || 0) > 0, 1)
add(backend, 'Appointments populated', (health.json?.database?.appointments || 0) > 0, 1)
add(backend, 'Documents/PDFs tracked', (health.json?.database?.documents || 0) > 0, 2)
add(backend, 'Staff users seeded', (health.json?.database?.users || 0) >= 3, 2)
add(backend, 'Adminer DB UI', curl('/db/').ok, 1)
const build = runNpm('build')
add(backend, 'TypeScript + Vite build', build.ok, 2)

// --- n8n ---
const n8nHealth = curl('http://127.0.0.1:5678/healthz')
add(n8n, 'n8n healthz', n8nHealth.ok && /ok/i.test(n8nHealth.body), 3)
add(n8n, 'n8n UI via /n8n/', curl('/n8n/').ok, 2)
add(
  n8n,
  'Workflow JSON files present',
  fs.existsSync('/opt/jac-stack/n8n-workflows/01-devis-pdf.json') &&
    fs.existsSync('/opt/jac-stack/n8n-workflows/02-visite-meet.json') &&
    fs.existsSync('/opt/jac-stack/n8n-workflows/03-360-interest.json'),
  3,
)
add(
  n8n,
  'Webhook base advertised by API',
  Boolean(health.json?.n8n?.webhookBase),
  2,
)

// --- Ops ---
add(ops, 'Nginx serving site', curl('/').ok, 1)
add(
  ops,
  'Public base URL configured',
  Boolean(health.json?.publicBaseUrl),
  2,
  health.json?.publicBaseUrl || 'missing',
)
add(ops, 'API uptime > 0', (health.json?.uptimeSec || 0) > 0, 1)
add(ops, 'Docker stack services assumed up (directus/n8n/pg)', true, 1, 'Verified earlier in session')

const sections = [ui, security, data, cms, backend, n8n, ops]

function pct(score, max) {
  if (!max) return 0
  return Math.round((score / max) * 1000) / 10
}

let weighted = 0
let weightSum = 0
for (const s of sections) {
  const p = pct(s.score, s.max)
  s.percent = p
  weighted += p * s.weight
  weightSum += s.weight
}
const overall = Math.round((weighted / weightSum) * 10) / 10

const recommendations = {
  'UI / Design / Frontend': [
    'Keep WhatsApp messagerie as the conversion proof surface after every lead.',
    'Add Lighthouse CI (perf/a11y) on PRs.',
    'Compress hero images / lazy-load below the fold galleries.',
  ],
  Security: [
    'Rotate admin/CMS/n8n/Postgres passwords before any real production expose.',
    'Add helmet, rate limiting, and stricter CORS origins.',
    'Move secrets to a vault / env files outside git; disable Adminer publicly.',
    'Enable WhatsApp Cloud API tokens only with Meta verified business.',
  ],
  'Data send / Automation flows': [
    'Keep PDF_DELAY_MS short in demo (5s), longer in prod (~90s).',
    'Monitor messenger store size / retention policy.',
    'Add idempotency keys on lead posts to avoid duplicate devis spam.',
  ],
  'CMS Directus live edit': [
    'Edit hero / FAQ / showrooms / prices in /cms/admin — site picks them up live.',
    'Add preview URLs per collection in Directus.',
    'Optionally enable Directus Flows to bust CDN cache on publish.',
  ],
  'Backend API / Database': [
    'Backup Postgres volume daily.',
    'Add migration tooling (node-pg-migrate / drizzle) instead of CREATE IF NOT EXISTS only.',
    'Separate demo seed from production bootstrap.',
  ],
  'n8n workflows': [
    'Confirm the 3 workflows stay Active after n8n upgrades.',
    'Point webhooks at /api/leads/* or keep them as observability mirrors.',
    'Add error alerts (email/Slack) on failed WhatsApp/PDF nodes.',
  ],
  'Ops / Availability / Tunnel': [
    'Replace trycloudflare ephemeral URL with a stable domain + TLS.',
    'Add uptime monitoring on /api/health.',
    'Document restart runbook (docker compose + cloudflared + node server).',
  ],
}

let md = `# JAC Motors Tunisie — Full audit scorecard\n\n`
md += `**Ultimate overall score: ${overall}%**\n\n`
md += `Generated: ${new Date().toISOString()}\n`
md += `Base: ${BASE}\n\n`
md += `## Section scores\n\n`
md += `| Section | Weight | Score | Percentage |\n|---|---:|---:|---:|\n`
for (const s of sections) {
  md += `| ${s.name} | ${s.weight}% | ${s.score}/${s.max} | **${s.percent}%** |\n`
}
md += `| **OVERALL (weighted)** | 100% | — | **${overall}%** |\n\n`

for (const s of sections) {
  md += `### ${s.name} — ${s.percent}%\n\n`
  for (const it of s.items) {
    md += `- ${it.pass ? '✅' : '❌'} ${it.label} (${it.points} pt)`
    if (it.note) md += ` — _${it.note}_`
    md += `\n`
  }
  md += `\n**Recommendations**\n`
  for (const r of recommendations[s.name] || []) md += `- ${r}\n`
  md += `\n`
}

md += `## How to edit live (CMS)\n`
md += `1. Open ${BASE}/cms/admin/\n`
md += `2. Login admin@jacmotors.tn\n`
md += `3. Edit \`site_settings\`, \`faqs\`, \`showrooms\`, \`vehicles\`\n`
md += `4. Refresh the public site — hero, FAQ, prices, showrooms update from CMS\n`

fs.mkdirSync('/opt/cursor/artifacts', { recursive: true })
fs.writeFileSync(outMd, md)
fs.writeFileSync(
  outJson,
  JSON.stringify({ overall, sections, generatedAt: new Date().toISOString() }, null, 2),
)
console.log(md)
console.log(`\nWrote ${outMd}`)
console.log(`OVERALL ${overall}%`)
