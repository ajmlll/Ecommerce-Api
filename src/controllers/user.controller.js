const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * Get current user's profile
 */
const getMe = catchAsync(async (req, res) => {
  return new ApiResponse(200, req.user, 'Profile retrieved successfully').send(res);
});

/**
 * Update current user's profile (name & email only)
 */
const updateMe = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  const updateData = {};
  if (name !== undefined) updateData.name = name;

  if (email !== undefined && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'Email address is already in use');
    }
    updateData.email = email;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'No valid profile update data provided');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  );

  return new ApiResponse(200, updatedUser, 'Profile updated successfully').send(res);
});

/**
 * Get all users (Admin only, paginated)
 */
const getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return new ApiResponse(
    200,
    {
      users,
      pagination: {
        totalUsers: total,
        totalPages,
        currentPage: page,
        limit,
      },
    },
    'Users list retrieved successfully'
  ).send(res);
});

/**
 * Toggle user active status (Admin only)
 * Prevent admins from deactivating themselves.
 */
const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  // Prevent admin self-deactivation
  if (req.user.id.toString() === id.toString() && isActive === false) {
    throw new ApiError(400, 'Admins cannot deactivate their own account');
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  targetUser.isActive = isActive;
  await targetUser.save();

  return new ApiResponse(
    200,
    targetUser,
    `User account status updated to ${isActive ? 'active' : 'deactivated'}`
  ).send(res);
});

module.exports = {
  getMe,
  updateMe,
  getAllUsers,
  updateUserStatus,
};
