const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const register = (req, res) => {
  const { name, email, password, role = 'viewer' } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return sendError(res, 'Email already in use', 409);

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(name, email, hashedPassword, role);

  // Fetch the newly created user by email
  const user = db.prepare(`
    SELECT id, name, email, role, status, created_at FROM users WHERE email = ?
  `).get(email);

  const token = generateToken({ id: user.id, role: user.role });
  return sendSuccess(res, { user, token }, 'User registered successfully', 201);
};

const login = (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return sendError(res, 'Invalid email or password', 401);
  if (user.status === 'inactive') return sendError(res, 'Account is inactive', 403);

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) return sendError(res, 'Invalid email or password', 401);

  const token = generateToken({ id: user.id, role: user.role });
  const { password: _, ...userWithoutPassword } = user;

  return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
};

const getMe = (req, res) => {
  return sendSuccess(res, req.user, 'Authenticated user');
};

module.exports = { register, login, getMe };

