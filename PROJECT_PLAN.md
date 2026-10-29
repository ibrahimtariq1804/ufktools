# UFK Tools — Project Plan & Strategy

## 1. Executive Summary & Vision

**UFK Tools** is a free, high-performance, all-in-one web utility platform offering PDF manipulation, document conversion, image utilities, an interactive CV/resume builder, calculators, and a real-time featured "Picture / Fact of the Day".

- **Brand**: UFK Tools
- **Tagline**: Free PDF, AI, Converter & Productivity Tools
- **Homepage Headline**: All the Online Tools You Need in One Place.
- **Secondary Tagline**: Free Online Tools for Everyone.
- **Target Audience**: Students, professionals, job seekers, and everyday internet users needing fast, private, free utilities without accounts or paywalls.

---

## 2. Core Business Directives & Budget Constraints

1. **Near-Zero Running Cost**:
   - Target Hosting: Single affordable Linux VPS ($5–$10/month, e.g., Hetzner, DigitalOcean, or Linode with 2GB–4GB RAM, 1–2 vCPUs).
   - Zero paid SaaS subscriptions (no paid file-conversion APIs, no subscription AI services, no third-party cloud storage fees).
2. **Client-Side First Philosophy**:
   - Any tool that can run inside the modern browser via WebAssembly or pure JavaScript (pdf-lib, PDF.js, jsPDF, Canvas) **must** run in the user's browser.
   - Benefits: Zero server CPU/RAM usage, zero server bandwidth for file transfers, maximum user privacy.
3. **Server-Side Microservice for Heavy Tasks**:
   - Python FastAPI microservice handling system-level utilities (LibreOffice headless, Ghostscript, Tesseract OCR, qpdf, pdf2docx).
   - Strict worker throttling (max 1–2 concurrent heavy conversions) and automated temporary file cleanup.
4. **No User Accounts Required**:
   - Public tools are 100% friction-free with zero authentication or signup.
   - Authentication is strictly reserved for the private `/admin` dashboard.
5. **Real-Time Highlight**:
   - The "Picture / Fact of the Day" is the homepage's flagship feature.
   - Publishing in `/admin` updates connected visitor homepages instantly via Server-Sent Events (SSE) with zero manual deployments or page refreshes.

---

## 3. Tool Classification & Processing Architecture

| # | Tool Name | Category | Processing Layer | Engine / Libraries | Limitations & Expected Fidelity |
|---|---|---|---|---|---|
| 1 | **Make Your CV / Resume** | CV & Career | Client-Side | React, Tailwind, `@react-pdf/renderer` / `html2canvas`+`jsPDF`, `localStorage` | Clean vector PDF export. Multi-template support. Browser local draft persistence. |
| 2 | **Merge PDF** | PDF Tools | Client-Side | `pdf-lib` (WebAssembly/JS) | Ultra-fast. Up to ~100MB files in browser memory without server cost. |
| 3 | **Split PDF** | PDF Tools | Client-Side | `pdf-lib` | Extract single pages or page ranges instantly. |
| 4 | **Rotate, Reorder & Delete PDF Pages** | PDF Tools | Client-Side | `pdfjs-dist` (thumbnails) + `pdf-lib` (mutation) | Visual drag-and-drop grid. Fast, responsive, 0 server cost. |
| 5 | **JPG to PDF** | Image & File | Client-Side | `pdf-lib` / `jsPDF` | Multi-image reordering, margin & orientation controls. |
| 6 | **PDF to JPG / PNG** | Image & File | Client-Side | `pdfjs-dist` + HTML5 Canvas + `JSZip` | High-DPI canvas rasterization; downloads single images or ZIP bundle. |
| 7 | **Measurement & Volume Converter** | Converters | Client-Side | Pure TypeScript calculation engine | Instant conversion across 8 units (Length, Weight, Temp, Area, Volume, Speed, Time, Data). |
| 8 | **Currency Converter** | Converters | Hybrid | Client UI + Server Route Cache (Frankfurter / Open Exchange Rates free API) | Rates cached on server for 12–24h. 0 client API limit issues. 0 recurring cost. |
| 9 | **Compress PDF** | PDF Tools | Hybrid / Server | Server: `Ghostscript` (`-dPDFSETTINGS=/ebook`) + `qpdf`; Client: Canvas downsampling for image-heavy PDFs | Real stream compression requires Ghostscript. Controlled quality presets (Extreme, Recommended, Low). |
| 10 | **Word to PDF (DOCX to PDF)** | PDF Tools | Server-Side | Python FastAPI + LibreOffice headless | High layout fidelity. Sandboxed processing with automated cleanup. |
| 11 | **Fill & Sign PDF** | PDF Tools | Client-Side | `pdf-lib` (AcroForm fields) + HTML5 Signature Canvas | Digital form completion + freehand signature stamping. |
| 12 | **Unlock / Protect PDF** | PDF Tools | Hybrid | `pdf-lib` (standard AES password) / `qpdf` (owner unlock/decrypt) | Instant client encryption; qpdf handles complex permission removals. |
| 13 | **PDF to Word (PDF to DOCX)** | PDF Tools | Server-Side | Python FastAPI + `pdf2docx` / LibreOffice | Recreates editable tables and paragraphs from digital PDFs. Note: scanned documents require OCR first. |
| 14 | **Edit PDF (Annotations & Overlays)** | PDF Tools | Client-Side | `pdfjs-dist` + Canvas overlay + `pdf-lib` | Adds text overlays, shapes, stamps, highlights, and drawings. (Honest limitation: Does not reflow existing PDF underlying font streams). |
| 15 | **OCR PDF (Searchable PDF)** | PDF Tools | Server-Side | Python FastAPI + `Tesseract OCR` + `pdf2image` + `ocrmypdf` | Produces sandwich PDF (searchable invisible text layer over scan). Strict page limits (e.g. 5–10 pages/job) to protect VPS CPU. |
| 16 | **PDF to Excel (PDF to XLSX)** | PDF Tools | Server-Side | Python FastAPI + `pdfplumber` / `camelot-py` + `openpyxl` | Extracts structured tables to Excel spreadsheets. |
| 17 | **PowerPoint to PDF / PDF to PowerPoint** | PDF Tools | Server-Side | Python FastAPI + LibreOffice (PPTX->PDF) / `python-pptx` (PDF->PPTX slide rasterization/frame layout) | PPTX to PDF has high fidelity; PDF to PPTX places rendered slides into presentation decks. |
| 18 | **Chat with PDF / AI Summarizer** | PDF Tools | Hybrid / Client-Side NLP + Optional BYOK | Client-side text extraction (`pdfjs-dist`) + TextRank / extractive summarizer + Optional BYOK (Bring Your Own Key for OpenAI / Gemini free tier) | **Zero hosting cost risk**. Avoids server crash from running heavy local LLMs on low-RAM VPS. |
| 19 | **Niche Format Converters** | Image & File | Client / Server | Client: Markdown to PDF, TXT to PDF, SVG to PNG/PDF, HTML to PDF; Server: EPUB to PDF | Fast, lightweight converters without expensive engines. |

