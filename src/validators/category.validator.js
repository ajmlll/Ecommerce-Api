const joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createCategorySchema = joi.object({
  name: joi.string().trim().required().messages({
    'any.required': 'Category name is required',
    'string.empty': 'Category name cannot be empty',
  }),
  parent: joi.string().regex(objectIdRegex).allow(null, '').optional().messages({
    'string.pattern.base': 'Parent must be a valid Category ID',
  }),
  isActive: joi.boolean().optional(),
});

const updateCategorySchema = joi.object({
  name: joi.string().trim().optional(),
  parent: joi.string().regex(objectIdRegex).allow(null, '').optional().messages({
    'string.pattern.base': 'Parent must be a valid Category ID',
  }),
  isActive: joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
