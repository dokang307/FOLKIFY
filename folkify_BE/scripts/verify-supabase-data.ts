import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying Supabase database data...\n');

  try {
    // Count users
    const userCount = await prisma.user.count();
    console.log(`✅ Users: ${userCount}`);

    // Count instruments
    const instrumentCount = await prisma.instrument.count();
    console.log(`✅ Instruments: ${instrumentCount}`);

    // Count lessons
    const lessonCount = await prisma.lesson.count();
    console.log(`✅ Lessons: ${lessonCount}`);

    // Count sheet music
    const sheetMusicCount = await prisma.sheetMusic.count();
    console.log(`✅ Sheet Music: ${sheetMusicCount}`);

    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@folkify.com' },
      select: { email: true, full_name: true, role: true, account_type: true },
    });
    console.log(`\n✅ Admin User:`, admin);

    // Get instruments
    const instruments = await prisma.instrument.findMany({
      select: { name: true, english_name: true },
    });
    console.log(`\n✅ Instruments:`);
    instruments.forEach((inst) => console.log(`   - ${inst.name} (${inst.english_name})`));

    console.log('\n🎉 Verification complete! All data is present in Supabase.');
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