---

## 4. Phase-by-Phase Implementation Roadmap

- **Phase 0 — Planning & Architecture** *(Current)*
  - Establish complete specifications, architecture documents, database schemas, and folder hierarchies.
  - Await client approval before application code execution.
- **Phase 1 — Complete Frontend Foundation**
  - Next.js 15 App Router setup, Tailwind CSS design system, navigation, footer.
  - Homepage with Hero, Featured Picture/Fact section, Popular Tools, Category Sections, Directory, and Tool Search.
  - Setup all 19 dedicated SEO tool routes with reusable tool layouts, drag-and-drop dropzones, status indicators, and error states.
- **Phase 2 — Admin Panel & Picture / Fact of the Day**
  - PostgreSQL database schema with migration scripts.
  - Secure admin authentication (Argon2 / secure session cookie).
  - Admin dashboard: Image upload (WebP optimization), title, fact, preview, history, publish.
  - Real-time Server-Sent Events (SSE) broadcasting to live homepage visitors without page refresh.
- **Phase 3 — Basic Tools Implementation**
  - 1. Merge PDF | 2. Split PDF | 3. JPG to PDF | 4. PDF to JPG/PNG | 5. Rotate/Reorder/Delete PDF Pages | 6. Measurement Converter | 7. Currency Converter.
  - Full client-side & hybrid processing with verification.
- **Phase 4 — Intermediate Tools Implementation**
  - 1. CV / Resume Builder (interactive editor, multiple templates, vector PDF export).
  - 2. Compress PDF (Ghostscript integration).
  - 3. Word to PDF (LibreOffice headless).
  - 4. Fill & Sign PDF (AcroForms & digital signatures).
  - 5. Unlock / Protect PDF (Password encryption & decryption).
- **Phase 5 — Advanced Tools Implementation**
  - 1. PDF to Word (pdf2docx).
  - 2. Edit PDF (Annotations, text overlays, stamps).
  - 3. OCR PDF (Tesseract + ocrmypdf).
  - 4. PDF to Excel (pdfplumber/openpyxl).
  - 5. PowerPoint to PDF / PDF to PowerPoint.
  - 6. Chat with PDF / AI Summarizer.
  - 7. Niche Format Converters (Markdown, EPUB, TXT, SVG).
- **Phase 6 — Production Readiness & Deployment**
  - Security hardening, rate limiting, temporary file cron sweepers, SEO metadata validation.
  - Complete single-VPS deployment guide (Docker, Nginx reverse proxy, SSL/Certbot, systemd).
