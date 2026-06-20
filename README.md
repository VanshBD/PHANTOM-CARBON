<div align="center">

# 👻 Phantom Carbon

### *"71% of your carbon footprint is invisible. We make it visible."*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-orange)](https://groq.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB%20Atlas-47A248?logo=mongodb)](https://mongodb.com/atlas)
[![Tests](https://img.shields.io/badge/Tests-151%20passing-22c55e)](/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**An AI-powered invisible carbon intelligence platform** — built for GDG HackToSkill 2025

[🚀 Live Demo](#) · [📖 Docs](#api-documentation) · [🐛 Report Bug](#)

</div>

---

## The Problem

Standard carbon trackers capture only **29% of your actual footprint** — the visible stuff: driving, flights, energy bills. The remaining **71% is split across two invisible layers** that no conventional app tracks.

## Our Innovation: Three-Layer Carbon Detection

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

Phantom Carbon is the **only platform** that detects all three layers from **natural language conversation** — zero form filling, ever.

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Carbon Chat** | Describe your day in plain English — Groq LLaMA 3.3-70B extracts all emissions automatically |
| 📄 **Receipt Upload** | Upload PDF or image receipts for instant AI-powered carbon classification |
| 👻 **Ghost Inferencer** | Infers hidden supply-chain and digital emissions from spending categories |
| 🔮 **Future Oracle** | Generates three personalized 2050 city scenarios based on your carbon habits |
| 📊 **Ghost Radar** | Animated SVG radar showing your three-layer carbon footprint in real time |
| 🏆 **Community Board** | Anonymized weekly leaderboard — privacy-first SHA-256 hashing |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| AI Engine | Groq API — LLaMA 3.3-70B Versatile |
| Database | MongoDB Atlas + Prisma ORM |
| Cache | Redis (ioredis) — all AI responses cached |
| Auth | NextAuth.js v5 — JWT + bcrypt-12 |
| Testing | Jest + React Testing Library — 151 tests |
| Deploy | Docker + docker-compose |

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier works)
- Redis instance (local or [Upstash](https://upstash.com) free tier)
- Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/phantom-carbon.git
cd phantom-carbon
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
```

### 3. Setup Database & Seed Demo Data

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
| `demo@phantom.carbon` | `Demo@12345` | Urban commuter |
| `eco@phantom.carbon` | `Eco@12345` | Low-carbon lifestyle |

---

## Docker

```bash
cp .env.example .env.local
# Fill in your credentials

npm run docker:build
npm run docker:up

# View logs
docker-compose logs -f app

# Stop
npm run docker:down
```

> MongoDB Atlas connects via `DATABASE_URL`. Redis runs locally in Docker.

---

## Running Tests

```bash
npm test                  # Run all 151 tests
npm run test:coverage     # With coverage report
```

**Test coverage:**
- Services: `carbonEngine`, `ghostInferencer`, `aiExtractor`, `oracleService`, `receiptParser`
- API routes: `extract`, `upload`, `history`, `oracle`, `register`, `community`
- Lib: `validators` (25 cases), `rate-limit` (13 cases)
- Components: `ChatInterface`, `ThreeLayerChart`

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PHANTOM CARBON                       │
│                                                         │
│  Next.js App Router (Server + Client Components)        │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │ /        │/dashboard│  /chat   │ /upload /oracle  │  │
│  │ Landing  │ SSR+CSR  │  CSR     │  CSR             │  │
│  └────┬─────┴────┬─────┴────┬─────┴──────────────────┘  │
│       │          │          │                            │
│  ┌────▼──────────▼──────────▼──────────────────────────┐ │
│  │           Next.js API Routes                        │ │
│  │  /api/carbon/*  /api/oracle/*  /api/community/*     │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │  Services: carbonEngine · aiExtractor · oracle       │ │
│  │            ghostInferencer · receiptParser           │ │
│  └──────┬──────────────┬──────────────┬────────────────┘ │
│         │              │              │                  │
│  MongoDB Atlas    Redis Cache    Groq AI API             │
└─────────────────────────────────────────────────────────┘
```

---

## API Documentation

All protected endpoints require `Authorization` via NextAuth session cookie.

### Carbon API

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|-----------|-------------|
| `POST` | `/api/carbon/extract` | ✅ | 10/min | Extract carbon from text |
| `POST` | `/api/carbon/upload` | ✅ | 5/min | Analyze receipt (PDF/image) |
| `GET` | `/api/carbon/summary?period=7d` | ✅ | — | Aggregated carbon summary |
| `GET` | `/api/carbon/history?page=1` | ✅ | — | Paginated history |

### Oracle API

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|-----------|-------------|
| `POST` | `/api/oracle/generate` | ✅ | 2/hour | Generate 2050 scenarios |

### Community API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/community/leaderboard` | ✅ | Anonymized weekly rankings |

**Example — POST `/api/carbon/extract`:**

```json
// Request
{ "text": "I drove 25km to work and had a beef burger for lunch", "inputType": "CHAT" }

// Response
{
  "data": {
    "logId": "...",
    "extraction": {
      "surfaceCarbon": 7.75,
      "shadowCarbon": 0.2,
      "ghostCarbon": 0.15,
      "totalCarbon": 8.1,
      "breakdown": { "transport": 5.25, "food": 2.5 },
      "confidence": 0.92,
      "summary": "Your commute and lunch generated 8.1 kg CO₂e.",
      "topAction": "Try plant-based lunch to reduce food emissions by 70%."
    }
  }
}
```

---

## Security

- **Passwords**: bcrypt with saltRounds=12
- **Sessions**: JWT-only (stateless), 30-day expiry
- **Input validation**: Zod schemas on every API route
- **Rate limiting**: Redis sliding window (10/min extract, 5/min upload, 2/hr oracle)
- **File uploads**: MIME-type validation via magic bytes + 5MB size limit
- **Database**: Prisma ORM exclusively — no raw queries
- **Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Privacy**: Leaderboard uses SHA-256 one-way hash — real IDs never exposed

---

## Emission Factor Sources

- Transport: [DEFRA UK GHG Conversion Factors 2023](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023)
- Food: [Poore & Nemecek, Science 2018](https://science.sciencemag.org/content/360/6392/987)
- Electricity (India): [CEEW India Carbon Tracker 2023](https://www.ceew.in)
- Digital/Ghost: [Carbon Trust Digital Footprint Study 2023](https://www.carbontrust.com)

---

## Accessibility

WCAG 2.1 AA compliant:
- Skip-to-main-content link
- All forms: proper label associations + aria-required + aria-invalid
- Loading states: aria-live regions
- SVG components: role="img" + title + desc + aria-label
- All animations: prefers-reduced-motion aware
- Focus indicators: visible on all interactive elements
- Color: never the only indicator of meaning

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ for GDG HackToSkill 2025**

*Phantom Carbon — Making the invisible visible*

</div>
