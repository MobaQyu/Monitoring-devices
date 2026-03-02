import { useEffect, useState } from "react";
import { authApi } from "../../services/apiService";
import "../../styles/modal.css";

export default function RoleModal({
  open,
  mode = "create",      // "create" | "edit"
  role = null,          // role object saat edit
  onClose,
  onSaved,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    loadPermissions();

    if (mode === "edit" && role) {
      setName(role.name || "");
      setDescription(role.description || "");
      loadRolePermissions(role.id);
    } else {
      resetForm();
    }
  }, [open, mode, role]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedPermissions([]);
  };

  const loadPermissions = async () => {
    try {
      const data = await authApi.get("/roles/permissions");
      setPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const data = await authApi.get(`/roles/${roleId}/permissions`);
      const ids = data.map((p) => p.id);
      setSelectedPermissions(ids);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (id) => {
    setSelectedPermissions((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name || selectedPermissions.length === 0) {
      alert("Nama role dan minimal 1 permission wajib diisi");
      return;
    }

    try {
      setSaving(true);

      if (mode === "create") {
        await authApi.post("/roles", {
          name,
          description,
          permissions: selectedPermissions,
        });
      } else {
        await authApi.put(`/roles/${role.id}`, {
          name,
          description,
          permissions: selectedPermissions,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      alert(err.message || "Gagal menyimpan role");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="role-modal">
        <h3>{mode === "create" ? "Create Role" : "Edit Role"}</h3>

        <div className="form-row">
          <input
            placeholder="Role name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="permission-section">
          <h4>Permissions</h4>

          <div className="permission-grid">
            {permissions.map((perm) => (
              <label key={perm.id} className="permission-item">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                />
                <span>{perm.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
