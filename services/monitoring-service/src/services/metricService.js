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
// ===== LATENCY BY RANGE =====
async function getLatencyByRange(range, deviceId) {
  const now = Date.now();

  let from;
  let interval;

  if (range === "1H") {
    from = now - 60 * 60 * 1000;
    interval = 30000;
  }

  if (range === "24H") {
    from = now - 24 * 60 * 60 * 1000;
    interval = 300000;
  }

  if (range === "7D") {
    from = now - 7 * 24 * 60 * 60 * 1000;
    interval = 3600000;
  }

  return await db.query(
    `SELECT
       (created_at / ?) * ? as time,
       AVG(latency) as latency
     FROM metrics
     WHERE created_at >= ?
     ${deviceId ? "AND device_id = ?" : ""}
     GROUP BY time
     ORDER BY time ASC`,
    deviceId
      ? [interval, interval, from, deviceId]
      : [interval, interval, from]
  );
}

  

// ===== TRAFFIC BY RANGE =====
async function getTrafficByRange(range, deviceId) {
  const now = Date.now();

  if (range === "1H") {
    const from = now - 60 * 60 * 1000;

    const rows = await db.query(
      `SELECT created_at as time, in_bps, out_bps
       FROM metrics
       WHERE created_at >= ?
       ${deviceId ? "AND device_id = ?" : ""}
       ORDER BY created_at DESC
       LIMIT 120`,
      deviceId ? [from, deviceId] : [from]
    );

    return rows.reverse();
  }

  if (range === "24H" || range === "7D") {
    const from =
      range === "24H"
        ? now - 24 * 60 * 60 * 1000
        : now - 7 * 24 * 60 * 60 * 1000;

    return await db.query(
      `SELECT hour_timestamp as time, avg_in_bps as in_bps, avg_out_bps as out_bps
       FROM metrics_hourly
       WHERE hour_timestamp >= ?
       ${deviceId ? "AND device_id = ?" : ""}
       ORDER BY hour_timestamp ASC`
    );
  }

  return [];
}

module.exports = {
  saveMetric,
  getMetricHistory,
  getTrafficHistory,
  getLatencyHistory,
  getLatencyByRange,
  getTrafficByRange,
};
