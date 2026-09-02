const express = require('express');
const productController = require('../controllers/product.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');
const { restrictTo } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
} = require('../validators/product.validator');

const router = express.Router();

// Public Routes (Supports optional authentication to grant admins view of inactive items)
router.get('/', optionalAuth, productController.getProducts);
router.get('/:id', optionalAuth, productController.getProductById);

// Protected Admin Routes
router.post(
  '/',
  protect,
  restrictTo('admin'),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  protect,
  restrictTo('admin'),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  productController.deleteProduct
);

module.exports = router;
