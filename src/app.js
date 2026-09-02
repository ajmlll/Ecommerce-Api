const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const ApiError = require('./utils/ApiError');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

// HTTP request logger
app.use(morgan('dev'));

// Parse JSON payload
app.use(express.json());

// Parse URL-encoded body payload
app.use(express.urlencoded({ extended: true }));

// API Routes
const authRoutes = require('./routes/auth.routes');
const { userRouter, adminUserRouter } = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// Handle 404 - Unmatched Routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
