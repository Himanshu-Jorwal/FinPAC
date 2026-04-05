const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const db = require('../config/db');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization token required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    // Fetch fresh user from DB (checks if user is still active)
    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(decoded.id);

    if (!user) return sendError(res, 'User not found', 401);
    if (user.status === 'inactive') return sendError(res, 'Account is inactive', 403);

    req.user = user;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

module.exports = { authenticate };
