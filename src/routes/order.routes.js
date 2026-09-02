const express = require('express');
const orderController = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const { restrictTo } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validators/order.validator');

const router = express.Router();

// All order endpoints require authentication
router.use(protect);

// Customer Routes
router.post(
  '/',
  restrictTo('customer'),
  validate(createOrderSchema),
  orderController.createOrder
);

router.get('/my', restrictTo('customer'), orderController.getMyOrders);

// Admin Routes
router.get('/', restrictTo('admin'), orderController.getAllOrders);

router.patch(
  '/:id/status',
  restrictTo('admin'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// Shared Route (Customer own order or Admin)
router.get('/:id', orderController.getOrderById);

module.exports = router;
