const { body, param } = require('express-validator');

const updateUserValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('role')
    .optional()
    .isIn(['viewer', 'analyst', 'admin'])
    .withMessage('Role must be viewer, analyst, or admin'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

module.exports = { updateUserValidator };
