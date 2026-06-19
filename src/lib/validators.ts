import { z } from 'zod';

// ---------- Auth ----------

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

// ---------- Carbon ----------

export const carbonExtractSchema = z.object({
  text: z
    .string()
    .min(10, 'Please describe at least one activity (min 10 characters)')
    .max(2000, 'Input too long (max 2000 characters)')
    .trim(),
  inputType: z.enum(['CHAT', 'SPENDING']).default('CHAT'),
});

export const carbonSummarySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('7d'),
});

export const carbonHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------- Oracle ----------

export const oracleGenerateSchema = z.object({
  city: z.string().min(2, 'City name required').max(100).trim(),
  country: z.string().min(2, 'Country name required').max(100).trim(),
});

// ---------- Community ----------

export const leaderboardSchema = z.object({
  period: z.enum(['weekly', 'monthly']).default('weekly'),
});

// ---------- Upload ----------

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateFileUpload(file: {
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `File type not supported. Allowed: PDF, JPEG, PNG, WEBP`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large. Maximum size is 5MB`,
    };
  }

  return { valid: true };
}
