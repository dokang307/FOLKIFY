import { prisma } from '../config/database';
import { Lesson, Instrument, Prisma } from '@prisma/client';

/**
 * Get lessons by instrument ID (for caching)
 * @param instrumentId - Instrument ID
 * @returns Lessons for the instrument
 */
export async function getLessonsByInstrument(instrumentId: string): Promise<Lesson[]> {
  return prisma.lesson.findMany({
    where: {
      instrument_id: instrumentId,
      status: 'published',
      deleted_at: null,
    },
    orderBy: {
      order_index: 'asc',
    },
  });
}

/**
 * Get lesson by ID
 * @param id - Lesson ID
 * @returns Lesson with instrument or null
 */
export async function getLessonById(
  id: string
): Promise<(Lesson & { instrument: Instrument }) | null> {
  return prisma.lesson.findUnique({
    where: {
      id,
      deleted_at: null,
    },
    include: {
      instrument: true,
    },
  });
}

/**
 * Search lessons with filters
 * @param filters - Search filters
 * @returns Lessons matching filters
 */
export async function searchLessons(filters: {
  q?: string;
  level?: string;
  instrumentId?: string;
  page?: number;
  limit?: number;
}): Promise<{ lessons: Lesson[]; total: number }> {
  const { q, level, instrumentId, page = 1, limit = 20 } = filters;

  const where: Prisma.LessonWhereInput = {
    status: 'published',
    deleted_at: null,
  };

  // Search in title and description
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Filter by level
  if (level) {
    where.level = level as any;
  }

  // Filter by instrument
  if (instrumentId) {
    where.instrument_id = instrumentId;
  }

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        order_index: 'asc',
      },
      include: {
        instrument: true,
      },
    }),
    prisma.lesson.count({ where }),
  ]);

  return { lessons, total };
}
