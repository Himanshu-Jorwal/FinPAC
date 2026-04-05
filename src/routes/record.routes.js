const express = require('express');
const router = express.Router();
const {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} = require('../controllers/record.controller');
const {
  createRecordValidator,
  updateRecordValidator,
  filterRecordValidator,
} = require('../validators/record.validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// All record routes require authentication
router.use(authenticate);

// GET /api/records  — viewer, analyst, admin can all read
router.get('/', authorize('viewer'), filterRecordValidator, validate, getRecords);

// GET /api/records/:id
router.get('/:id', authorize('viewer'), getRecordById);

// POST /api/records — analyst and admin only
router.post('/', authorize('analyst'), createRecordValidator, validate, createRecord);

// PATCH /api/records/:id — analyst and admin only
router.patch('/:id', authorize('analyst'), updateRecordValidator, validate, updateRecord);

// DELETE /api/records/:id — admin only
router.delete('/:id', authorize('admin'), deleteRecord);

module.exports = router;
