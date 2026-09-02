const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/env');

/**
 * Generate JWT Token for authenticated user
 * Payload contains { id, role }
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Register a new user
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  // Create new user (only admin role if explicitly set, default is customer)
  const user = await User.create({
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'customer',
  });

  const token = generateToken(user);

  return new ApiResponse(
    201,
    { user, token },
    'User registered successfully'
  ).send(res);
});

/**
 * Login existing user
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Compare candidate password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(403, 'Your account is deactivated');
  }

  const token = generateToken(user);

  // Convert to object to trigger toJSON password removal
  const userObject = user.toJSON();

  return new ApiResponse(
    200,
    { user: userObject, token },
    'Login successful'
  ).send(res);
});

module.exports = {
  register,
  login,
};
