const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "monitoring.db");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      if (/^\s*select/i.test(sql)) {
        const rows = db.prepare(sql).all(params);
        resolve(rows);
      } else {
        const result = db.prepare(sql).run(params);
        resolve(result);
      }
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { db, query };
