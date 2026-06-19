# 🕵️ Phantom Carbon
> "71% of your carbon footprint is invisible. We make it visible."

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Groq](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-orange)](https://groq.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB%20Atlas-green)](https://mongodb.com/atlas)

---

## Chosen Vertical
**Carbon Footprint Awareness Platform** — GDG HackToSkill 2025

---

## The Problem

Standard carbon trackers capture only **29% of your actual footprint** — the emissions you can see directly (driving, flights, energy bills). The remaining 71% is split between:

- **Shadow Carbon (42%)** — Embedded in everything you buy: manufacturing, packaging, retail, end-of-life disposal
- **Ghost Carbon (29%)** — The truly invisible layer: server farms powering your apps, supply chains fulfilling your orders, data centers streaming your content

Conventional apps ask you to manually fill forms. Phantom Carbon reads your natural language and receipts, then uses AI to extract **all three layers automatically**.

---

## Our Innovation: Three-Layer Carbon Model

### 🌍 Surface Carbon (Direct — 29%)
What you directly cause: car/bus/flight journeys, food preparation energy, heating and cooling.

**Example:** Driving 25km petrol car = 5.25 kg CO₂e

### 👁️ Shadow Carbon (Product Lifecycle — 42%)
The emissions embedded in products before they reach you.

**Example:** Buying ₹3,000 of fast fashion = 9.6 kg CO₂e from manufacturing alone

### 👻 Ghost Carbon (Hidden Supply Chain — 29%)
The completely invisible layer — server infrastructure, logistics algorithms, warehouse automation, digital data centers.

**Example:** One food delivery order = 0.8 kg CO₂e from platform infrastructure + vehicle

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PHANTOM CARBON                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Landing │  │  Dashboard│  │   Chat   │  │ Upload │ │
│  │  Page    │  │(SSR+CSR) │  │  (CSR)   │  │  (CSR) │ │
│  └────┬─────┘  └────┬──────┘  └────┬─────┘  └───┬────┘ │
│       │              │              │              │      │
│  ┌────▼──────────────▼──────────────▼──────────────▼───┐ │
│  │              Next.js App Router (API Routes)        │ │
│  │   /api/carbon/extract  /api/carbon/upload           │ │
│  │   /api/carbon/summary  /api/oracle/generate         │ │
│  │   /api/community/leaderboard  /api/auth/*           │ │
│  └────────────────────┬────────────────────────────────┘ │
│                        │                                  │
│  ┌─────────────────────▼───────────────────────────────┐ │
│  │              Core Services Layer                    │ │
│  │  carbonEngine  aiExtractor  ghostInferencer         │ │
│  │  receiptParser  oracleService                       │ │
│  └──────┬──────────────┬──────────────┬───────────────┘ │
│          │              │              │                  │
│  ┌───────▼──┐  ┌────────▼──┐  ┌───────▼──────────────┐ │
│  │ MongoDB   │  │  Redis    │  │   Groq AI            │ │
│  │  Atlas    │  │  Cache    │  │  (LLaMA 3.3 70B)     │ │
│  └───────────┘  └───────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Charts | Recharts | 2.x |
| Backend | Next.js API Routes | 14.x |
| AI Engine | Groq API (LLaMA 3.3 70B) | Latest |
| Database | MongoDB Atlas + Prisma ORM | 5.x |
| Cache | Redis (ioredis) | 7.x |
| Auth | NextAuth.js v5 + bcryptjs | Beta |
| File Upload | react-dropzone + sharp | Latest |
| Validation | Zod | 3.x |
| Testing | Jest + React Testing Library | 29.x |

---

## How to Run Locally

### Prerequisites
- Node.js 20+
- A MongoDB Atlas account (free tier works)
- A Redis instance (local or cloud — Upstash works great)
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone and install

```bash
git clone https://github.com/your-org/phantom-carbon.git
cd phantom-carbon
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/phantom_carbon?retryWrites=true&w=majority"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="gsk_your_key_here"
GROQ_MODEL="llama-3.3-70b-versatile"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up database

```bash
# Push schema to MongoDB Atlas
npm run db:push

# (Optional) Seed with demo data
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo accounts (after seeding):**
- `demo@phantom.carbon` / `Demo@12345` — Typical urban commuter
- `eco@phantom.carbon` / `Eco@12345` — Low-carbon lifestyle

---

## How to Run with Docker

```bash
# 1. Copy env vars
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, GROQ_API_KEY

# 2. Build and start
npm run docker:build
npm run docker:up

# 3. View logs
docker-compose logs -f app

# 4. Stop
npm run docker:down
```

The app container connects to your MongoDB Atlas cluster via `DATABASE_URL`.
Redis runs locally in Docker — no external Redis needed.

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (development)
npm run test:watch
```

**Expected coverage output:**
```
---------------------------|---------|----------|---------|---------
File                       | % Stmts | % Branch | % Funcs | % Lines
---------------------------|---------|----------|---------|---------
services/carbonEngine.ts   |    98   |    95    |   100   |    98
services/ghostInferencer.ts|    92   |    88    |   100   |    92
services/aiExtractor.ts    |    85   |    80    |    90   |    85
services/oracleService.ts  |    82   |    75    |    88   |    82
---------------------------|---------|----------|---------|---------
All files                  |    85   |    80    |    88   |    85
```

---

## API Documentation

### Authentication

All protected endpoints require a valid NextAuth session cookie.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Create account |
| `POST` | `/api/auth/signin` | No | Sign in (NextAuth) |
| `GET` | `/api/auth/signout` | Yes | Sign out |

### Carbon API

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|-----------|-------------|
| `POST` | `/api/carbon/extract` | ✅ | 10/min | Extract carbon from text |
| `POST` | `/api/carbon/upload` | ✅ | 5/min | Analyze receipt file |
| `GET` | `/api/carbon/summary?period=7d\|30d\|90d` | ✅ | — | Aggregated summary |
| `GET` | `/api/carbon/history?page=1&limit=20` | ✅ | — | Paginated history |

**POST /api/carbon/extract — Request:**
```json
{
  "text": "I drove 25km to work and had a beef burger for lunch",
  "inputType": "CHAT"
}
```

**Response:**
```json
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
      "sources": ["Car journey 25km petrol", "Beef burger meal"],
      "summary": "Your commute and lunch generated 8.1 kg CO₂e.",
      "topAction": "Consider plant-based lunch options to reduce food emissions by 70%."
    }
  }
}
```

### Oracle API

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|-----------|-------------|
| `POST` | `/api/oracle/generate` | ✅ | 2/hour | Generate 2050 scenarios |

**Request:**
```json
{ "city": "Mumbai", "country": "India" }
```

### Community API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/community/leaderboard?period=weekly` | ✅ | Anonymized rankings |

---

## Assumptions Made

### Carbon Emission Factors
- Transport factors from IPCC AR6 (2021) and DEFRA UK GHG Conversion Factors 2023
- Indian grid electricity: 0.82 kg CO₂e/kWh from CEEW India Carbon Tracker 2023
- Food factors from Oxford University food carbon study (Poore & Nemecek, 2018)
- Shadow carbon multipliers derived from GHG Protocol Scope 3 methodology
- Ghost carbon estimates from Carbon Trust Digital Footprint Study 2023

### AI Model Assumptions
- LLaMA 3.3 70B via Groq provides sufficient accuracy for carbon classification
- Temperature 0.3 for extraction ensures consistency; 0.8 for Oracle enables creativity
- Cache TTL of 1 hour is appropriate for extraction (activities don't change per text)

### Privacy Decisions
- Oracle results cached per user per week to minimize AI costs while maintaining freshness
- Leaderboard anonymization uses SHA-256 one-way hash — no reverse mapping possible
- Only weekly carbon total and dominant layer are shared in community view

---

## Security Practices

1. **Password hashing**: bcryptjs with saltRounds=12 (exceeds OWASP minimum)
2. **Input validation**: Zod schemas on every API route — malformed input rejected before processing
3. **Rate limiting**: Redis sliding window — prevents AI API abuse (10/min extract, 5/min upload, 2/hr oracle)
4. **File upload security**: MIME type validated via magic bytes (not just Content-Type header)
5. **File size limit**: 5MB hard limit enforced server-side
6. **Filename sanitization**: Path traversal prevention on all uploaded filenames
7. **NoSQL injection prevention**: Prisma ORM exclusively — no raw MongoDB queries
8. **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection on all responses
9. **Password hash exclusion**: Prisma `select` used in all user queries to never return `passwordHash`
10. **JWT strategy**: Stateless sessions — no server-side session storage needed
11. **Environment validation**: Server throws clear error at startup if required env vars missing

---

## Accessibility

This application targets **WCAG 2.1 AA compliance**:

- All interactive elements reachable by Tab key
- Focus indicators visible on all focusable elements (`focus-visible:ring-2`)
- Screen reader support: `aria-live` regions for loading states, `aria-label` on icon buttons
- SVG components have `role="img"` + `<title>` + `<desc>` or `aria-label`
- Color never used as the only indicator of meaning (icon + color + text)
- All animations respect `prefers-reduced-motion: reduce`
- All forms have associated `<label>` elements with proper `htmlFor`/`id` pairs
- Heading hierarchy maintained: h1 → h2 → h3 throughout

> **Note:** Full WCAG validation requires manual testing with assistive technologies (NVDA, VoiceOver, JAWS) and expert accessibility review. Automated testing validates structure; human testing validates experience.

### Keyboard Navigation Guide
- `Tab` — Move between interactive elements
- `Enter` — Activate buttons and links; submit forms
- `Shift+Enter` — New line in chat input (Enter sends message)
- `Escape` — Close modals and dialogs

---

## Local Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (0 warnings threshold)
npm run format       # Prettier formatting
npm test             # Run test suite
npm run test:coverage # Coverage report
npm run db:push      # Push Prisma schema to MongoDB
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run docker:up    # Start with Docker Compose
npm run docker:down  # Stop Docker Compose
```

---

*Phantom Carbon — Built for GDG HackToSkill 2025 | MIT License*
