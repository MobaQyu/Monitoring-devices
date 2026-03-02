const express = require("express");
const router = express.Router();

const controller = require("./user.controller");
const auth = require("./middleware/auth"); // ⬅️ JWT middleware
const requirePermission = require("./middleware/requirePermission"); // ⬅️ Permission middleware

/* ===== AUTH ===== */
router.post("/login", controller.login);

/* ===== USER MANAGEMENT (PROTECTED) ===== */
// wajib login + super_admin
router.get(
  "/",
  auth,
  requirePermission("manage_user"),
  controller.getUsers
);

// Create User
router.post(
  "/",
  auth,
  requirePermission("create_user"),
  controller.createUser
);

// Update User
router.put(
  "/:id",
  auth,
  requirePermission("update_user"),
  controller.updateUser
);

// Update Password
router.put(
  "/:id/password",
  auth,
  requirePermission("update_password"),
  controller.updatePassword
);

// Delete User
router.delete(
  "/:id",
  auth,
  requirePermission("delete_user"),
  controller.deleteUser
);



// UPDATE USER STATUS
router.patch(
  "/:id/status",
  auth,
  requirePermission("manage_user"),
  controller.updateUserStatus
);

// UPDATE USER REGION
router.put(
  "/:id/region",
  auth,
  requirePermission("manage_user"),
  controller.updateUserRegion
);

// GET USER LOGS
router.get(
  "/logs",
  auth,
  requirePermission("manage_user"),
  controller.getUserLogs
);

// GET USER SUMMARY
router.get(
  "/summary",
  auth,
  requirePermission("manage_user"),
  controller.getUserSummary
);

// GET USERS WITH STATUS
router.get(
  "/with-status",
  auth,
  requirePermission("manage_user"),
  controller.getUsersWithStatus
);

// GET RECENT ACTIVITY
router.get(
  "/activity",
  auth,
  requirePermission("manage_user"),
  controller.getRecentActivity
);

/* ===== EXPORT SEMUA ===== */
module.exports = router;
