import cors from 'cors'
import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 20 },
})
const supportedTools = new Set(['JPG to PDF', 'WORD to PDF', 'PDF to WORD', 'Merge PDF', 'Split PDF', 'Remove pages', 'Extract pages', 'Rotate PDF', 'Repair PDF', 'Compress PDF', 'Organize PDF', 'Add page numbers', 'Add watermark', 'Crop PDF', 'PDF Forms', 'Compare PDF', 'PDF to Markdown'])

app.use(cors())
app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'pdf-flex-api' }))

const pdfResponse = (response, bytes, filename) => response.type('application/pdf').attachment(filename).send(Buffer.from(bytes))
const getPdf = (file) => PDFDocument.load(file.buffer)
const savePdf = async (response, document, filename, options = {}) => pdfResponse(response, await document.save(options), filename)
const wrapText = (text, maxCharacters = 88) => { const words = text.split(/\s+/).filter(Boolean); const lines = []; let line = ''; for (const word of words) { if ((line + ' ' + word).trim().length > maxCharacters && line) { lines.push(line); line = word } else line = (line + ' ' + word).trim() } if (line) lines.push(line); return lines }
const docxToPdf = async (file) => { const result = await mammoth.extractRawText({ buffer: file.buffer }); const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); let page = pdf.addPage([595.28, 841.89]); let y = page.getHeight() - 56; const addPageIfNeeded = () => { if (y < 54) { page = pdf.addPage([595.28, 841.89]); y = page.getHeight() - 56 } }; for (const paragraph of result.value.split(/\r?\n/)) { const lines = wrapText(paragraph || ' '); for (const line of lines) { addPageIfNeeded(); page.drawText(line, { x: 48, y, size: 11, font }); y -= 17 } y -= 7 } return pdf.save() }
const pdfToDocx = async (file) => { const document = await pdfjsLib.getDocument({ data: new Uint8Array(file.buffer) }).promise; const children = []; for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) { const page = await document.getPage(pageNumber); const content = await page.getTextContent(); const text = content.items.map((item) => 'str' in item ? item.str : '').join(' ').replace(/\s+/g, ' ').trim(); children.push(new Paragraph({ text: `Page ${pageNumber}`, heading: HeadingLevel.HEADING_1 })); children.push(new Paragraph({ children: [new TextRun(text || '[No selectable text on this page]')] })); } return Packer.toBuffer(new Document({ sections: [{ children }] })) }

