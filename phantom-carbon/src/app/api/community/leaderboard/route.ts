import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redisGet, redisSet } from '@/lib/redis';
import crypto from 'crypto';
import type { LeaderboardEntry } from '@/types';

const CACHE_TTL = 600; // 10 minutes

/**
 * Generate an anonymized display name from a user ID
 * One-way hash ensures the real ID is never exposed
 */
function generateAnonymousId(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId + 'phantom-salt-2025').digest('hex');
  const adjectives = [
    'Eco', 'Green', 'Solar', 'Wind', 'Clean', 'Bio', 'Zero', 'Low',
    'Carbon', 'Earth', 'Sky', 'Ocean', 'Forest', 'River', 'Peak',
  ];
  const nouns = [
    'Hero', 'Guardian', 'Ranger', 'Keeper', 'Warrior', 'Pioneer',
    'Champion', 'Sage', 'Steward', 'Warden',
  ];

  const adjIdx = parseInt(hash.slice(0, 4), 16) % adjectives.length;
  const nounIdx = parseInt(hash.slice(4, 8), 16) % nouns.length;
  const num = parseInt(hash.slice(8, 12), 16) % 9000 + 1000;

  return `${adjectives[adjIdx]}${nouns[nounIdx]}#${num}`;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;
  const cacheKey = 'community:leaderboard:weekly';

  // Check cache
  const cached = await redisGet(cacheKey);
  if (cached) {
    const data = JSON.parse(cached) as { entries: LeaderboardEntry[]; updatedAt: string };
    // Mark current user's entry
    const entries = data.entries.map((e) => ({
      ...e,
      isCurrentUser: e.anonymousId === generateAnonymousId(userId),
    }));
    return NextResponse.json({ data: { entries, updatedAt: data.updatedAt } });
  }

  // Get weekly carbon totals per user
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const weeklyTotals = await prisma.carbonLog.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: since } },
    _sum: { totalCarbon: true },
    orderBy: { _sum: { totalCarbon: 'asc' } },
    take: 30, // Get extra to find current user
  });

  if (weeklyTotals.length === 0) {
    return NextResponse.json({
      data: { entries: [], updatedAt: new Date().toISOString() },
    });
  }

  // Get dominant layer per user for top 30
  const userIds = weeklyTotals.map((w) => w.userId);
  const layerAggregates = await Promise.all(
    userIds.map(async (uid) => {
      const agg = await prisma.carbonLog.aggregate({
        where: { userId: uid, createdAt: { gte: since } },
        _sum: {
          surfaceCarbon: true,
          shadowCarbon: true,
          ghostCarbon: true,
        },
      });
      return { userId: uid, agg };
    })
  );

  const layerMap = new Map(layerAggregates.map((l) => [l.userId, l.agg._sum]));

  // Get previous week for trend calculation
  const prevWeekStart = new Date(since.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekTotals = await prisma.carbonLog.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: prevWeekStart, lt: since } },
    _sum: { totalCarbon: true },
  });
  const prevWeekMap = new Map(
    prevWeekTotals.map((p) => [p.userId, p._sum.totalCarbon ?? 0])
  );

  // Build leaderboard entries (top 20 only exposed)
  const entries: LeaderboardEntry[] = weeklyTotals.slice(0, 20).map((entry, index) => {
    const weekly = entry._sum.totalCarbon ?? 0;
    const prevWeekly = prevWeekMap.get(entry.userId) ?? weekly;
    const reductionPercent =
      prevWeekly > 0 ? Math.round(((prevWeekly - weekly) / prevWeekly) * 100) : 0;

    const layers = layerMap.get(entry.userId);
    const surface = layers?.surfaceCarbon ?? 0;
    const shadow = layers?.shadowCarbon ?? 0;
    const ghost = layers?.ghostCarbon ?? 0;
    const topLayer =
      surface >= shadow && surface >= ghost
        ? 'surface'
        : shadow >= ghost
        ? 'shadow'
        : 'ghost';

    return {
      rank: index + 1,
      anonymousId: generateAnonymousId(entry.userId),
      weeklyTotal: Math.round(weekly * 100) / 100,
      reductionPercent,
      topLayer,
    };
  });

  const updatedAt = new Date().toISOString();
  await redisSet(cacheKey, JSON.stringify({ entries, updatedAt }), CACHE_TTL);

  // Check if current user is in top 20 — if not, find their rank
  const currentUserEntry = weeklyTotals.findIndex((w) => w.userId === userId);
  const enrichedEntries = entries.map((e) => ({
    ...e,
    isCurrentUser: e.anonymousId === generateAnonymousId(userId),
  }));

  // If current user is not in top 20, add their entry
  if (currentUserEntry >= 20) {
    const userWeekly = weeklyTotals[currentUserEntry];
    const weekly = userWeekly._sum.totalCarbon ?? 0;
    enrichedEntries.push({
      rank: currentUserEntry + 1,
      anonymousId: generateAnonymousId(userId),
      weeklyTotal: Math.round(weekly * 100) / 100,
      reductionPercent: 0,
      topLayer: 'surface',
      isCurrentUser: true,
    });
  }

  return NextResponse.json({ data: { entries: enrichedEntries, updatedAt } });
}
