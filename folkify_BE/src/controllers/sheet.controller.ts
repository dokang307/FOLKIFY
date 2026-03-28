import { Request, Response } from 'express';
import { z } from 'zod';
import { getAllSheets, searchSheets } from '../repositories/sheet.repository';
import { getSheetWithAccess, downloadSheet } from '../services/sheet.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

// Validation schemas
const getSheetsSchema = z.object({
  instrument: z.string().uuid().optional(),
  genre: z.string().optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  is_premium: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

const searchSheetsSchema = z.object({
  q: z.string().optional(),
  genre: z.string().optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  instrument: z.string().uuid().optional(),
  is_premium: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * GET /api/sheets
 * Get all sheets with filters and pagination
 */
export async function getSheetsController(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters
    const validatedQuery = getSheetsSchema.parse(req.query);

    // Get sheets with filters
    const { sheets, total } = await getAllSheets(validatedQuery);

    const totalPages = Math.ceil(total / validatedQuery.limit);

    res.status(200).json({
      success: true,
      data: sheets,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
      },
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

    logger.error('Get sheets error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/sheets/search
 * Search sheets with filters and pagination
 */
export async function searchSheetsController(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters
    const validatedQuery = searchSheetsSchema.parse(req.query);

    // Search sheets
    const { sheets, total } = await searchSheets(validatedQuery);

    const totalPages = Math.ceil(total / validatedQuery.limit);

    res.status(200).json({
      success: true,
      data: sheets,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
      },
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

    logger.error('Search sheets error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/sheets/:id
 * Get sheet by ID with access control (protected)
 */
export async function getSheetController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Get sheet with access control
    const sheet = await getSheetWithAccess(id, userId);

    res.status(200).json({
      success: true,
      data: sheet,
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

    logger.error('Get sheet error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/sheets/:id/download
 * Download sheet PDF file (protected, with access control)
 */
export async function downloadSheetController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Get file path (checks access control)
    const filePath = await downloadSheet(id, userId);

    // Check if file exists
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
      });
      return;
    }

    // Serve the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.sendFile(absolutePath);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Download sheet error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}
