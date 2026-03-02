const userService = require("./user.service");

/* ===== LOGIN ===== */
async function login(req, res) {
  try {
    const result = await userService.login(
      req.body.email,
      req.body.password
    );

    res.json({
      message: "login success",
      token: result.token,
      user: {
        id: result.user.id,
        username: result.user.username,
        full_name: result.user.full_name,
        permissions: result.user.permissions,
        regions: result.user.regions
      },
    });

  } catch (err) {
    res.status(400).json({
      error: err.toString()
    });
  }
}



/* ===== GET USERS ===== */
async function getUsers(req, res) {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ===== UPDATE USER ===== */
async function updateUser(req, res) {
  const { id } = req.params;

  try {
    const result = await userService.updateUser(id, {
    ...req.body,
    performed_by: req.user.id,
    performed_by_username: req.user.username
  });


    if (result.changes === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({ message: "User berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ===== CREATE USER ===== */
async function createUser(req, res) {
  const { username, email, password, role_id, regions } = req.body;

if (!username || !email || !password || !role_id || !regions || regions.length === 0) {
  return res.status(400).json({
    error: "username, email, password, role_id, regions wajib diisi",
  });
}


  try {
    const result = await userService.createUser({
  username,
  email,
  password,
  role_id,
  regions,
  performed_by: req.user.id,
  performed_by_username: req.user.username
});


    res.status(201).json({
      message: "User berhasil dibuat",
      id: result.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}





/* ===== DELETE USER ===== */
async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    const result = await userService.deleteUser(
      id,
      req.user.id,
      req.user.username
    );


    if (result.changes === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  const forceLogoutUser = req.app.get("forceLogoutUser");
  forceLogoutUser?.(id, "Account deleted");

}

/* ===== UPDATE PASSWORD ===== */
async function updatePassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password wajib diisi" });
  }

  try {
    const result = await userService.updatePassword(
      id,
      password,
      req.user.id,
      req.user.username
    );


    if (result.changes === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({ message: "Password berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}

/* ===== UPDATE USER STATUS ===== */
async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { account_status } = req.body;

  const allowed = ["active", "pending", "suspended", "banned", "locked"];

  if (!allowed.includes(account_status)) {
    return res.status(400).json({ error: "Status tidak valid" });
  }

  try {
        const result = await userService.updateUserStatus(
          id,
          account_status,
          req.user.id,
          req.user.username
        );


    if (result.changes === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({ message: "Status user berhasil diubah" });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
  const onlineUsers = req.app.get("onlineUsers");

  if (account_status !== "active") {
    const forceLogoutUser = req.app.get("forceLogoutUser");
    forceLogoutUser?.(id, `Account ${account_status}`);
  }

}


// UPDATE USER REGION

async function updateUserRegion(req, res) {
  const { id } = req.params;
  const { region_id } = req.body;

  if (!region_id) {
    return res.status(400).json({ error: "region_id wajib diisi" });
  }

  try {
    const result = await userService.updateUserRegion(id, region_id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({ message: "Region user berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}

/* ===== GET USER LOGS ===== */
async function getUserLogs(req, res) {
  try {
    const logs = await userService.getUserLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}

/* ===== GET USER SUMMARY ===== */
async function getUserSummary(req, res) {
  try {
    const onlineUsers = req.app.get("onlineUsers");
    const summary = await userService.getUserSummary(onlineUsers);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ===== GET USERS WITH STATUS ===== */
async function getUsersWithStatus(req, res) {
  try {
    const onlineUsers = req.app.get("onlineUsers");
    const users = await userService.getUsersWithStatus(onlineUsers);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ===== GET RECENT ACTIVITY ===== */
async function getRecentActivity(req, res) {
  try {
    const activity = await userService.getRecentActivity(20);
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


/* ===== EXPORT SEMUA ===== */
module.exports = {
  login,
  getUsers,
  createUser,
  updateUserRegion,
  updateUser,
  deleteUser,
  updateUserStatus,
  updatePassword,
  getUserLogs,
  getUserSummary,
  getUsersWithStatus,
  getRecentActivity
};
