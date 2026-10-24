/** Commercial quote catalog for WhatsApp devis (indicative Tunisia pricing) */

export type QuoteModel = 'T8' | 'T8 PRO'

export type FinancingExample = {
  apportPct: number
  durationMonths: number
  /** Indicative monthly payment in DT (not contractual) */
  monthlyFromDt: number
}

export type PaintColor = {
  id: string
  name: string
  hex: string
  /** Light text on dark paint */
  light?: boolean
}

export type QuoteOption = {
  id: string
  label: string
  detail: string
}

export type StockStatus = 'disponible' | 'sur_commande' | 'a_confirmer'

export type QuotePackage = {
  modele: QuoteModel
  priceFromDt: number
  priceLabel: string
  version: string
  drive: string
  engine: string
  highlights: string[]
  specs: string[]
  included: string[]
  financingExamples: FinancingExample[]
  colors: PaintColor[]
  options: QuoteOption[]
  stock: StockStatus
  stockLabel: string
  note: string
  warranty: string
  availability: string
}

export const PAINT_COLORS: PaintColor[] = [
  { id: 'blanc', name: 'Blanc Glacier', hex: '#f4f5f7' },
  { id: 'noir', name: 'Noir Obsidienne', hex: '#111418', light: true },
  { id: 'argent', name: 'Argent Métallisé', hex: '#9aa3ad' },
  { id: 'gris', name: 'Gris Graphite', hex: '#4a525c', light: true },
  { id: 'rouge', name: 'Rouge JAC', hex: '#e30613', light: true },
]

export const QUOTE_OPTIONS: QuoteOption[] = [
  {
    id: 'couvre-benne',
    label: 'Couvre-benne',
    detail: 'Protection bennette (selon dispo showroom)',
  },
  {
    id: 'barres',
    label: 'Barres de toit / roll-bar',
    detail: 'Accessoire lifestyle / utilitaire',
  },
  {
    id: 'tapis',
    label: 'Tapis & protections',
    detail: 'Habitacle + bac de benne',
  },
  {
    id: 'alarme',
    label: 'Alarme / antivol',
    detail: 'Sécurisation véhicule',
  },
]

export const QUOTE_PACKAGES: Record<QuoteModel, QuotePackage> = {
  T8: {
    modele: 'T8',
    priceFromDt: 95_000,
    priceLabel: 'à partir de 95 000 DT',
    version: 'Pickup double cabine',
    drive: '4×2 / 4×4 (selon version)',
    engine: 'Motorisation selon configuration Tunisie (à confirmer showroom)',
    highlights: [
      'Double cabine utilitaire / lifestyle',
      'Versions 4×2 et 4×4',
      'Grille hexagonale JAC',
      'Disponible via le réseau Tunisie',
    ],
    specs: [
      'Carrosserie : pickup double cabine',
      'Transmission : 4×2 / 4×4',
      'Usage : commercial & quotidien',
    ],
    included: [
      'Garantie constructeur selon conditions JAC Tunisie',
      'Livraison / mise à disposition en showroom',
      'Présentation véhicule & essai sur RDV',
    ],
    financingExamples: [
      { apportPct: 30, durationMonths: 48, monthlyFromDt: 1_450 },
      { apportPct: 40, durationMonths: 60, monthlyFromDt: 1_050 },
    ],
    colors: PAINT_COLORS,
    options: QUOTE_OPTIONS,
    stock: 'a_confirmer',
    stockLabel: 'Stock à confirmer',
    note: 'Prix indicatif Tunisie — confirmation stock, options et version exacte en showroom.',
    warranty: 'Garantie constructeur — détail en showroom / page Après-vente',
    availability: 'Sous réserve de stock — délai confirmé par le conseiller',
  },
  'T8 PRO': {
    modele: 'T8 PRO',
    priceFromDt: 105_000,
    priceLabel: '105 000 DT',
    version: 'Double Cabine · 2.0 L CTI Diesel · 4×4',
    drive: 'RWD / 4WD · boîte 6MT',
    engine: '2.0 CTI Diesel · 139 ch · 320 Nm',
    highlights: [
      'Design Rome Shield · jantes 18″',
      'Phares xénon + LED DRL',
      'Sellerie cuir · écran 7″',
      'Caméra de recul / 360° HD',
      'ESP Bosch · airbags · TPMS',
      'Garde au sol 220 mm · gué max. 1,2 m',
    ],
    specs: [
      'Dimensions : 5325 × 1880 × 1830 mm',
      'Empattement : 3090 mm',
      'Bennette : 1520 × 1520 × 470 mm',
      'Pneus : 265/60 R18',
      'Réservoir : 76 L',
      'Puissance : 139 ch · Couple : 320 Nm',
    ],
    included: [
      'Prix catalogue indicatif véhicule neuf',
      'Garantie constructeur selon conditions JAC Tunisie',
      'Présentation / essai showroom sur RDV',
      'Étude financement possible (selon profil)',
    ],
    financingExamples: [
      { apportPct: 30, durationMonths: 48, monthlyFromDt: 1_620 },
      { apportPct: 40, durationMonths: 60, monthlyFromDt: 1_180 },
    ],
    colors: PAINT_COLORS,
    options: QUOTE_OPTIONS,
    stock: 'disponible',
    stockLabel: 'Disponible showroom',
    note: 'Prix catalogue indicatif Tunisie (105 000 DT) — hors options, sous réserve de stock et confirmation concessionnaire.',
    warranty: 'Garantie constructeur — détail en showroom / page Après-vente',
    availability: 'Sous réserve de stock — délai confirmé par le conseiller',
  },
}

export function formatDt(amount: number): string {
  return `${amount.toLocaleString('fr-TN')} DT`
}

export function devisRef(): string {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DEV-${stamp}-${rand}`
}

export function wantsFinancing(besoin: string): boolean {
  return /financ|crédit|credit|leasing|mensual/i.test(besoin)
}

export function colorById(id: string): PaintColor | undefined {
  return PAINT_COLORS.find((c) => c.id === id)
}

export function optionLabels(ids: string[]): string[] {
  return ids
    .map((id) => QUOTE_OPTIONS.find((o) => o.id === id)?.label)
    .filter((label): label is string => Boolean(label))
}

export function stockBadgeClass(stock: StockStatus): string {
  if (stock === 'disponible') return 'stock-badge stock-badge--ok'
  if (stock === 'sur_commande') return 'stock-badge stock-badge--order'
  return 'stock-badge stock-badge--wait'
}
