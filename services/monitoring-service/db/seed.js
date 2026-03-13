const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "monitoring.db");

console.log("Using DB:", dbPath);

const db = new sqlite3.Database(dbPath);

const now = Math.floor(Date.now() / 1000);

const statuses = ["online", "online", "online", "online", "online", "online", "online", "warning", "warning", "offline"];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomIP(regionId) {
  return `10.${regionId}.${rand(1, 254)}.${rand(1, 254)}`;
}

function speedByType(typeName) {
  switch (typeName.toLowerCase()) {
    case "pc":
    case "cctv":
      return 100000000; // 100 Mbps
    case "server":
      return [1000000000, 10000000000][rand(0,1)];
    case "datacenter":
      return 10000000000;
    default:
      return 1000000000; // 1 Gbps
  }
}

db.serialize(() => {
  db.all("SELECT * FROM regions", [], (err, regions) => {
    if (err) throw err;

    db.all("SELECT * FROM device_types", [], (err, types) => {
      if (err) throw err;

      const stmt = db.prepare(`
        INSERT INTO devices (
          name, ip, lat, lng, snmp, iface_index,
          status, last_status, latency, uptime,
          iface_speed, last_in_octets, last_out_octets,
          last_check_time, created_at, updated_at,
          region_id, device_type_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let counter = 1;

      regions.forEach(region => {
        for (let i = 0; i < 25; i++) {

          const type = types[rand(0, types.length - 1)];
          const status = statuses[rand(0, statuses.length - 1)];

          stmt.run(
            `${type.name}-${region.code}-${counter}`,
            randomIP(region.id),
            -6.2 + Math.random(),
            106.8 + Math.random(),
            1,
            rand(1, 5),
            status,
            status,
            rand(1, 150),
            rand(1000, 500000),
            speedByType(type.name),
            rand(100000, 5000000),
            rand(100000, 5000000),
            now,
            now,
            now,
            region.id,
            type.id
          );

          counter++;
        }
      });

      stmt.finalize();
      console.log("✅ 100 Realistic Devices Seeded");
      db.close();
    });
  });
});