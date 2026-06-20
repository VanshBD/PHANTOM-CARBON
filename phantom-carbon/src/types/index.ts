// ============================================================
// Phantom Carbon — Core TypeScript Interfaces
// ============================================================

// ---------- Carbon Layer Types ----------

export type CarbonLayer = 'surface' | 'shadow' | 'ghost';
export type CarbonCategory = 'excellent' | 'good' | 'average' | 'high' | 'critical';
export type InputType = 'CHAT' | 'RECEIPT' | 'SPENDING';

export interface CarbonBreakdown {
  transport?: number;
  food?: number;
  energy?: number;
  shopping?: number;
  digital?: number;
  supplyChain?: number;
}

export interface CarbonExtraction {
  surfaceCarbon: number; // kg CO2e
  shadowCarbon: number; // kg CO2e
  ghostCarbon: number; // kg CO2e
  totalCarbon: number; // kg CO2e
  breakdown: CarbonBreakdown;
  confidence: number; // 0-1
  sources: string[]; // identified carbon sources
  summary?: string; // AI-generated insight
  topAction?: string; // most impactful action
}

export interface ActivityItem {
  description: string;
  layer: CarbonLayer;
  category: 'transport' | 'food' | 'energy' | 'shopping' | 'digital' | 'supplyChain';
  kg_co2e: number;
  confidence: number;
}

export interface GroqExtractionResponse {
  activities: ActivityItem[];
  total_surface: number;
  total_shadow: number;
  total_ghost: number;
  total_co2e: number;
  summary: string;
  top_action: string;
}

// ---------- Carbon Engine Input Types ----------

export interface SurfaceItem {
  type:
    | 'car_petrol'
    | 'car_electric'
    | 'bus'
    | 'train'
    | 'flight_short'
    | 'flight_long'
    | 'motorcycle'
    | 'beef_meal'
    | 'chicken_meal'
    | 'fish_meal'
    | 'vegetarian_meal'
    | 'vegan_meal'
    | 'dairy_serving'
    | 'grid_electricity_india'
    | 'grid_electricity_eu'
    | 'natural_gas';
  amount: number; // km, meals, or kWh/m3
}

export interface PurchaseItem {
  category:
    | 'fast_fashion'
    | 'electronics'
    | 'furniture'
    | 'groceries_packaged'
    | 'personal_care';
  amountINR: number;
}

export interface DigitalItem {
  type:
    | 'online_delivery'
    | 'streaming'
    | 'cloud_storage'
    | 'ride_hailing';
  amount: number; // trips, hours, or GB
  amountINR?: number;
}

// ---------- Oracle / Future Scenarios ----------

export interface OracleScenario {
  darkFuture: string;
  possibleFuture: string;
  phantomFuture: string;
  weeklyCarbon: number;
}

// ---------- Ghost Inferencer ----------

export interface GhostEstimate {
  estimatedKg: number;
  sources: string[];
  confidence: number;
  explanation: string;
}

// ---------- Community / Leaderboard ----------

export interface LeaderboardEntry {
  rank: number;
  anonymousId: string; // never expose real user id
  weeklyTotal: number;
  reductionPercent: number;
  topLayer: CarbonLayer;
  isCurrentUser?: boolean;
}

// ---------- Chat ----------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  extraction?: CarbonExtraction;
  timestamp: Date;
}

// ---------- API Response Types ----------

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CarbonSummary {
  period: string;
  totalSurface: number;
  totalShadow: number;
  totalGhost: number;
  totalCarbon: number;
  dailyBreakdown: DailyCarbon[];
  trend: 'improving' | 'worsening' | 'stable';
  categoryBreakdown: CarbonBreakdown;
  topAction?: string;
}

export interface DailyCarbon {
  date: string; // ISO date string
  surface: number;
  shadow: number;
  ghost: number;
  total: number;
}

// ---------- Receipt Parser ----------

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export interface ReceiptParseResult {
  items: ReceiptItem[];
  extraction: CarbonExtraction;
  rawText?: string;
}

// ---------- Rate Limit ----------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

// ---------- Auth / Session ----------

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
}

// Extend NextAuth types — these are ambient module augmentations, not runtime imports
declare module 'next-auth' {
  // eslint-disable-next-line no-unused-vars
  interface Session {
    user: SessionUser;
  }
}

// JWT type augmentation handled via next-auth session callback
// next-auth/jwt module augmentation not needed for v5 beta
