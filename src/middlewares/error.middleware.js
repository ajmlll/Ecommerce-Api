const ApiError = require('../utils/ApiError');
const config = require('../config/env');

/**
 * Centralized Express error handling middleware.
 * Should be registered as the last middleware in app.js.
 * 
 * @param {Error|ApiError} err 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert non-ApiError instances into ApiError for consistent handling
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    // Unknown/unhandled errors are non-operational by default
    error = new ApiError(statusCode, message, error.details || null, false, err.stack);
  }

  // Hide detailed error messages for unknown server errors in production if needed, or keep operational messages
  const statusCode = error.statusCode || 500;
  const message = (config.env === 'production' && !error.isOperational)
    ? 'Internal Server Error'
    : error.message;

  const response = {
    success: false,
    message,
    ...(error.details && { details: error.details }),
    ...(config.env !== 'production' && { stack: error.stack }),
  };

  // Log unexpected/unhandled errors
  if (!error.isOperational || statusCode >= 500) {
    console.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
