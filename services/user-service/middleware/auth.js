const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db"); // sesuaikan path
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";


async function login(req, res) {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // 🔴 CEK ACCOUNT STATUS
  if (user.account_status !== "active") {
    return res.status(403).json({
      message: `Account is ${user.account_status}`,
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    const newFailed = user.failed_attempts + 1;

    if (newFailed >= 5) {
      db.prepare(`
        UPDATE users 
        SET failed_attempts = ?, account_status = 'locked'
        WHERE id = ?
      `).run(newFailed, user.id);

      return res.status(403).json({
        message: "Account locked due to too many failed attempts",
      });
    }

    db.prepare(`
      UPDATE users 
      SET failed_attempts = ?
      WHERE id = ?
    `).run(newFailed, user.id);

    return res.status(401).json({ message: "Invalid credentials" });
  }

  // 🟢 LOGIN SUKSES

  db.prepare(`
    UPDATE users 
    SET failed_attempts = 0,
        last_login = ?
    WHERE id = ?
  `).run(Date.now(), user.id);

  // 🔥 AMBIL PERMISSIONS
  const permissions = db.prepare(`
    SELECT p.name
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `).all(user.role_id);

  const regions = db.prepare(`
      SELECT region_id
      FROM user_regions
      WHERE user_id = ?
    `).all(user.id);

    const regionList = regions.map(r => r.region_id);


  const permissionList = permissions.map(p => p.name);

  const token = jwt.sign(
    {
      id: user.id,
      role_id: user.role_id,
      permissions: permissionList,
      regions: regionList
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      permissions: permissionList,
      regions: regionList
    }
  });
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;   // ❗ penting
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = authenticate;