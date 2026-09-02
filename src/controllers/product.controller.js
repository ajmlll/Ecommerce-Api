const productService = require('../services/product.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * Create a new product (Admin)
 */
const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  return new ApiResponse(201, product, 'Product created successfully').send(res);
});

/**
 * Update an existing product (Admin)
 */
const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  return new ApiResponse(200, product, 'Product updated successfully').send(res);
});

/**
 * Delete a product (Admin)
 */
const deleteProduct = catchAsync(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  return new ApiResponse(200, null, result.message).send(res);
});

/**
 * Get paginated products list with search, category subtree, and price filtering (Public)
 */
const getProducts = catchAsync(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const result = await productService.getProducts(req.query, isAdmin);
  return new ApiResponse(200, result, 'Products retrieved successfully').send(res);
});

/**
 * Get product detail by ID (Public)
 */
const getProductById = catchAsync(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const product = await productService.getProductById(req.params.id, isAdmin);
  return new ApiResponse(200, product, 'Product details retrieved successfully').send(res);
});

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById,
};
