import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type CheckResult = {
  id: string
  label: string
  ok: boolean
  detail?: string
  link?: string
}

type AutoReport = {
  ok: boolean
  demo: true
  baseUrl: string
  checkedAt: string
  checks: CheckResult[]
  messageriePhone: string
  note: string
}

type Step = {
  id: string
  n: number
  title: string
  why: string
  doThis: string[]
  href: string
  external?: boolean
  see: string
}

const STORAGE_KEY = 'jac_demo_test_steps_v1'

const STEPS: Step[] = [
  {
    id: 'start',
    n: 1,
    title: 'Start here — this page',
    why: 'One place to open every demo link and run auto checks.',
    doThis: [
      'Read the DEMO banner (messages are not real WhatsApp yet).',
      'Click “Run auto test” below.',
      'Then follow steps 2 → 12 in order.',
    ],
    href: '/test',
    see: 'Green checks for API, DB, CMS, n8n health.',
  },
  {
    id: 'home',
    n: 2,
    title: 'Home page',
    why: 'Client landing — hero, prices, CTAs.',
    doThis: ['Open Accueil.', 'Scroll: hero, models, FAQ, footer.'],
    href: '/',
    see: 'T8 / T8 PRO content loads. CMS announcement may show.',
  },
  {
    id: 'devis',
    n: 3,
    title: 'Devis (most important)',
    why: 'Creates lead + ACK + PDF in Messagerie.',
    doThis: [
      'Open Devis.',
      'Name + WhatsApp `99 757 218`.',
      'Pick model, color, options, showroom → submit.',
    ],
    href: '/devis',
    see: 'Success → auto-open Messagerie with ACK, then PDF (~5s).',
  },
  {
    id: 'messagerie',
    n: 4,
    title: 'Messagerie (demo WhatsApp)',
    why: 'Fake phone inbox until real WhatsApp tokens are set.',
    doThis: [
      'Open Messagerie with phone 99757218.',
      'Read ACK + PDF bubble for your devis.',
    ],
    href: '/messagerie?phone=99757218',
    see: 'Bold text rendered (not raw *stars*). PDF opens.',
  },
  {
    id: 'visite',
    n: 5,
    title: 'Visite / Essai / Google Meet',
    why: 'Appointment flows with ACK (+ Meet link).',
    doThis: [
      'Open Visite.',
      'Try mode Meet once (date + time + phone).',
      'Optional: also try Essai or Visite showroom.',
    ],
    href: '/visite',
    see: 'ACK in Messagerie with date/time (and Meet URL if Meet).',
  },
  {
    id: 'modeles',
    n: 6,
    title: 'Modèles 360 interest',
    why: '360 interest lead → counselor follow-up ACK.',
    doThis: ['Open Modèles.', 'Leave interest with WhatsApp after 360.'],
    href: '/modeles',
    see: 'Interest ACK in Messagerie; lead in Admin.',
  },
  {
    id: 'checkup',
    n: 7,
    title: 'Après-vente check-up',
    why: 'Workshop calendar booking.',
    doThis: [
      'Open Après-vente → Check-up.',
      'Pick date + slot + plate → submit.',
    ],
    href: '/apres-vente#checkup',
    see: 'RDV ACK in Messagerie; row in Admin calendar.',
  },
  {
    id: 'showrooms',
    n: 8,
    title: 'Showrooms',
    why: 'Public locations page.',
    doThis: ['Open Showrooms.', 'Confirm Tunis / CLH / etc. list.'],
    href: '/showrooms',
    see: 'Addresses and contact CTAs.',
  },
  {
    id: 'admin',
    n: 9,
    title: 'Admin back-office',
    why: 'Staff see leads, PDFs, clients, calendar, messagerie.',
    doThis: [
      'Login: admin@jacmotors.tn / JacMotors2026!',
      'Check Dashboard, Leads, Documents, Calendrier, Messagerie.',
    ],
    href: '/admin',
    see: 'Your test devis/visite/checkup appear.',
  },
  {
    id: 'cms',
    n: 10,
    title: 'CMS Directus',
    why: 'Live edit site text / vehicles / FAQ.',
    doThis: [
      'Login same email/password.',
      'Open site_settings or vehicles → change a word → save.',
      'Refresh the public site.',
    ],
    href: '/cms/admin/',
    external: true,
    see: 'Public page updates (CMS live).',
  },
  {
    id: 'n8n',
    n: 11,
    title: 'n8n automations',
    why: 'Workflow engine for devis / visite / 360 webhooks.',
    doThis: [
      'Open n8n (same login if already created).',
      'Confirm workflows Jac devis / visite / 360 are Active.',
    ],
    href: '/n8n/',
    external: true,
    see: 'Editor loads; webhooks under /n8n/webhook/jac-*.',
  },
  {
    id: 'db',
    n: 12,
    title: 'Database (Adminer) + health',
    why: 'Proof data is stored (leads, clients…).',
    doThis: [
      'Open API health (JSON ok:true).',
      'Open Adminer → PostgreSQL → server postgres_app → jac / jac_dev_change_me / jacmotors.',
    ],
    href: '/api/health',
    external: true,
    see: 'Health shows DB counts. Adminer shows tables.',
  },
]

function loadDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

export function TestGuidePage() {
  const [done, setDone] = useState<Record<string, boolean>>(() => loadDone())
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<AutoReport | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Demo test guide · JAC Tunisie'
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done))
    } catch {
      /* ignore */
    }
  }, [done])

  const progress = useMemo(() => {
    const total = STEPS.length
    const n = STEPS.filter((s) => done[s.id]).length
    return { total, n, pct: Math.round((n / total) * 100) }
  }, [done])

  const toggle = (id: string) => {
    setDone((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const reset = () => setDone({})

  const runAuto = useCallback(async () => {
    setRunning(true)
    setError('')
    try {
      const res = await fetch('/api/demo/test-all?run=1', { method: 'POST' })
      const data = (await res.json()) as AutoReport & { error?: string }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setReport(data)
      if (data.ok) setDone((prev) => ({ ...prev, start: true }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auto test failed')
    } finally {
      setRunning(false)
    }
  }, [])

  return (
    <div className="test-guide">
      <section className="test-guide__hero">
        <p className="section__eyebrow">DEMO · START HERE</p>
        <h1>Test everything</h1>
        <p className="test-guide__lead">
          Simple guide for the full JAC Tunisie demo. Follow the steps in order. Messages go to{' '}
          <strong>JAC Messagerie</strong> on this server —{' '}
          <em>not real WhatsApp yet</em>. Later, the same flow will send to the client’s real
          WhatsApp number.
        </p>
        <div className="test-guide__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={runAuto}
            disabled={running}
          >
            {running ? 'Running…' : '1) Run auto test'}
          </button>
          <Link className="btn btn--whatsapp" to="/devis">
            2) Open Devis
          </Link>
          <Link className="btn btn--ghost-dark" to="/messagerie?phone=99757218">
            Open Messagerie
          </Link>
          <a className="btn btn--outline" href="/admin">
            Admin login
          </a>
        </div>
        <div className="test-guide__progress" aria-label="Progress">
          <div className="test-guide__bar">
            <span style={{ width: `${progress.pct}%` }} />
          </div>
          <p>
            Checklist: <strong>{progress.n}</strong> / {progress.total} · {progress.pct}%
            <button type="button" className="test-guide__reset" onClick={reset}>
              Reset ticks
            </button>
          </p>
        </div>
        {error ? <p className="test-guide__error">{error}</p> : null}
      </section>

      {report ? (
        <section className="test-guide__report panel">
          <header>
            <h2>{report.ok ? 'Auto test OK' : 'Auto test — check fails'}</h2>
            <p>
              {report.note} · {new Date(report.checkedAt).toLocaleString('fr-TN')}
            </p>
          </header>
          <ul className="test-guide__checks">
            {report.checks.map((c) => (
              <li key={c.id} className={c.ok ? 'is-ok' : 'is-bad'}>
                <span aria-hidden="true">{c.ok ? '✓' : '✗'}</span>
                <div>
                  <strong>{c.label}</strong>
                  {c.detail ? <em>{c.detail}</em> : null}
                  {c.link ? (
                    <a href={c.link} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <p className="test-guide__next">
            Next: open{' '}
            <Link to={`/messagerie?phone=${report.messageriePhone}`}>Messagerie</Link> to see
            the sample ACK/PDF, then continue the checklist.
          </p>
        </section>
      ) : null}

      <section className="test-guide__steps">
        <h2>Manual guide (do this)</h2>
        <ol className="test-guide__list">
          {STEPS.map((step) => (
            <li key={step.id} className={done[step.id] ? 'is-done' : ''}>
              <div className="test-guide__step-top">
                <label className="test-guide__tick">
                  <input
                    type="checkbox"
                    checked={Boolean(done[step.id])}
                    onChange={() => toggle(step.id)}
                  />
                  <span>
                    Step {step.n} — {step.title}
                  </span>
                </label>
                {step.external ? (
                  <a className="btn btn--outline" href={step.href} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  <Link className="btn btn--outline" to={step.href}>
                    Open
                  </Link>
                )}
              </div>
              <p className="test-guide__why">{step.why}</p>
              <ul>
                {step.doThis.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="test-guide__see">
                <strong>See:</strong> {step.see}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="test-guide__creds panel">
        <h2>Logins & keys (demo)</h2>
        <ul>
          <li>
            Admin / CMS / n8n: <code>admin@jacmotors.tn</code> / <code>JacMotors2026!</code>
          </li>
          <li>
            DB: user <code>jac</code> · password <code>jac_dev_change_me</code> · db{' '}
            <code>jacmotors</code>
          </li>
          <li>
            Directus secret: <code>jac_directus_secret_change_me_2026</code>
          </li>
          <li>
            WhatsApp tokens: <em>empty</em> (messagerie mode) · dealer demo{' '}
            <code>21699757218</code>
          </li>
        </ul>
        <p>
          Docs in the repo: <code>DEMO_ACCESS.md</code> · <code>TESTING_GUIDE.md</code>
        </p>
      </section>
    </div>
  )
}
