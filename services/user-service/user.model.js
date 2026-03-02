const db = require("./db");

/* ===== GET ALL USERS ===== */
function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, username, email, role, region_id, status, created_at
       FROM users
       ORDER BY id DESC`,
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

/* ===== CREATE USER ===== */
function createUser(data) {
  const { username, email, role, region_id, status } = data;

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users 
       (username, email, role, region_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username,
        email,
        role,
        region_id ?? null,
        status ?? "active",
        Date.now(),
      ],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

module.exports = {
  getAllUsers,
  createUser,
};
