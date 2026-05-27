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

/**
 * Lesson file upload middleware
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 12.6
 */

// Allowed lesson video types
const ALLOWED_LESSON_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

// Allowed sheet music types
const ALLOWED_SHEET_MUSIC_TYPES = ['application/pdf', 'application/vnd.recordare.musicxml+xml'];

// File size limits for lessons
const MAX_LESSON_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_SHEET_MUSIC_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Configure multer storage for lesson videos
 */
const lessonVideoStorage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const lessonId = req.params.id;
    if (!lessonId) {
      return cb(new Error('Lesson ID not found in request'), '');
    }

    const uploadPath = path.join(process.cwd(), 'uploads', 'lessons', lessonId, 'videos');

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
 * Configure multer storage for sheet music
 */
const sheetMusicStorage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const lessonId = req.params.id;
    if (!lessonId) {
      return cb(new Error('Lesson ID not found in request'), '');
    }

    const uploadPath = path.join(process.cwd(), 'uploads', 'lessons', lessonId, 'sheets');

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
 * File filter for lesson videos
 */
const lessonVideoFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!ALLOWED_LESSON_VIDEO_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestError(
        'Invalid video file type. Allowed types: mp4, mov, avi',
        'INVALID_FILE_TYPE'
      )
    );
  }
  cb(null, true);
};

/**
 * File filter for sheet music
 */
const sheetMusicFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!ALLOWED_SHEET_MUSIC_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestError(
        'Invalid sheet music file type. Allowed types: pdf, musicxml',
        'INVALID_FILE_TYPE'
      )
    );
  }
  cb(null, true);
};

/**
 * Multer upload configuration for lesson videos
 */
export const uploadLessonVideo = multer({
  storage: lessonVideoStorage,
  fileFilter: lessonVideoFilter,
  limits: {
    fileSize: MAX_LESSON_VIDEO_SIZE,
  },
}).single('video');

/**
 * Multer upload configuration for sheet music
 */
export const uploadSheetMusic = multer({
  storage: sheetMusicStorage,
  fileFilter: sheetMusicFilter,
  limits: {
    fileSize: MAX_SHEET_MUSIC_SIZE,
  },
}).single('sheet');

/**
 * Middleware to validate lesson video file size
 */
export function validateLessonVideoSize(req: Request, _res: any, next: any): void {
  if (!req.file) {
    return next(new BadRequestError('No video file uploaded', 'NO_FILE'));
  }

  if (req.file.size > MAX_LESSON_VIDEO_SIZE) {
    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
    return next(
      new BadRequestError(
        `Video file too large. Maximum size: ${MAX_LESSON_VIDEO_SIZE / 1024 / 1024}MB`,
        'FILE_TOO_LARGE'
      )
    );
  }

  next();
}

/**
 * Middleware to validate sheet music file size
 */
export function validateSheetMusicSize(req: Request, _res: any, next: any): void {
  if (!req.file) {
    return next(new BadRequestError('No sheet music file uploaded', 'NO_FILE'));
  }

  if (req.file.size > MAX_SHEET_MUSIC_SIZE) {
    // Delete the uploaded file
    fs.unlinkSync(req.file.path);
    return next(
      new BadRequestError(
        `Sheet music file too large. Maximum size: ${MAX_SHEET_MUSIC_SIZE / 1024 / 1024}MB`,
        'FILE_TOO_LARGE'
      )
    );
  }

  next();
}
