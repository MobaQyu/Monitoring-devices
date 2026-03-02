const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "users.db"),
  (err) => {
    if (err) {
      console.error("❌ DB error:", err.message);
    } else {
      console.log("✅ Connected to users.db");
    }
  }
);

/* ===== AUTO CREATE TABLE ===== */
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('user','admin','super_admin')) NOT NULL DEFAULT 'user',
  regional TEXT,
  status TEXT CHECK(status IN ('active','disabled')) NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);

  `, (err) => {
    if (err) {
      console.error("❌ Create table error:", err.message);
    } else {
      console.log("✅ users table ready");
    }
  });
});
db.serialize(() => {

  // === REGIONS TABLE ===
  db.run(`
    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  // === SEED REGIONS ===
  db.run(`
    INSERT OR IGNORE INTO regions (id, code, name, description) VALUES
    (1, 'P1', 'Pelindo I', 'Sumatera Utara, Aceh, Riau, Kepulauan Riau'),
    (2, 'P2', 'Pelindo II', 'Sumatera Barat hingga Jawa Barat, Kalimantan Barat'),
    (3, 'P3', 'Pelindo III', 'Jawa Tengah, Jawa Timur, Bali, Nusa Tenggara, Kalimantan Selatan & Tengah'),
    (4, 'P4', 'Pelindo IV', 'Kalimantan Timur & Utara, Sulawesi, Maluku, Papua')
  `);

  // === ADD region_id TO users ===
  db.run(`
    ALTER TABLE users ADD COLUMN region_id INTEGER
  `, () => {});
});

module.exports = db;
