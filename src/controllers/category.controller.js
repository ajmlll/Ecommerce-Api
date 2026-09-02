const categoryService = require('../services/category.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * Create a new category (Admin)
 */
const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return new ApiResponse(201, category, 'Category created successfully').send(res);
});

/**
 * Update an existing category (Admin)
 */
const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return new ApiResponse(200, category, 'Category updated successfully').send(res);
});

/**
 * Delete a category (Admin)
 */
const deleteCategory = catchAsync(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  return new ApiResponse(200, null, result.message).send(res);
});

/**
 * Get flat list of categories (Public, paginated)
 */
const getCategories = catchAsync(async (req, res) => {
  const data = await categoryService.getAllCategories(req.query);
  return new ApiResponse(200, data, 'Categories list retrieved successfully').send(res);
});

/**
 * Get nested category tree hierarchy (Public)
 */
const getCategoryTree = catchAsync(async (req, res) => {
  const tree = await categoryService.getTree();
  return new ApiResponse(200, tree, 'Category tree hierarchy retrieved successfully').send(res);
});

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryTree,
};
