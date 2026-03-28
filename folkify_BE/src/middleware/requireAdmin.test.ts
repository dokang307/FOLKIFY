import { Request, Response, NextFunction } from 'express';
import { requireAdmin } from './requireAdmin';

describe('requireAdmin middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should call next() if user has admin role', () => {
    mockRequest.userRole = 'admin';

    requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 403 if user role is not admin', () => {
    mockRequest.userRole = 'user';

    requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 if userRole is not set', () => {
    requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'User role not found',
      code: 'NO_USER_ROLE',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 for empty userRole', () => {
    mockRequest.userRole = '';

    requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
