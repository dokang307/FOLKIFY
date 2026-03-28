import { prisma } from '../config/database';
import { Instrument, Lesson } from '@prisma/client';

/**
 * Get all instruments (for caching)
 * @returns All instruments ordered by order_index
 */
export async function getAllInstruments(): Promise<Instrument[]> {
  return prisma.instrument.findMany({
    where: {
      deleted_at: null,
    },
    orderBy: {
      order_index: 'asc',
    },
  });
}

/**
 * Get instrument by ID with lessons
 * @param id - Instrument ID
 * @returns Instrument with lessons or null
 */
export async function getInstrumentById(
  id: string
): Promise<(Instrument & { lessons: Lesson[] }) | null> {
  return prisma.instrument.findUnique({
    where: {
      id,
      deleted_at: null,
    },
    include: {
      lessons: {
        where: {
          status: 'published',
          deleted_at: null,
        },
        orderBy: {
          order_index: 'asc',
        },
      },
    },
  });
}
