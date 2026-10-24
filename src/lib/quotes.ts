/** Commercial quote catalog for WhatsApp devis (indicative Tunisia pricing) */

export type QuoteModel = 'T8' | 'T8 PRO'

export type FinancingExample = {
  apportPct: number
  durationMonths: number
  /** Indicative monthly payment in DT (not contractual) */
  monthlyFromDt: number
}

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
  note: string
  warranty: string
  availability: string
}

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
    note: 'Prix indicatif Tunisie — confirmation stock, options et version exacte en showroom.',
    warranty: 'Garantie constructeur — détail en showroom',
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
    note: 'Prix catalogue indicatif Tunisie (105 000 DT) — hors options, sous réserve de stock et confirmation concessionnaire.',
    warranty: 'Garantie constructeur — détail en showroom',
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
