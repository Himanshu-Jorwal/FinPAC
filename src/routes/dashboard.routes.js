const express = require('express');
const router = express.Router();
const {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
  getWeeklyTrends,
} = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// All dashboard routes require at least analyst role
router.use(authenticate, authorize('analyst'));

// GET /api/dashboard/summary
router.get('/summary', getSummary);

// GET /api/dashboard/categories
router.get('/categories', getCategoryTotals);

// GET /api/dashboard/trends/monthly
router.get('/trends/monthly', getMonthlyTrends);

// GET /api/dashboard/trends/weekly
router.get('/trends/weekly', getWeeklyTrends);

// GET /api/dashboard/recent
router.get('/recent', getRecentActivity);

module.exports = router;
