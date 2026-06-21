import { getGroqClient } from '@/lib/groq';
import { extractCarbonFromText } from '@/services/aiExtractor';
import type { CarbonExtraction, ReceiptItem, ReceiptParseResult } from '@/types';

/**
 * Vision models officially supported by Groq for image input.
 * Source: https://console.groq.com/docs/vision
 */
const VISION_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct', // primary
  'qwen/qwen3.6-27b',                           // fallback
];

/** Groq hard limit: base64 encoded image must be < 4MB */
const MAX_BASE64_BYTES = 4 * 1024 * 1024;

const RECEIPT_PROMPT = `You are a receipt OCR assistant. Read this receipt image and extract ALL line items.

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "items": [
    { "name": "string", "quantity": number, "price": number, "category": "string" }
  ],
  "store_name": "string or null",
  "total": number or null
}

Categories: food, electronics, clothing, personal_care, household, transport, education, entertainment, other`;

// ─── PDF parsing ──────────────────────────────────────────────────────────────

async function parsePdfToText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

// ─── Image compression ────────────────────────────────────────────────────────

async function compressIfNeeded(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  // Approximate base64 size: original bytes × 4/3
  if (buffer.length * 1.34 <= MAX_BASE64_BYTES) return { buffer, mimeType };

  console.info(`[ReceiptParser] Compressing large image (${(buffer.length / 1024 / 1024).toFixed(1)}MB)...`);
  try {
    const sharp = (await import('sharp')).default;
    const compressed = await sharp(buffer).jpeg({ quality: 55 }).toBuffer();
    console.info(`[ReceiptParser] Compressed → ${(compressed.length / 1024).toFixed(0)}KB`);
    return { buffer: compressed, mimeType: 'image/jpeg' };
  } catch {
    console.warn('[ReceiptParser] Compression failed, using original');
    return { buffer, mimeType };
  }
}

// ─── Vision model call ────────────────────────────────────────────────────────

type VisionResult = { items: ReceiptItem[]; storeName: string | null };

async function callVisionModel(
  modelId: string,
  base64: string,
  mimeType: string
): Promise<VisionResult | null> {
  const client = getGroqClient();

  try {
    // Groq vision API: content array with image_url is supported at runtime
    // even though the SDK types only declare content as string.
    const visionContent = JSON.stringify([
      { type: 'text', text: RECEIPT_PROMPT },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64}` },
      },
    ]);

    // We pass the array via a workaround: create the request body manually
    // using the Groq client's underlying fetch to bypass type restriction.
    const groqAny = client as unknown as {
      chat: {
        completions: {
          create: (body: Record<string, unknown>) => Promise<{ choices: Array<{ message: { content: string | null } }> }>;
        };
      };
    };

    const response = await groqAny.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: RECEIPT_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    void visionContent; // suppress unused warning

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const cleaned = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed  = JSON.parse(cleaned);
    const items: ReceiptItem[] = parsed.items ?? [];

    console.info(`[ReceiptParser] ${modelId}: ${items.length} items | store=${parsed.store_name ?? '?'}`);
    return { items, storeName: parsed.store_name ?? null };
  } catch (err) {
    console.error(`[ReceiptParser] ${modelId} error:`, err);
    return null;
  }
}

// ─── Image parsing with model fallover ───────────────────────────────────────

async function parseImage(fileBuffer: Buffer, mimeType: string): Promise<VisionResult> {
  const { buffer, mimeType: finalMime } = await compressIfNeeded(fileBuffer, mimeType);
  const base64 = buffer.toString('base64');

  for (const model of VISION_MODELS) {
    const result = await callVisionModel(model, base64, finalMime);
    if (result && result.items.length > 0) return result;
    if (result) console.info(`[ReceiptParser] ${model} returned 0 items, trying next...`);
  }

  console.warn('[ReceiptParser] All vision models returned 0 items');
  return { items: [], storeName: null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function itemsToText(items: ReceiptItem[], storeName?: string | null): string {
  if (items.length === 0) {
    return 'A receipt was uploaded. Estimate carbon footprint for a typical purchase receipt.';
  }
  const header = storeName ? `Store: ${storeName}\n` : '';
  const lines  = items.map(i => `- ${i.quantity}x ${i.name}: ₹${i.price.toFixed(2)} (${i.category})`);
  return `Receipt:\n${header}${lines.join('\n')}\n\nCalculate carbon footprint including manufacturing, packaging, transport, and lifecycle emissions.`;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a receipt file (PDF or image) and extract carbon footprint.
 * - PDF: extracts text with pdf-parse, then runs AI carbon extraction
 * - Image: uses Groq vision models (llama-4-scout → qwen fallback) to OCR the receipt
 */
export async function parseReceipt(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ReceiptParseResult> {
  const name = sanitizeFilename(filename);
  console.info(`[ReceiptParser] ${name} | ${mimeType} | ${(fileBuffer.length / 1024).toFixed(0)}KB`);

  let rawText: string | undefined;
  let items: ReceiptItem[]     = [];
  let storeName: string | null = null;
  let extractionText: string;

  if (mimeType === 'application/pdf') {
    rawText       = await parsePdfToText(fileBuffer);
    extractionText = `Receipt text:\n${rawText}\n\nExtract purchases and calculate their carbon footprint.`;
    console.info(`[ReceiptParser] PDF → ${rawText.length} chars`);
  } else {
    const result  = await parseImage(fileBuffer, mimeType);
    items         = result.items;
    storeName     = result.storeName;
    extractionText = itemsToText(items, storeName);
  }

  const extraction: CarbonExtraction = await extractCarbonFromText(extractionText);
  return { items, extraction, rawText };
}

/**
 * Validate file MIME type via magic bytes to prevent spoofing.
 */
export function validateMimeType(buffer: Buffer, claimedMime: string): boolean {
  const hex = buffer.slice(0, 8).toString('hex');
  switch (claimedMime) {
    case 'image/jpeg':      return hex.startsWith('ffd8ff');
    case 'image/png':       return hex.startsWith('89504e47');
    case 'image/webp':      return buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case 'application/pdf': return buffer.slice(0, 4).toString('ascii') === '%PDF';
    default:                return false;
  }
}
