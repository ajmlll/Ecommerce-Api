const express = require('express');
const categoryController = require('../controllers/category.controller');
const { protect } = require('../middlewares/auth.middleware');
const { restrictTo } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createCategorySchema,
  updateCategorySchema,
} = require('../validators/category.validator');

const router = express.Router();

// Public Routes
router.get('/tree', categoryController.getCategoryTree);
router.get('/', categoryController.getCategories);

// Protected Admin Routes
router.post(
  '/',
  protect,
  restrictTo('admin'),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  protect,
  restrictTo('admin'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  categoryController.deleteCategory
);

module.exports = router;
