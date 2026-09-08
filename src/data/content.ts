/** Real Tunisia showrooms + official JAC T8 / T8 PRO data & photos */

export type Showroom = {
  id: string
  name: string
  city: string
  address: string
  phone: string
  hours: string
  rating?: number
  reviewCount?: number
  type: 'siege' | 'showroom' | 'atelier'
}

export const showrooms: Showroom[] = [
  {
    id: 'etraton',
    name: 'JAC Motors',
    city: 'Tunis',
    address: 'Immeuble Etraton, Rue Khadija Ben Arfa',
    phone: '50 512 877',
    hours: 'Selon horaires Google / sur place',
    rating: 4.0,
    reviewCount: 13,
    type: 'siege',
  },
  {
    id: 'clh',
    name: 'SHOWROOM CLH MOTORS',
    city: 'Tunis',
    address: 'Tunis — Achats en magasin',
    phone: '79 731 328',
    hours: 'Ouvert · Ferme à 17:30',
    rating: 4.3,
    reviewCount: 4,
    type: 'showroom',
  },
  {
    id: 'benarous',
    name: 'JAC Motors Ben Arous',
    city: 'Ben Arous',
    address: 'Ben Arous',
    phone: '58 554 765',
    hours: 'Ouvert · Ferme à 17:30',
    type: 'showroom',
  },
  {
    id: 'mghira',
    name: 'JAC MOTORS',
    city: 'El Mghira',
    address: '2, Lot n° 97, Zone Industrielle El Mghira',
    phone: '29 402 200',
    hours: 'Selon horaires Google / sur place',
    rating: 3.5,
    reviewCount: 4,
    type: 'atelier',
  },
]

export type Review = {
  id: string
  author: string
  rating: number
  date: string
  text: string
  location: string
  likes?: number
}

/** Avis Google fournis — textes réels uniquement */
export const reviews: Review[] = [
  {
    id: 'r1',
    author: 'Samsung S21',
    rating: 1,
    date: 'il y a 11 mois',
    text: 'Je déconseille fortement l’achat d’un JAC T8. Le véhicule présente de nombreux défauts, aussi bien mécaniques qu’électriques. Le service après-vente est catastrophique : désorganisation totale.',
    location: 'JAC Motors Tunis',
    likes: 1,
  },
  {
    id: 'r2',
    author: 'coulibaly sadio',
    rating: 2,
    date: 'il y a un an',
    text: 'Quel sont les horaires d’ouvertures réelle car toujours fermée le showroom de Tunis.',
    location: 'JAC Motors Tunis',
  },
  {
    id: 'r3',
    author: 'Sabrine Seddik',
    rating: 2,
    date: 'il y a 11 mois',
    text: 'Je tiens à vous faire part de ma déception concernant l’un de vos conseillers. J’ai trouvé son attitude peu professionnelle. Je pense qu’un tel comportement nuit à la satisfaction des clients et à la réputation de votre établissement.',
    location: 'JAC Motors Tunis',
    likes: 1,
  },
  {
    id: 'r4',
    author: 'Youssef Ben Cheikh Larbi',
    rating: 4,
    date: 'il y a 9 mois',
    text: 'Un petit problème pour trouver de la place mais le personnel est très chaleureux et accueillant.',
    location: 'JAC Motors Tunis',
    likes: 1,
  },
  {
    id: 'r5',
    author: 'Ben Hotmen SMC Najeh',
    rating: 5,
    date: 'il y a un mois',
    text: 'Merci beaucoup pour vôtre efforts d’aide.',
    location: 'SHOWROOM CLH MOTORS',
  },
  {
    id: 'r6',
    author: 'ahmed beji',
    rating: 2,
    date: 'il y a 3 mois',
    text: 'Services médiocre pas de respect des délais, pas d’informations clair et exactes. Malheureusement voiture performante SAV nulle.',
    location: 'JAC MOTORS El Mghira',
  },
  {
    id: 'r7',
    author: 'Zied Ben Ayed',
    rating: 3,
    date: 'Modifié il y a 3 semaines',
    text: 'Pour ma première expérience, j’ai trouvé les deux personnes à l’accueil très aimables, professionnels et serviables (un homme et une dame), par contre j’ai noté le manque de personnel opérationnel d’où le mécontentement des clients car les délais de traitement et de service semble être long… La deuxième expérience était moins satisfaisante, 3 heures d’attente pour finalement un simple entretien de routine… Il faut faire un effort pour la propreté des véhicules après intervention…',
    location: 'JAC MOTORS El Mghira',
  },
]

export type CarModel = {
  id: string
  name: string
  officialUrl: string
  tagline: string
  drive: string
  highlight: string
  heroImage: string
  gallery: string[]
  engines: { name: string; detail: string }[]
  specs: { label: string; value: string }[]
  features: string[]
  sourceNote: string
}

/**
 * Photos & specs from official JAC sources:
 * - https://jacen.jac.com.cn/models/t8pro/
 * - https://pickup.jac.com.cn/jhT8/
 * - https://pickup.jac.com.cn/jhT8PRO/
 */
