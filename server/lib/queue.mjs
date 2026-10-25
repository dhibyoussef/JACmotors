import { loadJobs, saveJobs } from './store.mjs'

/** Persistent delayed job runner (survives restarts via jobs.json) */

const timers = new Map()
let handler = null

export function setJobHandler(fn) {
  handler = fn
}

export async function enqueueJob(job) {
  const jobs = await loadJobs()
  jobs.push(job)
  await saveJobs(jobs)
  schedule(job)
  return job
}

function schedule(job) {
  if (timers.has(job.id)) return
  const delay = Math.max(0, new Date(job.runAt).getTime() - Date.now())
  const timer = setTimeout(async () => {
    timers.delete(job.id)
    if (!handler) return
    try {
      await handler(job)
      await markDone(job.id, 'done')
    } catch (err) {
      console.error(`[queue] job ${job.id} failed`, err)
      await markDone(job.id, 'failed', String(err?.message || err))
    }
  }, delay)
  timers.set(job.id, timer)
  console.log(`[queue] scheduled ${job.id} in ${Math.round(delay / 1000)}s`)
}

async function markDone(id, status, error) {
  const jobs = await loadJobs()
  const next = jobs.map((j) =>
    j.id === id
      ? { ...j, status, error: error || null, finishedAt: new Date().toISOString() }
      : j,
  )
  await saveJobs(next)
}

export async function restoreJobs() {
  const jobs = await loadJobs()
  const pending = jobs.filter((j) => j.status === 'pending')
  for (const job of pending) schedule(job)
  console.log(`[queue] restored ${pending.length} pending job(s)`)
  return pending.length
}

export async function listJobs(limit = 50) {
  const jobs = await loadJobs()
  return jobs.slice(-limit).reverse()
}
