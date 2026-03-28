import { prisma } from '../config/database';
import redis from '../config/redis';
import { SheetMusic, Instrument, Prisma } from '@prisma/client';

/**
 * Get all sheets with filters
 * @param filters - Filter options
 * @returns Sheets matching filters
 */
export async function getAllSheets(filters: {
  instrument?: string;
  genre?: string;
  level?: string;
  is_premium?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ sheets: SheetMusic[]; total: number }> {
  const { instrument, genre, level, is_premium, page = 1, limit = 20 } = filters;

  // Create cache key based on filters
  const cacheKey = `sheets:list:${JSON.stringify({ instrument, genre, level, is_premium, page, limit })}`;

  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const where: Prisma.SheetMusicWhereInput = {
    deleted_at: null,
  };

  if (instrument) {
    where.instrument_id = instrument;
  }

  if (genre) {
    where.genre = genre;
  }

  if (level) {
    where.level = level as any;
  }

  if (is_premium !== undefined) {
    where.is_premium = is_premium;
  }

  const [sheets, total] = await Promise.all([
    prisma.sheetMusic.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        instrument: true,
      },
    }),
    prisma.sheetMusic.count({ where }),
  ]);

  const result = { sheets, total };

  // Cache for 30 minutes (1800 seconds)
  await redis.setex(cacheKey, 1800, JSON.stringify(result));

  return result;
}

/**
 * Get sheet by ID
 * @param id - Sheet ID
 * @returns Sheet with instrument or null
 */
export async function getSheetById(
  id: string
): Promise<(SheetMusic & { instrument: Instrument }) | null> {
  // Try to get from cache
  const cacheKey = `sheet:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const sheet = await prisma.sheetMusic.findUnique({
    where: {
      id,
      deleted_at: null,
    },
    include: {
      instrument: true,
    },
  });

  if (sheet) {
    // Cache for 30 minutes (1800 seconds)
    await redis.setex(cacheKey, 1800, JSON.stringify(sheet));
  }

  return sheet;
}

/**
 * Search sheets with filters
 * @param filters - Search filters
 * @returns Sheets matching filters
 */
export async function searchSheets(filters: {
  q?: string;
  genre?: string;
  level?: string;
  instrument?: string;
  is_premium?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ sheets: SheetMusic[]; total: number }> {
  const { q, genre, level, instrument, is_premium, page = 1, limit = 20 } = filters;

  // Create cache key based on search filters
  const cacheKey = `sheets:search:${JSON.stringify({ q, genre, level, instrument, is_premium, page, limit })}`;

  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const where: Prisma.SheetMusicWhereInput = {
    deleted_at: null,
  };

  // Search in title and composer
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { composer: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Filter by genre
  if (genre) {
    where.genre = genre;
  }

  // Filter by level
  if (level) {
    where.level = level as any;
  }

  // Filter by instrument
  if (instrument) {
    where.instrument_id = instrument;
  }

  // Filter by premium status
  if (is_premium !== undefined) {
    where.is_premium = is_premium;
  }

  const [sheets, total] = await Promise.all([
    prisma.sheetMusic.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        instrument: true,
      },
    }),
    prisma.sheetMusic.count({ where }),
  ]);

  const result = { sheets, total };

  // Cache for 30 minutes (1800 seconds)
  await redis.setex(cacheKey, 1800, JSON.stringify(result));

  return result;
}
