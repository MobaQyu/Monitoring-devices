const db = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "super_secret_key"; // nanti pindah ke .env

/* ================= LOGIN ================= */
function login(email, password) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE email = ?`,
      [email],
      async (err, user) => {
        if (err) return reject(err);
        if (!user) return reject("User not found");

        if (user.account_status !== "active") {
          return reject(`Account is ${user.account_status}`);
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          const newFailed = (user.failed_attempts || 0) + 1;

          if (newFailed >= 5) {
            db.run(
              `UPDATE users 
               SET failed_attempts = ?, account_status = 'locked' 
               WHERE id = ?`,
              [newFailed, user.id]
            );

            // 🔴 LOG ACCOUNT LOCK
            db.run(
              `INSERT INTO user_logs 
               (user_id, action, performed_by, performed_by_username, created_at)
               VALUES (?, ?, ?, ?, ?)`,
              [
                user.id,
                "account_locked",
                user.id,
                user.username,
                Date.now()
              ]
            );

            return reject("Account locked due to too many failed attempts");
          }

          db.run(
            `UPDATE users SET failed_attempts = ? WHERE id = ?`,
            [newFailed, user.id]
          );

          // 🔴 LOG LOGIN FAILED
          db.run(
            `INSERT INTO user_logs 
             (user_id, action, performed_by, performed_by_username, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [
              user.id,
              "login_failed",
              user.id,
              user.username,
              Date.now()
            ]
          );

          return reject("Wrong password");
        }

        // 🟢 RESET FAILED + UPDATE LAST LOGIN
        db.run(
          `UPDATE users 
           SET failed_attempts = 0, last_login = ? 
           WHERE id = ?`,
          [Date.now(), user.id]
        );

        // 🔥 GET PERMISSIONS
        db.all(
          `SELECT p.name
           FROM permissions p
           JOIN role_permissions rp ON p.id = rp.permission_id
           WHERE rp.role_id = ?`,
          [user.role_id],
          (err2, permRows) => {
            if (err2) return reject(err2);

            const permissions = permRows.map(p => p.name);

            // 🔥 GET REGIONS
            db.all(
              `SELECT region_id FROM user_regions WHERE user_id = ?`,
              [user.id],
              (err3, regionRows) => {
                if (err3) return reject(err3);

                const regions = regionRows.map(r => r.region_id);

                const token = jwt.sign(
                  {
                    id: user.id,
                    role_id: user.role_id,
                    permissions,
                    regions
                  },
                  JWT_SECRET,
                  { expiresIn: "1d" }
                );

                // 🟢 LOG LOGIN SUCCESS
                db.run(
                  `INSERT INTO user_logs 
                   (user_id, action, performed_by, performed_by_username, created_at)
                   VALUES (?, ?, ?, ?, ?)`,
                  [
                    user.id,
                    "login_success",
                    user.id,
                    user.username,
                    Date.now()
                  ]
                );

                resolve({
                  token,
                  user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    permissions,
                    regions
                  }
                });
              }
            );
          }
        );
      }
    );
  });
}



/* ================= GET USERS ================= */
function getUsers() {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.account_status,
        u.created_at,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
      `,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

/* ================= CREATE USER ================= */
function createUser(data) {
  const {
    username,
    email,
    password,
    role_id,
    regions,
    performed_by,
    performed_by_username
  } = data;

  return new Promise(async (resolve, reject) => {
    try {
      if (!password) return reject("Password wajib diisi");
      if (!regions || regions.length === 0)
        return reject("Minimal 1 region wajib dipilih");

      const emailExist = await isEmailExist(email);
      if (emailExist) return reject("Email sudah terdaftar");

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        `
        INSERT INTO users
        (username, email, password, role_id, account_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          username,
          email,
          hashedPassword,
          role_id,
          "active",
          Date.now()
        ],
        function (err) {
          if (err) return reject(err);

          const userId = this.lastID;

          // 🔥 INSERT MULTI REGIONS
          const stmt = db.prepare(
            `INSERT INTO user_regions (user_id, region_id) VALUES (?, ?)`
          );

          regions.forEach((regionId) => {
            stmt.run(userId, regionId);
          });

          stmt.finalize();

          // AUDIT
          db.run(
            `
            INSERT INTO user_logs
            (user_id, action, performed_by, performed_by_username, created_at)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
              userId,
              "create_user",
              performed_by ?? null,
              performed_by_username ?? "system",
              Date.now()
            ]
          );

          resolve({ id: userId });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}




/* ================= DELETE USER ================= */
function deleteUser(id, performed_by, performed_by_username) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM users WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err);

        db.run(
          `
          INSERT INTO user_logs
          (user_id, action, performed_by, performed_by_username, created_at)
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            id,
            "delete_user",
            performed_by ?? null,
            performed_by_username ?? "system",
            Date.now()
          ]
        );

        resolve({ changes: this.changes });
      }
    );
  });
}

