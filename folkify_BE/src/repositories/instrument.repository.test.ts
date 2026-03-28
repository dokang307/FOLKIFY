import { getAllInstruments, getInstrumentById } from './instrument.repository';
import { prisma } from '../config/database';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    instrument: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Instrument Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllInstruments', () => {
    it('should return all instruments ordered by order_index', async () => {
      const mockInstruments = [
        {
          id: '1',
          name: 'Đàn Tranh',
          english_name: 'Dan Tranh',
          order_index: 0,
          deleted_at: null,
        },
        {
          id: '2',
          name: 'Sáo Trúc',
          english_name: 'Sao Truc',
          order_index: 1,
          deleted_at: null,
        },
      ];

      (prisma.instrument.findMany as jest.Mock).mockResolvedValue(mockInstruments);

      const result = await getAllInstruments();

      expect(result).toEqual(mockInstruments);
      expect(prisma.instrument.findMany).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
        },
        orderBy: {
          order_index: 'asc',
        },
      });
    });
  });

  describe('getInstrumentById', () => {
    it('should return instrument with lessons', async () => {
      const mockInstrument = {
        id: '1',
        name: 'Đàn Tranh',
        english_name: 'Dan Tranh',
        deleted_at: null,
        lessons: [
          {
            id: 'lesson1',
            title: 'Lesson 1',
            status: 'published',
            order_index: 0,
          },
        ],
      };

      (prisma.instrument.findUnique as jest.Mock).mockResolvedValue(mockInstrument);

      const result = await getInstrumentById('1');

      expect(result).toEqual(mockInstrument);
      expect(prisma.instrument.findUnique).toHaveBeenCalledWith({
        where: {
          id: '1',
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
    });

    it('should return null if instrument not found', async () => {
      (prisma.instrument.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getInstrumentById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
