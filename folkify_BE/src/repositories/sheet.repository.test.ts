import { prisma } from '../config/database';
import redis from '../config/redis';
import { getAllSheets, getSheetById, searchSheets } from './sheet.repository';

// Mock Prisma and Redis
jest.mock('../config/database', () => ({
  prisma: {
    sheetMusic: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    setex: jest.fn(),
  },
}));

describe('Sheet Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSheets', () => {
    it('should return sheets from cache if available', async () => {
      const mockSheets = [
        {
          id: 'sheet-1',
          title: 'Test Sheet',
          instrument_id: 'instrument-1',
          is_premium: false,
        },
      ];
      const mockResult = { sheets: mockSheets, total: 1 };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockResult));

      const result = await getAllSheets({ page: 1, limit: 20 });

      expect(result).toEqual(mockResult);
      expect(redis.get).toHaveBeenCalled();
      expect(prisma.sheetMusic.findMany).not.toHaveBeenCalled();
    });

    it('should fetch sheets from database and cache them if not in cache', async () => {
      const mockSheets = [
        {
          id: 'sheet-1',
          title: 'Test Sheet',
          instrument_id: 'instrument-1',
          is_premium: false,
          instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
        },
      ];

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.sheetMusic.findMany as jest.Mock).mockResolvedValue(mockSheets);
      (prisma.sheetMusic.count as jest.Mock).mockResolvedValue(1);

      const result = await getAllSheets({ page: 1, limit: 20 });

      expect(result).toEqual({ sheets: mockSheets, total: 1 });
      expect(redis.get).toHaveBeenCalled();
      expect(prisma.sheetMusic.findMany).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalledWith(
        expect.any(String),
        1800,
        JSON.stringify({ sheets: mockSheets, total: 1 })
      );
    });

    it('should filter sheets by instrument', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.sheetMusic.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sheetMusic.count as jest.Mock).mockResolvedValue(0);

      await getAllSheets({ instrument: 'instrument-1', page: 1, limit: 20 });

      expect(prisma.sheetMusic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            instrument_id: 'instrument-1',
          }),
        })
      );
    });

    it('should filter sheets by premium status', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.sheetMusic.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sheetMusic.count as jest.Mock).mockResolvedValue(0);

      await getAllSheets({ is_premium: true, page: 1, limit: 20 });

      expect(prisma.sheetMusic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_premium: true,
          }),
        })
      );
    });
  });

  describe('getSheetById', () => {
    it('should return sheet from cache if available', async () => {
      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockSheet));

      const result = await getSheetById('sheet-1');

      expect(result).toEqual(mockSheet);
      expect(redis.get).toHaveBeenCalledWith('sheet:sheet-1');
      expect(prisma.sheetMusic.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch sheet from database and cache it if not in cache', async () => {
      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.sheetMusic.findUnique as jest.Mock).mockResolvedValue(mockSheet);

      const result = await getSheetById('sheet-1');

      expect(result).toEqual(mockSheet);
      expect(redis.get).toHaveBeenCalled();
      expect(prisma.sheetMusic.findUnique).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalledWith('sheet:sheet-1', 1800, JSON.stringify(mockSheet));
    });

    it('should return null if sheet not found', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.sheetMusic.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getSheetById('non-existent');

      expect(result).toBeNull();
      expect(redis.setex).not.toHaveBeenCalled();
    });
  });

  describe('searchSheets', () => {
    it('should return search results from cache if available', async () => {
      const mockResult = {
        sheets: [{ id: 'sheet-1', title: 'Test Sheet' }],
        total: 1,
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockResult));

      const result = await searchSheets({ q: 'test', page: 1, limit: 20 });

      expect(result).toEqual(mockResult);
      expect(redis.get).toHaveBeenCalled();
      expect(prisma.sheetMusic.findMany).not.toHaveBeenCalled();
    });

    it('should search sheets by query and cache results', async () => {
      const mockSheets = [
        {
          id: 'sheet-1',
          title: 'Test Sheet',
          instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
        },
      ];

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.sheetMusic.findMany as jest.Mock).mockResolvedValue(mockSheets);
      (prisma.sheetMusic.count as jest.Mock).mockResolvedValue(1);

      const result = await searchSheets({ q: 'test', page: 1, limit: 20 });

      expect(result).toEqual({ sheets: mockSheets, total: 1 });
      expect(prisma.sheetMusic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'test', mode: 'insensitive' } },
              { composer: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        })
      );
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should filter search results by multiple criteria', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.sheetMusic.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sheetMusic.count as jest.Mock).mockResolvedValue(0);

      await searchSheets({
        q: 'test',
        genre: 'folk',
        level: 'Beginner',
        instrument: 'instrument-1',
        is_premium: false,
        page: 1,
        limit: 20,
      });

      expect(prisma.sheetMusic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            genre: 'folk',
            level: 'Beginner',
            instrument_id: 'instrument-1',
            is_premium: false,
          }),
        })
      );
    });
  });
});
