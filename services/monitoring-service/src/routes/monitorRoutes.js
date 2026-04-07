const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const metricService = require("../services/metricService");

/* ===== TRAFFIC ===== */
router.get("/traffic", auth, async (req, res) => {
  try {

    const data = await metricService.getTrafficHistory();

    res.json(data);

  } catch (err) {

    res.status(500).json({ error: "Traffic error" });

  }
});

/* ===== LATENCY ===== */
router.get("/latency", auth, async (req, res) => {
  try {
    const { range = "1H", deviceId } = req.query;

    const data = await metricService.getLatencyByRange(
      range,
      deviceId
    );

    res.json(data);

  } catch (err) {
    console.error("LATENCY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/traffic", auth, async (req, res) => {
  try {
    const { range = "1H", deviceId } = req.query;

    const data = await metricService.getTrafficByRange(
      range,
      deviceId
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Traffic error" });
  }
});

// ===== EXPORT CSV =====
router.get("/export", auth, async (req, res) => {
  try {
    const { range = "1H", type = "latency", deviceId } = req.query;

    let data = [];

    if (type === "latency") {
      data = await metricService.getLatencyByRange(range, deviceId);
    } else if (type === "traffic") {
      data = await metricService.getTrafficByRange(range, deviceId);
    }

    let csv = "";

    if (type === "latency") {
      csv += "time,latency\n";
      data.forEach(d => {
        const time = new Date(d.time).toISOString();
        csv += `${time},${d.latency ?? 0}\n`;
      });
    }

    if (type === "traffic") {
      csv += "time,in_bps,out_bps\n";
      data.forEach(d => {
        const time = new Date(d.time).toISOString();
        csv += `${time},${d.in_bps ?? 0},${d.out_bps ?? 0}\n`;
      });
    }

    const today = new Date().toISOString().split("T")[0];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}_${deviceId || "all"}_${range}_${today}.csv`
    );

    res.send(csv);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export error" });
  }
});

module.exports = router;