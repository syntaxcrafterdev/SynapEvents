import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Something went wrong';
  const errors = err.errors || [];

  // Log the error
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {},
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    user: req.user ? req.user.id : 'anonymous',
  });

  // Don't leak error details in production
  const errorResponse = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(StatusCodes.NOT_FOUND);
  next(error);
};

export const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }
  next(err);
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
