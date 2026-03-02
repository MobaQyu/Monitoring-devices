const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth"); // JWT verify
const deviceService = require("../services/deviceService");
const metricService = require("../services/metricService");
const activityService = require("../services/activityService");
const requirePermission = require("../middleware/requirePermission"); // Permission middleware

/* ================= GET ALL DEVICES ================= */
router.get(
  "/",
  auth,
  requirePermission("view_device"),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        status,
        type,
        region,
      } = req.query;

      const result = await deviceService.getDevices({
        regions: req.user.regions,
        page: Number(page),
        limit: Number(limit),
        search,
        status,
        type,
        region,
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Gagal ambil device" });
    }
  }
);


/* ================= CREATE DEVICE ================= */
router.post(
  "/",
  auth,
  requirePermission("create_device"),
  async (req, res) => {
    try {
      const device = await deviceService.createDevice(
        req.body,
        req.user
      );

      const io = req.app.get("io");
       if(io){ 
      io.emit("device:created", device);
       }
       
      res.status(201).json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);


/* ================= UPDATE DEVICE ================= */
router.put("/:id", auth, requirePermission("update_device"), async (req, res) => {
  try {
    const updatedDevice = await deviceService.updateDevice(
      req.params.id,
      req.body,
      req.user
    );

    const io = req.app.get("io");

    if (io) {
  io.emit("device:updated", updatedDevice);
}

    res.json({ ok: true });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

/* ================= DELETE DEVICE ================= */
router.delete("/:id", auth, requirePermission("delete_device"), async (req, res) => {
  try {
    await deviceService.deleteDevice(req.params.id, req.user);

    const io = req.app.get("io");

    io.emit("device:deleted", Number(req.params.id));

    res.json({ ok: true });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});
/* ================= HISTORY ================= */
router.get("/:id/history", auth, async (req, res) => {
  try {
    const data = await metricService.getMetricHistory(req.params.id);
    res.json(data);
  } catch (err) {
    console.error("HISTORY ERROR:", err);
    res.status(500).json({ error: "Gagal ambil history" });
  }
});

/* ================= LOGS ================= */
router.get("/:id/logs", auth, async (req, res) => {
  try {
    const logs = await activityService.getActivityLogs(req.params.id);
    res.json(logs);
  } catch (err) {
    console.error("LOG ERROR:", err);
    res.status(500).json({ error: "Gagal ambil logs" });
  }
});

module.exports = router;
