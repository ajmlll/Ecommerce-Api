const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

/**
 * State machine allowed status transitions map
 */
const ALLOWED_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

/**
 * Create order with atomic stock handling and price snapshotting within a transaction.
 * 
 * @param {string} userId - Customer User ID
 * @param {Array<{product: string, quantity: number}>} items - Requested order items
 */
const createOrder = async (userId, items) => {
  const executeOrderCreation = async (session = null) => {
    const snapshotItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { product: productId, quantity } = item;

      if (!quantity || quantity < 1) {
        throw new ApiError(400, 'Quantity must be at least 1');
      }

      // Load product inside the session to verify existence and active status
      const productQuery = Product.findById(productId);
      if (session) productQuery.session(session);
      const product = await productQuery;

      if (!product || product.status !== 'active') {
        throw new ApiError(400, `Product ${productId} is unavailable or inactive`);
      }

      // Atomically decrement stock with a single conditional update.
      // If stock < quantity, modifiedCount will be 0.
      const updateOptions = session ? { session } : {};
      const updateResult = await Product.updateOne(
        { _id: productId, status: 'active', stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        updateOptions
      );

      if (updateResult.modifiedCount === 0) {
        throw new ApiError(409, `Insufficient stock for ${product.name}`);
      }

      // Snapshot price: Use salePrice if present and > 0, else regular price. Ignore any client price.
      const snapshotPrice =
        product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0
          ? product.salePrice
          : product.price;

      totalAmount += snapshotPrice * quantity;

      snapshotItems.push({
        product: product._id,
        name: product.name,
        price: snapshotPrice,
        quantity,
      });
    }

    // Create Order document inside the same session
    const orderData = {
      customer: userId,
      items: snapshotItems,
      totalAmount,
      status: 'Pending',
    };

    let orderDoc;
    if (session) {
      const createdOrders = await Order.create([orderData], { session });
      orderDoc = createdOrders[0];
    } else {
      orderDoc = await Order.create(orderData);
    }

    return orderDoc;
  };

  // Attempt transaction if connected to live MongoDB replica set, fallback cleanly if standalone/mock
  let session = null;
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      session = await mongoose.startSession();
      let createdOrder;
      await session.withTransaction(async () => {
        createdOrder = await executeOrderCreation(session);
      });
      return await Order.findById(createdOrder._id).populate('items.product', 'name sku');
    } else {
      const order = await executeOrderCreation(null);
      return await Order.findById(order._id).populate('items.product', 'name sku');
    }
  } catch (error) {
    // Fallback without transaction if standalone MongoDB without replica set
    if (
      error.message &&
      (error.message.includes('Transaction numbers are only allowed') ||
        error.message.includes('standalone'))
    ) {
      const order = await executeOrderCreation(null);
      return await Order.findById(order._id).populate('items.product', 'name sku');
    }
    throw error;
  } finally {
    if (session) session.endSession();
  }
};

/**
 * Get logged-in customer's orders (paginated, newest first)
 */
const getUserOrders = async (userId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { customer: userId };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    data: orders,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get all orders (Admin only, paginated, filterable by status, newest first)
 */
const getAllOrders = async (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'name email')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    data: orders,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get order by ID with ownership enforcement for customers
 */
const getOrderById = async (orderId, userId, userRole) => {
  const order = await Order.findById(orderId)
    .populate('customer', 'name email')
    .populate('items.product', 'name sku');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Enforce customer ownership check
  if (userRole !== 'admin' && order.customer._id.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have permission to view this order');
  }

  return order;
};

/**
 * Update order status (Admin only) with state machine transition rules
 */
const updateOrderStatus = async (orderId, newStatus) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const currentStatus = order.status;

  if (currentStatus === newStatus) {
    return order;
  }

  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }

  order.status = newStatus;
  await order.save();

  return order;
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
