/** Branded admin back-office API client */

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const TOKEN_KEY = 'jac_admin_token'

export type AdminUser = {
  id: string
  nom: string
  email: string
  role: string
  active?: boolean
  created_at?: string
}

export type AdminClient = {
  id: string
  nom: string
  telephone: string
  email?: string | null
  modele?: string | null
  matricule?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type AdminAppointment = {
  id: string
  client_id?: string | null
  nom: string
  telephone: string
  email?: string | null
  modele?: string | null
  matricule?: string | null
  type: string
  showroom?: string | null
  date: string
  time: string
  status: string
  notes?: string | null
  created_at?: string
}

export type AdminDocument = {
  id: string
  lead_id?: string | null
  client_id?: string | null
  title: string
  file_name: string
  file_url: string
  kind: string
  created_at?: string
}

export type AdminLead = {
  id: string
  type: string
  nom: string
  telephone: string
  email?: string | null
  modele?: string | null
  showroom?: string | null
  pdf_url?: string | null
  status: string
  created_at?: string
  payload?: Record<string, unknown>
}

export type DashboardStats = {
  leads: number
  clients: number
  appointments: number
  today: number
  documents: number
  users: number
}

export type Slot = { time: string; taken: boolean }

type ApiOk<T> = T & { ok: true }
type ApiErr = { ok: false; error?: string }

function token(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAdminToken(value: string | null) {
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function getAdminToken() {
  return token()
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  auth = true,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const headers = new Headers(init.headers || {})
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json')
    }
    if (auth) {
      const t = token()
      if (t) headers.set('Authorization', `Bearer ${t}`)
    }
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
    const data = (await res.json()) as ApiOk<T> | ApiErr
    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        error: (data as ApiErr).error || `Erreur ${res.status}`,
      }
    }
    return { ok: true, data: data as T }
  } catch {
    return {
      ok: false,
      error: 'Serveur admin injoignable. Vérifiez l’API automation.',
    }
  }
}

export async function adminLogin(email: string, password: string) {
  const result = await request<{
    token: string
    user: AdminUser
    expiresAt: string
  }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false)
  if (result.ok) setAdminToken(result.data.token)
  return result
}

export function adminLogout() {
  setAdminToken(null)
}

export function fetchAdminMe() {
  return request<{ user: AdminUser }>('/api/admin/me')
}

export function fetchDashboard() {
  return request<{ stats: DashboardStats }>('/api/admin/dashboard')
}

export function fetchLeads() {
  return request<{ leads: AdminLead[]; source?: string }>('/api/admin/leads')
}

export function fetchClients() {
  return request<{ clients: AdminClient[] }>('/api/admin/clients')
}

export function createClient(body: Partial<AdminClient> & { nom: string; telephone: string }) {
  return request<{ client: AdminClient }>('/api/admin/clients', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function fetchUsers() {
  return request<{ users: AdminUser[] }>('/api/admin/users')
}

export function createUser(body: {
  nom: string
  email: string
  password?: string
  role?: string
}) {
  return request<{ user: AdminUser }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function fetchAppointments(from?: string, to?: string) {
  const q = new URLSearchParams()
  if (from) q.set('from', from)
  if (to) q.set('to', to)
  const qs = q.toString()
  return request<{ appointments: AdminAppointment[] }>(
    `/api/admin/appointments${qs ? `?${qs}` : ''}`,
  )
}

export function createAppointment(body: Record<string, unknown>) {
  return request<{ appointment: AdminAppointment }>('/api/admin/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function patchAppointment(id: string, status: string) {
  return request<{ appointment: AdminAppointment }>(`/api/admin/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function fetchDocuments() {
  return request<{ documents: AdminDocument[] }>('/api/admin/documents')
}

export function fetchJobs() {
  return request<{ jobs: unknown[] }>('/api/admin/jobs')
}

export async function fetchSlots(date: string) {
  try {
    const res = await fetch(`${API_BASE}/api/appointments/slots?date=${encodeURIComponent(date)}`)
    const data = (await res.json()) as { ok: boolean; slots?: Slot[]; error?: string }
    if (!res.ok || !data.ok) {
      return { ok: false as const, error: data.error || `Erreur ${res.status}` }
    }
    return { ok: true as const, slots: data.slots || [] }
  } catch {
    return { ok: false as const, error: 'Créneaux indisponibles.' }
  }
}

export async function bookPublicAppointment(body: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/api/appointments/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as {
      ok: boolean
      appointment?: AdminAppointment
      error?: string
    }
    if (!res.ok || !data.ok) {
      return { ok: false as const, error: data.error || `Erreur ${res.status}` }
    }
    return { ok: true as const, appointment: data.appointment! }
  } catch {
    return { ok: false as const, error: 'Serveur injoignable pour le RDV.' }
  }
}
