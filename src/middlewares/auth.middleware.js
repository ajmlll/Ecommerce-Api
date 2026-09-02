const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/env');

/**
 * Protect middleware: Verifies JWT token, fetches user from DB, and checks active status.
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  // Extract Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Authentication token missing. Please log in.');
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }

  // Find user from database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw new ApiError(401, 'The user belonging to this token no longer exists.');
  }

  // Ensure account is active
  if (!currentUser.isActive) {
    throw new ApiError(401, 'User account is deactivated.');
  }

  // Attach user object to request
  req.user = currentUser;
  next();
});

module.exports = {
  protect,
};
