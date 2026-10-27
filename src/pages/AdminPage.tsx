import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  adminLogin,
  adminLogout,
  createAppointment,
  createClient,
  createUser,
  fetchAppointments,
  fetchClients,
  fetchDashboard,
  fetchDocuments,
  fetchJobs,
  fetchLeads,
  fetchAdminMe,
  fetchUsers,
  getAdminToken,
  patchAppointment,
  type AdminAppointment,
  type AdminClient,
  type AdminDocument,
  type AdminLead,
  type AdminUser,
  type DashboardStats,
} from '../lib/adminApi'
import { isValidTunisianPhone, sanitizeText } from '../lib/security'
import { useCms } from '../cms/CmsProvider'
import {
  classifyMessage,
  extractTitle,
  formatChatText,
  kindLabel,
  type ChatKind,
} from '../lib/messageFormat'

type Tab =
  | 'dashboard'
  | 'leads'
  | 'clients'
  | 'calendar'
  | 'documents'
  | 'messenger'
  | 'users'
  | 'jobs'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'messenger', label: 'Messagerie' },
  { id: 'leads', label: 'Leads' },
  { id: 'clients', label: 'Clients' },
  { id: 'calendar', label: 'Calendrier RDV' },
  { id: 'documents', label: 'Documents' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'jobs', label: 'File WhatsApp' },
]

type MsgConversation = {
  phone: string
  lastAt: string
  lastPreview: string
  count: number
  hasDocument?: boolean
}

