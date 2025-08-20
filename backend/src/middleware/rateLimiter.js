import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger.js';

/**
 * Rate limiting middleware to prevent abuse
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(
      `Rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`
    );
    res.status(StatusCodes.TOO_MANY_REQUESTS).json(options.message);
  },
});

/**
 * More strict rate limiting for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(
      `Auth rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`
    );
    res.status(StatusCodes.TOO_MANY_REQUESTS).json(options.message);
  },
});

/**
 * Rate limiting for public APIs
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per hour
  message: {
    success: false,
    message: 'Too many API requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 file uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many file uploads, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for password reset endpoints
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
