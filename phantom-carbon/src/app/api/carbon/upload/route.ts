import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { validateFileUpload, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/validators';
import { parseReceipt, validateMimeType, sanitizeFilename } from '@/services/receiptParser';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. Rate limiting (stricter for uploads — 5/min)
  const rateLimitResult = await rateLimiters.carbonUpload(userId);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Upload rate limit exceeded. Please wait before uploading again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimitResult.retryAfter ?? 60) },
      }
    );
  }

  // 3. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json(
      { error: 'No file provided. Send a file in the "file" field.' },
      { status: 400 }
    );
  }

  // 4. Validate file metadata
  const metaValidation = validateFileUpload({ type: file.type, size: file.size });
  if (!metaValidation.valid) {
    return NextResponse.json({ error: metaValidation.error }, { status: 400 });
  }

  // Additional explicit checks for security
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return NextResponse.json(
      { error: 'File type not allowed. Upload PDF, JPEG, PNG, or WEBP only.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5MB size limit.' }, { status: 400 });
  }

  // 5. Read buffer and validate MIME type via magic bytes
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const mimeValid = validateMimeType(buffer, file.type);
  if (!mimeValid) {
    return NextResponse.json(
      { error: 'File content does not match claimed type. Upload rejected.' },
      { status: 400 }
    );
  }

  // 6. Parse and analyze receipt
  try {
    const sanitizedName = sanitizeFilename(file.name);
    const result = await parseReceipt(buffer, file.type, sanitizedName);

    // 7. Save to CarbonLog
    const carbonLog = await prisma.carbonLog.create({
      data: {
        userId,
        inputText: `Receipt upload: ${sanitizedName}`,
        inputType: 'RECEIPT',
        surfaceCarbon: result.extraction.surfaceCarbon,
        shadowCarbon: result.extraction.shadowCarbon,
        ghostCarbon: result.extraction.ghostCarbon,
        totalCarbon: result.extraction.totalCarbon,
        breakdown: result.extraction.breakdown as object,
        rawAiResponse: JSON.parse(JSON.stringify({
          items: result.items,
          confidence: result.extraction.confidence,
          sources: result.extraction.sources,
          rawText: result.rawText ? result.rawText.slice(0, 500) : undefined,
        })),
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({
      data: {
        logId: carbonLog.id,
        extraction: result.extraction,
        items: result.items,
        confidence: result.extraction.confidence,
        savedAt: carbonLog.createdAt,
      },
      message: 'Receipt analyzed successfully',
    });
  } catch (err) {
    console.error('[API/carbon/upload] Error:', err);
    return NextResponse.json(
      { error: 'Failed to analyze receipt. Please try again.' },
      { status: 500 }
    );
  }
}
