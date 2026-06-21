import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { MAX_FILE_SIZE_BYTES } from '@/lib/validators';
import { detectMimeFromMagicBytes } from '@/lib/fileUtils';
import { parseReceipt, sanitizeFilename } from '@/services/receiptParser';

/**
 * POST /api/carbon/upload
 * Analyzes a receipt image/PDF with Groq vision AI.
 * Does NOT save to DB — user reviews result and confirms via /api/carbon/save.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = await rateLimiters.carbonUpload(session.user.id);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Upload rate limit exceeded. Please wait before uploading again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter ?? 60) } }
    );
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided. Send a file in the "file" field.' }, { status: 400 });
  }

  // Size check (5MB hard limit)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum 5MB. Use a smaller image or compress it.' }, { status: 400 });
  }

  // Read buffer
  const buffer = Buffer.from(await file.arrayBuffer()) as Buffer;

  // Detect actual type from magic bytes — authoritative, ignores browser MIME claims
  const { mime: detectedMime, valid } = detectMimeFromMagicBytes(buffer, file.type || 'image/jpeg');

  if (!valid) {
    return NextResponse.json(
      { error: 'File is not a valid image or PDF. Please upload a JPEG, PNG, WEBP, or PDF receipt.' },
      { status: 400 }
    );
  }

  // For non-standard image types (HEIC, etc.) convert to JPEG using sharp
  let processBuffer = buffer;
  let processMime   = detectedMime;

  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(detectedMime)) {
    try {
      const sharp      = (await import('sharp')).default;
      processBuffer    = await sharp(buffer).jpeg({ quality: 80 }).toBuffer();
      processMime      = 'image/jpeg';
      console.info(`[Upload] Converted ${detectedMime} → JPEG (${(processBuffer.length / 1024).toFixed(0)}KB)`);
    } catch {
      // sharp failed — try sending as-is, let the vision model handle it
      console.warn(`[Upload] Could not convert ${detectedMime}, sending original`);
    }
  }

  // Analyze — DO NOT save to DB yet
  try {
    const sanitizedName = sanitizeFilename(file.name || 'receipt.jpg');
    const result = await parseReceipt(processBuffer, processMime, sanitizedName);

    return NextResponse.json({
      data: {
        extraction: result.extraction,
        items:      result.items,
        confidence: result.extraction.confidence,
        fileName:   sanitizedName,
      },
      message: 'Receipt analyzed. Review and save to your carbon log.',
    });
  } catch (err) {
    console.error('[API/carbon/upload] Error:', err);
    return NextResponse.json({ error: 'Failed to analyze receipt. Please try again.' }, { status: 500 });
  }
}
