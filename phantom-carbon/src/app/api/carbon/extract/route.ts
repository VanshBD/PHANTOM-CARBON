import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { carbonExtractSchema } from '@/lib/validators';
import { extractCarbonFromText } from '@/services/aiExtractor';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. Rate limiting
  const rateLimitResult = await rateLimiters.carbonExtract(userId);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before sending more requests.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter ?? 60),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 3. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = carbonExtractSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { text, inputType } = validation.data;

  // 4. Extract carbon using AI
  try {
    const extraction = await extractCarbonFromText(text);

    // 5. Save to database
    const carbonLog = await prisma.carbonLog.create({
      data: {
        userId,
        inputText: text,
        inputType,
        surfaceCarbon: extraction.surfaceCarbon,
        shadowCarbon: extraction.shadowCarbon,
        ghostCarbon: extraction.ghostCarbon,
        totalCarbon: extraction.totalCarbon,
        breakdown: extraction.breakdown as object,
        rawAiResponse: {
          sources: extraction.sources,
          confidence: extraction.confidence,
          summary: extraction.summary,
          topAction: extraction.topAction,
        },
      },
      select: {
        id: true,
        createdAt: true,
        surfaceCarbon: true,
        shadowCarbon: true,
        ghostCarbon: true,
        totalCarbon: true,
      },
    });

    return NextResponse.json(
      {
        data: {
          logId: carbonLog.id,
          extraction,
          savedAt: carbonLog.createdAt,
        },
        message: 'Carbon extracted and logged successfully',
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        },
      }
    );
  } catch (err) {
    console.error('[API/carbon/extract] Error:', err);
    return NextResponse.json(
      { error: 'Failed to extract carbon data. Please try again.' },
      { status: 500 }
    );
  }
}
