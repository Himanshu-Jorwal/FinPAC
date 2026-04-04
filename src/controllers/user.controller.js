const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

const getAllUsers = (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, role, status, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `).all();
  return sendSuccess(res, users, 'Users fetched successfully');
};

const getUserById = (req, res) => {
  const { id } = req.params;
  const user = db.prepare(`
    SELECT id, name, email, role, status, created_at, updated_at
    FROM users WHERE id = ?
  `).get(id);

  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, user, 'User fetched successfully');
};

const updateUser = (req, res) => {
  const { id } = req.params;
  const { name, role, status } = req.body;

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return sendError(res, 'User not found', 404);

  // Prevent admin from deactivating themselves
  if (Number(id) === req.user.id && status === 'inactive') {
    return sendError(res, 'You cannot deactivate your own account', 400);
  }

  const fields = [];
  const values = [];

  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (role !== undefined) { fields.push('role = ?'); values.push(role); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }

  if (fields.length === 0) return sendError(res, 'No fields to update', 400);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare(`
    SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?
  `).get(id);

  return sendSuccess(res, updated, 'User updated successfully');
};

const deleteUser = (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    return sendError(res, 'You cannot delete your own account', 400);
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return sendError(res, 'User not found', 404);

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return sendSuccess(res, null, 'User deleted successfully');
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
