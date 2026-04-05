const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { loginValidator, registerValidator } = require('../validators/auth.validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');

// POST /api/auth/register
router.post('/register', registerValidator, validate, register);

// POST /api/auth/login
router.post('/login', loginValidator, validate, login);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

module.exports = router;
