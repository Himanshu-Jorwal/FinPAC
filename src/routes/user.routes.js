const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { updateUserValidator } = require('../validators/user.validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// All user routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// GET /api/users
router.get('/', getAllUsers);

// GET /api/users/:id
router.get('/:id', getUserById);

// PATCH /api/users/:id
router.patch('/:id', updateUserValidator, validate, updateUser);

// DELETE /api/users/:id
router.delete('/:id', deleteUser);

module.exports = router;
