const db = require('../config/db');
const { sendSuccess } = require('../utils/response');

const getSummary = (req, res) => {
  // Total income, total expenses, net balance
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_balance
    FROM financial_records
    WHERE is_deleted = 0
  `).get();

  return sendSuccess(res, totals, 'Summary fetched successfully');
};

const getCategoryTotals = (req, res) => {
  const categories = db.prepare(`
    SELECT
      category,
      type,
      COUNT(*) AS transaction_count,
      ROUND(SUM(amount), 2) AS total
    FROM financial_records
    WHERE is_deleted = 0
    GROUP BY category, type
    ORDER BY total DESC
  `).all();

  return sendSuccess(res, categories, 'Category totals fetched successfully');
};

const getMonthlyTrends = (req, res) => {
  const trends = db.prepare(`
    SELECT
      strftime('%Y-%m', date) AS month,
      ROUND(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 2) AS income,
      ROUND(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 2) AS expenses,
      ROUND(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 2) AS net
    FROM financial_records
    WHERE is_deleted = 0
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `).all();

  return sendSuccess(res, trends, 'Monthly trends fetched successfully');
};

const getRecentActivity = (req, res) => {
  const recent = db.prepare(`
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, u.name AS created_by_name
    FROM financial_records r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.is_deleted = 0
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all();

  return sendSuccess(res, recent, 'Recent activity fetched successfully');
};

const getWeeklyTrends = (req, res) => {
  const trends = db.prepare(`
    SELECT
      strftime('%Y-W%W', date) AS week,
      ROUND(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 2) AS income,
      ROUND(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 2) AS expenses,
      ROUND(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 2) AS net
    FROM financial_records
    WHERE is_deleted = 0
    GROUP BY week
    ORDER BY week DESC
    LIMIT 8
  `).all();

  return sendSuccess(res, trends, 'Weekly trends fetched successfully');
};

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity, getWeeklyTrends };
