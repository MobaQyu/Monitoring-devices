const db = require("../../db");

async function cleanupOldData() {
  const now = Date.now();

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  try {
    // Hapus raw metrics > 7 hari
    await db.query(
      `DELETE FROM metrics WHERE created_at < ?`,
      [now - sevenDays]
    );

    // Hapus activity logs > 30 hari
    await db.query(
      `DELETE FROM activity_logs WHERE created_at < ?`,
      [now - thirtyDays]
    );

    console.log("✅ Cleanup selesai");
  } catch (err) {
    console.error("❌ Cleanup error:", err.message);
  }
}

module.exports = { cleanupOldData };