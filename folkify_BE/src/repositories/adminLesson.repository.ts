import { prisma } from '../config/database';
import { Lesson, Prisma } from '@prisma/client';

/**
 * Create a new lesson
 * @param data - Lesson creation data
 * @returns Created lesson
 */
export async function create(data: Prisma.LessonCreateInput): Promise<Lesson> {
  return prisma.lesson.create({
    data,
  });
}

/**
 * Find lessons with filters, pagination, and sorting
 * @param filters - Query filters
 * @returns Lessons matching filters
 */
export async function findMany(filters: {
  where: Prisma.LessonWhereInput;
  skip?: number;
  take?: number;
  orderBy?: Prisma.LessonOrderByWithRelationInput;
  include?: Prisma.LessonInclude;
}): Promise<Lesson[]> {
  return prisma.lesson.findMany(filters);
}

/**
 * Count lessons matching filters
 * @param where - Query filters
 * @returns Count of lessons
 */
export async function count(where: Prisma.LessonWhereInput): Promise<number> {
  return prisma.lesson.count({ where });
}

/**
 * Find lesson by ID
 * @param id - Lesson ID
 * @param includeDeleted - Whether to include soft-deleted lessons
 * @returns Lesson or null
 */
export async function findById(
  id: string,
  includeDeleted: boolean = false
): Promise<Lesson | null> {
  const where: Prisma.LessonWhereInput = { id };

  if (!includeDeleted) {
    where.deleted_at = null;
  }

  return prisma.lesson.findFirst({
    where,
  });
}

/**
 * Update lesson
 * @param id - Lesson ID
 * @param data - Update data
 * @returns Updated lesson
 */
export async function update(id: string, data: Prisma.LessonUpdateInput): Promise<Lesson> {
  return prisma.lesson.update({
    where: { id },
    data,
  });
}

/**
 * Soft delete lesson by setting deleted_at timestamp
 * @param id - Lesson ID
 * @returns Soft-deleted lesson
 */
export async function softDelete(id: string): Promise<Lesson> {
  return prisma.lesson.update({
    where: { id },
    data: {
      deleted_at: new Date(),
    },
  });
}

/**
 * Get maximum order_index for an instrument
 * @param instrumentId - Instrument ID
 * @returns Maximum order_index or -1 if no lessons exist
 */
export async function getMaxOrderIndex(instrumentId: string): Promise<number> {
  const result = await prisma.lesson.aggregate({
    where: {
      instrument_id: instrumentId,
      deleted_at: null,
    },
    _max: {
      order_index: true,
    },
  });

  return result._max.order_index ?? -1;
}

/**
 * Batch update order_index for multiple lessons
 * @param updates - Array of lesson ID and new order_index pairs
 */
export async function batchUpdateOrderIndex(
  updates: Array<{ id: string; orderIndex: number }>
): Promise<void> {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.lesson.update({
        where: { id: update.id },
        data: { order_index: update.orderIndex },
      })
    )
  );
}

/**
 * Check if an instrument exists
 * @param instrumentId - Instrument ID
 * @returns True if instrument exists, false otherwise
 */
export async function instrumentExists(instrumentId: string): Promise<boolean> {
  const count = await prisma.instrument.count({
    where: {
      id: instrumentId,
      deleted_at: null,
    },
  });

  return count > 0;
}
