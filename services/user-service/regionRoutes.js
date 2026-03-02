const express = require("express");
const router = express.Router();

const controller = require("./region.controller");
const auth = require("./middleware/auth");
const requirePermission = require("./middleware/requirePermission");

// semua user login boleh lihat region
router.get("/", auth, controller.getRegions);
router.post("/", auth, requirePermission("manage_user"), controller.createRegion);
router.put("/:id", auth, requirePermission("manage_user"), controller.updateRegion);
router.delete("/:id", auth, requirePermission("manage_user"), controller.deleteRegion);


module.exports = router;

