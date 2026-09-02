const joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createProductSchema = joi.object({
  name: joi.string().trim().required().messages({
    'any.required': 'Product name is required',
    'string.empty': 'Product name cannot be empty',
  }),
  sku: joi.string().trim().uppercase().required().messages({
    'any.required': 'Product SKU is required',
    'string.empty': 'Product SKU cannot be empty',
  }),
  description: joi.string().trim().allow('').optional(),
  price: joi.number().min(0).required().messages({
    'any.required': 'Price is required',
    'number.min': 'Price cannot be negative',
  }),
  salePrice: joi.number().min(0).allow(null).optional().custom((value, helpers) => {
    const parentPrice = helpers.state.ancestors[0].price;
    if (value !== null && value !== undefined && parentPrice !== undefined && value > parentPrice) {
      return helpers.message('Sale price must be less than or equal to regular price');
    }
    return value;
  }).messages({
    'number.min': 'Sale price cannot be negative',
  }),
  stock: joi.number().integer().min(0).default(0).messages({
    'number.min': 'Stock cannot be negative',
  }),
  category: joi.string().regex(objectIdRegex).required().messages({
    'any.required': 'Category ID is required',
    'string.pattern.base': 'Category must be a valid Category ID',
  }),
  status: joi.string().valid('active', 'inactive').default('active'),
});

const updateProductSchema = joi.object({
  name: joi.string().trim().optional(),
  sku: joi.string().trim().uppercase().optional(),
  description: joi.string().trim().allow('').optional(),
  price: joi.number().min(0).optional().messages({
    'number.min': 'Price cannot be negative',
  }),
  salePrice: joi.number().min(0).allow(null).optional().messages({
    'number.min': 'Sale price cannot be negative',
  }),
  stock: joi.number().integer().min(0).optional().messages({
    'number.min': 'Stock cannot be negative',
  }),
  category: joi.string().regex(objectIdRegex).optional().messages({
    'string.pattern.base': 'Category must be a valid Category ID',
  }),
  status: joi.string().valid('active', 'inactive').optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};
