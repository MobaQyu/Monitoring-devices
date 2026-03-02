const express = require("express");
const router = express.Router();
const roleController = require("./role.controller");
const auth = require("./middleware/auth");
const requirePermission = require("./middleware/requirePermission");

// GET ALL ROLES
router.get("/", auth, requirePermission("manage_roles"), roleController.getRoles);

// GET ALL PERMISSIONS
router.get("/permissions", auth, requirePermission("manage_roles"), roleController.getPermissions);

// CREATE ROLE
router.post("/", auth, requirePermission("manage_roles"), roleController.createRole);

// UPDATE ROLE
router.put("/:id", auth, requirePermission("manage_roles"), roleController.updateRole);

// GET ROLE PERMISSIONS
router.get("/:id/permissions", auth, requirePermission("manage_roles"), roleController.getRolePermissions);

// DELETE ROLE
router.delete("/:id", auth, requirePermission("manage_roles"), roleController.deleteRole);

module.exports = router;
