import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = path.resolve(__dirname, '../data')
export const PDF_DIR = path.join(DATA_DIR, 'pdfs')
export const OUTBOX_DIR = path.join(DATA_DIR, 'outbox')
const LEADS_FILE = path.join(DATA_DIR, 'leads.json')
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json')

async function ensure() {
  await mkdir(PDF_DIR, { recursive: true })
  await mkdir(OUTBOX_DIR, { recursive: true })
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

async function writeJson(file, value) {
  await ensure()
  await writeFile(file, JSON.stringify(value, null, 2), 'utf8')
}

export async function initStore() {
  await ensure()
  if (!(await readJson(LEADS_FILE, null))) await writeJson(LEADS_FILE, [])
  if (!(await readJson(JOBS_FILE, null))) await writeJson(JOBS_FILE, [])
}

export async function saveLead(lead) {
  await ensure()
  const leads = await readJson(LEADS_FILE, [])
  leads.unshift(lead)
  await writeJson(LEADS_FILE, leads.slice(0, 500))
  return lead
}

export async function listLeads(limit = 50) {
  const leads = await readJson(LEADS_FILE, [])
  return leads.slice(0, limit)
}

export async function saveJobs(jobs) {
  await writeJson(JOBS_FILE, jobs)
}

export async function loadJobs() {
  return readJson(JOBS_FILE, [])
}

export async function writeOutbox(name, payload) {
  await ensure()
  const file = path.join(OUTBOX_DIR, name)
  await writeFile(file, typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
  return file
}

export function newId(prefix) {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${stamp}-${rand}`
}
