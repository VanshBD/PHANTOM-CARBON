import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      _count: { select: { carbonLogs: true } },
    },
  });

  console.log('\n📊 Database Status:');
  for (const u of users) {
    console.log(`  ${u.email} — ${u._count.carbonLogs} carbon logs`);
  }

  const totalLogs = await prisma.carbonLog.count();
  console.log(`\n  Total carbon logs: ${totalLogs}`);

  // Check date range of logs
  const oldest = await prisma.carbonLog.findFirst({ orderBy: { createdAt: 'asc'  }, select: { createdAt: true } });
  const newest = await prisma.carbonLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
  if (oldest && newest) {
    console.log(`  Date range: ${oldest.createdAt.toISOString().split('T')[0]} → ${newest.createdAt.toISOString().split('T')[0]}`);
  }

  // Check if logs are within past 7 days
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent  = await prisma.carbonLog.count({ where: { createdAt: { gte: since7d } } });
  console.log(`  Logs in past 7 days: ${recent}`);

  if (recent === 0 && totalLogs > 0) {
    console.log('\n  ⚠️  All logs are older than 7 days! Re-running seed to fix dates...');
  } else if (recent > 0) {
    console.log('\n  ✅ Dashboard should show data for the past 7 days.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
