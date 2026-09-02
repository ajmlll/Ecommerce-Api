/**
 * Higher-order function that wraps async Express middleware/route handlers.
 * Catches any rejected promises and passes the error to next() for centralized error handling.
 * 
 * @param {Function} fn - Async controller/middleware function
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;
