# Rank Pilot — AI-Powered SEO Analyzer & Rank Tracker

**Get instant AI-powered SEO audits and automated Google keyword-rank tracking for any website.**

Rank Pilot is a full-stack SaaS-style application that audits any public URL with a real cloud browser and an AI scoring engine, then continuously tracks your keyword rankings on Google with a daily automated cron job. Enter a URL, get a comprehensive SEO report (scores, meta, headings, links, images, keywords, issues), and watch your rankings over time — all in one dashboard.

## Badges

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Frontend: React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Frontend: TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Backend: Express 5](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![AI: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)
![Deploy: Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

## Overview / Problem It Solves

Performing an SEO audit traditionally requires multiple paid tools (SiteAudit, Ahrefs, SEMrush) and a separate rank-tracking subscription. Rank Pilot consolidates both into a single app:

- **Audit:** A real cloud browser (BrowserBase) renders the target page exactly like a user, extracts 25+ technical SEO signals, and Google Gemini scores them into an overall 0–100 grade across **SEO, Performance, Accessibility, and Best Practices** — with actionable, severity-ranked recommendations.
- **Track:** Instead of guessing, it drives a real headless browser through Google SERPs (up to 5 pages / 50 results) to find your exact position for a keyword, records daily history, and lists top-10 competitors.

## Key Features

- **AI-powered SEO audit** — scrape → analyze → report pipeline using BrowserBase cloud sessions + Playwright Core (via CDP) and a Gemini JSON-schema response for structured, predictable output.
- **Comprehensive report** — overall score gauge, 4 category scores (SEO, Performance, Accessibility, Best Practices), meta-tag validation (title/description length checks, OG/Twitter/Canonical/Robots/Viewport), heading hierarchy, internal/external link counts, image alt-text audit, keyword density, load time, page size, and word count.
- **Actionable issues** — 5–15 prioritized issues per audit with `critical` / `warning` / `info` severities and specific fix recommendations.
- **Automated Google rank tracking** — real headless browser searches, handles Google consent walls, paginates up to 5 SERP pages, detects your domain (with www / substring normalization), and extracts the top-10 competitors with titles and snippets.
- **Daily cron updates** — `node-cron` runs at **06:00** every day, updates all active trackings sequentially with randomized **10–15s delays** to avoid Google rate-limiting.
- **Rank history & analytics** — per-day deduplicated rank history, best position, position change, and a hand-rolled **zero-dependency canvas line chart** (HiDPI-aware).
- **Async processing with live UX** — audits return `202` with an analysis ID immediately; the client polls and animates a 4-step progress flow (Connecting → Scanning → AI Analysis → Report Ready).
- **Pause / resume tracking** — toggle any keyword tracking on/off; inactive ones are skipped by the cron.
- **Free vs. Pro plans** — `free` users get **5 analyses/day** (enforced in the UI), `pro` is unlimited.
- **Auth & security** — JWT auth with bcrypt password hashing, tiered **rate limiting** (strict 30 req/15min on analyze & add-keyword), and **SSRF protection** that pre-resolves DNS and blocks all private IPv4/IPv6 ranges before scraping.
- **Polished dark/light UI** — Tailwind 4 theming with a WebGL fluid "splash cursor" background effect, glassmorphism cards, and full mobile responsiveness.
- **Vercel-ready** — SPA rewrites for the client and a serverless entry for the API.

## Tech Stack

### Frontend (`client/`)
- **React 19** + **TypeScript** (strict, `verbatimModuleSyntax`, no unused locals/params)
- **Vite 8** build tooling with `@vitejs/plugin-react`
- **Tailwind CSS 4** (via `@tailwindcss/vite`) + custom CSS-variable theming
- **React Router 7** for routing with protected routes
- **Axios** (shared instance with JWT request interceptor)
- **lucide-react**, **react-hot-toast**, **@icons-pack/react-simple-icons**
- Hand-written **WebGL** fluid simulation for the splash cursor (no animation library)

### Backend (`server/`)
- **Node.js** + **Express 5**
- **MongoDB** via **Mongoose 9** (ODM)
- **Google Gemini** (`@google/genai`) for AI scoring with structured output schemas
- **Browserbase SDK** + **playwright-core** (`chromium.connectOverCDP`) for cloud-browser scraping and SERP automation
- **jsonwebtoken** + **bcrypt** for auth
- **express-rate-limit** for rate limiting
- **node-cron** for the daily rank-tracking job
- **dotenv** for environment configuration

### DevOps / Deployment
- **Vercel** — `vercel.json` in both client (SPA rewrites) and server (`@vercel/node` serverless function)
- **nodemon** for local dev (server hot-reload)

## Architecture / Folder Structure

```
SEO_rank_tracker/
├── client/                        # React SPA (frontend)
│   ├── public/favicon.svg
│   ├── vercel.json                # SPA rewrites for deployment
│   ├── vite.config.ts             # Vite + React + Tailwind, "@" → ./src alias
│   └── src/
│       ├── main.tsx               # Entry: providers + router
│       ├── App.tsx                # Routes + global layout (navbar, splash cursor)
│       ├── index.css              # Tailwind v4 theme, CSS vars, glass/gradient utilities
│       ├── context/
│       │   ├── AppContext.tsx     # Auth state, axios instance + JWT interceptor
│       │   └── ThemeContext.tsx   # dark/light/system theme
│       ├── pages/                 # Home, Login, Dashboard, Analyze, Report,
│       │                          # History, RankTracker, RankDetail
│       ├── components/
│       │   ├── Navbar.tsx, ProtectedRoute.tsx, Loading.tsx
│       │   ├── ScoreGauge.tsx     # SVG circular score gauge
│       │   ├── IssueCard.tsx      # Expandable severity-tagged issue card
│       │   ├── AnalysesCard.tsx   # Dashboard report card
│       │   ├── SplashCursor.tsx   # WebGL fluid background effect
│       │   ├── home/              # Hero, Features, HowItWorks, Pricing, Footer
│       │   └── ui/pixel/animations/pixel-splash-cursor.tsx
│       └── assets/assets.tsx      # Feature copy + dummy data
│
└── server/                        # Express API (backend)
    ├── server.js                  # Entry: middleware, rate limiters, routes, cron start
    ├── vercel.json                # Serverless build config
    ├── config/db.js               # Mongoose connection
    ├── models/                    # User, Analysis, KeywordTracking (Mongoose schemas)
    ├── middleware/auth.js         # JWT bearer verification → req.userId
    ├── routes/                    # authRoutes, analysisRoutes, rankRoutes
    ├── controllers/               # auth, analysis (incl. SSRF guard), rank CRUD
    ├── services/
    │   ├── scrapperService.js     # Browserbase + Playwright page-data extraction
    │   ├── geminiService.js       # Gemini scoring with JSON schema
    │   ├── rankTrackerService.js  # Google SERP scraping + competitor extraction
    │   └── keywordTrackingService.js # Orchestrates rank checks, updates history
    └── cron/
        └── rankTrackingCron.js    # Daily 06:00 job with rate-limit-safe delays
```

### How the modules connect

1. **Request flow** — `server.js` mounts routers under `/api/*`, applies the general limiter globally and a strict limiter to expensive routes (`analyze`, `rank/add`). Every data route runs the `auth` middleware, which decodes the JWT into `req.userId`.
2. **Audit flow (async)** — `POST /api/analysis/analyze` validates/SSRF-checks the URL, creates an `Analysis` doc (`processing`), responds `202 { analysisId }`, then scrapes with Browserbase → sends extracted signals to Gemini → persists scores/issues → flips status to `completed`/`failed`. The client polls `GET /api/analysis/:id`.
3. **Rank flow (async + cron)** — `POST /api/rank/add` creates a `KeywordTracking` doc and kicks off a background check; the cron re-runs all `active` trackings daily. `rankTrackerService` does the SERP crawl; `keywordTrackingService` retries up to 2× with backoff, then updates position/best/change/history/competitors.

## Installation & Setup

> Prerequisites: **Node.js** (LTS, ≥18 recommended) and a **MongoDB** instance (local or Atlas).

### 1. Clone & install

```bash
git clone https://github.com/Altaf-Raja07/Rank-Pilot.git
cd SEO_rank_tracker
```

**Server:**

```bash
cd server
npm install
```

**Client:**

```bash
cd ../client
npm install
```

### 2. Configure environment variables

There is no committed `.env.example`, but the app reads the following variables (create the files from the values listed below):

**`server/.env`**

```env
MONGODB_URI=mongodb://localhost:27017/rankpilot   # or your Atlas connection string
JWT_SECRET=your-secret-key                        # used to sign/verify auth tokens
BROWSERBASE_API_KEY=your-browserbase-key          # https://www.browserbase.com/
GEMINI_API_KEY=your-gemini-key                    # https://aistudio.google.com/
```

**`client/.env`**

```env
VITE_BACKEND_URL=http://localhost:5000            # base URL of the API
```

### 3. Run locally

**Server** (with nodemon hot-reload):

```bash
cd server
npm run server
# or production-style: npm start
```

**Client** (Vite dev server):

```bash
cd client
npm run dev
```

The client runs at `http://localhost:5173` and proxies API calls to the backend at `http://localhost:5000`.

## Usage

1. Open the client → **Sign up / Log in**.
2. From the **Dashboard** or the **Analyze** page, enter any public URL and hit **Analyze**. Watch the live progress steps; you'll be redirected to the report.
3. Review the report across **Overview / Meta Tags / Content / Issues** tabs — scores, heading structure, keyword density, link/image audits, and prioritized fixes.
4. Go to **Rank Tracker** → **Track Keyword**, enter a keyword + your domain URL. The app searches Google (up to page 5), records your position, and lists competitors.
5. Check back daily (the 6:00 AM cron updates rankings), or hit **Refresh** on a keyword to re-check immediately. Use **Rank Detail** for the historical trend chart and full competitor list.
6. Manage everything from **History** (search, filter by status, sort by score/date, paginated) and the **Dashboard** (avg score, scans remaining).

### API reference (all endpoints require `Authorization: Bearer <token>` except auth)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account → returns JWT + user |
| POST | `/api/auth/login` | Login → returns JWT + user |
| GET | `/api/auth/user` | Current user profile |
| POST | `/api/analysis/analyze` | Start audit → `202 { analysisId }` |
| GET | `/api/analysis/:id` | Poll / fetch full report |
| GET | `/api/analysis/list?page=1&limit=10` | Paginated analyses (heavy fields omitted) |
| DELETE | `/api/analysis/:id` | Delete an analysis |
| POST | `/api/rank/add` | Add a keyword to track (async check) |
| GET | `/api/rank/list` | All tracked keywords |
| GET | `/api/rank/:id` | Keyword with full rank history + competitors |
| POST | `/api/rank/:id/refresh` | Trigger an immediate rank check |
| PUT | `/api/rank/:id/toggle` | Pause / resume tracking |
| DELETE | `/api/rank/:id` | Remove tracking |

## Screenshots / Demo

> Screenshots to be added. Key UI surfaces: marketing Home (Hero/Features/HowItWorks/Pricing/Footer), Dashboard (quick analyze + stats + recent analyses), Analyze (animated progress flow), Report (score hero + 4 tabs), History (filterable paginated list), RankTracker (keyword list + add modal), RankDetail (canvas trend chart + competitors).

## Testing

No automated test suite is currently configured. The server's `npm test` is a stub.

To check code quality in the client:

```bash
cd client
npm run lint            # ESLint (React hooks + TS)
npm run build           # tsc -b && vite build (type-checks the whole app)
```

## Deployment

The app is configured for **Vercel** (client and server are separate projects).

**Server (`server/`)**

- `vercel.json` builds `server.js` with `@vercel/node` and routes all traffic to it.
- Set the environment variables (`MONGODB_URI`, `JWT_SECRET`, `BROWSERBASE_API_KEY`, `GEMINI_API_KEY`) in the Vercel project dashboard.
- Note: the daily cron runs via `node-cron` inside the server process — for a reliable production schedule, consider moving the job to **Vercel Cron Jobs** (or an external scheduler like GitHub Actions) since serverless functions may not run it continuously.

**Client (`client/`)**

- `vercel.json` rewrites all routes to `/` so client-side routing works on refresh.
- Set `VITE_BACKEND_URL` to your deployed API URL at build time.

```bash
# Deploy with Vercel CLI
cd client && vercel --prod
cd server && vercel --prod
```

## Contributing

1. Fork the repo and create a descriptive branch (`git checkout -b 325-add-keyword-density-check`).
2. Ensure Node.js LTS is installed, then `npm install` and `npm run dev` to get the test/dev suite running.
3. Follow the existing code style — run `npm run lint` in `client/` before pushing.
4. Commit with a descriptive message and open a PR against `main`, clearly describing the problem and solution.

See `client/CONTRIBUTING.md` for the full contributor guide.

## License

MIT — see [LICENSE.md](client/LICENSE.md). Copyright © 2026 SEO Rank Tracker.
