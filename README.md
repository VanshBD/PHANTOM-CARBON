<div align="center">

# 👻 Phantom Carbon

### *"71% of your carbon footprint is invisible. We make it visible."*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3%20%2B%20Vision-orange)](https://groq.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB%20Atlas-47A248?logo=mongodb)](https://mongodb.com/atlas)
[![Tests](https://img.shields.io/badge/Tests-151%20passing-22c55e)](/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**AI-powered invisible carbon intelligence platform** — built for GDG HackToSkill 2025

[🚀 Live Demo](#) · [📖 API Docs](#api-documentation) · [🐛 Report Bug](https://github.com/VanshBD/PHANTOM-CARBON/issues)

</div>

---

## The Problem

Standard carbon trackers capture only **29% of your actual footprint** — the visible stuff. The remaining **71% is invisible**, split across two layers that no conventional app tracks.

## Three-Layer Carbon Detection

```
┌─────────────────────────────────────────────────────────┐
│  🌍 SURFACE CARBON (29%)  — What you can see            │
│     Transport · Food · Energy                           │
├─────────────────────────────────────────────────────────┤
│  👁️ SHADOW CARBON (42%)   — Product lifecycle          │
│     Manufacturing · Packaging · Retail · Waste          │
├─────────────────────────────────────────────────────────┤
│  👻 GHOST CARBON (29%)    — Completely invisible        │
│     Server farms · Supply chains · Delivery logistics   │
│     Digital infrastructure · Data centers              │
└─────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Carbon Chat** | Describe your day in plain English — Groq LLaMA 3.3-70B extracts all emissions automatically |
| 📄 **Receipt Upload (Vision AI)** | Upload PDF or image receipts — Groq vision model reads the receipt and classifies every item |
| 👻 **Ghost Inferencer** | Infers hidden supply-chain and digital emissions from spending categories |
| 🔮 **Future Oracle** | Generates three personalized 2050 city scenarios based on your carbon habits |
| 📊 **Ghost Radar** | Animated SVG radar — dots sit exactly on their layer rings (surface/shadow/ghost) |
| 🔄 **Auto-Refresh Dashboard** | Dashboard auto-refreshes every 30s and on tab focus — always shows latest data |
| 🏆 **Community Board** | Anonymized weekly leaderboard — SHA-256 privacy-first hashing |

---

## What's New (Latest Updates)

- **Receipt Vision AI** — Image uploads now use `meta-llama/llama-4-scout-17b-16e-instruct` (Groq's official vision model) with `qwen/qwen3.6-27b` as fallback. Images > 4MB auto-compressed before upload.
- **Ghost Radar fixed** — Dots now sit exactly on their ring lines. Removed scatter math that was causing dots to fly outside the radar.
- **Dashboard auto-refresh** — Live `Updated Xs ago` counter with 30s auto-refresh and tab-focus refresh.
- **Sign out redirect fixed** — Uses `window.location.origin` so sign out works correctly on both localhost and Vercel.
- **Vercel deployment** — `prisma generate` added to build command. Root directory set via `rootDirectory` in Vercel dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| AI Engine | Groq — LLaMA 3.3-70B (text) + LLaMA 4 Scout (vision) |
| Database | MongoDB Atlas + Prisma ORM |
| Cache | Redis (ioredis) — all AI responses cached |
| Auth | NextAuth.js v5 — JWT + bcrypt-12 |
| Testing | Jest + React Testing Library — 151 tests |
| Deploy | Docker + docker-compose + Vercel |

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier works)
- Redis instance ([Upstash](https://upstash.com) free tier works)
- Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Clone & Install

```bash
git clone https://github.com/VanshBD/PHANTOM-CARBON.git
cd PHANTOM-CARBON/phantom-carbon
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/phantom_carbon?retryWrites=true&w=majority"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="gsk_your_key_here"
GROQ_MODEL="llama-3.3-70b-versatile"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> ⚠️ `DATABASE_URL` must include the database name: `.../phantom_carbon?...`

### 3. Setup Database & Seed

```bash
npm run db:push    # Push schema to MongoDB Atlas
npm run db:seed    # Create demo users with 14 days of carbon data
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:**

| Email | Password | Profile |
|-------|----------|---------|
| `demo@phantom.carbon` | `Demo@12345` | Urban commuter — high carbon |
| `eco@phantom.carbon` | `Eco@12345` | Low-carbon lifestyle |

---

## Deploy to Vercel

1. Import `VanshBD/PHANTOM-CARBON` on Vercel
2. Set **Root Directory** → `phantom-carbon`
3. Add environment variables (same as `.env.local` but with your production values)
4. Set `NEXTAUTH_URL` to your Vercel URL (e.g. `https://phantom-carbon.vercel.app`)
5. Deploy

The `package.json` build command already includes `prisma generate` so Vercel builds succeed automatically.

---

## Docker

```bash
cp .env.example .env.local
# Fill in credentials

npm run docker:build
npm run docker:up
docker-compose logs -f app
npm run docker:down
```

---

## Running Tests

```bash
npm test                  # Run all 151 tests
npm run test:coverage     # With coverage report
```

**Test suites:**
- Services: `carbonEngine` (16), `ghostInferencer` (10), `aiExtractor` (6), `oracleService` (4), `receiptParser` (12)
- API routes: `extract` (7), `upload` (4), `history` (7), `oracle` (5), `register` (7), `community` (5)
- Lib: `validators` (25), `rate-limit` (13)
- Components: `ChatInterface` (9), `ThreeLayerChart` (4)

---

## Architecture

```
PHANTOM-CARBON/ (repo root)
├── README.md
└── phantom-carbon/          ← all project code
    ├── src/
    │   ├── app/             (pages + API routes)
    │   ├── components/      (UI — GhostRadar, ChatInterface, etc.)
    │   ├── services/        (carbonEngine, aiExtractor, receiptParser, oracle)
    │   ├── lib/             (auth, redis, groq, rate-limit, validators)
    │   ├── hooks/
    │   ├── types/
    │   └── __tests__/       (151 tests)
    ├── prisma/              (schema + seed)
    ├── public/              (manifest.json, robots.txt)
    ├── Dockerfile
    ├── docker-compose.yml
    └── package.json
```

---

## API Documentation

All protected endpoints require a valid NextAuth session cookie.

### Carbon API

| Method | Endpoint | Rate Limit | Description |
|--------|----------|-----------|-------------|
| `POST` | `/api/carbon/extract` | 10/min | Extract carbon from natural language text |
| `POST` | `/api/carbon/upload` | 5/min | Analyze receipt image/PDF with vision AI |
| `GET` | `/api/carbon/summary?period=7d\|30d\|90d` | — | Aggregated carbon summary |
| `GET` | `/api/carbon/history?page=1&limit=20` | — | Paginated log history |

### Oracle & Community

| Method | Endpoint | Rate Limit | Description |
|--------|----------|-----------|-------------|
| `POST` | `/api/oracle/generate` | 2/hour | Generate 3 personalized 2050 city scenarios |
| `GET` | `/api/community/leaderboard` | — | Anonymized weekly rankings (top 20) |

**Example — POST `/api/carbon/extract`:**
```json
// Request
{ "text": "Drove 25km to work and had a beef burger for lunch", "inputType": "CHAT" }

// Response
{
  "data": {
    "extraction": {
      "surfaceCarbon": 7.75,
      "shadowCarbon": 0.2,
      "ghostCarbon": 0.15,
      "totalCarbon": 8.1,
      "breakdown": { "transport": 5.25, "food": 2.5 },
      "confidence": 0.92,
      "summary": "Your commute and lunch generated 8.1 kg CO₂e.",
      "topAction": "Plant-based lunch reduces food emissions by 70%."
    }
  }
}
```

---

## Receipt Image Upload

The upload feature uses Groq's vision models to OCR receipt images:

1. Upload PDF or image (JPEG, PNG, WEBP — max 5MB)
2. `meta-llama/llama-4-scout-17b-16e-instruct` reads the receipt visually
3. If that fails, `qwen/qwen3.6-27b` is tried as fallback
4. Images > 4MB are auto-compressed with sharp before sending
5. Extracted items are passed to the carbon engine for footprint calculation

---

## Security

- **Passwords**: bcrypt saltRounds=12
- **Sessions**: JWT-only (stateless), 30-day expiry
- **Validation**: Zod schemas on every API route
- **Rate limiting**: Redis sliding window (10/min extract, 5/min upload, 2/hr oracle)
- **File uploads**: Magic-byte MIME validation + 5MB limit + filename sanitization
- **Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Privacy**: Leaderboard uses SHA-256 one-way hash — real IDs never exposed

---

## Emission Factor Sources

- Transport: [DEFRA UK GHG Conversion Factors 2023](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023)
- Food: [Poore & Nemecek, Science 2018](https://science.sciencemag.org/content/360/6392/987)
- Electricity (India): [CEEW India Carbon Tracker 2023](https://www.ceew.in)
- Digital/Ghost: [Carbon Trust Digital Footprint Study 2023](https://www.carbontrust.com)

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ for GDG HackToSkill 2025**

*Phantom Carbon — Making the invisible visible*

</div>
