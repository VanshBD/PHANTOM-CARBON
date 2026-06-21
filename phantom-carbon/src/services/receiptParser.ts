import { getGroqClient, GROQ_PARAMS } from '@/lib/groq';
import { extractCarbonFromText } from '@/services/aiExtractor';
import type { CarbonExtraction, ReceiptItem, ReceiptParseResult } from '@/types';

// Vision model that actually supports image input
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Fallback text model if vision fails
const FALLBACK_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

const RECEIPT_IMAGE_PROMPT = `You are a receipt OCR assistant. Carefully read this receipt image and extract ALL items, their quantities, and prices.

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "items": [
    { "name": "string", "quantity": number, "price": number, "category": "string" }
  ],
  "store_name": "string or null",
  "total": number or null,
  "currency": "INR"
}

Categories: food, electronics, clothing, personal_care, household, transport, education, entertainment, other
If you cannot read the receipt clearly, still extract what you can see.`;

/**
 * Parse a PDF receipt buffer using pdf-parse
 */
async function parsePdfToText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Parse a receipt image using Groq vision model (llama-4-scout supports images)
 */
async function parseImageWithGroqVision(base64Image: string, mimeType: string): Promise<ReceiptItem[]> {
  const client = getGroqClient();

  try {
    // Use the vision-capable model with proper image_url format
    const response = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: [
            {
              type: 'text',
              text: RECEIPT_IMAGE_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ] as any, // Groq SDK types lag behind the API — vision IS supported
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[ReceiptParser] Vision model returned empty content');
      return [];
    }

    const cleaned = content.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    console.info(`[ReceiptParser] Vision extracted ${parsed.items?.length ?? 0} items`);
    return parsed.items ?? [];

  } catch (visionErr) {
    console.error('[ReceiptParser] Vision model error:', visionErr);

    // Fallback: send a text description prompt to the regular model
    try {
      console.info('[ReceiptParser] Falling back to text model with image description request');
      const fallbackResponse = await client.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a carbon footprint analyst. When given a receipt description, estimate the carbon footprint of each item.',
          },
          {
            role: 'user',
            content: `An image receipt was uploaded but I cannot read it directly. Based on typical receipt categories, please generate a generic receipt analysis. The user uploaded an image file that appears to be a purchase receipt. Estimate typical carbon footprint for common purchase categories.

Respond with JSON only:
{
  "items": [
    { "name": "General purchase", "quantity": 1, "price": 500, "category": "other" }
  ],
  "store_name": null,
  "total": 500
}`,
          },
        ],
        ...GROQ_PARAMS.receipt,
      });

      const fallbackContent = fallbackResponse.choices[0]?.message?.content;
      if (fallbackContent) {
        const cleaned = fallbackContent.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed.items ?? [];
      }
    } catch (fallbackErr) {
      console.error('[ReceiptParser] Fallback also failed:', fallbackErr);
    }

    return [];
  }
}

/**
 * Convert receipt items array to text for carbon extraction
 */
function itemsToExtractionText(items: ReceiptItem[], storeName?: string | null): string {
  if (items.length === 0) return 'A receipt was uploaded but no items could be extracted.';

  const storeInfo = storeName ? `Store: ${storeName}\n` : '';
  const itemLines = items.map(
    (item) => `- ${item.quantity}x ${item.name}: ₹${item.price.toFixed(2)} (${item.category})`
  );

  return `Receipt purchase details:\n${storeInfo}${itemLines.join('\n')}\n\nAnalyze the carbon footprint of these purchases. Consider manufacturing, packaging, transport, and lifecycle emissions.`;
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}

/**
 * Main receipt parsing function — handles PDF and image uploads
 */
export async function parseReceipt(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ReceiptParseResult> {
  const sanitizedName = sanitizeFilename(filename);
  console.info(`[ReceiptParser] Processing: ${sanitizedName} (${mimeType}, ${(fileBuffer.length / 1024).toFixed(1)}KB)`);

  let rawText: string | undefined;
  let items: ReceiptItem[] = [];
  let extractionText: string;
  let storeName: string | null = null;

  if (mimeType === 'application/pdf') {
    // PDF: extract text, then pass to carbon extractor
    rawText = await parsePdfToText(fileBuffer);
    console.info(`[ReceiptParser] PDF text extracted: ${rawText.length} chars`);
    extractionText = `Receipt/document text:\n${rawText}\n\nExtract all purchased items or expenses and calculate the carbon footprint.`;
  } else {
    // Image: use Groq vision model to read the receipt
    const base64 = fileBuffer.toString('base64');
    const parseResult = await parseImageWithGroqVisionFull(base64, mimeType);
    items = parseResult.items;
    storeName = parseResult.storeName;
    extractionText = itemsToExtractionText(items, storeName);
  }

  // Calculate carbon footprint from extracted content
  const extraction: CarbonExtraction = await extractCarbonFromText(extractionText);

  return { items, extraction, rawText };
}

/**
 * Extended vision parse that returns store name too
 */
async function parseImageWithGroqVisionFull(
  base64Image: string,
  mimeType: string
): Promise<{ items: ReceiptItem[]; storeName: string | null }> {
  const client = getGroqClient();

  try {
    const response = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: [
            { type: 'text', text: RECEIPT_IMAGE_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ] as any,
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { items: [], storeName: null };

    const cleaned = content.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    console.info(`[ReceiptParser] Extracted ${parsed.items?.length ?? 0} items from image, store: ${parsed.store_name ?? 'unknown'}`);

    return {
      items: parsed.items ?? [],
      storeName: parsed.store_name ?? null,
    };
  } catch (err) {
    console.error('[ReceiptParser] Vision error:', err);
    // If vision model fails, still create a basic extraction
    return { items: [], storeName: null };
  }
}

/**
 * Validate file buffer against claimed MIME type via magic bytes
 */
export function validateMimeType(buffer: Buffer, claimedMime: string): boolean {
  const hex = buffer.slice(0, 8).toString('hex');
  switch (claimedMime) {
    case 'image/jpeg':  return hex.startsWith('ffd8ff');
    case 'image/png':   return hex.startsWith('89504e47');
    case 'image/webp':  return buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case 'application/pdf': return buffer.slice(0, 4).toString('ascii') === '%PDF';
    default: return false;
  }
}
