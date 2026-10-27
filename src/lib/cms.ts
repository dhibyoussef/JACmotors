/** Live Directus CMS client — falls back to static site data when offline */

import {
  models as staticModels,
  showrooms as staticShowrooms,
  type CarModel,
  type Showroom,
} from '../data/content'
import { QUOTE_PACKAGES, type QuoteModel } from './quotes'

const CMS_BASE = (import.meta.env.VITE_CMS_BASE || '/cms').replace(/\/$/, '')

export type CmsSiteSettings = {
  whatsapp_display: string
  hero_title: string
  hero_lead: string
  announcement: string
}

export type CmsFaq = {
  id: number | string
  question: string
  answer: string
  sort?: number
}

export type CmsVehicle = {
  id: number | string
  name: string
  slug: string
  tagline?: string
  price_label?: string
  drive?: string
  stock_label?: string
  highlights?: string | string[]
  published?: number | boolean
}

export type CmsBundle = {
  live: boolean
  settings: CmsSiteSettings
  faqs: CmsFaq[]
  showrooms: Showroom[]
  vehicles: CmsVehicle[]
  priceByModel: Partial<Record<QuoteModel, string>>
}

const defaultSettings: CmsSiteSettings = {
  whatsapp_display: '+216 99 757 218',
  hero_title: 'Le pickup qui prend la route au sérieux.',
  hero_lead:
    'JAC T8 PRO disponible en Tunisie. Devis PDF automatique, essai et Meet.',
  announcement: 'Devis PDF automatique · Essai sur RDV',
}

function parseHighlights(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      return raw
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

async function getItems<T>(collection: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${CMS_BASE}/items/${collection}?limit=100`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { data?: T | T[] }
    if (Array.isArray(data.data)) return data.data
    if (data.data) return [data.data]
    return []
  } catch {
    return null
  }
}

function mapShowrooms(rows: Array<Record<string, unknown>> | null): Showroom[] {
  if (!rows?.length) return staticShowrooms
  return rows
    .filter((r) => r.published === 1 || r.published === true || r.published == null)
    .map((r) => {
      const slug = String(r.slug || '').trim()
      const fallback = staticShowrooms.find(
        (s) =>
          s.id === slug ||
          s.name.toLowerCase() === String(r.name || '').toLowerCase() ||
          s.city.toLowerCase() === String(r.city || '').toLowerCase(),
      )
      return {
        id: slug || fallback?.id || `cms-${r.id}`,
        name: String(r.name || fallback?.name || 'Showroom'),
        city: String(r.city || fallback?.city || ''),
        address: String(r.address || fallback?.address || ''),
        phone: String(r.phone || fallback?.phone || ''),
        hours: String(r.hours || fallback?.hours || ''),
        rating: fallback?.rating,
        reviewCount: fallback?.reviewCount,
        type: (String(r.type || fallback?.type || 'showroom') as Showroom['type']),
      }
    })
}

export async function fetchCmsBundle(): Promise<CmsBundle> {
  const [settingsRows, faqRows, showroomRows, vehicleRows] = await Promise.all([
    getItems<CmsSiteSettings>('site_settings'),
    getItems<CmsFaq>('faqs'),
    getItems<Record<string, unknown>>('showrooms'),
    getItems<CmsVehicle>('vehicles'),
  ])

  const live = Boolean(
    settingsRows || faqRows || showroomRows || vehicleRows,
  )

  const settings = {
    ...defaultSettings,
    ...(settingsRows?.[0] || {}),
  }

  const faqs = (faqRows || [])
    .filter((f) => f.question && f.answer)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))

  const vehicles = (vehicleRows || []).filter(
    (v) => v.published === 1 || v.published === true || v.published == null,
  )

  const priceByModel: Partial<Record<QuoteModel, string>> = {}
  for (const v of vehicles) {
    const name = String(v.name || '')
    if (name === 'T8' || name === 'T8 PRO') {
      if (v.price_label) priceByModel[name] = v.price_label
    }
  }

  return {
    live,
    settings,
    faqs,
    showrooms: mapShowrooms(showroomRows),
    vehicles,
    priceByModel,
  }
}

export function modelWithCms(model: CarModel, vehicles: CmsVehicle[]): CarModel {
  const hit = vehicles.find(
    (v) =>
      v.slug === model.id ||
      String(v.name).toLowerCase() === model.name.toLowerCase(),
  )
  if (!hit) return model
  const highlights = parseHighlights(hit.highlights)
  return {
    ...model,
    tagline: hit.tagline || model.tagline,
    drive: hit.drive || model.drive,
    features: highlights.length ? highlights : model.features,
  }
}

export function priceLabelFor(
  modele: QuoteModel,
  priceByModel: Partial<Record<QuoteModel, string>>,
): string {
  return priceByModel[modele] || QUOTE_PACKAGES[modele].priceLabel
}

export { staticModels, staticShowrooms, defaultSettings }
