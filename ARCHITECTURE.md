# UFK Tools — System Architecture & Technical Specifications

## 1. High-Level System Architecture

UFK Tools is designed specifically for **maximum cost-efficiency and single-VPS self-hosting**. It decouples browser-executable tasks from heavy system tasks to guarantee low memory usage and smooth scalability.

```
                      +------------------------------------------+
                      |         User Browser / Client            |
                      |  (Desktop, Tablet, Mobile Web Browser)   |
                      +------------------------------------------+
                                     |             |
           Static Assets & Pages     |             | Tool Operations
             (SSR / SSG / RSC)       |             | (Client-side when possible)
                                     v             v
                      +------------------------------------------+
                      |       Reverse Proxy (Nginx / Caddy)      |
                      |        SSL (Let's Encrypt / Certbot)     |
                      +------------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               | Port 3000 (HTTP)                          | Port 8000 (HTTP)
               v                                           v
+-------------------------------+             +-------------------------------+
|      Next.js 15 App Router    |             |  Python FastAPI Microservice  |
|  - UI & React Server Comps    |             |  (Document Processing Engine) |
|  - Public SEO Routes          |             |  - LibreOffice Headless       |
|  - Realtime SSE Broadcaster   |             |  - Ghostscript Compressor     |
|  - Admin Auth & Dashboard API |             |  - Tesseract OCR (ocrmypdf)   |
|  - Client Asset Bundles       |             |  - pdf2docx / camelot / openpy|
+-------------------------------+             +-------------------------------+
       |                 |                                   |
       | Queries         | Local FS (Admin Media)            | Ephemeral Temp Files
       v                 v                                   v
+--------------+  +-------------------+               +--------------------+
|  PostgreSQL  |  | /public/uploads/  |               |  /tmp/ufk-jobs/    |
|  Database    |  | (Featured Images) |               |  (Auto-deleted)    |
+--------------+  +-------------------+               +--------------------+
```

---

## 2. Technology Stack Breakdown & Rationales

### Frontend & Core Application
- **Next.js 15 (App Router)**: Provides optimal SEO with Server Components, fast page transitions, API routes, and built-in image optimization without additional server costs.
- **TypeScript**: Ensures type safety across all file operations, API contracts, and form states.
- **Tailwind CSS**: Zero runtime CSS overhead, responsive utility design system inspired by iLovePDF and modern SaaS products.
- **Lucide React**: Clean, lightweight icons for all categories, tools, and actions.
- **pdf-lib & PDF.js (`pdfjs-dist`)**: Complete client-side PDF inspection, merging, splitting, page rotation, deletion, and canvas rendering without contacting the server.

### Backend & Microservices
- **Next.js Server Actions & Route Handlers**:
  - Handles admin authentication, post publishing, and Server-Sent Events (SSE) broadcasting.
  - Caches third-party data (e.g., currency rates).
- **FastAPI (Python 3.11+)**:
  - Lightweight, high-throughput microservice strictly dedicated to complex document transformations.
  - Integrates directly with mature open-source binary packages (`libreoffice-nogui`, `ghostscript`, `tesseract-ocr`, `qpdf`).
- **PostgreSQL 16**:
  - Robust, relational database running locally on the VPS.
  - Low memory footprint (~30–50MB RAM idle).

---

## 3. Real-Time Architecture: Server-Sent Events (SSE)

Instead of running a heavy WebSocket server or paying for cloud Pub/Sub services (Pusher/Ably), UFK Tools uses **Server-Sent Events (SSE)** over standard HTTP:

1. **Client Connection**: When a user lands on the homepage, a lightweight `EventSource('/api/sse/featured')` connection is opened.
2. **Event Dispatcher**: An in-memory event emitter in the Next.js runtime broadcasts `new_featured_content` payloads when the admin publishes or updates a featured post.
3. **Automatic Reconnection**: Browsers automatically handle reconnection with exponential backoff.
4. **Zero State Overhead**: SSE does not maintain bidirectional socket queues, keeping server RAM minimal.
5. **Database Source of Truth**: All featured updates are persisted in PostgreSQL before the SSE event is emitted. Reloading the page or visiting later always loads the active record directly from PostgreSQL.

---

## 4. PostgreSQL Database Schema

```sql
-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Picture / Fact of the Day table
CREATE TABLE IF NOT EXISTS featured_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    fact TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_filename VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(500),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index to ensure fast featured post retrieval and single active featured item
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_featured_post 
ON featured_posts (is_featured) 
WHERE is_featured = TRUE;

-- Currency Rates Cache table
CREATE TABLE IF NOT EXISTS currency_rates_cache (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'LATEST_RATES'
    base_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    rates_json JSONB NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Audit Logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Transactional Featured Post Switch
To guarantee that only one item is featured at any time, updates execute inside a database transaction:
```sql
BEGIN;
  UPDATE featured_posts SET is_featured = FALSE WHERE is_featured = TRUE;
  UPDATE featured_posts SET is_featured = TRUE, published_at = CURRENT_TIMESTAMP WHERE id = $1;
COMMIT;
```

---

## 5. Security & Privacy Architecture

1. **Zero Document Retention for Public Users**:
   - Client-processed documents never touch the server disk or network.
   - Server-processed documents are stored in `/tmp/ufk-jobs/[job_id]/` with unique, non-guessable UUIDs.
   - As soon as the output is streamed to the user, files are permanently deleted.
   - A background cron process wipes any orphaned temporary files older than 15 minutes.
2. **Admin Authentication & Protected Routes**:
   - Strong password hashing via `Argon2id` or `bcrypt` (work factor 12).
   - Secure HttpOnly, SameSite=Strict, Secure cookies storing encrypted session tokens.
   - Middleware on `/admin/*` routes intercepting unauthenticated requests and redirecting to `/admin/login`.
3. **Upload Security**:
   - Strict MIME-type sniffing (validating magic bytes, not just file extensions).
   - Maximum upload limits (e.g., 10MB for featured images, 25MB for document conversions).
   - Images re-encoded to WebP format to strip malicious EXIF metadata.
4. **Sandboxed Command Execution**:
   - System binary calls (LibreOffice, Ghostscript) execute with strict CPU/time caps (e.g., max 30s timeout) to prevent DoS via decompression bombs.

---

## 6. Resource Consumption Analysis & Low-Cost VPS Tuning

### Target Specs: Affordable VPS (2GB RAM, 1 vCPU, 40GB SSD)

| Service | Idle RAM | Peak RAM under load | Optimization Strategy |
|---|---|---|---|
| **Next.js Node Process** | ~80 MB | ~180 MB | Standalone output build mode, garbage collection tuning. |
| **Python FastAPI Process** | ~45 MB | ~90 MB | Single worker with `uvicorn`, async non-blocking handlers. |
| **PostgreSQL 16** | ~35 MB | ~80 MB | Tuned `shared_buffers = 128MB`, `work_mem = 4MB`. |
| **LibreOffice Headless** | 0 MB (spawns on demand) | ~200–350 MB | Concurrency semaphore = 1; terminates immediately after conversion. |
| **Ghostscript / Tesseract**| 0 MB (spawns on demand) | ~150–400 MB | Concurrency semaphore = 1; page limit capped at 10 pages per run. |
| **Operating System & Nginx**| ~120 MB | ~180 MB | Lean Ubuntu Server LTS with Nginx caching static assets. |
| **Total Estimated Footprint**| **~280 MB** | **~1.1 GB** | **Comfortably operates within a 2GB VPS (with a 2GB swapfile as a buffer).** |
