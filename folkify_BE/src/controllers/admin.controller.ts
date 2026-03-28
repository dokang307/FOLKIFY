import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getUsersService,
  getUserDetails,
  manualUpgradeUser,
  banUser,
  unbanUser,
  setLessonPremium,
  publishLesson,
  unpublishLesson,
} from '../services/admin.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

// Validation schemas
const getUsersQuerySchema = z.object({
  accountType: z.enum(['free', 'basic', 'pro']).optional(),
  accountStatus: z.enum(['active', 'banned', 'suspended']).optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

const manualUpgradeSchema = z.object({
  planType: z.enum(['basic', 'pro'], {
    required_error: 'Plan type is required',
    invalid_type_error: 'Plan type must be "basic" or "pro"',
  }),
  durationMonths: z
    .number({
      required_error: 'Duration in months is required',
      invalid_type_error: 'Duration must be a number',
    })
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 month')
    .max(12, 'Duration must be at most 12 months'),
  notes: z.string().optional(),
});

const banUserSchema = z.object({
  reason: z.string().min(1, 'Ban reason is required'),
});

/**
 * GET /api/admin/users
 * Get users with filters and pagination (admin only)
 */
export async function getUsersController(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters
    const validatedQuery = getUsersQuerySchema.parse(req.query);

    const filters = {
      accountType: validatedQuery.accountType,
      accountStatus: validatedQuery.accountStatus,
      search: validatedQuery.search,
    };

    const pagination = {
      page: parseInt(validatedQuery.page),
      limit: parseInt(validatedQuery.limit),
    };

    const result = await getUsersService(filters, pagination);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/admin/users/:id
 * Get user details (admin only)
 */
export async function getUserDetailsController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await getUserDetails(id);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/admin/users/:id/upgrade
 * Manually upgrade user to premium (admin only)
 */
export async function upgradeUserController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.userId!; // Set by authenticate middleware

    // Validate request body
    const validatedData = manualUpgradeSchema.parse(req.body);

    const result = await manualUpgradeUser(
      id,
      validatedData.planType,
      validatedData.durationMonths,
      adminId,
      validatedData.notes,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Upgrade user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/admin/users/:id/ban
 * Ban user (admin only)
 */
export async function banUserController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.userId!; // Set by authenticate middleware

    // Validate request body
    const validatedData = banUserSchema.parse(req.body);

    const result = await banUser(
      id,
      validatedData.reason,
      adminId,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/admin/users/:id/unban
 * Unban user (admin only)
 */
export async function unbanUserController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.userId!; // Set by authenticate middleware

    const result = await unbanUser(id, adminId, req.ip, req.headers['user-agent']);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/admin/lessons/:id/set-premium
 * Set lesson premium status (admin only)
 */
export async function setLessonPremiumController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.userId!; // Set by authenticate middleware

    // Validate request body
    const schema = z.object({
      isPremium: z.boolean({
        required_error: 'isPremium is required',
        invalid_type_error: 'isPremium must be a boolean',
      }),
    });

    const validatedData = schema.parse(req.body);

    const result = await setLessonPremium(
      id,
      validatedData.isPremium,
      adminId,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Set lesson premium error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/admin/lessons/:id/publish
 * Publish lesson (admin only)
 */
export async function publishLessonController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.userId!; // Set by authenticate middleware

    const result = await publishLesson(id, adminId, req.ip, req.headers['user-agent']);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Publish lesson error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/admin/lessons/:id/unpublish
 * Unpublish lesson (admin only)
 */
export async function unpublishLessonController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.userId!; // Set by authenticate middleware

    const result = await unpublishLesson(id, adminId, req.ip, req.headers['user-agent']);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Unpublish lesson error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/admin/activity-logs
 * Get activity logs with filters and pagination (admin only)
 */
export async function getActivityLogsController(req: Request, res: Response): Promise<void> {
  try {
    // Validation schema for query parameters
    const querySchema = z.object({
      action: z.string().optional(),
      resource_type: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      page: z.string().regex(/^\d+$/).optional().default('1'),
      limit: z.string().regex(/^\d+$/).optional().default('20'),
    });

    const validatedQuery = querySchema.parse(req.query);

    const filters = {
      action: validatedQuery.action,
      resource_type: validatedQuery.resource_type,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
    };

    const pagination = {
      page: parseInt(validatedQuery.page),
      limit: parseInt(validatedQuery.limit),
    };

    const { getActivityLogs } = await import('../services/admin.service');
    const result = await getActivityLogs(filters, pagination);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/admin/cronjobs/trigger
 * Manually trigger premium expiration cronjob (admin only)
 * Requirements: 11.10
 */
export async function triggerCronjobController(req: Request, res: Response): Promise<void> {
  try {
    const { type } = req.body;

    // Validate cronjob type
    if (!type || !['premium-expiration', 'file-cleanup'].includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid cronjob type. Must be "premium-expiration" or "file-cleanup"',
        code: 'INVALID_CRONJOB_TYPE',
      });
      return;
    }

    let result;

    if (type === 'premium-expiration') {
      const { checkExpiredPremium } = await import('../services/cronjob.service');
      result = await checkExpiredPremium();
    } else if (type === 'file-cleanup') {
      const { cleanupOldFiles } = await import('../services/cronjob.service');
      result = await cleanupOldFiles();
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Trigger cronjob error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}
