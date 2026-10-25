import { QUOTE_PACKAGES, colorName, formatDt, optionLabels } from './catalog.mjs'

export function devisAckText({ nom, modele, ref }) {
  const first = String(nom || 'Client').trim().split(/\s+/)[0] || 'Client'
  return [
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    '*DEMANDE DE DEVIS REÇUE*',
    '',
    `Bonjour *${first}*,`,
    '',
    `Merci pour votre demande de devis concernant le *JAC ${modele}*.`,
    '',
    'Votre demande a bien été enregistrée.',
    'Vous recevrez *sous peu* un *document PDF professionnel* (prix, version, couleur, options, conditions) directement sur ce WhatsApp.',
    '',
    `Réf. dossier : *${ref}*`,
    '',
    'Aucune autre action n’est nécessaire de votre côté.',
    'Un conseiller JAC peut vous recontacter pour préciser le stock ou un essai.',
    '',
    '*JAC Motors Tunisie*',
  ].join('\n')
}

export function devisPdfCaption({ nom, modele, ref }) {
  const first = String(nom || 'Client').trim().split(/\s+/)[0] || 'Client'
  return [
    `Bonjour ${first},`,
    '',
    `Voici votre *devis PDF JAC ${modele}* (réf. ${ref}).`,
    'Document indicatif — stock, options et prix définitifs à confirmer en showroom.',
    '',
    'JAC Motors Tunisie',
  ].join('\n')
}

export function visitAckText({ nom, modele, mode, date, time, showroomName, ref, meetUrl }) {
  const first = String(nom || 'Client').trim().split(/\s+/)[0] || 'Client'
  const modeLabel =
    mode === 'meet' ? 'Google Meet' : mode === 'essai' ? 'essai routier' : 'visite showroom'
  return [
    '*JAC MOTORS TUNISIE*',
    '────────────────',
    '*CONFIRMATION DE RENDEZ-VOUS*',
    '',
    `Bonjour *${first}*,`,
    '',
    `Votre demande de *${modeLabel}* pour le *JAC ${modele}* est bien enregistrée.`,
    '',
    `• Réf. : *${ref}*`,
    `• Showroom : ${showroomName}`,
    `• Date : *${date}*`,
    `• Heure : *${time}*`,
    meetUrl ? `• Lien Meet : ${meetUrl}` : null,
    mode === 'essai' ? '• Merci d’apporter un permis de conduire valide.' : null,
    '',
    'Nous vous confirmons le créneau sous peu sur WhatsApp.',
    '',
    '*JAC Motors Tunisie*',
  ]
    .filter(Boolean)
    .join('\n')
}

export function dealerLeadText(lead) {
  const lines = [
    '*JAC MOTORS — NOUVEAU LEAD*',
    '────────────────',
    `Type : *${lead.type}*`,
    `Réf. : *${lead.id}*`,
    `Client : ${lead.nom}`,
    `Tél : ${lead.telephone}`,
    lead.modele ? `Modèle : JAC ${lead.modele}` : null,
    lead.showroom ? `Showroom : ${lead.showroom}` : null,
    lead.besoin ? `Besoin : ${lead.besoin}` : null,
    lead.mode ? `Mode : ${lead.mode}` : null,
    lead.date ? `Quand : ${lead.date} ${lead.time || ''}`.trim() : null,
    lead.couleur ? `Couleur : ${lead.couleur}` : null,
    lead.options?.length ? `Options : ${lead.options.join(', ')}` : null,
    '',
    'PDF / suivi automatisé en cours.',
  ]
  return lines.filter(Boolean).join('\n')
}

export function enrichDevisLead(input, ref) {
  const q = QUOTE_PACKAGES[input.modele] || QUOTE_PACKAGES['T8 PRO']
  const couleur = colorName(input.couleurId)
  const options = optionLabels(input.optionIds || [])
  return {
    ...input,
    ref,
    priceLabel: q.priceLabel,
    priceFromDt: q.priceFromDt,
    priceFormatted: formatDt(q.priceFromDt),
    version: q.version,
    drive: q.drive,
    engine: q.engine,
    highlights: q.highlights,
    specs: q.specs,
    stockLabel: q.stockLabel,
    note: q.note,
    warranty: q.warranty,
    couleur,
    options,
  }
}
