const db = require("../../db");

async function generateHourlySummary() {
  const now = Date.now();
  const oneHour = 5 * 60 * 1000;

  // Bulatkan ke awal jam sekarang
  const currentHour = Math.floor(now / oneHour) * oneHour;

  // Ambil 1 jam yang SUDAH SELESAI
  const previousHour = currentHour - oneHour;

  try {
    console.log("⏳ Generating summary for hour:", new Date(previousHour));

    // Ambil data raw dalam range 1 jam penuh
    const rows = await db.query(
      `
      SELECT 
        device_id,
        AVG(in_bps) as avg_in,
        AVG(out_bps) as avg_out,
        MAX(in_bps) as max_in,
        MAX(out_bps) as max_out,
        AVG(latency) as avg_latency,
        MAX(latency) as max_latency
      FROM metrics
      WHERE created_at >= ? AND created_at < ?
      GROUP BY device_id
      `,
      [previousHour, currentHour]
    );

    if (!rows || rows.length === 0) {
      console.log("⚠ No raw data found for this hour.");
      return;
    }

    for (const r of rows) {

      // Cegah double insert
      const existing = await db.query(
        `
        SELECT id FROM metrics_hourly
        WHERE device_id = ?
        AND hour_timestamp = ?
        `,
        [r.device_id, previousHour]
      );

      if (existing.length > 0) {
        console.log(`⏭ Summary already exists for device ${r.device_id}`);
        continue;
      }

      await db.query(
        `
        INSERT INTO metrics_hourly (
          device_id,
          hour_timestamp,
          avg_in_bps,
          avg_out_bps,
          max_in_bps,
          max_out_bps,
          avg_latency,
          max_latency,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          r.device_id,
          previousHour,
          r.avg_in || 0,
          r.avg_out || 0,
          r.max_in || 0,
          r.max_out || 0,
          r.avg_latency || 0,
          r.max_latency || 0,
          now
        ]
      );
    }

    console.log("✅ Hourly summary generated successfully.");

  } catch (err) {
    console.error("❌ Hourly summary error:", err.message);
  }
}

module.exports = { generateHourlySummary };