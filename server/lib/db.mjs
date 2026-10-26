import pg from 'pg'
import crypto from 'node:crypto'

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://jac:jac_dev_change_me@127.0.0.1:5433/jacmotors'

let pool = null

export function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      max: 8,
      idleTimeoutMillis: 10_000,
    })
  }
  return pool
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const next = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(next, 'hex'))
}

export async function initDb() {
  const client = await getPool().connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        nom TEXT NOT NULL,
        telephone TEXT NOT NULL,
        email TEXT,
        modele TEXT,
        showroom TEXT,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        pdf_url TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
      CREATE INDEX IF NOT EXISTS leads_type_idx ON leads (type);

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        telephone TEXT NOT NULL UNIQUE,
        email TEXT,
        modele TEXT,
        matricule TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS clients_nom_idx ON clients (nom);

      CREATE TABLE IF NOT EXISTS staff_users (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'conseiller',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        nom TEXT NOT NULL,
        telephone TEXT NOT NULL,
        email TEXT,
        modele TEXT,
        matricule TEXT,
        type TEXT NOT NULL DEFAULT 'entretien',
        showroom TEXT,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments (date, time);
      CREATE UNIQUE INDEX IF NOT EXISTS appointments_slot_uidx
        ON appointments (date, time, COALESCE(showroom, ''))
        WHERE status <> 'cancelled';

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        client_id TEXT,
        title TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'devis_pdf',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );
    `)

    const { rows } = await client.query('SELECT COUNT(*)::int AS c FROM staff_users')
    if (rows[0].c === 0) {
      await client.query(
        `INSERT INTO staff_users (id, nom, email, password_hash, role)
         VALUES ($1,$2,$3,$4,'admin')`,
        [
          'USR-ADMIN',
          'JAC Admin',
          'admin@jacmotors.tn',
          hashPassword('JacMotors2026!'),
        ],
      )
    }

    return { ok: true, databaseUrl: DATABASE_URL.replace(/:[^:@/]+@/, ':***@') }
  } finally {
    client.release()
  }
}

export async function insertLead(lead) {
  const q = `
    INSERT INTO leads (id, type, nom, telephone, email, modele, showroom, payload, pdf_url, status, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,COALESCE($11::timestamptz, NOW()))
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      pdf_url = COALESCE(EXCLUDED.pdf_url, leads.pdf_url),
      payload = EXCLUDED.payload
    RETURNING id
  `
  const values = [
    lead.id,
    lead.type || 'lead',
    lead.nom || '',
    lead.telephone || '',
    lead.email || null,
    lead.modele || null,
    lead.showroom || null,
    JSON.stringify(lead),
    lead.pdfUrl || lead.pdf_url || null,
    lead.status || 'new',
    lead.createdAt || null,
  ]
  const { rows } = await getPool().query(q, values)

  // upsert lightweight client
  try {
    await getPool().query(
      `INSERT INTO clients (id, nom, telephone, email, modele)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (telephone) DO UPDATE SET
         nom = EXCLUDED.nom,
         email = COALESCE(EXCLUDED.email, clients.email),
         modele = COALESCE(EXCLUDED.modele, clients.modele),
         updated_at = NOW()`,
      [
        `CLI-${lead.telephone?.replace(/\D/g, '').slice(-8) || Date.now()}`,
        lead.nom,
        lead.telephone,
        lead.email || null,
        lead.modele || null,
      ],
    )
  } catch {
    /* ignore client upsert errors */
  }

  if (lead.pdfUrl || lead.pdf_url) {
    await getPool().query(
      `INSERT INTO documents (id, lead_id, title, file_name, file_url, kind)
       VALUES ($1,$2,$3,$4,$5,'devis_pdf')
       ON CONFLICT (id) DO NOTHING`,
      [
        `DOC-${lead.id}`,
        lead.id,
        `Devis JAC ${lead.modele || ''}`.trim(),
        `${lead.id}-devis.pdf`,
        lead.pdfUrl || lead.pdf_url,
      ],
    )
  }

  return rows[0]
}

export async function listLeadsDb(limit = 100) {
  const { rows } = await getPool().query(
    `SELECT id, type, nom, telephone, email, modele, showroom, payload, pdf_url, status, created_at
     FROM leads ORDER BY created_at DESC LIMIT $1`,
    [limit],
  )
  return rows
}

export async function dbHealth() {
  try {
    const { rows } = await getPool().query(`
      SELECT
        (SELECT COUNT(*)::int FROM leads) AS leads,
        (SELECT COUNT(*)::int FROM clients) AS clients,
        (SELECT COUNT(*)::int FROM appointments) AS appointments,
        (SELECT COUNT(*)::int FROM documents) AS documents,
        (SELECT COUNT(*)::int FROM staff_users) AS users
    `)
    return { ok: true, ...rows[0] }
  } catch (err) {
    return { ok: false, error: String(err?.message || err) }
  }
}

export async function loginStaff(email, password) {
  const { rows } = await getPool().query(
    `SELECT * FROM staff_users WHERE lower(email)=lower($1) AND active=TRUE LIMIT 1`,
    [email],
  )
  const user = rows[0]
  if (!user || !verifyPassword(password, user.password_hash)) return null
  const token = crypto.randomBytes(24).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 12)
  await getPool().query(
    `INSERT INTO admin_sessions (token, user_id, expires_at) VALUES ($1,$2,$3)`,
    [token, user.id, expires.toISOString()],
  )
  return {
    token,
    user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    expiresAt: expires.toISOString(),
  }
}

export async function authStaff(token) {
  if (!token) return null
  const { rows } = await getPool().query(
    `SELECT u.* FROM admin_sessions s
     JOIN staff_users u ON u.id = s.user_id
     WHERE s.token=$1 AND s.expires_at > NOW() AND u.active=TRUE
     LIMIT 1`,
    [token],
  )
  return rows[0]
    ? { id: rows[0].id, nom: rows[0].nom, email: rows[0].email, role: rows[0].role }
    : null
}

export async function listClients(limit = 200) {
  const { rows } = await getPool().query(
    `SELECT * FROM clients ORDER BY updated_at DESC LIMIT $1`,
    [limit],
  )
  return rows
}

export async function upsertClient(input) {
  const id =
    input.id ||
    `CLI-${String(input.telephone || '')
      .replace(/\D/g, '')
      .slice(-8) || Date.now()}`
  const { rows } = await getPool().query(
    `INSERT INTO clients (id, nom, telephone, email, modele, matricule, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (telephone) DO UPDATE SET
       nom=EXCLUDED.nom,
       email=COALESCE(EXCLUDED.email, clients.email),
       modele=COALESCE(EXCLUDED.modele, clients.modele),
       matricule=COALESCE(EXCLUDED.matricule, clients.matricule),
       notes=COALESCE(EXCLUDED.notes, clients.notes),
       updated_at=NOW()
     RETURNING *`,
    [
      id,
      input.nom,
      input.telephone,
      input.email || null,
      input.modele || null,
      input.matricule || null,
      input.notes || null,
    ],
  )
  return rows[0]
}

export async function listUsers() {
  const { rows } = await getPool().query(
    `SELECT id, nom, email, role, active, created_at FROM staff_users ORDER BY created_at`,
  )
  return rows
}

export async function createUser(input) {
  const id = `USR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  const { rows } = await getPool().query(
    `INSERT INTO staff_users (id, nom, email, password_hash, role, active)
     VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING id, nom, email, role, active, created_at`,
    [
      id,
      input.nom,
      input.email,
      hashPassword(input.password || 'JacMotors2026!'),
      input.role || 'conseiller',
    ],
  )
  return rows[0]
}

export async function listAppointments({ from, to, limit = 200 } = {}) {
  const { rows } = await getPool().query(
    `SELECT * FROM appointments
     WHERE ($1::date IS NULL OR date >= $1::date)
       AND ($2::date IS NULL OR date <= $2::date)
     ORDER BY date ASC, time ASC
     LIMIT $3`,
    [from || null, to || null, limit],
  )
  return rows
}

export async function createAppointment(input) {
  const id = `RDV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase()}`
  const client = await upsertClient({
    nom: input.nom,
    telephone: input.telephone,
    email: input.email,
    modele: input.modele,
    matricule: input.matricule,
  })
  const { rows } = await getPool().query(
    `INSERT INTO appointments
      (id, client_id, nom, telephone, email, modele, matricule, type, showroom, date, time, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      id,
      client.id,
      input.nom,
      input.telephone,
      input.email || null,
      input.modele || null,
      input.matricule || null,
      input.type || 'entretien',
      input.showroom || null,
      input.date,
      input.time,
      input.status || 'pending',
      input.notes || null,
    ],
  )
  return rows[0]
}

export async function updateAppointmentStatus(id, status) {
  const { rows } = await getPool().query(
    `UPDATE appointments SET status=$2 WHERE id=$1 RETURNING *`,
    [id, status],
  )
  return rows[0]
}

export async function listDocuments(limit = 100) {
  const { rows } = await getPool().query(
    `SELECT * FROM documents ORDER BY created_at DESC LIMIT $1`,
    [limit],
  )
  return rows
}

export async function dashboardStats() {
  const { rows } = await getPool().query(`
    SELECT
      (SELECT COUNT(*)::int FROM leads) AS leads,
      (SELECT COUNT(*)::int FROM clients) AS clients,
      (SELECT COUNT(*)::int FROM appointments WHERE status <> 'cancelled') AS appointments,
      (SELECT COUNT(*)::int FROM appointments WHERE date = CURRENT_DATE AND status <> 'cancelled') AS today,
      (SELECT COUNT(*)::int FROM documents) AS documents,
      (SELECT COUNT(*)::int FROM staff_users WHERE active) AS users
  `)
  return rows[0]
}

export { hashPassword, verifyPassword }
