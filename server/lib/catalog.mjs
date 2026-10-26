/** Indicative Tunisia catalog — mirrored for PDF / WhatsApp automation */

export const PAINT_COLORS = [
  { id: 'blanc', name: 'Blanc Glacier', hex: '#f4f5f7' },
  { id: 'noir', name: 'Noir Obsidienne', hex: '#111418' },
  { id: 'argent', name: 'Argent Métallisé', hex: '#9aa3ad' },
  { id: 'gris', name: 'Gris Graphite', hex: '#4a525c' },
  { id: 'rouge', name: 'Rouge JAC', hex: '#e30613' },
]

export const QUOTE_OPTIONS = [
  { id: 'couvre-benne', label: 'Couvre-benne' },
  { id: 'barres', label: 'Barres de toit / roll-bar' },
  { id: 'tapis', label: 'Tapis & protections' },
  { id: 'alarme', label: 'Alarme / antivol' },
]

export const QUOTE_PACKAGES = {
  T8: {
    modele: 'T8',
    priceFromDt: 95_000,
    priceLabel: 'à partir de 95 000 DT',
    version: 'Pickup double cabine',
    drive: '4×2 / 4×4 (selon version)',
    engine: 'Motorisation selon configuration Tunisie',
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
    stockLabel: 'Stock à confirmer',
    note: 'Prix indicatif Tunisie — confirmation stock, options et version exacte en showroom.',
    warranty: 'Garantie constructeur — détail en showroom / après-vente',
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
    stockLabel: 'Disponible showroom',
    note: 'Prix catalogue indicatif Tunisie (105 000 DT) — hors options, sous réserve de stock.',
    warranty: 'Garantie constructeur — détail en showroom / après-vente',
  },
}

export function colorName(id) {
  return PAINT_COLORS.find((c) => c.id === id)?.name ?? null
}

export function optionLabels(ids = []) {
  return ids
    .map((id) => QUOTE_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean)
}

export function formatDt(amount) {
  return `${Number(amount).toLocaleString('fr-TN')} DT`
}

export function toE164(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (/^216\d{8}$/.test(digits)) return digits
  if (/^[2-9]\d{7}$/.test(digits)) return `216${digits}`
  return null
}
