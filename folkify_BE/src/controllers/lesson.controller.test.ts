import { Request, Response } from 'express';
import {
  getLessonController,
  completeLessonController,
  searchLessonsController,
} from './lesson.controller';
import { getLessonWithAccess, completeLesson } from '../services/lesson.service';
import { searchLessons } from '../repositories/lesson.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';

// Mock dependencies
jest.mock('../services/lesson.service');
jest.mock('../repositories/lesson.repository');

describe('Lesson Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {
      userId: 'user1',
    };
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('getLessonController', () => {
    const mockLesson = {
      id: 'lesson1',
      title: 'Test Lesson',
      has_access: true,
      requires_premium: false,
      completed: false,
      progress_percentage: 0,
    };

    beforeEach(() => {
      mockReq.params = { id: 'lesson1' };
    });

    it('should return lesson with access control', async () => {
      (getLessonWithAccess as jest.Mock).mockResolvedValue(mockLesson);

      await getLessonController(mockReq as Request, mockRes as Response);

      expect(getLessonWithAccess).toHaveBeenCalledWith('lesson1', 'user1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockLesson,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.userId = undefined;

      await getLessonController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle NotFoundError', async () => {
      (getLessonWithAccess as jest.Mock).mockRejectedValue(
        new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND')
      );

      await getLessonController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Lesson not found',
        code: 'LESSON_NOT_FOUND',
      });
    });

    it('should handle generic errors', async () => {
      (getLessonWithAccess as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getLessonController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('completeLessonController', () => {
    const mockResult = {
      xp_earned: 100,
      new_total_xp: 600,
      new_level: 1,
      level_up: false,
    };

    beforeEach(() => {
      mockReq.params = { id: 'lesson1' };
    });

    it('should complete lesson and return result', async () => {
      (completeLesson as jest.Mock).mockResolvedValue(mockResult);

      await completeLessonController(mockReq as Request, mockRes as Response);

      expect(completeLesson).toHaveBeenCalledWith('lesson1', 'user1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.userId = undefined;

      await completeLessonController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle ForbiddenError', async () => {
      (completeLesson as jest.Mock).mockRejectedValue(
        new ForbiddenError('Access denied', 'LESSON_ACCESS_DENIED')
      );

      await completeLessonController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
        code: 'LESSON_ACCESS_DENIED',
      });
    });

    it('should handle generic errors', async () => {
      (completeLesson as jest.Mock).mockRejectedValue(new Error('Database error'));

      await completeLessonController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('searchLessonsController', () => {
    const mockLessons = [
      { id: 'lesson1', title: 'Lesson 1' },
      { id: 'lesson2', title: 'Lesson 2' },
    ];

    it('should search lessons with default pagination', async () => {
      mockReq.query = {};
      (searchLessons as jest.Mock).mockResolvedValue({
        lessons: mockLessons,
        total: 2,
      });

      await searchLessonsController(mockReq as Request, mockRes as Response);

      expect(searchLessons).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockLessons,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should search lessons with query and filters', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockReq.query = {
        q: 'basic',
        level: 'Beginner',
        instrumentId: validUuid,
        page: '2',
        limit: '10',
      };
      (searchLessons as jest.Mock).mockResolvedValue({
        lessons: mockLessons,
        total: 25,
      });

      await searchLessonsController(mockReq as Request, mockRes as Response);

      expect(searchLessons).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'basic',
          level: 'Beginner',
          instrumentId: validUuid,
          page: 2,
          limit: 10,
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockLessons,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should handle validation errors', async () => {
      mockReq.query = {
        level: 'InvalidLevel',
      };

      await searchLessonsController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should handle generic errors', async () => {
      mockReq.query = {};
      (searchLessons as jest.Mock).mockRejectedValue(new Error('Database error'));

      await searchLessonsController(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });
});
