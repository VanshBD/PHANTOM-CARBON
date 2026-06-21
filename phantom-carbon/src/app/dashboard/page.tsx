import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { GhostRadar } from '@/components/dashboard/GhostRadar';
import { ThreeLayerChart } from '@/components/dashboard/ThreeLayerChart';
import { LayerBreakdownCard } from '@/components/dashboard/LayerBreakdownCard';
import { DailyScoreCard } from '@/components/dashboard/DailyScoreCard';
import { DashboardRefresher } from '@/components/dashboard/DashboardRefresher';
import type { Metadata } from 'next';
import type { CarbonSummary, CarbonBreakdown, DailyCarbon } from '@/types';

export const metadata: Metadata = { title: 'Dashboard' };

// Direct DB query — no HTTP self-call, fully server-side
async function getCarbonSummary(userId: string): Promise<CarbonSummary> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const logs = await prisma.carbonLog.findMany({
    where: { userId, createdAt: { gte: since } },
    select: {
      surfaceCarbon: true,
      shadowCarbon: true,
      ghostCarbon: true,
      totalCarbon: true,
      breakdown: true,
      createdAt: true,
      rawAiResponse: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (logs.length === 0) {
    return {
      period: '7d',
      totalSurface: 0,
      totalShadow: 0,
      totalGhost: 0,
      totalCarbon: 0,
      dailyBreakdown: [],
      trend: 'stable',
      categoryBreakdown: {},
    };
  }

  // Aggregate totals
  const totals = logs.reduce(
    (acc, log) => ({
      surface: acc.surface + log.surfaceCarbon,
      shadow:  acc.shadow  + log.shadowCarbon,
      ghost:   acc.ghost   + log.ghostCarbon,
      total:   acc.total   + log.totalCarbon,
    }),
    { surface: 0, shadow: 0, ghost: 0, total: 0 }
  );

  // Category breakdown
  const categoryBreakdown: CarbonBreakdown = {};
  for (const log of logs) {
    const bd = log.breakdown as CarbonBreakdown | null;
    if (!bd) continue;
    if (bd.transport)   categoryBreakdown.transport   = (categoryBreakdown.transport   ?? 0) + bd.transport;
    if (bd.food)        categoryBreakdown.food        = (categoryBreakdown.food        ?? 0) + bd.food;
    if (bd.energy)      categoryBreakdown.energy      = (categoryBreakdown.energy      ?? 0) + bd.energy;
    if (bd.shopping)    categoryBreakdown.shopping    = (categoryBreakdown.shopping    ?? 0) + bd.shopping;
    if (bd.digital)     categoryBreakdown.digital     = (categoryBreakdown.digital     ?? 0) + bd.digital;
    if (bd.supplyChain) categoryBreakdown.supplyChain = (categoryBreakdown.supplyChain ?? 0) + bd.supplyChain;
  }

  // Daily breakdown map
  const dailyMap = new Map<string, DailyCarbon>();
  for (const log of logs) {
    const dateKey = log.createdAt.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) ?? { date: dateKey, surface: 0, shadow: 0, ghost: 0, total: 0 };
    dailyMap.set(dateKey, {
      ...existing,
      surface: existing.surface + log.surfaceCarbon,
      shadow:  existing.shadow  + log.shadowCarbon,
      ghost:   existing.ghost   + log.ghostCarbon,
      total:   existing.total   + log.totalCarbon,
    });
  }
  const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Trend: compare first vs second half
  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (dailyBreakdown.length >= 4) {
    const mid = Math.floor(dailyBreakdown.length / 2);
    const firstAvg  = dailyBreakdown.slice(0, mid).reduce((s, d) => s + d.total, 0) / mid;
    const secondAvg = dailyBreakdown.slice(mid).reduce((s, d) => s + d.total, 0) / (dailyBreakdown.length - mid);
    if (secondAvg < firstAvg * 0.95) trend = 'improving';
    else if (secondAvg > firstAvg * 1.05) trend = 'worsening';
  }

  // Top action from latest log
  const latest = logs[logs.length - 1];
  const raw = latest?.rawAiResponse as { topAction?: string } | null;

  return {
    period: '7d',
    totalSurface:  Math.round(totals.surface * 100) / 100,
    totalShadow:   Math.round(totals.shadow  * 100) / 100,
    totalGhost:    Math.round(totals.ghost   * 100) / 100,
    totalCarbon:   Math.round(totals.total   * 100) / 100,
    dailyBreakdown,
    trend,
    categoryBreakdown,
    topAction: raw?.topAction,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const summary = await getCarbonSummary(session.user.id);

  const totalCarbon   = summary.totalCarbon;
  const surfaceCarbon = summary.totalSurface;
  const shadowCarbon  = summary.totalShadow;
  const ghostCarbon   = summary.totalGhost;
  const layerPercent  = (v: number) => totalCarbon > 0 ? (v / totalCarbon) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar userName={session.user.name} />

      <main id="main-content" className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Carbon Dashboard</h1>
                <p className="text-gray-500 mt-1">
                  Your full three-layer carbon footprint — past 7 days
                </p>
              </div>
              <DashboardRefresher intervalSeconds={30} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — Radar + Score */}
            <div className="space-y-6">
              <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6" aria-labelledby="radar-heading">
                <h2 id="radar-heading" className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Ghost Radar
                </h2>
                <div className="flex justify-center">
                  <GhostRadar
                    surfaceCarbon={surfaceCarbon}
                    shadowCarbon={shadowCarbon}
                    ghostCarbon={ghostCarbon}
                  />
                </div>
              </section>

              <DailyScoreCard summary={summary} />
            </div>

            {/* Right — Chart + Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6" aria-labelledby="chart-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="chart-heading" className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    7-Day Carbon Trend
                  </h2>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    summary.trend === 'improving' ? 'bg-green-900/30 text-green-400' :
                    summary.trend === 'worsening' ? 'bg-red-900/30 text-red-400' :
                    'bg-gray-800 text-gray-500'
                  }`}>
                    {summary.trend === 'improving' ? '↓ Improving' :
                     summary.trend === 'worsening' ? '↑ Worsening' : '→ Stable'}
                  </span>
                </div>
                <ThreeLayerChart data={summary.dailyBreakdown} period="7d" />
              </section>

              <section aria-labelledby="breakdown-heading">
                <h2 id="breakdown-heading" className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Layer Breakdown
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <LayerBreakdownCard layer="surface" value={surfaceCarbon} percentage={layerPercent(surfaceCarbon)} />
                  <LayerBreakdownCard layer="shadow"  value={shadowCarbon}  percentage={layerPercent(shadowCarbon)}  />
                  <LayerBreakdownCard layer="ghost"   value={ghostCarbon}   percentage={layerPercent(ghostCarbon)}   />
                </div>
              </section>

              {totalCarbon === 0 && (
                <div className="bg-gray-900/50 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
                  <p className="text-3xl mb-3" aria-hidden="true">👻</p>
                  <h3 className="text-white font-semibold mb-2">No carbon data yet</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Start by chatting about your activities or uploading a receipt.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a href="/chat"   className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">Start chatting</a>
                    <a href="/upload" className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">Upload receipt</a>
                  </div>
                </div>
              )}

              {/* Category Breakdown */}
              {totalCarbon > 0 && Object.keys(summary.categoryBreakdown).length > 0 && (
                <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6" aria-labelledby="cat-heading">
                  <h2 id="cat-heading" className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Category Breakdown
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(summary.categoryBreakdown)
                      .filter(([, v]) => (v ?? 0) > 0)
                      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                      .map(([cat, val]) => {
                        const pct = totalCarbon > 0 ? ((val ?? 0) / totalCarbon) * 100 : 0;
                        return (
                          <div key={cat}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400 capitalize">{cat}</span>
                              <span className="text-white font-medium">{(val ?? 0).toFixed(2)} kg</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full">
                              <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
