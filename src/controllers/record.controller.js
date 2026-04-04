const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

const getRecords = (req, res) => {
  const { type, category, from, to, page = 1, limit = 20 } = req.query;

  const conditions = ['r.is_deleted = 0'];
  const params = [];

  if (type) { conditions.push('r.type = ?'); params.push(type); }
  if (category) { conditions.push('r.category LIKE ?'); params.push(`%${category}%`); }
  if (from) { conditions.push('r.date >= ?'); params.push(from); }
  if (to) { conditions.push('r.date <= ?'); params.push(to); }

  const where = conditions.join(' AND ');
  const offset = (Number(page) - 1) * Number(limit);

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM financial_records r WHERE ${where}`).get(...params);
  const total = totalRow ? totalRow.count : 0;

  const records = db.prepare(`
    SELECT r.*, u.name as created_by_name
    FROM financial_records r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE ${where}
    ORDER BY r.date DESC, r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  return sendSuccess(res, {
    records,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  }, 'Records fetched successfully');
};

const getRecordById = (req, res) => {
  const record = db.prepare(`
    SELECT r.*, u.name as created_by_name
    FROM financial_records r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.id = ? AND r.is_deleted = 0
  `).get(req.params.id);

  if (!record) return sendError(res, 'Record not found', 404);
  return sendSuccess(res, record, 'Record fetched successfully');
};

const createRecord = (req, res) => {
  const { amount, type, category, date, notes } = req.body;

  db.prepare(`
    INSERT INTO financial_records (amount, type, category, date, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(amount, type, category, date, notes || null, req.user.id);

  // Fetch the most recently inserted record for this user
  const record = db.prepare(`
    SELECT * FROM financial_records
    WHERE created_by = ? AND is_deleted = 0
    ORDER BY rowid DESC LIMIT 1
  `).get(req.user.id);

  return sendSuccess(res, record, 'Record created successfully', 201);
};

const updateRecord = (req, res) => {
  const { id } = req.params;
  const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
  if (!record) return sendError(res, 'Record not found', 404);

  const { amount, type, category, date, notes } = req.body;

  const fields = [];
  const values = [];

  if (amount !== undefined) { fields.push('amount = ?'); values.push(amount); }
  if (type !== undefined) { fields.push('type = ?'); values.push(type); }
  if (category !== undefined) { fields.push('category = ?'); values.push(category); }
  if (date !== undefined) { fields.push('date = ?'); values.push(date); }
  if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }

  if (fields.length === 0) return sendError(res, 'No fields to update', 400);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE financial_records SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);
  return sendSuccess(res, updated, 'Record updated successfully');
};

const deleteRecord = (req, res) => {
  const { id } = req.params;
  const record = db.prepare('SELECT id FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
  if (!record) return sendError(res, 'Record not found', 404);

  db.prepare(`
    UPDATE financial_records SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(id);

  return sendSuccess(res, null, 'Record deleted successfully');
};

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