/* ================= UPDATE USER ================= */

function updateUser(id, data) {
  const {
    username,
    email,
    role_id,
    account_status,
    regions,
    performed_by,
    performed_by_username
  } = data;

  return new Promise((resolve, reject) => {
    db.run(
      `
      UPDATE users SET
        username = ?,
        email = ?,
        role_id = ?,
        account_status = ?
      WHERE id = ?
      `,
      [username, email, role_id, account_status, id],
      function (err) {
        if (err) return reject(err);

        // 🔥 UPDATE REGION ACCESS
        if (Array.isArray(regions)) {
          db.run(`DELETE FROM user_regions WHERE user_id = ?`, [id], (err2) => {
            if (err2) return reject(err2);

            const stmt = db.prepare(
              `INSERT INTO user_regions (user_id, region_id) VALUES (?, ?)`
            );

            regions.forEach((regionId) => {
              stmt.run(id, regionId);
            });

            stmt.finalize();
          });
        }

        resolve({ changes: this.changes });
      }
    );
  });
}



/* ================= UPDATE PASSWORD ================= */
function updatePassword(id, newPassword, performed_by, performed_by_username) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!newPassword) return reject("Password wajib diisi");

      const hashed = await bcrypt.hash(newPassword, 10);

      db.run(
        `UPDATE users SET password = ? WHERE id = ?`,
        [hashed, id],
        function (err) {
          if (err) return reject(err);

          db.run(
            `
            INSERT INTO user_logs
            (user_id, action, performed_by, performed_by_username, created_at)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
              id,
              "update_password",
              performed_by ?? null,
              performed_by_username ?? "system",
              Date.now()
            ]
          );

          resolve({ changes: this.changes });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}


/* ================= UPDATE USER STATUS ================= */
function updateUserStatus(id, account_status, performed_by, performed_by_username) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET account_status = ? WHERE id = ?`,
      [account_status, id],
      function (err) {
        if (err) return reject(err);

        db.run(
          `
          INSERT INTO user_logs
          (user_id, action, performed_by, performed_by_username, created_at)
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            id,
            "update_status",
            performed_by ?? null,
            performed_by_username ?? "system",
            Date.now()
          ]
        );

        resolve({ changes: this.changes });
      }
    );
  });
}

/* ================= CHECK EMAIL EXISTENCE ================= */
function isEmailExist(email) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM users WHERE email = ?`,
      [email],
      (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      }
    );
  });
}

/* ================= GET USER LOGS ================= */
function getUserLogs() {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT
        l.id,
        l.user_id,
        l.action,
        l.performed_by,
        l.performed_by_username,
        l.created_at,
        u.username as target_username
      FROM user_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      `,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

/* ================= GET USER SUMMARY ================= */
function getUserSummary(onlineUsersMap) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN account_status = 'pending' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN account_status = 'suspended' THEN 1 ELSE 0 END) as suspended_users,
        SUM(CASE WHEN account_status = 'locked' THEN 1 ELSE 0 END) as locked_users,
        SUM(CASE WHEN account_status = 'banned' THEN 1 ELSE 0 END) as banned_users
      FROM users
      `,
      [],
      (err, row) => {
        if (err) return reject(err);

        resolve({
          ...row,
          online_users: onlineUsersMap.size
        });
      }
    );
  });
}

/* ================= GET USERS WITH STATUS ================= */
function getUsersWithStatus(onlineUsersMap) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.account_status,
        u.last_login,
        u.created_at,
        u.role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
      `,
      [],
      async (err, rows) => {
        if (err) return reject(err);

        // 🔥 Ambil regions tiap user
        const enriched = await Promise.all(
          rows.map(async (user) => {
            const regions = await new Promise((res, rej) => {
              db.all(
                `SELECT region_id FROM user_regions WHERE user_id = ?`,
                [user.id],
                (err2, regionRows) => {
                  if (err2) return rej(err2);
                  res(regionRows.map(r => r.region_id));
                }
              );
            });

            return {
              ...user,
              regions,
              is_online: onlineUsersMap.has(user.id)
            };
          })
        );

        resolve(enriched);
      }
    );
  });
}



/* ================= GET RECENT ACTIVITY ================= */
function getRecentActivity(limit = 20) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT
        ul.id,
        ul.user_id,
        u.username,
        ul.action,
        ul.performed_by,
        ul.performed_by_username,
        ul.created_at
      FROM user_logs ul
      LEFT JOIN users u ON ul.user_id = u.id
      ORDER BY ul.created_at DESC
      LIMIT ?
      `,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}


/* ================= EXPORT ================= */
module.exports = {
  login,
  getUsers,
  createUser,
  updateUser,
  updatePassword,
  deleteUser,
  updateUserStatus,
  getUserLogs,
  isEmailExist,
  getUserSummary,
  getUsersWithStatus,
  getRecentActivity
};
