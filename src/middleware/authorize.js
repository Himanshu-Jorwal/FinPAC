const { sendError } = require('../utils/response');

// Role hierarchy: admin > analyst > viewer
const ROLE_LEVELS = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

/**
 * Middleware factory — pass one or more allowed roles
 * e.g. authorize('admin') or authorize('admin', 'analyst')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Unauthorized', 401);

    const userRoleLevel = ROLE_LEVELS[req.user.role];
    const hasAccess = allowedRoles.some(
      (role) => userRoleLevel >= ROLE_LEVELS[role]
    );

    if (!hasAccess) {
      return sendError(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        403
      );
    }

    next();
  };
};

module.exports = { authorize };
