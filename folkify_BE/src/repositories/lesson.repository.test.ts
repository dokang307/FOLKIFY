import { getLessonsByInstrument, getLessonById, searchLessons } from './lesson.repository';
import { prisma } from '../config/database';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    lesson: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Lesson Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLessonsByInstrument', () => {
    it('should return lessons for an instrument', async () => {
      const mockLessons = [
        {
          id: 'lesson1',
          title: 'Lesson 1',
          instrument_id: 'instrument1',
          status: 'published',
          order_index: 0,
        },
      ];

      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);

      const result = await getLessonsByInstrument('instrument1');

      expect(result).toEqual(mockLessons);
      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        where: {
          instrument_id: 'instrument1',
          status: 'published',
          deleted_at: null,
        },
        orderBy: {
          order_index: 'asc',
        },
      });
    });
  });

  describe('getLessonById', () => {
    it('should return lesson with instrument', async () => {
      const mockLesson = {
        id: 'lesson1',
        title: 'Lesson 1',
        instrument: {
          id: 'instrument1',
          name: 'Đàn Tranh',
        },
      };

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);

      const result = await getLessonById('lesson1');

      expect(result).toEqual(mockLesson);
      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'lesson1',
          deleted_at: null,
        },
        include: {
          instrument: true,
        },
      });
    });

    it('should return null if lesson not found', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getLessonById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('searchLessons', () => {
    it('should search lessons with query', async () => {
      const mockLessons = [
        {
          id: 'lesson1',
          title: 'Basic Techniques',
          description: 'Learn basic techniques',
        },
      ];

      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(1);

      const result = await searchLessons({ q: 'basic', page: 1, limit: 20 });

      expect(result.lessons).toEqual(mockLessons);
      expect(result.total).toBe(1);
      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        where: {
          status: 'published',
          deleted_at: null,
          OR: [
            { title: { contains: 'basic', mode: 'insensitive' } },
            { description: { contains: 'basic', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: {
          order_index: 'asc',
        },
        include: {
          instrument: true,
        },
      });
    });

    it('should filter by level', async () => {
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(0);

      await searchLessons({ level: 'Beginner' });

      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            level: 'Beginner',
          }),
        })
      );
    });

    it('should filter by instrument', async () => {
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(0);

      await searchLessons({ instrumentId: 'instrument1' });

      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            instrument_id: 'instrument1',
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(50);

      const result = await searchLessons({ page: 2, limit: 10 });

      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.total).toBe(50);
    });
  });
});
