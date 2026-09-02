const joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const orderItemSchema = joi.object({
  product: joi.string().regex(objectIdRegex).required().messages({
    'any.required': 'Product ID is required',
    'string.pattern.base': 'Product must be a valid Product ID',
  }),
  quantity: joi.number().integer().min(1).required().messages({
    'any.required': 'Quantity is required',
    'number.min': 'Quantity must be at least 1',
    'number.integer': 'Quantity must be an integer',
  }),
});

const createOrderSchema = joi.object({
  items: joi.array().items(orderItemSchema).min(1).required().messages({
    'any.required': 'Items array is required',
    'array.min': 'Order must contain at least one item',
  }),
});

const updateOrderStatusSchema = joi.object({
  status: joi
    .string()
    .valid('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Invalid order status',
    }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
