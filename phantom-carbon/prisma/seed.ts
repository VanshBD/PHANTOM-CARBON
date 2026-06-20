import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

// Generate realistic daily carbon data over 14 days
function generateCarbonLogs(userId: string): Array<{
  userId: string;
  inputText: string;
  inputType: 'CHAT' | 'RECEIPT' | 'SPENDING';
  surfaceCarbon: number;
  shadowCarbon: number;
  ghostCarbon: number;
  totalCarbon: number;
  breakdown: object;
  createdAt: Date;
}> {
  const entries = [];
  const now = new Date();

  const activitySets = [
    {
      inputText: 'Drove 20km to office, had coffee and a chicken sandwich for lunch',
      inputType: 'CHAT' as const,
      surfaceCarbon: 4.2 + 0.7,
      shadowCarbon: 0.2,
      ghostCarbon: 0.3,
      breakdown: { transport: 4.2, food: 0.7, digital: 0.3 },
    },
    {
      inputText: 'Receipt from Zomato: Paneer butter masala, naan, cold drink',
      inputType: 'RECEIPT' as const,
      surfaceCarbon: 0.6,
      shadowCarbon: 0.4,
      ghostCarbon: 1.2,
      breakdown: { food: 0.6, shopping: 0.4, supplyChain: 1.2 },
    },
    {
      inputText: 'Took the metro to work, vegetarian dal and rice for lunch',
      inputType: 'CHAT' as const,
      surfaceCarbon: 0.82 + 0.3,
      shadowCarbon: 0.1,
      ghostCarbon: 0.2,
      breakdown: { transport: 0.82, food: 0.3 },
    },
    {
      inputText: 'Bought new Nike sneakers for ₹4500 from Myntra',
      inputType: 'SPENDING' as const,
      surfaceCarbon: 0.5,
      shadowCarbon: 14.4,
      ghostCarbon: 8.1,
      breakdown: { shopping: 14.4, supplyChain: 8.1 },
    },
    {
      inputText: 'Worked from home, ordered Swiggy lunch, streamed 4hrs Netflix, used AC',
      inputType: 'CHAT' as const,
      surfaceCarbon: 8.2,
      shadowCarbon: 0.5,
      ghostCarbon: 1.344 + 0.8,
      breakdown: { energy: 8.2, food: 0.5, digital: 1.344, supplyChain: 0.8 },
    },
    {
      inputText: 'Weekend: drove to mall (30km), bought new phone case ₹800, ate a burger',
      inputType: 'CHAT' as const,
      surfaceCarbon: 6.3 + 2.5,
      shadowCarbon: 6.8,
      ghostCarbon: 1.44,
      breakdown: { transport: 6.3, food: 2.5, shopping: 6.8, supplyChain: 1.44 },
    },
    {
      inputText: 'Took bus to client meeting (15km), vegan lunch at cafe',
      inputType: 'CHAT' as const,
      surfaceCarbon: 1.335 + 0.18,
      shadowCarbon: 0.1,
      ghostCarbon: 0.15,
      breakdown: { transport: 1.335, food: 0.18 },
    },
  ];

  for (let day = 13; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Pick 1-2 activity sets per day
    const primaryActivity = activitySets[day % activitySets.length];
    const totalCarbon = primaryActivity.surfaceCarbon + primaryActivity.shadowCarbon + primaryActivity.ghostCarbon;

    entries.push({
      userId,
      inputText: primaryActivity.inputText,
      inputType: primaryActivity.inputType,
      surfaceCarbon: Math.round(primaryActivity.surfaceCarbon * 100) / 100,
      shadowCarbon: Math.round(primaryActivity.shadowCarbon * 100) / 100,
      ghostCarbon: Math.round(primaryActivity.ghostCarbon * 100) / 100,
      totalCarbon: Math.round(totalCarbon * 100) / 100,
      breakdown: primaryActivity.breakdown,
      createdAt: date,
    });
  }

  return entries;
}

async function main() {
  console.log('🌱 Starting Phantom Carbon database seed...');

  // Clean existing demo data
  await prisma.oracleReport.deleteMany({
    where: { user: { email: { in: ['demo@phantom.carbon', 'eco@phantom.carbon'] } } },
  });
  await prisma.carbonLog.deleteMany({
    where: { user: { email: { in: ['demo@phantom.carbon', 'eco@phantom.carbon'] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: ['demo@phantom.carbon', 'eco@phantom.carbon'] } },
  });

  const saltRounds = 12;

  // Create Demo User 1 — Typical urban commuter
  const user1 = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@phantom.carbon',
      passwordHash: await bcryptjs.hash('Demo@12345', saltRounds),
    },
  });
  console.log(`✅ Created user: ${user1.email}`);

  const logs1 = generateCarbonLogs(user1.id);
  for (const log of logs1) {
    await prisma.carbonLog.create({ data: log });
  }
  console.log(`✅ Created ${logs1.length} carbon logs for ${user1.email}`);

  // Oracle report for user 1
  await prisma.oracleReport.create({
    data: {
      userId: user1.id,
      darkFuture: 'In 2050, Mumbai sees 55°C summer days. Your street floods twice a year. The sea wall holds — barely.',
      possibleFuture: 'You commute by metro in 2050, mostly. Your diet shifted. Mumbai is hot but manageable.',
      phantomFuture: 'You addressed ghost carbon in 2025. By 2050, your neighborhood generates more energy than it uses.',
      weeklyCarbon: 42.5,
    },
  });

  // Create Demo User 2 — Low-carbon lifestyle
  const user2 = await prisma.user.create({
    data: {
      name: 'Eco Priya',
      email: 'eco@phantom.carbon',
      passwordHash: await bcryptjs.hash('Eco@12345', saltRounds),
    },
  });
  console.log(`✅ Created user: ${user2.email}`);

  const logs2 = generateCarbonLogs(user2.id).map((log) => ({
    ...log,
    surfaceCarbon: log.surfaceCarbon * 0.4,
    shadowCarbon: log.shadowCarbon * 0.3,
    ghostCarbon: log.ghostCarbon * 0.5,
    totalCarbon: (log.surfaceCarbon * 0.4 + log.shadowCarbon * 0.3 + log.ghostCarbon * 0.5),
  }));

  for (const log of logs2) {
    await prisma.carbonLog.create({ data: log });
  }
  console.log(`✅ Created ${logs2.length} carbon logs for ${user2.email}`);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo credentials:');
  console.log('   Email: demo@phantom.carbon  | Password: Demo@12345');
  console.log('   Email: eco@phantom.carbon   | Password: Eco@12345');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
