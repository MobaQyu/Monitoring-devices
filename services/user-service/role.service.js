const db = require("./db");

function getRoles() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM roles ORDER BY id DESC`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getPermissions() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM permissions ORDER BY id ASC`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createRole(data) {
  const { name, description, permissions } = data;

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO roles (name, description, created_at) VALUES (?, ?, ?)`,
      [name, description || null, Date.now()],
      function (err) {
        if (err) return reject(err);

        const roleId = this.lastID;

        const stmt = db.prepare(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`
        );

        permissions.forEach((permId) => {
          stmt.run(roleId, permId);
        });

        stmt.finalize();

        resolve({ id: roleId });
      }
    );
  });
}
function updateRole(id, data) {
  const { name, description, permissions } = data;

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE roles SET name = ?, description = ? WHERE id = ?`,
      [name, description || null, id],
      function (err) {
        if (err) return reject(err);

        // 🔥 Hapus permission lama
        db.run(`DELETE FROM role_permissions WHERE role_id = ?`, [id]);

        // 🔥 Insert permission baru
        const stmt = db.prepare(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`
        );

        permissions.forEach((permId) => {
          stmt.run(id, permId);
        });

        stmt.finalize();

        resolve({ changes: this.changes });
      }
    );
  });
}

function getRolePermissions(roleId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT p.id, p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      `,
      [roleId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function deleteRole(id) {
  return new Promise((resolve, reject) => {

    // 🔥 Cek apakah role masih dipakai user
    db.get(
      `SELECT COUNT(*) as total FROM users WHERE role_id = ?`,
      [id],
      (err, row) => {
        if (err) return reject(err);

        if (row.total > 0) {
          return reject("Role masih digunakan oleh user");
        }

        // 🔥 Hapus role_permissions dulu
        db.run(`DELETE FROM role_permissions WHERE role_id = ?`, [id]);

        // 🔥 Hapus role
        db.run(
          `DELETE FROM roles WHERE id = ?`,
          [id],
          function (err2) {
            if (err2) return reject(err2);
            resolve({ changes: this.changes });
          }
        );
      }
    );
  });
}


module.exports = {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  getRolePermissions,
  deleteRole
};
