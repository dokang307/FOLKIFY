import { Request, Response, NextFunction } from 'express';
import { authenticate } from './authenticate';
import { generateAccessToken } from '../utils/jwt';

// Mock env config
jest.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-testing-purposes-only',
    JWT_ACCESS_EXPIRATION: '15m',
    JWT_REFRESH_EXPIRATION: '7d',
  },
}));

describe('authenticate middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should attach userId and userRole to request for valid token', () => {
    const userId = 'test-user-id';
    const role = 'user';
    const token = generateAccessToken(userId, role);

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.userId).toBe(userId);
    expect(mockRequest.userRole).toBe(role);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is missing', () => {
    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Authorization header missing',
      code: 'NO_AUTH_HEADER',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization format is invalid', () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token',
    };

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>',
      code: 'INVALID_AUTH_FORMAT',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid.token.here',
    };

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if Bearer keyword is missing', () => {
    const token = generateAccessToken('user-id', 'user');
    mockRequest.headers = {
      authorization: token,
    };

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
