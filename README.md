# PDFflex

A privacy-first PDF toolbox with a focused, responsive interface for everyday document work.

## Features

The app currently exposes 18 working tools:

- JPG and PNG to PDF
- DOCX to PDF (server-side text-preserving conversion)
- PDF to DOCX (server-side selectable-text extraction)
- Merge PDF files
- Split a PDF into a ZIP of page PDFs
- Remove the first page
- Extract the first page
- Rotate PDF pages
- PDF to JPG ZIP export
- Repair and compression
- Organize, crop, rotate, watermark, and page numbering
- PDF form-field creation
- PDF comparison metadata
- PDF to Markdown text extraction
- File validation, progress feedback, and downloads

The catalog hides tools that are not implemented yet, so users cannot download fake or incorrectly renamed files. DOCX conversion is intentionally text-focused: complex Word layouts, scanned PDFs, tables, and embedded media need dedicated rendering/OCR engines and are not silently presented as fully preserved.

## Run Locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev:full
```

Open the local URL printed by Vite. `dev:full` starts both the Vite frontend and the PDF API on port `3001`.

To run them separately:

```bash
npm run server
npm run dev
```

The backend endpoint is `POST /api/convert` with a `tool` field and one or more `files` fields. It performs JPG to PDF, DOCX to PDF, PDF to DOCX, merge, split, remove, extract, rotate, repair, compression, organize/normalize, page numbering, watermarking, cropping, form-field creation, comparison metadata, and PDF-to-Markdown text extraction with real file processing.

## Production Build

```bash
npm run build
npm run preview
```

## Deploy To GitHub Pages

1. Create a public repository named `pdf-flex` on GitHub.
2. Push this project to the repository's `main` branch.
3. In GitHub, open **Settings > Pages**.
4. Set the source to **GitHub Actions**.
5. The workflow in `.github/workflows/deploy.yml` will publish the static app automatically after each push to `main`.

GitHub Pages cannot run the Node PDF API. For server-side processing in production, deploy `server/index.js` separately on a Node host and proxy `/api` to it. The static app still includes browser fallbacks for the original browser-safe tools, while Word conversion requires the API.

For a practical GitHub setup, keep the frontend on GitHub Pages and deploy the API to Render, Railway, Fly.io, or a small VPS. Set the API's CORS allowlist to the Pages origin, add rate limiting and object-storage cleanup before accepting public traffic, and keep uploads in memory or ephemeral storage only. Never commit sample documents, secrets, generated PDFs, or `.env` files.

Your site will be available at:

`https://YOUR-GITHUB-USERNAME.github.io/pdf-flex/`

## Project Structure

- `src/main.ts`: tool catalog, upload flow, conversion logic, and downloads
- `src/style.css`: responsive visual design
- `server/index.js`: Node PDF processing API
- `.github/workflows/deploy.yml`: GitHub Pages deployment
- `vite.config.ts`: relative asset paths for Pages hosting

## License

MIT. See [LICENSE](LICENSE).
