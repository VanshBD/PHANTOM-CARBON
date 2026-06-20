import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { carbonHistorySchema } from '@/lib/validators';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);

  const queryValidation = carbonHistorySchema.safeParse({
    page: searchParams.get('page') ?? '1',
    limit: searchParams.get('limit') ?? '20',
  });

  if (!queryValidation.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { page, limit } = queryValidation.data;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.carbonLog.findMany({
      where: { userId },
      select: {
        id: true,
        inputText: true,
        inputType: true,
        surfaceCarbon: true,
        shadowCarbon: true,
        ghostCarbon: true,
        totalCarbon: true,
        breakdown: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.carbonLog.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    data: logs,
    total,
    page,
    limit,
    hasNext: skip + logs.length < total,
    hasPrev: page > 1,
  });
}
