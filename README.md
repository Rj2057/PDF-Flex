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
npm run dev
```

Open the local URL printed by Vite.

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
5. The workflow in `.github/workflows/deploy.yml` will publish the app automatically after each push to `main`.

Your site will be available at:

`https://YOUR-GITHUB-USERNAME.github.io/pdf-flex/`

## Project Structure

- `src/main.ts`: tool catalog, upload flow, conversion logic, and downloads
- `src/style.css`: responsive visual design
- `.github/workflows/deploy.yml`: GitHub Pages deployment
- `vite.config.ts`: relative asset paths for Pages hosting

## License

MIT. See [LICENSE](LICENSE).
