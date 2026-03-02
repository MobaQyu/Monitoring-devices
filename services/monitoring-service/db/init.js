const fs = require("fs");
const path = require("path");
const { db } = require("./index");

// 1️⃣ Load schema devices, metrics, dll
const schema = fs.readFileSync(
  path.join(__dirname, "schema.sqlite.sql"),
  "utf8"
);

// 2️⃣ Execute base schema
db.exec(schema);

// 3️⃣ Create regions table
db.exec(`
  CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT
  );
`);

// 4️⃣ Seed regions (Pelindo)
db.exec(`
  INSERT OR IGNORE INTO regions (id, code, name, description) VALUES
  (1, 'P1', 'Pelindo I', 'Sumatera Utara, Aceh, Riau, Kepulauan Riau'),
  (2, 'P2', 'Pelindo II', 'Sumatera Barat hingga Jawa Barat, Kalimantan Barat'),
  (3, 'P3', 'Pelindo III', 'Jawa Tengah, Jawa Timur, Bali, Nusa Tenggara, Kalimantan Selatan & Tengah'),
  (4, 'P4', 'Pelindo IV', 'Kalimantan Timur & Utara, Sulawesi, Maluku, Papua');
`);

// 5️⃣ Add region_id to devices (safe)
try {
  db.exec(`ALTER TABLE devices ADD COLUMN region_id INTEGER;`);
} catch (e) {
  // kolom sudah ada → aman
}

console.log("✅ monitoring-service DB init + region OK");
