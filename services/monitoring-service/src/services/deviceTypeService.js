const db = require("../../db");

/* ================= GET ================= */
async function getDeviceTypes() {
  return await db.query(`
    SELECT id, name, icon_key
    FROM device_types
    ORDER BY name ASC
  `);
}

/* ================= CREATE ================= */
async function createDeviceType(data) {
  if (!data.name || !data.icon_key) {
    throw new Error("Nama dan icon wajib diisi");
  }

  // Cek duplicate name
  const existing = await db.query(
    "SELECT id FROM device_types WHERE name = ?",
    [data.name]
  );

  if (existing.length > 0) {
    throw new Error(
      "Device type dengan nama ini sudah ada"
    );
  }

  await db.query(
  `
  INSERT INTO device_types (name, icon_key, created_at)
  VALUES (?, ?, ?)
`,
  [data.name, data.icon_key, Date.now()]
);

  return true;
}

/* ================= UPDATE ================= */
async function updateDeviceType(id, data) {
  if (!data.name || !data.icon_key) {
    throw new Error("Nama dan icon wajib diisi");
  }

  const existing = await db.query(
    "SELECT id FROM device_types WHERE id = ?",
    [id]
  );

  if (existing.length === 0) {
    throw new Error("Device type tidak ditemukan");
  }

  await db.query(
    `
    UPDATE device_types
    SET name = ?, icon_key = ?
    WHERE id = ?
  `,
    [data.name, data.icon_key, id]
  );

  return true;
}

/* ================= DELETE ================= */
async function deleteDeviceType(id) {
  const used = await db.query(
    "SELECT COUNT(*) as total FROM devices WHERE device_type_id = ?",
    [id]
  );

  if (used[0].total > 0) {
    throw new Error(
      "Device type masih digunakan oleh device"
    );
  }

  await db.query(
    "DELETE FROM device_types WHERE id = ?",
    [id]
  );

  return true;
}

module.exports = {
  getDeviceTypes,
  createDeviceType,
  updateDeviceType,
  deleteDeviceType,
};