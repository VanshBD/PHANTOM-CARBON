import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const testEmails = ['testco2@yopmail.com'];

  for (const email of testEmails) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await prisma.oracleReport.deleteMany({ where: { userId: user.id } });
      await prisma.carbonLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      console.info(`[cleanup] Deleted: ${email}`);
    } else {
      console.info(`[cleanup] Not found: ${email}`);
    }
  }

  const users = await prisma.user.findMany({
    select: { email: true, _count: { select: { carbonLogs: true } } },
  });
  console.info('[cleanup] Current accounts:');
  users.forEach(u => console.info(`  ${u.email} — ${u._count.carbonLogs} logs`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
