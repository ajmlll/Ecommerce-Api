const joi = require('joi');

const registerSchema = joi.object({
  name: joi.string().trim().required().messages({
    'any.required': 'Name is required',
    'string.empty': 'Name cannot be empty',
  }),
  email: joi.string().email().trim().lowercase().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email cannot be empty',
  }),
  password: joi.string().min(6).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password cannot be empty',
  }),
  role: joi.string().valid('admin', 'customer').optional(),
});

const loginSchema = joi.object({
  email: joi.string().email().trim().lowercase().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email cannot be empty',
  }),
  password: joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
});

const updateProfileSchema = joi.object({
  name: joi.string().trim().optional(),
  email: joi.string().email().trim().lowercase().optional(),
}).min(1).messages({
  'object.min': 'At least one field (name or email) must be provided for update',
});

const updateStatusSchema = joi.object({
  isActive: joi.boolean().required().messages({
    'any.required': 'isActive boolean field is required',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updateStatusSchema,
};
