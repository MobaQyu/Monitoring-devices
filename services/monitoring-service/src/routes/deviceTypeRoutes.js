const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requirePermission = require("../middleware/requirePermission");
const deviceTypeService = require("../services/deviceTypeService");

/* ================= GET DEVICE TYPES ================= */
router.get(
  "/",
  auth,
  requirePermission("view_device"),
  async (req, res) => {
    try {
      const types =
        await deviceTypeService.getDeviceTypes();
      res.json(types);
    } catch (err) {
      res.status(500).json({
        error: "Gagal ambil device types",
      });
    }
  }
);

/* ================= CREATE ================= */
router.post(
  "/",
  auth,
  requirePermission("manage_device_type"),
  async (req, res) => {
    try {
      console.log("BODY:", req.body); // 👈 tambahkan ini
      await deviceTypeService.createDeviceType(req.body);
      res.status(201).json({ ok: true });
    } catch (err) {
      console.log("CREATE ERROR:", err.message); // 👈 tambahkan ini
      res.status(400).json({ error: err.message });
    }
  }
);
/* ================= UPDATE ================= */
router.put(
  "/:id",
  auth,
  requirePermission("manage_device_type"),
  async (req, res) => {
    try {
      await deviceTypeService.updateDeviceType(
        req.params.id,
        req.body
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({
        error: err.message,
      });
    }
  }
);

/* ================= DELETE ================= */
router.delete(
  "/:id",
  auth,
  requirePermission("manage_device_type"),
  async (req, res) => {
    try {
      await deviceTypeService.deleteDeviceType(
        req.params.id
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({
        error: err.message,
      });
    }
  }
);

module.exports = router;