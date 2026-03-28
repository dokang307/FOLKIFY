import { PrismaClient, LessonLevel, LessonStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  console.log('Creating admin user...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@folkify.com' },
    update: {},
    create: {
      email: 'admin@folkify.com',
      password_hash: adminPasswordHash,
      full_name: 'Admin User',
      role: 'admin',
      account_type: 'pro',
      account_status: 'active',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create admin stats
  await prisma.userStats.upsert({
    where: { user_id: admin.id },
    update: {},
    create: {
      user_id: admin.id,
      level: 1,
      total_xp: 0,
      lessons_completed: 0,
      total_practice_minutes: 0,
      current_streak: 0,
      longest_streak: 0,
    },
  });

  // Create instruments
  console.log('Creating instruments...');
  const instruments = [
    {
      name: 'Đàn Tranh',
      english_name: 'Vietnamese Zither',
      region: 'Miền Nam',
      category: 'Dây',
      emoji: '🎵',
      color: '#FF6B6B',
      bg_gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
      short_desc: 'Nhạc cụ truyền thống với 16-17 dây',
      description:
        'Đàn tranh là một nhạc cụ dây truyền thống của Việt Nam, có nguồn gốc từ đàn tranh Trung Quốc. Đàn có 16-17 dây, mỗi dây được căng trên một cầu đàn riêng biệt.',
      origin: 'Nguồn gốc từ Trung Quốc, phát triển tại Việt Nam',
      material: 'Gỗ quý, dây đồng hoặc thép',
      sound_range: '3 quãng tám',
      difficulty: 'Trung bình đến khó',
      popularity: 95,
      facts: JSON.stringify([
        'Có 16-17 dây',
        'Mỗi dây có một cầu đàn riêng',
        'Âm thanh trong trẻo, du dương',
      ]),
      order_index: 1,
    },
    {
      name: 'Sáo Trúc',
      english_name: 'Bamboo Flute',
      region: 'Toàn quốc',
      category: 'Hơi',
      emoji: '🎋',
      color: '#4ECDC4',
      bg_gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
      short_desc: 'Sáo tre truyền thống Việt Nam',
      description:
        'Sáo trúc là nhạc cụ hơi truyền thống được làm từ tre, có âm thanh trong trẻo, gần gũi với thiên nhiên.',
      origin: 'Việt Nam',
      material: 'Tre, trúc',
      sound_range: '2 quãng tám',
      difficulty: 'Dễ đến trung bình',
      popularity: 90,
      facts: JSON.stringify([
        'Làm từ tre tự nhiên',
        'Có 6 lỗ bấm chính',
        'Âm thanh trong trẻo, gần gũi',
      ]),
      order_index: 2,
    },
    {
      name: 'Đàn Bầu',
      english_name: 'Monochord',
      region: 'Miền Bắc',
      category: 'Dây',
      emoji: '🎸',
      color: '#95E1D3',
      bg_gradient: 'linear-gradient(135deg, #95E1D3 0%, #38A3A5 100%)',
      short_desc: 'Nhạc cụ một dây độc đáo',
      description:
        'Đàn bầu là nhạc cụ truyền thống Việt Nam chỉ có một dây, tạo ra âm thanh du dương, sâu lắng.',
      origin: 'Việt Nam',
      material: 'Gỗ, dây thép, bầu khô',
      sound_range: '3 quãng tám',
      difficulty: 'Khó',
      popularity: 85,
      facts: JSON.stringify([
        'Chỉ có một dây duy nhất',
        'Sử dụng cần gạt để thay đổi cao độ',
        'Âm thanh sâu lắng, trữ tình',
      ]),
      order_index: 3,
    },
    {
      name: 'Đàn Nguyệt',
      english_name: 'Moon Lute',
      region: 'Miền Nam',
      category: 'Dây',
      emoji: '🌙',
      color: '#F38181',
      bg_gradient: 'linear-gradient(135deg, #F38181 0%, #FCE38A 100%)',
      short_desc: 'Đàn lute hình trăng',
      description:
        'Đàn nguyệt có thân hình tròn như mặt trăng, là nhạc cụ quan trọng trong dàn nhạc cải lương.',
      origin: 'Trung Quốc, phát triển tại Việt Nam',
      material: 'Gỗ, da trăn',
      sound_range: '2 quãng tám',
      difficulty: 'Trung bình',
      popularity: 75,
      facts: JSON.stringify([
        'Thân hình tròn như mặt trăng',
        'Có 2 dây chính',
        'Quan trọng trong cải lương',
      ]),
      order_index: 4,
    },
    {
      name: 'Đàn Nhị',
      english_name: 'Two-String Fiddle',
      region: 'Miền Bắc',
      category: 'Dây',
      emoji: '🎻',
      color: '#A8E6CF',
      bg_gradient: 'linear-gradient(135deg, #A8E6CF 0%, #DCEDC1 100%)',
      short_desc: 'Đàn kéo hai dây',
      description:
        'Đàn nhị là nhạc cụ dây kéo có hai dây, tạo ra âm thanh trầm ấm, thường dùng trong nhạc dân tộc.',
      origin: 'Trung Quốc, phát triển tại Việt Nam',
      material: 'Gỗ, da trăn, dây tơ',
      sound_range: '2.5 quãng tám',
      difficulty: 'Trung bình đến khó',
      popularity: 70,
      facts: JSON.stringify(['Có 2 dây', 'Kéo bằng cung như violin', 'Âm thanh trầm ấm, sâu lắng']),
      order_index: 5,
    },
  ];

  const createdInstruments = [];
  for (const instrument of instruments) {
    const created = await prisma.instrument.upsert({
      where: { id: instrument.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: instrument,
    });
    createdInstruments.push(created);
    console.log(`✅ Instrument created: ${created.name}`);
  }

  // Create lessons for each instrument
  console.log('Creating lessons...');
  for (const instrument of createdInstruments) {
    // 3 free lessons
    const freeLessons = [
      {
        instrument_id: instrument.id,
        title: `Giới thiệu ${instrument.name}`,
        duration: 15,
        level: LessonLevel.Beginner,
        status: LessonStatus.published,
        is_premium: false,
        description: `Tìm hiểu về lịch sử và cấu tạo của ${instrument.name}`,
        xp: 100,
        order_index: 1,
        youtube_embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        steps: JSON.stringify([
          { title: 'Lịch sử nhạc cụ', duration: 5 },
          { title: 'Cấu tạo và bộ phận', duration: 5 },
          { title: 'Tư thế cầm đàn', duration: 5 },
        ]),
        tips: JSON.stringify([
          'Giữ tư thế thẳng lưng',
          'Thư giãn vai và cánh tay',
          'Luyện tập đều đặn mỗi ngày',
        ]),
      },
      {
        instrument_id: instrument.id,
        title: `Kỹ thuật cơ bản ${instrument.name}`,
        duration: 20,
        level: LessonLevel.Beginner,
        status: LessonStatus.published,
        is_premium: false,
        description: `Học các kỹ thuật cơ bản để chơi ${instrument.name}`,
        xp: 150,
        order_index: 2,
        youtube_embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        steps: JSON.stringify([
          { title: 'Kỹ thuật cầm nắm', duration: 7 },
          { title: 'Bài tập khởi động', duration: 7 },
          { title: 'Thực hành nốt đơn', duration: 6 },
        ]),
        tips: JSON.stringify(['Bắt đầu chậm rãi', 'Chú ý đến âm thanh', 'Luyện tập từng phần nhỏ']),
      },
      {
        instrument_id: instrument.id,
        title: `Bài hát đầu tiên - ${instrument.name}`,
        duration: 25,
        level: LessonLevel.Beginner,
        status: LessonStatus.published,
        is_premium: false,
        description: `Học bài hát đơn giản đầu tiên với ${instrument.name}`,
        xp: 200,
        order_index: 3,
        youtube_embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        steps: JSON.stringify([
          { title: 'Học giai điệu chính', duration: 10 },
          { title: 'Luyện tập từng đoạn', duration: 10 },
          { title: 'Chơi toàn bài', duration: 5 },
        ]),
        tips: JSON.stringify([
          'Nghe bài hát nhiều lần',
          'Chia nhỏ thành các phần',
          'Tăng tốc độ dần dần',
        ]),
      },
    ];

    // 5 premium lessons
    const premiumLessons = [
      {
        instrument_id: instrument.id,
        title: `Kỹ thuật nâng cao ${instrument.name}`,
        duration: 30,
        level: LessonLevel.Intermediate,
        status: LessonStatus.published,
        is_premium: true,
        description: `Nâng cao kỹ năng chơi ${instrument.name} với các kỹ thuật phức tạp`,
        xp: 250,
        order_index: 4,
        youtube_embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        steps: JSON.stringify([
          { title: 'Kỹ thuật trang trí', duration: 10 },
          { title: 'Chuyển đổi nốt nhanh', duration: 10 },
          { title: 'Biểu cảm âm nhạc', duration: 10 },
        ]),
        tips: JSON.stringify([
          'Luyện tập kỹ thuật riêng biệt',
          'Chú ý đến cảm xúc',
          'Nghe các nghệ sĩ chuyên nghiệp',
        ]),
      },
      {
        instrument_id: instrument.id,
        title: `Bài hát dân ca truyền thống`,
        duration: 35,
        level: LessonLevel.Intermediate,
        status: LessonStatus.published,
        is_premium: true,
        description: `Học chơi các bài dân ca Việt Nam truyền thống`,
        xp: 300,
        order_index: 5,
        youtube_embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        steps: JSON.stringify([
          { title: 'Tìm hiểu bài hát', duration: 10 },
          { title: 'Học giai điệu chính', duration: 15 },
          { title: 'Thêm trang trí', duration: 10 },
        ]),
        tips: JSON.stringify([
          'Hiểu ý nghĩa bài hát',
          'Chú ý đến phong cách dân gian',
          'Thể hiện cảm xúc chân thật',
        ]),
      },
      {
        instrument_id: instrument.id,
        title: `Kỹ thuật ứng tấu`,
        duration: 40,
        level: LessonLevel.Advanced,
        status: LessonStatus.published,
        is_premium: true,
        description: `Học cách ứng tấu và sáng tạo với ${instrument.name}`,
        xp: 350,
        order_index: 6,
        youtube_embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        steps: JSON.stringify([
          { title: 'Lý thuyết ứng tấu', duration: 15 },
          { title: 'Thực hành với backing track', duration: 15 },
          { title: 'Sáng tạo giai điệu riêng', duration: 10 },
        ]),
        tips: JSON.stringify(['Hiểu về âm giai', 'Lắng nghe và phản ứng', 'Đừng ngại thử nghiệm']),
      },
      {
        instrument_id: instrument.id,
        title: `Biểu diễn chuyên nghiệp`,
        duration: 45,
        level: LessonLevel.Advanced,
        status: LessonStatus.published,
        is_premium: true,
        description: `Chuẩn bị cho buổi biểu diễn chuyên nghiệp`,
        xp: 400,
        order_index: 7,
        youtube_embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        steps: JSON.stringify([
          { title: 'Chuẩn bị tinh thần', duration: 10 },
          { title: 'Kỹ thuật sân khấu', duration: 15 },
          { title: 'Xử lý tình huống', duration: 10 },
          { title: 'Tương tác khán giả', duration: 10 },
        ]),
        tips: JSON.stringify([
          'Luyện tập trước gương',
          'Ghi âm và nghe lại',
          'Tự tin và tận hưởng',
        ]),
      },
      {
        instrument_id: instrument.id,
        title: `Masterclass: Nghệ thuật biểu cảm`,
        duration: 50,
        level: LessonLevel.Advanced,
        status: LessonStatus.published,
        is_premium: true,
        description: `Khóa học chuyên sâu về nghệ thuật biểu cảm trong âm nhạc dân tộc`,
        xp: 500,
        order_index: 8,
        youtube_embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        steps: JSON.stringify([
          { title: 'Phân tích tác phẩm', duration: 15 },
          { title: 'Kỹ thuật biểu cảm', duration: 20 },
          { title: 'Thực hành tổng hợp', duration: 15 },
        ]),
        tips: JSON.stringify([
          'Cảm nhận sâu sắc âm nhạc',
          'Kết hợp kỹ thuật và cảm xúc',
          'Phát triển phong cách riêng',
        ]),
      },
    ];

    const allLessons = [...freeLessons, ...premiumLessons];
    for (const lesson of allLessons) {
      await prisma.lesson.create({ data: lesson });
    }
    console.log(`✅ Created 8 lessons for ${instrument.name}`);
  }

  // Create sample sheet music
  console.log('Creating sheet music...');
  for (const instrument of createdInstruments) {
    const sheetMusicItems = [
      {
        instrument_id: instrument.id,
        title: 'Lý Ngựa Ô',
        composer: 'Dân gian',
        genre: 'Dân ca',
        level: LessonLevel.Beginner,
        is_premium: false,
        file_path: `/sheets/${instrument.id}/ly-ngua-o.pdf`,
        preview_url: `/sheets/${instrument.id}/ly-ngua-o-preview.jpg`,
        pages: 2,
      },
      {
        instrument_id: instrument.id,
        title: 'Trống Cơm',
        composer: 'Dân gian',
        genre: 'Dân ca',
        level: LessonLevel.Beginner,
        is_premium: false,
        file_path: `/sheets/${instrument.id}/trong-com.pdf`,
        preview_url: `/sheets/${instrument.id}/trong-com-preview.jpg`,
        pages: 2,
      },
      {
        instrument_id: instrument.id,
        title: 'Diễm Xưa',
        composer: 'Trịnh Công Sơn',
        genre: 'Nhạc trữ tình',
        level: LessonLevel.Intermediate,
        is_premium: true,
        file_path: `/sheets/${instrument.id}/diem-xua.pdf`,
        preview_url: `/sheets/${instrument.id}/diem-xua-preview.jpg`,
        pages: 3,
      },
      {
        instrument_id: instrument.id,
        title: 'Bèo Dạt Mây Trôi',
        composer: 'Dân gian',
        genre: 'Dân ca',
        level: LessonLevel.Intermediate,
        is_premium: true,
        file_path: `/sheets/${instrument.id}/beo-dat-may-troi.pdf`,
        preview_url: `/sheets/${instrument.id}/beo-dat-may-troi-preview.jpg`,
        pages: 4,
      },
    ];

    for (const sheet of sheetMusicItems) {
      await prisma.sheetMusic.create({ data: sheet });
    }
    console.log(`✅ Created 4 sheet music items for ${instrument.name}`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
