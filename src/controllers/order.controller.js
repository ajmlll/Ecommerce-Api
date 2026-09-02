const orderService = require('../services/order.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * Place a new order (Customer only)
 */
const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body.items);
  return new ApiResponse(201, order, 'Order placed successfully').send(res);
});

/**
 * Get logged-in customer's orders (Customer only)
 */
const getMyOrders = catchAsync(async (req, res) => {
  const result = await orderService.getUserOrders(req.user.id, req.query);
  return new ApiResponse(200, result, 'User orders retrieved successfully').send(res);
});

/**
 * Get all orders across system (Admin only)
 */
const getAllOrders = catchAsync(async (req, res) => {
  const result = await orderService.getAllOrders(req.query);
  return new ApiResponse(200, result, 'All orders retrieved successfully').send(res);
});

/**
 * Get order details by ID (Customer own order or Admin)
 */
const getOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user.id,
    req.user.role
  );
  return new ApiResponse(200, order, 'Order details retrieved successfully').send(res);
});

/**
 * Update order status (Admin only)
 */
const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status
  );
  return new ApiResponse(200, order, 'Order status updated successfully').send(res);
});

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
