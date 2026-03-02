const db = require("../../db");

/* =========================================================
   GET DEVICES
========================================================= */
async function getDevices(options = {}) {
  const {
    regions = [],
    page = 1,
    limit = 20,
    search,
    status,
    type, // ini = device_type_id
    region,
  } = options;

  const conditions = [];
  const params = [];

  if (regions.length > 0) {
    const placeholders = regions.map(() => "?").join(",");
    conditions.push(`d.region_id IN (${placeholders})`);
    params.push(...regions);
  }

  if (region) {
    conditions.push(`d.region_id = ?`);
    params.push(Number(region));
  }

  if (search) {
    conditions.push(`(d.name LIKE ? OR d.ip LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    conditions.push(`d.status = ?`);
    params.push(status);
  }

  if (type) {
    conditions.push(`d.device_type_id = ?`);
    params.push(Number(type));
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const offset = (page - 1) * limit;

  const data = await db.query(
    `
    SELECT 
      d.*,
      r.name as region_name,
      dt.name as device_type_name,
      dt.icon_key
    FROM devices d
    LEFT JOIN regions r ON d.region_id = r.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    ${whereClause}
    LIMIT ?
    OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  const totalResult = await db.query(
    `
    SELECT COUNT(*) as total
    FROM devices d
    ${whereClause}
    `,
    params
  );

  const total = totalResult[0]?.total || 0;

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/* =========================================================
   CREATE DEVICE
========================================================= */
async function createDevice(d, user) {
  if (!d.name || !d.ip) {
    throw new Error("name dan ip wajib");
  }

  if (!d.device_type_id) {
    throw new Error("Device type wajib dipilih");
  }

  if (!user.regions.includes(d.region_id)) {
    throw new Error("Tidak boleh create device di region lain");
  }
 
  const result = await db.query(
  `
  INSERT INTO devices
  (
    name,
    ip,
    lat,
    lng,
    iface_index,
    region_id,
    device_type_id,
    is_core,
    parent_device_id,
    created_at,
    latency_warning_ms,
    latency_critical_ms,
    traffic_warning_percent,
    traffic_critical_percent
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
  d.name,
  d.ip,
  d.lat ?? null,
  d.lng ?? null,
  d.iface_index ?? null,
  d.region_id,
  d.device_type_id,
  d.is_core ?? 0,
  d.is_core ? null : d.parent_device_id ?? null,
  Date.now(),
  d.latency_warning_ms,
  d.latency_critical_ms,
  d.traffic_warning_percent,
  d.traffic_critical_percent
]
);

  const deviceId = result?.lastInsertRowid;

  await db.query(
    `
    INSERT INTO device_logs
    (device_id, action, performed_by, performed_by_username, created_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      deviceId,
      "create_device",
      user.id,
      user.username,
      Date.now(),
    ]
  );
const newDevice = await db.query(
    `
    SELECT 
      d.*,
      r.name as region_name,
      dt.name as device_type_name,
      dt.icon_key
    FROM devices d
    LEFT JOIN regions r ON d.region_id = r.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    WHERE d.id = ?
    `,
    [deviceId]
  );

  return newDevice[0];
}

/* =========================================================
   UPDATE DEVICE
========================================================= */
async function updateDevice(id, d, user) {
  if (!d.device_type_id) {
    throw new Error("Device type wajib dipilih");
  }

  if (!user.regions.includes(d.region_id)) {
    throw new Error("Tidak boleh update device region lain");
  }

  await db.query(
  `
  UPDATE devices SET
    name = ?,
    ip = ?,
    lat = ?,
    lng = ?,
    iface_index = ?,
    region_id = ?,
    device_type_id = ?,
    is_core = ?,
    parent_device_id = ?,
    latency_warning_ms = ?,
    latency_critical_ms = ?,
    traffic_warning_percent = ?,
    traffic_critical_percent = ?
  WHERE id = ?
  `,
  [
    d.name,
    d.ip,
    d.lat ?? null,
    d.lng ?? null,
    d.iface_index ?? null,
    d.region_id,
    d.device_type_id,
    d.is_core ?? 0,
    d.is_core ? null : d.parent_device_id ?? null,
    d.latency_warning_ms,
    d.latency_critical_ms,
    d.traffic_warning_percent,
    d.traffic_critical_percent,
    id,
  ]
);

  await db.query(
    `
    INSERT INTO device_logs
    (device_id, action, performed_by, performed_by_username, created_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      id,
      "update_device",
      user.id,
      user.username,
      Date.now(),
    ]
  );

    const updated = await db.query(
    `
    SELECT 
      d.*,
      r.name as region_name,
      dt.name as device_type_name,
      dt.icon_key
    FROM devices d
    LEFT JOIN regions r ON d.region_id = r.id
    LEFT JOIN device_types dt ON d.device_type_id = dt.id
    WHERE d.id = ?
    `,
    [id]
  );

  return updated[0];
}

/* =========================================================
   DELETE DEVICE
========================================================= */
async function deleteDevice(id, user) {
  const result = await db.query(
    "SELECT region_id FROM devices WHERE id = ?",
    [id]
  );

  const device = result[0];

  if (!device) {
    throw new Error("Device tidak ditemukan");
  }

  if (!user.regions.includes(device.region_id)) {
    throw new Error("Tidak boleh hapus device region lain");
  }

  await db.query("DELETE FROM devices WHERE id = ?", [id]);

  await db.query(
    `
    INSERT INTO device_logs
    (device_id, action, performed_by, performed_by_username, created_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      id,
      "delete_device",
      user.id,
      user.username,
      Date.now(),
    ]
  );

  return true;
}

/* =========================================================
   UPDATE DEVICE RUNTIME
========================================================= */
async function updateDeviceRuntime(id, runtime) {
  await db.query(
    `
    UPDATE devices
    SET
      status = COALESCE(?, status),
      latency = COALESCE(?, latency),
      uptime = COALESCE(?, uptime),
      iface_speed = COALESCE(?, iface_speed),
      last_in_octets = COALESCE(?, last_in_octets),
      last_out_octets = COALESCE(?, last_out_octets),
      last_check_time = COALESCE(?, last_check_time),
      updated_at = ?
    WHERE id = ?
    `,
    [
      runtime.status,
      runtime.latency,
      runtime.uptime,
      runtime.iface_speed,
      runtime.last_in_octets,
      runtime.last_out_octets,
      runtime.last_check_time,
      Date.now(),
      id,
    ]
  );
}

/* =========================================================
   GET ALL DEVICES RAW
========================================================= */
async function getAllDevicesRaw() {
  return await db.query(`
    SELECT 
      id,
      name,
      ip,
      snmp,
      iface_index,
      last_status,
      last_check_time,
      last_in_octets,
      last_out_octets,
      latency_warning_ms,
      latency_critical_ms,
      traffic_warning_percent,
      traffic_critical_percent
    FROM devices
  `);
}

module.exports = {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  updateDeviceRuntime,
  getAllDevicesRaw,
};