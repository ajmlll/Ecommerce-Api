const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce REST API',
      version: '1.0.0',
      description: 'Comprehensive E-commerce REST API backend documentation with JWT Authentication, Materialized-Path Categories, Subtree Product Filtering, and Transactional Order Management.',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'customer'], example: 'customer' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
            name: { type: 'string', example: 'Laptops' },
            slug: { type: 'string', example: 'laptops' },
            parent: { type: 'string', nullable: true, example: '60d0fe4f5311236168a109ca' },
            ancestors: { type: 'array', items: { type: 'string' }, example: ['60d0fe4f5311236168a109ca'] },
            isActive: { type: 'boolean', example: true },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cc' },
            name: { type: 'string', example: 'Gaming Laptop' },
            sku: { type: 'string', example: 'SKU-ROG-100' },
            description: { type: 'string', example: 'High performance laptop' },
            price: { type: 'number', example: 1200 },
            salePrice: { type: 'number', nullable: true, example: 999 },
            stock: { type: 'integer', example: 15 },
            category: { type: 'string', example: '60d0fe4f5311236168a109cb' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cd' },
            customer: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string', example: '60d0fe4f5311236168a109cc' },
                  name: { type: 'string', example: 'Gaming Laptop' },
                  price: { type: 'number', example: 999 },
                  quantity: { type: 'integer', example: 1 },
                },
              },
            },
            totalAmount: { type: 'number', example: 999 },
            status: { type: 'string', enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], example: 'Pending' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
            details: { type: 'object', nullable: true },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
