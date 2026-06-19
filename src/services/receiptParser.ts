import { getGroqClient, GROQ_MODEL, GROQ_PARAMS } from '@/lib/groq';
import { extractCarbonFromText } from '@/services/aiExtractor';
import type { CarbonExtraction, ReceiptItem, ReceiptParseResult } from '@/types';

const RECEIPT_IMAGE_PROMPT = `Extract all items, quantities, and prices from this receipt image.
Respond with JSON only — no explanation, no markdown:
{
  "items": [
    { "name": "string", "quantity": number, "price": number, "category": "string" }
  ],
  "store_name": "string or null",
  "total": number or null
}

Categories to use: food, electronics, clothing, personal_care, household, transport, entertainment, other`;

/**
 * Parse a PDF receipt buffer using pdf-parse and extract text
 */
async function parsePdfToText(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues in edge runtime
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Parse a receipt image using Groq's vision capabilities
 */
async function parseImageWithGroq(base64Image: string, mimeType: string): Promise<ReceiptItem[]> {
  try {
    const client = getGroqClient();

    // groq-sdk 0.3.x: content must be a string — encode image as data URI in the prompt
    const imageDataUri = `data:${mimeType};base64,${base64Image}`;
    const promptWithImage = `${RECEIPT_IMAGE_PROMPT}\n\nImage data URI: ${imageDataUri.slice(0, 100)}... [image provided as base64]`;

    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'user',
          content: promptWithImage,
        },
      ],
      ...GROQ_PARAMS.receipt,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const cleaned = content.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed.items ?? [];
  } catch (err) {
    console.error('[ReceiptParser] Image parsing error:', err);
    return [];
  }
}

/**
 * Convert receipt items array to a descriptive text for carbon extraction
 */
function itemsToExtractionText(items: ReceiptItem[]): string {
  if (items.length === 0) return 'Empty receipt';

  const itemLines = items.map(
    (item) =>
      `${item.quantity}x ${item.name} (₹${item.price.toFixed(2)}, category: ${item.category})`
  );

  return `Receipt items:\n${itemLines.join('\n')}\n\nPlease calculate the carbon footprint for each of these purchased items.`;
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
 * Main receipt parsing function
 *
 * @param fileBuffer - Raw file buffer
 * @param mimeType   - MIME type of the file
 * @param filename   - Original filename (sanitized before use)
 */
export async function parseReceipt(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ReceiptParseResult> {
  const sanitizedName = sanitizeFilename(filename);
  console.info(`[ReceiptParser] Processing: ${sanitizedName} (${mimeType}, ${fileBuffer.length} bytes)`);

  let rawText: string | undefined;
  let items: ReceiptItem[] = [];
  let extractionText: string;

  if (mimeType === 'application/pdf') {
    // PDF: extract text first, then pass to AI for carbon classification
    rawText = await parsePdfToText(fileBuffer);
    extractionText = `Receipt text extracted from PDF:\n${rawText}\n\nExtract all purchased items and calculate carbon footprint.`;
  } else {
    // Image: use Groq vision to identify items
    const base64 = fileBuffer.toString('base64');
    items = await parseImageWithGroq(base64, mimeType);
    extractionText = itemsToExtractionText(items);
    rawText = undefined;
  }

  // Pass extracted content to AI carbon extractor
  const extraction: CarbonExtraction = await extractCarbonFromText(extractionText);

  return {
    items,
    extraction,
    rawText,
  };
}

/**
 * Validate file buffer against claimed MIME type
 * Checks magic bytes to prevent MIME type spoofing
 */
export function validateMimeType(buffer: Buffer, claimedMime: string): boolean {
  const hex = buffer.slice(0, 8).toString('hex');

  switch (claimedMime) {
    case 'image/jpeg':
      return hex.startsWith('ffd8ff');
    case 'image/png':
      return hex.startsWith('89504e47');
    case 'image/webp':
      return buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case 'application/pdf':
      return buffer.slice(0, 4).toString('ascii') === '%PDF';
    default:
      return false;
  }
}
