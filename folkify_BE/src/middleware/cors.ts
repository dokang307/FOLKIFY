import cors, { CorsOptions } from 'cors';

/**
 * CORS middleware configuration
 * Allows requests from frontend URL specified in environment variables
 * Supports credentials for cookie-based authentication
 */
export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
} as CorsOptions);
