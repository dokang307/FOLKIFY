import { Request, Response } from 'express';
import { getInstrumentsController, getInstrumentByIdController } from './instrument.controller';
import { getAllInstruments, getInstrumentById } from '../repositories/instrument.repository';
import redisClient from '../config/redis';

// Mock dependencies
jest.mock('../repositories/instrument.repository');
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    setex: jest.fn(),
  },
}));

describe('Instrument Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {};
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('getInstrumentsController', () => {
    const mockInstruments = [
      { id: '1', name: 'Đàn Tranh', order_index: 0 },
      { id: '2', name: 'Sáo Trúc', order_index: 1 },
    ];

    it('should return cached instruments if available', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockInstruments));

      await getInstrumentsController(mockReq as Request, mockRes as Response);

      expect(redisClient.get).toHaveBeenCalledWith('instruments:list');
      expect(getAllInstruments).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockInstruments,
      });
    });

    it('should fetch from database and cache if not in cache', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (getAllInstruments as jest.Mock).mockResolvedValue(mockInstruments);

      await getInstrumentsController(mockReq as Request, mockRes as Response);

      expect(redisClient.get).toHaveBeenCalledWith('instruments:list');
      expect(getAllInstruments).toHaveBeenCalled();
      expect(redisClient.setex).toHaveBeenCalledWith(
        'instruments:list',
        1800,
        JSON.stringify(mockInstruments)
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockInstruments,
      });
    });

    it('should handle errors', async () => {
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await getInstrumentsController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('getInstrumentByIdController', () => {
    const mockInstrument = {
      id: '1',
      name: 'Đàn Tranh',
      lessons: [{ id: 'lesson1', title: 'Lesson 1' }],
    };

    beforeEach(() => {
      mockReq.params = { id: '1' };
    });

    it('should return cached instrument if available', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockInstrument));

      await getInstrumentByIdController(mockReq as Request, mockRes as Response);

      expect(redisClient.get).toHaveBeenCalledWith('instrument:1');
      expect(getInstrumentById).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockInstrument,
      });
    });

    it('should fetch from database and cache if not in cache', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (getInstrumentById as jest.Mock).mockResolvedValue(mockInstrument);

      await getInstrumentByIdController(mockReq as Request, mockRes as Response);

      expect(redisClient.get).toHaveBeenCalledWith('instrument:1');
      expect(getInstrumentById).toHaveBeenCalledWith('1');
      expect(redisClient.setex).toHaveBeenCalledWith(
        'instrument:1',
        1800,
        JSON.stringify(mockInstrument)
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockInstrument,
      });
    });

    it('should return 404 if instrument not found', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (getInstrumentById as jest.Mock).mockResolvedValue(null);

      await getInstrumentByIdController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Instrument not found',
        code: 'INSTRUMENT_NOT_FOUND',
      });
    });

    it('should handle errors', async () => {
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await getInstrumentByIdController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });
});
