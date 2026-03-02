CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ip TEXT NOT NULL,
  type TEXT,
  lat REAL,
  lng REAL,
  snmp INTEGER,
  iface_index INTEGER,
  status TEXT,
  last_status TEXT,
  latency REAL,
  uptime INTEGER,
  iface_speed INTEGER,
  last_in_octets INTEGER,
  last_out_octets INTEGER,
  last_check_time INTEGER,
  created_at INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER,
  latency INTEGER,
  in_bps REAL,
  out_bps REAL,
  created_at INTEGER,
  FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER,
  status TEXT,
  created_at INTEGER,
  FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);
