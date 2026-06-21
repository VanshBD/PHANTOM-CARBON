import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const saveSchema = z.object({
  fileName:    z.string().max(255).optional(),
  inputType:   z.enum(['CHAT', 'RECEIPT', 'SPENDING']).default('RECEIPT'),
  surfaceCarbon: z.number().min(0),
  shadowCarbon:  z.number().min(0),
  ghostCarbon:   z.number().min(0),
  totalCarbon:   z.number().min(0),
  breakdown:     z.record(z.string(), z.number().optional()),
  sources:       z.array(z.string()).optional(),
  confidence:    z.number().min(0).max(1).optional(),
  topAction:     z.string().optional(),
  summary:       z.string().optional(),
});

/**
 * POST /api/carbon/save
 * Saves a previously-analyzed carbon extraction to the database.
 * Called after user reviews and confirms the receipt analysis.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = saveSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = validation.data;

  try {
    const carbonLog = await prisma.carbonLog.create({
      data: {
        userId,
        inputText:     data.fileName ? `Receipt: ${data.fileName}` : 'Receipt upload',
        inputType:     data.inputType,
        surfaceCarbon: data.surfaceCarbon,
        shadowCarbon:  data.shadowCarbon,
        ghostCarbon:   data.ghostCarbon,
        totalCarbon:   data.totalCarbon,
        breakdown:     data.breakdown as object,
        rawAiResponse: {
          sources:    data.sources ?? [],
          confidence: data.confidence ?? 0,
          topAction:  data.topAction,
          summary:    data.summary,
        },
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({
      data:    { logId: carbonLog.id, savedAt: carbonLog.createdAt },
      message: 'Saved to your carbon log.',
    }, { status: 201 });
  } catch (err) {
    console.error('[API/carbon/save] Error:', err);
    return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
  }
}
