const db = require("../../db");

async function getWeeklySummary(deviceId) {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  try {
    // ================= TRAFFIC & LATENCY =================
    const metricRows = await db.query(
      `
      SELECT
        AVG(avg_in_bps) as avg_in,
        AVG(avg_out_bps) as avg_out,
        MAX(max_in_bps) as peak_in,
        MAX(max_out_bps) as peak_out,
        AVG(avg_latency) as avg_latency,
        MAX(max_latency) as peak_latency,
        COUNT(*) as total_hours
      FROM metrics_hourly
      WHERE device_id = ?
      AND hour_timestamp >= ?
      `,
      [deviceId, now - sevenDays]
    );

    const data = metricRows[0] || {};

    const avgIn = data.avg_in || 0;
    const peakIn = data.peak_in || 0;

    // ================= UPTIME BASED ON HOURLY EXISTENCE =================
    const totalPossibleHours = 7 * 24; // 168 jam
    const activeHours = data.total_hours || 0;

    const uptimePercent =
      totalPossibleHours > 0
        ? (activeHours / totalPossibleHours) * 100
        : 0;

    // ================= STABILITY LOGIC =================
    let stability = "stable";

    if (uptimePercent < 95) {
      stability = "critical";
    } else if (peakIn > avgIn * 3) {
      stability = "spike";
    }

    return {
      avg_in_bps: avgIn,
      avg_out_bps: data.avg_out || 0,
      peak_in_bps: peakIn,
      peak_out_bps: data.peak_out || 0,
      avg_latency: data.avg_latency || 0,
      peak_latency: data.peak_latency || 0,
      uptime_percent: Number(uptimePercent.toFixed(2)),
      stability
    };

  } catch (err) {
    console.error("Weekly summary error:", err.message);
    throw err;
  }
}

module.exports = { getWeeklySummary };