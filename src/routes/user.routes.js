const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { restrictTo } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateProfileSchema, updateStatusSchema } = require('../validators/auth.validator');

const userRouter = express.Router();
const adminUserRouter = express.Router();

// User self-service routes (Mounted under /api/users)
userRouter.use(protect);
userRouter.get('/me', userController.getMe);
userRouter.put('/me', validate(updateProfileSchema), userController.updateMe);

// Admin user management routes (Mounted under /api/admin/users)
adminUserRouter.use(protect, restrictTo('admin'));
adminUserRouter.get('/', userController.getAllUsers);
adminUserRouter.patch('/:id/status', validate(updateStatusSchema), userController.updateUserStatus);

module.exports = {
  userRouter,
  adminUserRouter,
};
