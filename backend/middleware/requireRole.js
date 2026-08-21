const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is already set by requireAuth.js
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: You do not have the permission this action.' });
        }
        next();
    }
}

module.exports = requireRole;