export const models: CarModel[] = [
  {
    id: 't8',
    name: 'T8',
    officialUrl: 'https://pickup.jac.com.cn/jhT8/',
    tagline:
      'Pickup double cabine JAC — version Tunisie 4×4 / RWD. Photos officielles Jianghuai Pickup.',
    drive: '4×2 / 4×4',
    highlight: '江淮 T8 · pickup.jac.com.cn',
    heroImage: '/images/jac/t8-b.jpg',
    gallery: [
      '/images/jac/t8-b.jpg',
      '/images/jac/t8-a.jpg',
      '/images/jac/t8-c.jpg',
      '/images/jac/t8-d.jpg',
      '/images/jac/t8-e.jpg',
      '/images/jac/t8-f.jpg',
    ],
    engines: [
      {
        name: 'Diesel / essence (selon marché)',
        detail:
          'Gamme T8 officielle Chine : versions dont 2.4T essence et variantes diesel — vérifier la config Tunisie en showroom.',
      },
    ],
    specs: [
      { label: 'Carrosserie', value: 'Pickup double cabine' },
      { label: 'Transmission', value: '4×2 / 4×4 (selon version)' },
      { label: 'Positionnement', value: 'Pickup commercial / lifestyle' },
      { label: 'Source photos', value: 'pickup.jac.com.cn/jhT8' },
    ],
    features: [
      'Grille hexagonale JAC',
      'Double cabine',
      'Versions 4×2 et 4×4',
      'Disponible en Tunisie (réseau local)',
    ],
    sourceNote:
      'Images : site officiel Jianghuai Pickup (江淮T8). Configurations exactes Tunisie à confirmer auprès des showrooms listés.',
  },
  {
    id: 't8pro',
    name: 'T8 PRO',
    officialUrl: 'https://jacen.jac.com.cn/models/t8pro/',
    tagline:
      'Full-range update in style, comfort, stability, safety and power — 8th generation international platform.',
    drive: 'RWD / 4WD',
    highlight: 'Official JAC Motors · jacen.jac.com.cn',
    heroImage: '/images/jac/hero-t8pro.jpg',
    gallery: [
      '/images/jac/hero-t8pro.jpg',
      '/images/jac/t8pro-2.jpg',
      '/images/jac/t8pro-1.jpg',
      '/images/jac/t8pro-3.jpg',
      '/images/jac/t8pro-6.jpg',
      '/images/jac/t8pro-8.jpg',
      '/images/jac/t8pro-13.jpg',
      '/images/jac/t8pro-14.jpg',
      '/images/jac/cn-t8pro-a.jpg',
      '/images/jac/cn-t8pro-b.jpg',
    ],
    engines: [
      {
        name: '2.0 CTI Diesel',
        detail:
          'JAC 2.0CTI 4DB2-1D1 · 102 kW (139 PS) / 3600 rpm · 320 Nm / 1600–2600 rpm · 6MT',
      },
      {
        name: '2.0T+ Petrol',
        detail:
          'JAC 2.0T+ 4GA3-4D · 140 kW (190 PS) / 5000 rpm · 290 Nm / 1800–2400 rpm · 6MT',
      },
      {
        name: '2.4T+ Petrol',
        detail:
          'Mitsubishi 4K22 · 155 kW / 5200 rpm · 320 Nm / 2000–4000 rpm · 6MT',
      },
    ],
    specs: [
      { label: 'Dimensions (L×W×H)', value: '5325 × 1880 × 1830 mm' },
      { label: 'Empattement', value: '3090 mm' },
      { label: 'Bennette (L×W×H)', value: '1520 × 1520 × 470 mm' },
      { label: 'Angles app./dép.', value: '30.9° / 23.3°' },
      { label: 'Garde au sol', value: '220 mm' },
      { label: 'Gué max.', value: '1,2 m' },
      { label: 'Roues motrices', value: 'RWD / 4WD' },
      { label: 'Pneus', value: '265/60 R18' },
      { label: 'Réservoir', value: '76 L (2.0) / 74 L (2.4)' },
      { label: 'Boîte', value: '6MT' },
    ],
    features: [
      'Grille agressive — design Rome Shield',
      'Jantes alliage 18″ bicolores',
      'Phares xénon auto + LED DRL',
      'Feux arrière LED Double C',
      'Planche de bord en T · sellerie cuir',
      'Volant multifonction cuir + Bluetooth',
      'Entrée & démarrage sans clé',
      'Écran multi-info 7″',
      'Caméra de recul / 360° HD',
      'EPB + Auto Hold (selon version)',
      'ESP Bosch 9.3 (ABS EBD TCS VDC HBA HAC)',
      'Airbags conducteur & passager · TPMS',
      'Structure cage · acier haute résistance 43%',
    ],
    sourceNote:
      'Spécifications et photos : JAC Motors officiel https://jacen.jac.com.cn/models/t8pro/ — à titre indicatif ; config Tunisie chez le concessionnaire.',
  },
]

export const timeSlots = ['08:30', '10:00', '11:30', '14:00', '15:30'] as const

export const serviceTypes = [
  'Entretien périodique',
  'Vidange & filtres',
  'Freinage',
  'Diagnostic électronique',
  'Climatisation',
  'Autre',
] as const
