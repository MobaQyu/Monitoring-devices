const db = require("../../db");

function logStatus(deviceId, status) {
  return db.query(
    `INSERT INTO activity_logs
     (device_id, status, created_at)
     VALUES (?, ?, ?)`,
    [deviceId, status, Date.now()]
  );
}

function getActivityLogs(deviceId, limit = 20) {
  return db.query(
    `SELECT status, created_at
     FROM activity_logs
     WHERE device_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [deviceId, limit]
  );
}

module.exports = {
  logStatus,
  getActivityLogs,
};
