// Set environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

import { Request, Response } from 'express';
import {
  getSheetsController,
  searchSheetsController,
  getSheetController,
  downloadSheetController,
} from './sheet.controller';
import * as sheetRepository from '../repositories/sheet.repository';
import * as sheetService from '../services/sheet.service';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../repositories/sheet.repository');
jest.mock('../services/sheet.service');
jest.mock('fs');
jest.mock('path');
jest.mock('../config/database');
jest.mock('../config/redis');

describe('Sheet Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendFileMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    sendFileMock = jest.fn();
    setHeaderMock = jest.fn();

    mockRequest = {
      query: {},
      params: {},
      userId: 'user-1',
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      sendFile: sendFileMock,
      setHeader: setHeaderMock,
    };

    jest.clearAllMocks();
  });

  describe('getSheetsController', () => {
    it('should return sheets with pagination', async () => {
      const mockSheets = [
        {
          id: 'sheet-1',
          title: 'Test Sheet',
          is_premium: false,
        },
      ];

      (sheetRepository.getAllSheets as jest.Mock).mockResolvedValue({
        sheets: mockSheets,
        total: 1,
      });

      mockRequest.query = { page: '1', limit: '20' };

      await getSheetsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockSheets,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should filter sheets by instrument', async () => {
      (sheetRepository.getAllSheets as jest.Mock).mockResolvedValue({
        sheets: [],
        total: 0,
      });

      mockRequest.query = {
        instrument: 'instrument-1',
        page: '1',
        limit: '20',
      };

      await getSheetsController(mockRequest as Request, mockResponse as Response);

      expect(sheetRepository.getAllSheets).toHaveBeenCalledWith(
        expect.objectContaining({
          instrument: 'instrument-1',
        })
      );
    });

    it('should return 400 for invalid query parameters', async () => {
      mockRequest.query = { page: 'invalid' };

      await getSheetsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'VALIDATION_ERROR',
        })
      );
    });
  });

  describe('searchSheetsController', () => {
    it('should search sheets by query', async () => {
      const mockSheets = [
        {
          id: 'sheet-1',
          title: 'Test Sheet',
        },
      ];

      (sheetRepository.searchSheets as jest.Mock).mockResolvedValue({
        sheets: mockSheets,
        total: 1,
      });

      mockRequest.query = { q: 'test', page: '1', limit: '20' };

      await searchSheetsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockSheets,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should filter search results by multiple criteria', async () => {
      (sheetRepository.searchSheets as jest.Mock).mockResolvedValue({
        sheets: [],
        total: 0,
      });

      mockRequest.query = {
        q: 'test',
        genre: 'folk',
        level: 'Beginner',
        instrument: 'instrument-1',
        is_premium: 'false',
        page: '1',
        limit: '20',
      };

      await searchSheetsController(mockRequest as Request, mockResponse as Response);

      expect(sheetRepository.searchSheets).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'test',
          genre: 'folk',
          level: 'Beginner',
          instrument: 'instrument-1',
          is_premium: false,
        })
      );
    });
  });

  describe('getSheetController', () => {
    it('should return sheet with access flags', async () => {
      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        has_access: true,
        requires_premium: false,
      };

      (sheetService.getSheetWithAccess as jest.Mock).mockResolvedValue(mockSheet);

      mockRequest.params = { id: 'sheet-1' };

      await getSheetController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockSheet,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.userId = undefined;

      await getSheetController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should return 404 if sheet not found', async () => {
      (sheetService.getSheetWithAccess as jest.Mock).mockRejectedValue(
        new NotFoundError('Sheet music not found', 'SHEET_NOT_FOUND')
      );

      mockRequest.params = { id: 'non-existent' };

      await getSheetController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Sheet music not found',
        code: 'SHEET_NOT_FOUND',
      });
    });
  });

  describe('downloadSheetController', () => {
    it('should serve PDF file for authorized user', async () => {
      const mockFilePath = '/uploads/sheets/sheet-1/test.pdf';

      (sheetService.downloadSheet as jest.Mock).mockResolvedValue(mockFilePath);
      (path.resolve as jest.Mock).mockReturnValue('/absolute/path/test.pdf');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (path.basename as jest.Mock).mockReturnValue('test.pdf');

      mockRequest.params = { id: 'sheet-1' };

      await downloadSheetController(mockRequest as Request, mockResponse as Response);

      expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(setHeaderMock).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test.pdf"'
      );
      expect(sendFileMock).toHaveBeenCalledWith('/absolute/path/test.pdf');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.userId = undefined;

      await downloadSheetController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should return 403 if user does not have access', async () => {
      (sheetService.downloadSheet as jest.Mock).mockRejectedValue(
        new ForbiddenError(
          'You do not have access to this sheet music. Upgrade to premium.',
          'SHEET_ACCESS_DENIED'
        )
      );

      mockRequest.params = { id: 'sheet-1' };

      await downloadSheetController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'You do not have access to this sheet music. Upgrade to premium.',
        code: 'SHEET_ACCESS_DENIED',
      });
    });

    it('should return 404 if file does not exist', async () => {
      const mockFilePath = '/uploads/sheets/sheet-1/test.pdf';

      (sheetService.downloadSheet as jest.Mock).mockResolvedValue(mockFilePath);
      (path.resolve as jest.Mock).mockReturnValue('/absolute/path/test.pdf');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      mockRequest.params = { id: 'sheet-1' };

      await downloadSheetController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
      });
    });
  });
});
