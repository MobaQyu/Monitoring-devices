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
        created_at AS time,
        latency,
        in_bps AS "in",
        out_bps AS "out"
     FROM metrics
     WHERE device_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [deviceId, limit]
  );
}

function getTrafficHistory() {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

  return db.query(
    `SELECT
        (created_at / 5000) * 5000 AS time,
        SUM(in_bps) AS "in",
        SUM(out_bps) AS "out"
     FROM metrics
     WHERE created_at > ?
     GROUP BY time
     ORDER BY time ASC`,
    [fiveMinutesAgo]
  );
}

function getLatencyHistory() {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

  return db.query(
    `SELECT
        (created_at / 5000) * 5000 AS time,
        AVG(latency) AS latency
     FROM metrics
     WHERE created_at > ?
     GROUP BY time
     ORDER BY time ASC`,
    [fiveMinutesAgo]
  );
}
module.exports = {
  saveMetric,
  getMetricHistory,
  getTrafficHistory,
  getLatencyHistory,
};
