const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

/**
 * Global Rate Limiter: 100 requests per 15 minutes per IP.
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP, please try again after 15 minutes'));
  },
});

/**
 * Stricter Auth Rate Limiter: 10 requests per 15 minutes per IP.
 * Applied specifically to login and register routes to prevent brute-force attacks.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts, please try again after 15 minutes'));
  },
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
};
