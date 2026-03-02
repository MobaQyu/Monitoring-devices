const roleService = require("./role.service");

async function getRoles(req, res) {
  try {
    const roles = await roleService.getRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPermissions(req, res) {
  try {
    const permissions = await roleService.getPermissions();
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createRole(req, res) {
  const { name, description, permissions } = req.body;

  if (!name || !permissions || permissions.length === 0) {
    return res.status(400).json({ error: "Role name dan permissions wajib diisi" });
  }

  try {
    const result = await roleService.createRole({ name, description, permissions });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateRole(req, res) {
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  if (!name || !permissions || permissions.length === 0) {
    return res.status(400).json({
      error: "Name dan permissions wajib diisi"
    });
  }

  try {
    const result = await roleService.updateRole(id, {
      name,
      description,
      permissions
    });

    res.json({ message: "Role berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getRolePermissions(req, res) {
  const { id } = req.params;

  try {
    const data = await roleService.getRolePermissions(id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteRole(req, res) {
  const { id } = req.params;

  try {
    await roleService.deleteRole(id);
    res.json({ message: "Role berhasil dihapus" });
  } catch (err) {
    res.status(400).json({ error: err.toString() });
  }
}

module.exports = {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  getRolePermissions,
  deleteRole
};
