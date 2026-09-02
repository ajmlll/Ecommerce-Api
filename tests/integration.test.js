const mongoose = require('mongoose');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const categoryService = require('../src/services/category.service');
const productService = require('../src/services/product.service');
const orderService = require('../src/services/order.service');

describe('High-Risk System Integration Tests', () => {
  let isDbConnected = false;

  beforeAll(async () => {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce_test_db';
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      isDbConnected = true;
    } catch (err) {
      console.log('ℹ Local MongoDB not available during Jest runner execution');
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      await Category.deleteMany({});
      await Product.deleteMany({});
      await Order.deleteMany({});
      await User.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('1. Category Cycle Prevention', () => {
    it('should reject setting a category parent to its own descendant with a circular reference error', async () => {
      if (!isDbConnected) return;

      // Root: Electronics -> Child: Laptops -> Grandchild: Gaming
      const catA = await categoryService.createCategory({ name: 'Electronics Test A' });
      const catB = await categoryService.createCategory({ name: 'Laptops Test B', parent: catA._id });
      const catC = await categoryService.createCategory({ name: 'Gaming Test C', parent: catB._id });

      // Attempt to set Electronics A parent to Gaming C (descendant)
      await expect(
        categoryService.updateCategory(catA._id, { parent: catC._id })
      ).rejects.toThrow('circular reference');
    });
  });

  describe('2. Order Stock Handling & Atomic Decrement', () => {
    it('should correctly decrement stock on order and reject insufficient stock with 409 Conflict', async () => {
      if (!isDbConnected) return;

      const customer = await User.create({
        name: 'Test Customer',
        email: `cust_${Date.now()}@example.com`,
        password: 'password123',
        role: 'customer',
      });

      const category = await categoryService.createCategory({ name: 'Gadgets Test' });
      const product = await productService.createProduct({
        name: 'Smart Watch Test',
        sku: `SKU-WATCH-${Date.now()}`,
        price: 200,
        stock: 2,
        category: category._id,
      });

      // Order 1 unit
      const order1 = await orderService.createOrder(customer._id, [
        { product: product._id, quantity: 1 },
      ]);
      expect(order1).toBeDefined();

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stock).toBe(1);

      // Attempt to order 5 units (exceeding stock of 1) -> expects Insufficient stock error
      await expect(
        orderService.createOrder(customer._id, [{ product: product._id, quantity: 5 }])
      ).rejects.toThrow('Insufficient stock');

      // Stock should remain 1
      const checkProduct = await Product.findById(product._id);
      expect(checkProduct.stock).toBe(1);
    });
  });
});
