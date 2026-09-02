const ApiError = require('../utils/ApiError');

/**
 * Generic middleware factory to validate request body against a Joi schema.
 * 
 * @param {import('joi').ObjectSchema} schema - Joi schema object
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return next(new ApiError(400, message, details));
  }

  // Replace req.body with validated and sanitized values
  req.body = value;
  next();
};

module.exports = validate;
