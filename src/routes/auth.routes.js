const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { authRateLimiter } = require('../middlewares/rateLimiter.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

// Public Authentication Routes (protected with strict rate limiting)
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

module.exports = router;
