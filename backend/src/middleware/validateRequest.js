import { validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

/**
 * Middleware to validate request using express-validator
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware function
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Log validation errors
    logger.warn('Validation failed:', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Format error response
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  };
};

/**
 * Middleware to validate file uploads
 * @param {Object} options - Options for file validation
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @returns {Function} Express middleware function
 */
export const validateFile = (options = {}) => {
  const { allowedTypes = [], maxSize = 5 * 1024 * 1024 } = options;
  
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const errors = [];

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
      errors.push({
        field: 'file',
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      errors.push({
        field: 'file',
        message: `File too large. Maximum size is ${maxSizeMB}MB`,
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors,
      });
    }

    next();
  };
};

/**
 * Middleware to validate query parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));

      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors,
      });
    }

    next();
  };
};

/**
 * Middleware to validate request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

/**
 * Middleware to validate route parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));

      return res.status(400).json({
        success: false,
        message: 'Invalid route parameters',
        errors,
      });
    }

    next();
  };
};
