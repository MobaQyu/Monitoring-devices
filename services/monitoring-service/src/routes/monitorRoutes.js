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

    const data = await metricService.getLatencyHistory();

    res.json(data);

  } catch (err) {

    res.status(500).json({ error: "Latency error" });

  }
});

module.exports = router;