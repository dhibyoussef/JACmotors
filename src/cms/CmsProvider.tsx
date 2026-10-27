import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultSettings,
  fetchCmsBundle,
  type CmsBundle,
  type CmsFaq,
  type CmsSiteSettings,
  type CmsVehicle,
} from '../lib/cms'
import { showrooms as staticShowrooms, type Showroom } from '../data/content'
import type { QuoteModel } from '../lib/quotes'

type CmsContextValue = {
  ready: boolean
  live: boolean
  settings: CmsSiteSettings
  faqs: CmsFaq[]
  showrooms: Showroom[]
  vehicles: CmsVehicle[]
  priceByModel: Partial<Record<QuoteModel, string>>
  refresh: () => Promise<void>
}

const CmsContext = createContext<CmsContextValue | null>(null)

const emptyBundle: CmsBundle = {
  live: false,
  settings: defaultSettings,
  faqs: [],
  showrooms: staticShowrooms,
  vehicles: [],
  priceByModel: {},
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<CmsBundle>(emptyBundle)
  const [ready, setReady] = useState(false)

  async function refresh() {
    const next = await fetchCmsBundle()
    setBundle(next)
    setReady(true)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next = await fetchCmsBundle()
      if (!cancelled) {
        setBundle(next)
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<CmsContextValue>(
    () => ({
      ready,
      live: bundle.live,
      settings: bundle.settings,
      faqs: bundle.faqs,
      showrooms: bundle.showrooms.length ? bundle.showrooms : staticShowrooms,
      vehicles: bundle.vehicles,
      priceByModel: bundle.priceByModel,
      refresh,
    }),
    [bundle, ready],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) {
    return {
      ready: true,
      live: false,
      settings: defaultSettings,
      faqs: [] as CmsFaq[],
      showrooms: staticShowrooms,
      vehicles: [] as CmsVehicle[],
      priceByModel: {} as Partial<Record<QuoteModel, string>>,
      refresh: async () => undefined,
    }
  }
  return ctx
}
