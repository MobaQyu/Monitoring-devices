const db = require("../../db");

function saveMetric(deviceId, latency, inBps, outBps) {
  return db.query(
    `INSERT INTO metrics
     (device_id, latency, in_bps, out_bps, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [deviceId, latency, inBps, outBps, Date.now()]
  );
}

function getMetricHistory(deviceId, limit = 120) {
  return db.query(
    `SELECT
        created_at,
        latency,
        in_bps,
        out_bps
     FROM metrics
     WHERE device_id = ?
     ORDER BY created_at ASC
     LIMIT ?`,
    [deviceId, limit]
  );
}

module.exports = {
  saveMetric,
  getMetricHistory,
};
