const db = require("./db");

function getRegions() {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT id, code, name, description
      FROM regions
      ORDER BY id ASC
      `,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}
function createRegion(data) {
  const { code, name, description } = data;

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO regions (code, name, description) VALUES (?, ?, ?)`,
      [code, name, description || null],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function updateRegion(id, data) {
  const { code, name, description } = data;

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE regions SET code = ?, name = ?, description = ? WHERE id = ?`,
      [code, name, description || null, id],
      function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      }
    );
  });
}

function deleteRegion(id) {
  return new Promise((resolve, reject) => {

    db.get(
      `SELECT COUNT(*) as total FROM devices WHERE region_id = ?`,
      [id],
      (err, row) => {
        if (row.total > 0) {
          return reject("Region masih memiliki device");
        }

        db.get(
          `SELECT COUNT(*) as total FROM user_regions WHERE region_id = ?`,
          [id],
          (err2, row2) => {
            if (row2.total > 0) {
              return reject("Region masih dipakai user");
            }

            db.run(
              `DELETE FROM regions WHERE id = ?`,
              [id],
              function (err3) {
                if (err3) return reject(err3);
                resolve({ changes: this.changes });
              }
            );
          }
        );
      }
    );
  });
}

module.exports = {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion
};