type MsgItem = {
  id: string
  type: string
  body?: string
  caption?: string | null
  fileName?: string | null
  fileUrl?: string | null
  at: string
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('fr-TN', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

function statusClass(status: string) {
  if (status === 'confirmed' || status === 'done' || status === 'ack_sent' || status === 'pdf_sent')
    return 'is-ok'
  if (status === 'cancelled') return 'is-bad'
  return 'is-warn'
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Admin'
  if (role === 'sub_admin') return 'Sub-admin'
  if (role === 'under_admin') return 'Under-admin'
  if (role === 'conseiller') return 'Conseiller'
  return role
}

export function AdminPage() {
  const cms = useCms()
  const showrooms = cms.showrooms
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [email, setEmail] = useState('admin@jacmotors.tn')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [clients, setClients] = useState<AdminClient[]>([])
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [jobs, setJobs] = useState<unknown[]>([])
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedDay, setSelectedDay] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )

  const [clientForm, setClientForm] = useState({
    nom: '',
    telephone: '',
    email: '',
    modele: 'T8 PRO',
    matricule: '',
    notes: '',
  })
  const [userForm, setUserForm] = useState({
    nom: '',
    email: '',
    password: 'JacMotors2026!',
    role: 'under_admin',
  })
  const [rdvForm, setRdvForm] = useState({
    nom: '',
    telephone: '',
    modele: 'T8 PRO',
    matricule: '',
    type: 'checkup',
    showroom: 'Atelier El Mghira',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    notes: '',
  })
  const [conversations, setConversations] = useState<MsgConversation[]>([])
  const [threadPhone, setThreadPhone] = useState('21699757218')
  const [threadMessages, setThreadMessages] = useState<MsgItem[]>([])
  const [msgFilter, setMsgFilter] = useState<'all' | ChatKind>('all')

  const refresh = useCallback(async () => {
    setError('')
    const token = getAdminToken()
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
    const [d, l, c, a, docs, u, j, convRes, thrRes] = await Promise.all([
      fetchDashboard(),
      fetchLeads(),
      fetchClients(),
      fetchAppointments(),
      fetchDocuments(),
      fetchUsers(),
      fetchJobs(),
      fetch('/api/messenger/conversations', { headers }).then((r) => r.json()).catch(() => null),
      fetch(`/api/messenger/messages?phone=${encodeURIComponent(threadPhone)}`, {
        headers,
      })
        .then((r) => r.json())
        .catch(() => null),
    ])
    if (d.ok) setStats(d.data.stats)
    if (l.ok) setLeads(l.data.leads)
    if (c.ok) setClients(c.data.clients)
    if (a.ok) setAppointments(a.data.appointments)
    if (docs.ok) setDocuments(docs.data.documents)
    if (u.ok) setUsers(u.data.users)
    if (j.ok) setJobs(j.data.jobs)
    if (convRes?.ok) setConversations(convRes.conversations || [])
    if (thrRes?.ok) setThreadMessages((thrRes.messages || []).slice().reverse())
    if (!d.ok && !l.ok) setError(d.error || l.error)
  }, [threadPhone])

  useEffect(() => {
    document.title = 'Admin · JAC Motors Tunisie'
    ;(async () => {
      if (!getAdminToken()) {
        setBooting(false)
        return
      }
      const me = await fetchAdminMe()
      if (!me.ok) {
        adminLogout()
        setBooting(false)
        return
      }
      setUser(me.data.user)
      await refresh()
      setBooting(false)
    })()
  }, [refresh])

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setLoggingIn(true)
    setError('')
    const result = await adminLogin(email.trim(), password)
    setLoggingIn(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setUser(result.data.user)
    setPassword('')
    await refresh()
  }

  function onLogout() {
    adminLogout()
    setUser(null)
    setStats(null)
  }

  const monthDays = useMemo(() => {
    const [y, m] = calMonth.split('-').map(Number)
    const first = new Date(y, m - 1, 1)
    const startPad = (first.getDay() + 6) % 7
    const daysInMonth = new Date(y, m, 0).getDate()
    const cells: Array<{ date: string | null; count: number }> = []
    for (let i = 0; i < startPad; i++) cells.push({ date: null, count: 0 })
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const count = appointments.filter(
        (a) => a.date?.slice(0, 10) === date && a.status !== 'cancelled',
      ).length
      cells.push({ date, count })
    }
    return cells
  }, [appointments, calMonth])

  const dayAppointments = useMemo(
    () =>
      appointments.filter((a) => a.date?.slice(0, 10) === selectedDay),
    [appointments, selectedDay],
  )

  async function onCreateClient(e: FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    const nom = sanitizeText(clientForm.nom, 80)
    if (nom.length < 2) return setError('Nom client requis.')
    if (!isValidTunisianPhone(clientForm.telephone)) {
      return setError('Téléphone tunisien invalide.')
    }
    const result = await createClient({
      nom,
      telephone: clientForm.telephone.trim(),
      email: clientForm.email || undefined,
      modele: clientForm.modele,
      matricule: clientForm.matricule || undefined,
      notes: clientForm.notes || undefined,
    })
    if (!result.ok) return setError(result.error)
    setNotice(`Client ${result.data.client.nom} enregistré.`)
    setClientForm({
      nom: '',
      telephone: '',
      email: '',
      modele: 'T8 PRO',
      matricule: '',
      notes: '',
    })
    await refresh()
  }

  async function onCreateUser(e: FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    const nom = sanitizeText(userForm.nom, 80)
    if (nom.length < 2 || !userForm.email.includes('@')) {
      return setError('Nom et email utilisateur requis.')
    }
    const result = await createUser({
      nom,
      email: userForm.email.trim(),
      password: userForm.password,
      role: userForm.role,
    })
    if (!result.ok) return setError(result.error)
    setNotice(`Utilisateur ${result.data.user.email} créé.`)
    setUserForm({
      nom: '',
      email: '',
      password: 'JacMotors2026!',
      role: 'under_admin',
    })
    await refresh()
  }

  async function onSeedDemo() {
    setError('')
    setNotice('')
    try {
      const token = getAdminToken()
      const res = await fetch('/api/admin/seed-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ force: true }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; devisPdfs?: number; stats?: DashboardStats }
      if (!res.ok || data.ok === false) {
        setError(data.error || 'Seed demo impossible')
        return
      }
      setNotice(
        `Demo remplie : ${data.devisPdfs ?? 0} devis PDF, clients, RDV, visite/Meet/360, staff.`,
      )
      await refresh()
    } catch {
      setError('Seed demo injoignable.')
    }
  }

  async function onCreateRdv(e: FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    const nom = sanitizeText(rdvForm.nom, 80)
    if (nom.length < 2) return setError('Nom requis pour le RDV.')
    if (!isValidTunisianPhone(rdvForm.telephone)) {
      return setError('Téléphone tunisien invalide.')
    }
    const result = await createAppointment({
      ...rdvForm,
      nom,
      telephone: rdvForm.telephone.trim(),
      status: 'confirmed',
    })
    if (!result.ok) return setError(result.error)
    setNotice(`RDV ${result.data.appointment.id} créé.`)
    setSelectedDay(rdvForm.date)
    await refresh()
  }

  async function onStatus(id: string, status: string) {
    setError('')
    const result = await patchAppointment(id, status)
    if (!result.ok) return setError(result.error)
    setNotice(`RDV ${id} → ${status}`)
    await refresh()
  }

  if (booting) {
    return (
      <div className="admin-shell">
        <div className="admin-login admin-login--loading">
          <p className="section__eyebrow">JAC Motors Tunisie</p>
          <h1>Back-office</h1>
          <p>Chargement de la session…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="admin-shell">
        <form className="admin-login" onSubmit={onLogin}>
          <div className="admin-login__brand">
            <span>JAC MOTORS</span>
            <em>TN</em>
          </div>
          <p className="section__eyebrow">Back-office concession</p>
          <h1>Connexion admin</h1>
          <p className="admin-login__lead">
            Gérez leads, clients, check-up atelier, documents devis et utilisateurs —
            même thème rouge JAC que le site.
          </p>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="admin-alert admin-alert--bad">{error}</p> : null}
          <button className="btn btn--primary" type="submit" disabled={loggingIn}>
            {loggingIn ? 'Connexion…' : 'Entrer dans l’admin'}
          </button>
          <Link className="admin-login__back" to="/">
            ← Retour au site public
          </Link>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-shell admin-shell--app">
      <aside className="admin-side">
        <div className="admin-side__brand">
          <strong>JAC MOTORS</strong>
          <span>Admin TN</span>
        </div>
        <p className="admin-side__user">
          {user.nom}
          <small>{roleLabel(user.role)}</small>
        </p>
        <nav className="admin-side__nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'is-active' : ''}
              onClick={() => {
                setTab(t.id)
                setError('')
                setNotice('')
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="admin-side__foot">
          <Link to="/messagerie?phone=99757218">Messagerie client</Link>
          <a href="/cms/admin/" target="_blank" rel="noreferrer">
            CMS Directus
          </a>
          <a href="/n8n/" target="_blank" rel="noreferrer">
            n8n
          </a>
          <Link to="/">Site public</Link>
          <button type="button" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-main__head">
          <div>
            <p className="section__eyebrow">JAC Motors Tunisie · back-office</p>
            <h1>{TABS.find((t) => t.id === tab)?.label}</h1>
            {tab === 'messenger' ? (
              <p className="admin-main__lead">
                Inbox serveur (alternative WhatsApp démo). Mise en forme lisible,
                alertes concession séparées des messages client et PDF.
              </p>
            ) : null}
          </div>
          <div className="admin-main__actions">
            {user.role === 'admin' && tab === 'dashboard' ? (
              <button type="button" className="btn btn--primary" onClick={() => onSeedDemo()}>
                Remplir démo
              </button>
            ) : null}
            <button type="button" className="btn btn--outline" onClick={() => refresh()}>
              Actualiser
            </button>
          </div>
        </header>

        {error ? <p className="admin-alert admin-alert--bad">{error}</p> : null}
        {notice ? <p className="admin-alert admin-alert--ok">{notice}</p> : null}

        {tab === 'dashboard' && (
          <section className="admin-panel">
            <div className="admin-stats">
              {[
                ['Leads', stats?.leads],
                ['Clients', stats?.clients],
                ['RDV actifs', stats?.appointments],
                ['RDV aujourd’hui', stats?.today],
                ['Documents', stats?.documents],
                ['Utilisateurs', stats?.users],
              ].map(([label, value]) => (
                <article key={String(label)} className="admin-stat">
                  <span>{label}</span>
                  <strong>{value ?? '—'}</strong>
                </article>
              ))}
            </div>
            <div className="admin-grid-2">
              <article className="admin-card">
                <h2>Derniers leads</h2>
                <ul className="admin-list">
                  {leads.slice(0, 6).map((lead) => (
                    <li key={lead.id}>
                      <strong>{lead.nom}</strong>
                      <span>
                        {lead.type} · {lead.modele || '—'} · {formatDate(lead.created_at)}
                      </span>
                    </li>
                  ))}
                  {!leads.length ? <li>Aucun lead pour le moment.</li> : null}
                </ul>
              </article>
              <article className="admin-card">
                <h2>Prochains RDV</h2>
                <ul className="admin-list">
                  {appointments
                    .filter((a) => a.status !== 'cancelled')
                    .slice(0, 6)
                    .map((a) => (
                      <li key={a.id}>
                        <strong>
                          {a.date} {a.time} — {a.nom}
                        </strong>
                        <span>
                          {a.type} · {a.matricule || a.modele || '—'} · {a.status}
                        </span>
                      </li>
                    ))}
                  {!appointments.length ? <li>Aucun rendez-vous planifié.</li> : null}
                </ul>
              </article>
            </div>
          </section>
        )}

        {tab === 'leads' && (
          <section className="admin-panel">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Réf.</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Modèle</th>
                    <th>Statut</th>
                    <th>PDF</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td>
                        <strong>{lead.nom}</strong>
                        <div>{lead.telephone}</div>
                      </td>
                      <td>{lead.type}</td>
                      <td>{lead.modele || '—'}</td>
                      <td>
                        <span className={`admin-pill ${statusClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td>
                        {lead.pdf_url ? (
                          <a href={lead.pdf_url} target="_blank" rel="noreferrer">
                            Ouvrir
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{formatDate(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'clients' && (
          <section className="admin-panel admin-grid-2">
            <form className="admin-card" onSubmit={onCreateClient}>
              <h2>Ajouter / mettre à jour un client</h2>
              <div className="field-grid">
                <label className="field">
                  <span>Nom</span>
                  <input
                    value={clientForm.nom}
                    onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  <span>Téléphone</span>
                  <input
                    value={clientForm.telephone}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, telephone: e.target.value })
                    }
                    placeholder="99 757 218"
                    required
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Modèle</span>
                  <select
                    value={clientForm.modele}
                    onChange={(e) => setClientForm({ ...clientForm, modele: e.target.value })}
                  >
                    <option>T8 PRO</option>
                    <option>T8</option>
                  </select>
                </label>
                <label className="field">
                  <span>Matricule</span>
                  <input
                    value={clientForm.matricule}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, matricule: e.target.value })
                    }
                    placeholder="123 TU 4567"
                  />
                </label>
                <label className="field field--full">
                  <span>Notes</span>
                  <input
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  />
                </label>
              </div>
              <button className="btn btn--primary" type="submit">
                Enregistrer le client
              </button>
            </form>
            <div className="admin-card">
              <h2>Fichier clients ({clients.length})</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Véhicule</th>
                      <th>Matricule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id}>
                        <td>{c.nom}</td>
                        <td>{c.telephone}</td>
                        <td>{c.modele || '—'}</td>
                        <td>{c.matricule || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === 'calendar' && (
          <section className="admin-panel">
            <div className="admin-cal-toolbar">
              <label>
                Mois
                <input
                  type="month"
                  value={calMonth}
                  onChange={(e) => setCalMonth(e.target.value)}
                />
              </label>
              <p>
                Jour sélectionné : <strong>{selectedDay}</strong> · {dayAppointments.length}{' '}
                RDV
              </p>
            </div>
            <div className="admin-cal">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                <div key={d} className="admin-cal__dow">
                  {d}
                </div>
              ))}
              {monthDays.map((cell, idx) =>
                cell.date ? (
                  <button
                    key={cell.date}
                    type="button"
                    className={`admin-cal__day${
                      cell.date === selectedDay ? ' is-selected' : ''
                    }${cell.count ? ' has-rdv' : ''}`}
                    onClick={() => {
                      setSelectedDay(cell.date!)
                      setRdvForm((f) => ({ ...f, date: cell.date! }))
                    }}
                  >
                    <span>{Number(cell.date.slice(-2))}</span>
                    {cell.count ? <em>{cell.count}</em> : null}
                  </button>
                ) : (
                  <div key={`pad-${idx}`} className="admin-cal__day is-empty" />
                ),
              )}
            </div>

            <div className="admin-grid-2" style={{ marginTop: '1.25rem' }}>
              <div className="admin-card">
                <h2>RDV du {selectedDay}</h2>
                <ul className="admin-list">
                  {dayAppointments.map((a) => (
                    <li key={a.id} className="admin-rdv-item">
                      <div>
                        <strong>
                          {a.time} — {a.nom}
                        </strong>
                        <span>
                          {a.type} · {a.telephone}
                          {a.matricule ? ` · ${a.matricule}` : ''}
                        </span>
                        <span className={`admin-pill ${statusClass(a.status)}`}>
                          {a.status}
                        </span>
                      </div>
                      <div className="admin-rdv-actions">
                        <button type="button" onClick={() => onStatus(a.id, 'confirmed')}>
                          Confirmer
                        </button>
                        <button type="button" onClick={() => onStatus(a.id, 'done')}>
                          Terminé
                        </button>
                        <button type="button" onClick={() => onStatus(a.id, 'cancelled')}>
                          Annuler
                        </button>
                      </div>
                    </li>
                  ))}
                  {!dayAppointments.length ? (
                    <li>Aucun rendez-vous ce jour — créez-en un à droite.</li>
                  ) : null}
                </ul>
              </div>

              <form className="admin-card" onSubmit={onCreateRdv}>
                <h2>Créer un RDV / check-up</h2>
                <div className="field-grid">
                  <label className="field">
                    <span>Nom client</span>
                    <input
                      value={rdvForm.nom}
                      onChange={(e) => setRdvForm({ ...rdvForm, nom: e.target.value })}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Téléphone</span>
                    <input
                      value={rdvForm.telephone}
                      onChange={(e) =>
                        setRdvForm({ ...rdvForm, telephone: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Type</span>
                    <select
                      value={rdvForm.type}
                      onChange={(e) => setRdvForm({ ...rdvForm, type: e.target.value })}
                    >
                      <option value="checkup">Check-up véhicule</option>
                      <option value="entretien">Entretien</option>
                      <option value="diagnostic">Diagnostic</option>
                      <option value="visite">Visite showroom</option>
                      <option value="essai">Essai</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Showroom / atelier</span>
                    <select
                      value={rdvForm.showroom}
                      onChange={(e) => setRdvForm({ ...rdvForm, showroom: e.target.value })}
                    >
                      {showrooms.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Date</span>
                    <input
                      type="date"
                      value={rdvForm.date}
                      onChange={(e) => setRdvForm({ ...rdvForm, date: e.target.value })}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Heure</span>
                    <select
                      value={rdvForm.time}
                      onChange={(e) => setRdvForm({ ...rdvForm, time: e.target.value })}
                    >
                      {['08:30', '10:00', '11:30', '14:00', '15:30', '17:00'].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Modèle</span>
                    <select
                      value={rdvForm.modele}
                      onChange={(e) => setRdvForm({ ...rdvForm, modele: e.target.value })}
                    >
                      <option>T8 PRO</option>
                      <option>T8</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Matricule</span>
                    <input
                      value={rdvForm.matricule}
                      onChange={(e) =>
                        setRdvForm({ ...rdvForm, matricule: e.target.value })
                      }
                    />
                  </label>
                  <label className="field field--full">
                    <span>Notes</span>
                    <input
                      value={rdvForm.notes}
                      onChange={(e) => setRdvForm({ ...rdvForm, notes: e.target.value })}
                    />
                  </label>
                </div>
                <button className="btn btn--primary" type="submit">
                  Enregistrer le rendez-vous
                </button>
              </form>
            </div>
          </section>
        )}

        {tab === 'messenger' && (
          <section className="admin-panel">
            <div className="inbox-toolbar">
              <p className="admin-help" style={{ margin: 0 }}>
                Vue client :{' '}
                <Link to="/messagerie?phone=99757218">ouvrir le téléphone</Link>
              </p>
              <div className="inbox-filters">
                {(
                  [
                    ['all', 'Tous'],
                    ['client', 'Client'],
                    ['dealer', 'Concession'],
                    ['document', 'PDF'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`inbox-chip${msgFilter === id ? ' is-on' : ''}`}
                    onClick={() => setMsgFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="inbox-layout">
              <aside className="inbox-convs">
                <h2>Conversations · {conversations.length}</h2>
                <ul>
                  {conversations.map((c) => {
                    const active = c.phone === threadPhone || c.phone.endsWith(threadPhone.slice(-8))
                    const digits = c.phone.replace(/\D/g, '')
                    const pretty =
                      digits.length >= 8
                        ? `+216 ${digits.slice(-8, -6)} ${digits.slice(-6, -3)} ${digits.slice(-3)}`
                        : `+${digits}`
                    return (
                      <li key={c.phone}>
                        <button
                          type="button"
                          className={`inbox-conv${active ? ' is-on' : ''}`}
                          onClick={async () => {
                            setThreadPhone(c.phone)
                            const token = getAdminToken()
                            const res = await fetch(
                              `/api/messenger/messages?phone=${encodeURIComponent(c.phone)}`,
                              {
                                headers: token
                                  ? { Authorization: `Bearer ${token}` }
                                  : {},
                              },
                            )
                            const data = await res.json()
                            if (data?.ok) {
                              setThreadMessages((data.messages || []).slice().reverse())
                            }
                          }}
                        >
                          <span className="inbox-conv__avatar">
                            {digits.slice(-2)}
                          </span>
                          <span className="inbox-conv__meta">
                            <strong>{pretty}</strong>
                            <em>
                              {c.count} msg · {extractTitle(c.lastPreview)}
                            </em>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                  {!conversations.length ? (
                    <li className="inbox-empty">Aucun message pour le moment.</li>
                  ) : null}
                </ul>
              </aside>
              <div className="inbox-thread-wrap">
                <header className="inbox-thread__head">
                  <div>
                    <strong>
                      {threadPhone.replace(/\D/g, '').length >= 8
                        ? `+216 ${threadPhone.replace(/\D/g, '').slice(-8, -6)} ${threadPhone.replace(/\D/g, '').slice(-6, -3)} ${threadPhone.replace(/\D/g, '').slice(-3)}`
                        : `+${threadPhone}`}
                    </strong>
                    <span>
                      Fil · {msgFilter === 'all' ? 'tous les messages' : kindLabel(msgFilter)}
                    </span>
                  </div>
                </header>
                <div className="inbox-thread">
                  {(() => {
                    const visible = threadMessages.filter((m) => {
                      if (msgFilter === 'all') return true
                      return classifyMessage(m) === msgFilter
                    })
                    if (!threadMessages.length) {
                      return (
                        <p className="inbox-empty">
                          Choisissez une conversation à gauche.
                        </p>
                      )
                    }
                    if (!visible.length) {
                      return (
                        <p className="inbox-empty">
                          Aucun message pour ce filtre.
                        </p>
                      )
                    }
                    return visible.map((m) => {
                      const kind = classifyMessage(m)
                      return (
                        <article
                          key={m.id}
                          className={`chat-card chat-card--${kind}`}
                        >
                          <div className="chat-card__badge">{kindLabel(kind)}</div>
                          <div className="chat-card__body">
                            {formatChatText(m.body || m.caption || '')}
                          </div>
                          {m.fileUrl ? (
                            <a
                              className="chat-card__pdf"
                              href={m.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              📄 {m.fileName || 'Ouvrir le PDF'}
                            </a>
                          ) : null}
                          <time>{formatDate(m.at)}</time>
                        </article>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'documents' && (
          <section className="admin-panel">
            <p className="admin-help">
              Les devis PDF générés pour les clients apparaissent ici — prêts à être
              renvoyés ou ouverts. WhatsApp envoie le document automatiquement après
              l’accusé de réception.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Fichier</th>
                    <th>Type</th>
                    <th>Lead</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.title}</td>
                      <td>{doc.file_name}</td>
                      <td>{doc.kind}</td>
                      <td>{doc.lead_id || '—'}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td>
                        <a
                          className="btn btn--outline"
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ouvrir PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!documents.length ? (
                    <tr>
                      <td colSpan={6}>
                        Aucun document encore — un devis client créera le PDF ici.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'users' && (
          <section className="admin-panel admin-grid-2">
            <form className="admin-card" onSubmit={onCreateUser}>
              <h2>Nouvel utilisateur staff</h2>
              <p className="admin-help">Réservé au rôle admin.</p>
              <div className="field-grid">
                <label className="field">
                  <span>Nom</span>
                  <input
                    value={userForm.nom}
                    onChange={(e) => setUserForm({ ...userForm, nom: e.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  <span>Mot de passe</span>
                  <input
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  <span>Rôle</span>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="sub_admin">Sub-admin</option>
                    <option value="under_admin">Under-admin</option>
                    <option value="conseiller">Conseiller</option>
                  </select>
                </label>
              </div>
              <button className="btn btn--primary" type="submit">
                Créer l’utilisateur
              </button>
            </form>
            <div className="admin-card">
              <h2>Équipe ({users.length})</h2>
              <ul className="admin-list">
                {users.map((u) => (
                  <li key={u.id}>
                    <strong>
                      {u.nom} · {u.email}
                    </strong>
                    <span>
                      {roleLabel(u.role)} · {u.active === false ? 'inactif' : 'actif'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {tab === 'jobs' && (
          <section className="admin-panel">
            <p className="admin-help">
              File d’attente des envois WhatsApp (ACK, PDF devis différé). Mode dry-run
              tant que les tokens Cloud API ne sont pas branchés.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Planifié</th>
                  </tr>
                </thead>
                <tbody>
                  {(jobs as Array<Record<string, string>>).map((job) => (
                    <tr key={job.id}>
                      <td>{job.id}</td>
                      <td>{job.type}</td>
                      <td>
                        <span className={`admin-pill ${statusClass(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>{formatDate(job.runAt || job.createdAt)}</td>
                    </tr>
                  ))}
                  {!jobs.length ? (
                    <tr>
                      <td colSpan={4}>Aucune tâche en file.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
