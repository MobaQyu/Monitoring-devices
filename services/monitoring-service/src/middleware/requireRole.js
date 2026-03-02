module.exports = function requireRole(roles = []) {
  return (req, res, next) => {
    // 🔴 PASTIKAN authMiddleware SUDAH JALAN
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: "Unauthorized (no user role)",
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden (role not allowed)",
      });
    }

    next();
  };
};
