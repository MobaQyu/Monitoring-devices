function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: "No permission" });
    }

    next();
  };
}

module.exports = requirePermission;
