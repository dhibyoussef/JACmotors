import PDFDocument from 'pdfkit'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const RED = '#e30613'
const INK = '#0b0d10'
const STEEL = '#5c6570'

function drawStamp(doc, x, y) {
  doc.save()
  doc.circle(x, y, 42).lineWidth(2.2).strokeColor(RED).stroke()
  doc.circle(x, y, 36).lineWidth(0.8).strokeColor(RED).stroke()
  doc.fillColor(RED).font('Helvetica-Bold').fontSize(8)
  doc.text('JAC MOTORS', x - 28, y - 14, { width: 56, align: 'center' })
  doc.fontSize(7).text('TUNISIE', x - 28, y - 2, { width: 56, align: 'center' })
  doc.fontSize(6).text('DEVIS INDICATIF', x - 30, y + 10, { width: 60, align: 'center' })
  doc.restore()
}

/**
 * Build a professional stamped devis PDF for a lead.
 * @returns {Promise<{ filePath: string, fileName: string }>}
 */
export async function buildDevisPdf(lead, outDir) {
  await mkdir(outDir, { recursive: true })
  const fileName = `${lead.ref || lead.id}-devis.pdf`
  const filePath = path.join(outDir, fileName)

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 56, left: 48, right: 48 },
      info: {
        Title: `Devis JAC ${lead.modele} — ${lead.ref}`,
        Author: 'JAC Motors Tunisie',
        Subject: 'Devis indicatif véhicule neuf',
      },
    })
    const stream = createWriteStream(filePath)
    doc.pipe(stream)

    // Header bar
    doc.rect(0, 0, doc.page.width, 72).fill(INK)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
    doc.text('JAC MOTORS TUNISIE', 48, 22)
    doc.font('Helvetica').fontSize(9).fillColor('#f0b4b8')
    doc.text('Devis professionnel · Pickup T8 / T8 PRO', 48, 46)

    drawStamp(doc, doc.page.width - 78, 88)

    let y = 96
    doc.fillColor(RED).font('Helvetica-Bold').fontSize(11)
    doc.text('DEVIS INDICATIF', 48, y)
    y += 18
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(20)
    doc.text(`JAC ${lead.modele}`, 48, y)
    y += 28

    doc.font('Helvetica').fontSize(10).fillColor(STEEL)
    doc.text(`Référence : ${lead.ref}`, 48, y)
    y += 14
    doc.text(
      `Date : ${new Date().toLocaleDateString('fr-TN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      48,
      y,
    )
    y += 14
    doc.text(`Validité : 7 jours`, 48, y)
    y += 22

    // Client block
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Client', 48, y)
    y += 16
    doc.font('Helvetica').fontSize(10).fillColor(INK)
    const clientLines = [
      `Nom : ${lead.nom}`,
      `Téléphone : ${lead.telephone}`,
      `Showroom : ${lead.showroom}`,
      `Besoin : ${lead.besoin}`,
    ]
    for (const line of clientLines) {
      doc.text(line, 48, y)
      y += 14
    }
    y += 10

    // Price highlight
    doc.roundedRect(48, y, doc.page.width - 96, 58, 8).fill('#f7f8fa')
    doc.fillColor(STEEL).fontSize(8).font('Helvetica-Bold')
    doc.text('PRIX CATALOGUE INDICATIF', 64, y + 12)
    doc.fillColor(RED).fontSize(20).font('Helvetica-Bold')
    doc.text(lead.priceLabel || lead.priceFormatted, 64, y + 26)
    y += 74

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Véhicule', 48, y)
    y += 16
    doc.font('Helvetica').fontSize(10)
    const vehicle = [
      `Version : ${lead.version}`,
      `Transmission : ${lead.drive}`,
      `Motorisation : ${lead.engine}`,
      `Disponibilité : ${lead.stockLabel}`,
      lead.couleur ? `Couleur souhaitée : ${lead.couleur}` : null,
      lead.options?.length ? `Options : ${lead.options.join(', ')}` : 'Options : à discuter en showroom',
      `Garantie : ${lead.warranty}`,
    ].filter(Boolean)
    for (const line of vehicle) {
      doc.fillColor(INK).text(`• ${line}`, 48, y, { width: doc.page.width - 96 })
      y += 14
    }
    y += 12

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Points forts', 48, y)
    y += 16
    doc.font('Helvetica').fontSize(10)
    for (const h of lead.highlights || []) {
      if (y > 720) break
      doc.text(`• ${h}`, 48, y, { width: doc.page.width - 96 })
      y += 14
    }
    y += 12

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Caractéristiques', 48, y)
    y += 16
    doc.font('Helvetica').fontSize(10)
    for (const s of lead.specs || []) {
      if (y > 740) break
      doc.text(`• ${s}`, 48, y, { width: doc.page.width - 96 })
      y += 14
    }

    // Footer
    const footerY = doc.page.height - 48
    doc
      .moveTo(48, footerY - 16)
      .lineTo(doc.page.width - 48, footerY - 16)
      .strokeColor('#d0d4d8')
      .lineWidth(1)
      .stroke()
    doc.fontSize(8).fillColor(STEEL).font('Helvetica')
    doc.text(
      lead.note ||
        'Devis indicatif, non contractuel — prix, options et stock à confirmer en showroom JAC Motors Tunisie.',
      48,
      footerY - 8,
      { width: doc.page.width - 96, align: 'left' },
    )

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  return { filePath, fileName }
}