app.post('/api/convert', upload.array('files', 20), async (request, response) => {
  const body = request.body || {}
  const tool = String(body.tool || '')
  const files = request.files || []
  if (!supportedTools.has(tool)) return response.status(400).json({ error: 'This tool is not implemented by the backend yet.' })
  if (!files.length) return response.status(400).json({ error: 'Upload at least one file.' })

  try {
    if (tool === 'WORD to PDF') {
      if (files.length !== 1 || !/\.docx$/i.test(files[0].originalname)) return response.status(400).json({ error: 'WORD to PDF accepts one .docx file.' })
      return pdfResponse(response, await docxToPdf(files[0]), 'word-to-pdf.pdf')
    }
    if (tool === 'PDF to WORD') {
      if (files.length !== 1 || files[0].mimetype !== 'application/pdf') return response.status(400).json({ error: 'PDF to WORD accepts one PDF file.' })
      return response.type('application/vnd.openxmlformats-officedocument.wordprocessingml.document').attachment('pdf-to-word.docx').send(await pdfToDocx(files[0]))
    }
    if (tool === 'JPG to PDF') {
      const pdf = await PDFDocument.create()
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) return response.status(400).json({ error: 'JPG to PDF accepts image files only.' })
        const normalizedImage = await sharp(file.buffer).png().toBuffer()
        const image = await pdf.embedPng(normalizedImage)
        const page = pdf.addPage([595.28, 841.89])
        const scale = Math.min((page.getWidth() - 48) / image.width, (page.getHeight() - 48) / image.height)
        page.drawImage(image, { x: (page.getWidth() - image.width * scale) / 2, y: (page.getHeight() - image.height * scale) / 2, width: image.width * scale, height: image.height * scale })
      }
      return pdfResponse(response, await pdf.save(), 'converted-images.pdf')
    }

    const source = await getPdf(files[0])
    if (tool === 'Merge PDF') {
      const output = await PDFDocument.create()
      for (const file of files) {
        const input = await getPdf(file)
        const pages = await output.copyPages(input, input.getPageIndices())
        pages.forEach((page) => output.addPage(page))
      }
      return pdfResponse(response, await output.save(), 'merged.pdf')
    }
    if (tool === 'Rotate PDF') {
      source.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + 90) % 360)))
      return pdfResponse(response, await source.save(), 'rotated.pdf')
    }
    if (tool === 'Repair PDF' || tool === 'Compress PDF' || tool === 'Organize PDF') return savePdf(response, source, `${tool.toLowerCase().replaceAll(' ', '-')}.pdf`, { useObjectStreams: true })
    if (tool === 'Add page numbers') {
      const font = await source.embedFont(StandardFonts.Helvetica)
      source.getPages().forEach((page, index) => page.drawText(`${index + 1}`, { x: page.getWidth() - 36, y: 18, size: 9, font, color: rgb(0.25, 0.25, 0.25) }))
      return savePdf(response, source, 'numbered.pdf')
    }
    if (tool === 'Add watermark') {
      const font = await source.embedFont(StandardFonts.HelveticaBold)
      source.getPages().forEach((page) => page.drawText('PDFflex', { x: page.getWidth() / 2 - 38, y: page.getHeight() / 2, size: 30, font, color: rgb(0.75, 0.75, 0.75), opacity: 0.35, rotate: degrees(35) }))
      return savePdf(response, source, 'watermarked.pdf')
    }
    if (tool === 'Crop PDF') {
      source.getPages().forEach((page) => page.setCropBox(24, 24, Math.max(1, page.getWidth() - 48), Math.max(1, page.getHeight() - 48)))
      return savePdf(response, source, 'cropped.pdf')
    }
    if (tool === 'PDF Forms') {
      const form = source.getForm()
      const field = form.createTextField('pdf_flex_field')
      field.setText('')
      field.addToPage(source.getPages()[0], { x: 48, y: 48, width: 240, height: 24, borderWidth: 1 })
      return savePdf(response, source, 'form.pdf')
    }
    if (tool === 'Compare PDF') {
      if (files.length < 2) return response.status(400).json({ error: 'Upload two PDF files to compare.' })
      const other = await getPdf(files[1])
      return response.type('application/json').attachment('comparison.json').send(JSON.stringify({ first: { pages: source.getPageCount(), title: source.getTitle() || null }, second: { pages: other.getPageCount(), title: other.getTitle() || null }, samePageCount: source.getPageCount() === other.getPageCount(), note: 'Binary and visual page comparison requires a dedicated comparison engine.' }, null, 2))
    }
    if (tool === 'PDF to Markdown') {
      const document = await pdfjsLib.getDocument({ data: new Uint8Array(files[0].buffer) }).promise
      const sections = []
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()
        const text = content.items.map((item) => 'str' in item ? item.str : '').join(' ').replace(/\s+/g, ' ').trim()
        sections.push(`## Page ${pageNumber}\n\n${text}`)
      }
      return response.type('text/markdown').attachment('converted.md').send(`# PDF export\n\n${sections.join('\n\n')}`)
    }
    if (tool === 'Remove pages' || tool === 'Extract pages') {
      const output = await PDFDocument.create()
      const indexes = tool === 'Remove pages' ? source.getPageIndices().slice(1) : source.getPageIndices().slice(0, 1)
      if (!indexes.length) return response.status(400).json({ error: 'The source PDF does not have enough pages for this operation.' })
      const pages = await output.copyPages(source, indexes)
      pages.forEach((page) => output.addPage(page))
      return pdfResponse(response, await output.save(), `${tool.toLowerCase().replaceAll(' ', '-')}.pdf`)
    }
    if (tool === 'Split PDF') {
      const zip = new JSZip()
      for (const [index] of source.getPages().entries()) {
        const output = await PDFDocument.create()
        const [page] = await output.copyPages(source, [index])
        output.addPage(page)
        zip.file(`page-${index + 1}.pdf`, await output.save())
      }
      response.type('application/zip').attachment('split-pages.zip').send(await zip.generateAsync({ type: 'nodebuffer' }))
      return
    }
  } catch (error) {
    console.error(error)
    return response.status(422).json({ error: error instanceof Error ? error.message : 'The file could not be processed. Check that it is a valid supported file.' })
  }
})

const port = Number(process.env.PORT || 3001)
app.listen(port, () => console.log(`PDFflex API running on http://localhost:${port}`))
