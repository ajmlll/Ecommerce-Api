const ApiError = require('../utils/ApiError');

/**
 * Middleware factory to restrict access to specific user roles.
 * Must be executed after the protect middleware.
 * 
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'customer')
 * @returns {Function} Express middleware
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action')
      );
    }
    next();
  };
};

module.exports = {
  restrictTo,
};
