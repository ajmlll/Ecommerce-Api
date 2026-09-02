class ApiError extends Error {
  /**
   * Custom Operational Error Class
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {any} [details=null] - Additional details or validation error objects
   * @param {boolean} [isOperational=true] - Indicates operational error (known error)
   * @param {string} [stack=''] - Optional stack trace override
   */
  constructor(statusCode, message, details = null, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
