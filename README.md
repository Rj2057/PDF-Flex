# PDFflex

A privacy-first PDF toolbox with a focused, responsive interface for everyday document work.

## Features

Browser-supported tools currently include:

- JPG and PNG to PDF
- Merge PDF files
- Split a PDF into a ZIP of page PDFs
- Remove the first page
- Extract the first page
- Rotate PDF pages
- PDF to JPG ZIP export
- File validation, progress feedback, and downloads

The app refuses to create fake outputs for tools that need a server-side processor. Office conversion, OCR, AI, signing, encryption, and advanced editing are prepared in the catalog and can be connected to a backend later.

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

The backend endpoint is `POST /api/convert` with a `tool` field and one or more `files` fields. It performs JPG to PDF, merge, split, remove, extract, rotate, repair, compression, organize/normalize, page numbering, watermarking, cropping, form-field creation, comparison metadata, and PDF-to-Markdown text extraction with real file processing.

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

GitHub Pages cannot run the Node PDF API. For server-side processing in production, deploy `server/index.js` separately on a Node host and proxy `/api` to it. The static app still includes browser fallbacks for the original supported PDF tools.

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
