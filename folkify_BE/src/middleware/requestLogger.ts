import morgan from 'morgan';
import logger from '../utils/logger';

/**
 * Custom morgan token for user ID from JWT
 */
morgan.token('user-id', (req: any) => {
  return req.userId || 'anonymous';
});

/**
 * Custom morgan token for user role from JWT
 */
morgan.token('user-role', (req: any) => {
  return req.userRole || 'guest';
});

/**
 * Custom format for HTTP request logging
 * Includes: method, url, status, response-time, user-id, user-role
 */
const customFormat =
  ':method :url :status :response-time ms - user: :user-id (:user-role) - :remote-addr';

/**
 * Request logging middleware using morgan
 * Streams logs to Winston logger
 */
export const requestLogger = morgan(customFormat, {
  stream: {
    write: (message: string) => {
      // Remove trailing newline and log to Winston
      logger.info(message.trim());
    },
  },
});

/**
 * Error logging middleware for morgan
 * Only logs requests that result in errors (status >= 400)
 */
export const errorLogger = morgan(customFormat, {
  skip: (_req, res) => res.statusCode < 400,
  stream: {
    write: (message: string) => {
      logger.error(message.trim());
    },
  },
});
