const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const logger = require('./config/logger');
const setupSwagger = require('./config/swagger');
const ApiError = require('./utils/ApiError');
const errorHandler = require('./middlewares/error.middleware');
const { globalRateLimiter } = require('./middlewares/rateLimiter.middleware');

const authRoutes = require('./routes/auth.routes');
const { userRouter, adminUserRouter } = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();

// Security HTTP headers
app.use(helmet());

// Global Rate Limiting
app.use(globalRateLimiter);

// Enable CORS
app.use(cors());

// HTTP Request Logger piped through Winston stream
const morganFormat = config.env === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// Parse JSON payload
app.use(express.json());

// Parse URL-encoded body payload
app.use(express.urlencoded({ extended: true }));

// Serve Swagger / OpenAPI Documentation at /api-docs
setupSwagger(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Handle 404 - Unmatched Routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
