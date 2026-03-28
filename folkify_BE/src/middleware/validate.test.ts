import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, commonSchemas } from './validate';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('validate middleware factory', () => {
    it('should pass validation with valid data', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      });

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const middleware = validate(schema, 'body');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid data', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      });

      mockReq.body = {
        email: 'invalid-email',
        password: '123',
      };

      const middleware = validate(schema, 'body');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: expect.any(Array),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate query parameters', () => {
      const schema = z.object({
        page: z.coerce.number().int().positive(),
      });

      mockReq.query = { page: '1' };

      const middleware = validate(schema, 'query');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.query).toEqual({ page: 1 });
    });

    it('should validate params', () => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validate(schema, 'params');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('commonSchemas', () => {
    it('should validate UUID param', () => {
      const result = commonSchemas.uuidParam.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = commonSchemas.uuidParam.safeParse({ id: 'invalid-uuid' });
      expect(result.success).toBe(false);
    });

    it('should validate pagination', () => {
      const result = commonSchemas.pagination.safeParse({ page: '1', limit: '20' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should validate email', () => {
      const result = commonSchemas.email.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = commonSchemas.email.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });

    it('should validate password', () => {
      const result = commonSchemas.password.safeParse('password123');
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = commonSchemas.password.safeParse('12345');
      expect(result.success).toBe(false);
    });
  });
});
