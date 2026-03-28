import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { BadRequestError } from '../utils/errors';

/**
 * File upload middleware for AI grading submissions
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */

// Allowed file types
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp3'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_TYPES = [...ALLOWED_AUDIO_TYPES, ...ALLOWED_VIDEO_TYPES];

// File size limits
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const userId = req.userId;
    if (!userId) {
      return cb(new Error('User ID not found in request'), '');
    }

    const uploadPath = path.join(process.cwd(), 'uploads', 'ai-grading', userId);

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with UUID
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

/**
 * File filter to validate file types
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file type is allowed
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestError(
        'Invalid file type. Allowed types: mp3, wav, m4a, mp4, mov, avi',
        'INVALID_FILE_TYPE'
      )
    );
  }

  cb(null, true);
};

/**
 * Multer upload configuration
 */
export const uploadAIGrading = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use max video size as the limit
  },
}).single('file');

/**
 * Middleware to validate file size based on type
 */
export function validateFileSize(req: Request, _res: any, next: any): void {
  if (!req.file) {
    return next(new BadRequestError('No file uploaded', 'NO_FILE'));
  }

  const isAudio = ALLOWED_AUDIO_TYPES.includes(req.file.mimetype);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(req.file.mimetype);

  // Validate audio file size
  if (isAudio && req.file.size > MAX_AUDIO_SIZE) {
    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
    return next(
      new BadRequestError(
        `Audio file too large. Maximum size: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
        'FILE_TOO_LARGE'
      )
    );
  }

  // Validate video file size
  if (isVideo && req.file.size > MAX_VIDEO_SIZE) {
    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
    return next(
      new BadRequestError(
        `Video file too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
        'FILE_TOO_LARGE'
      )
    );
  }

  next();
}
