import { useEffect, useState } from "react";
import { authApi } from "../../services/apiService";

export default function UserModal({ open, onClose, user, onSaved }) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role_id: "",
    regions: []
  });

  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState("");


  // ================= LOAD ROLES & REGIONS =================
  useEffect(() => {
    if (open) {
      loadRoles();
      loadRegions();
    }
  }, [open]);

  const loadRoles = async () => {
    try {
      const data = await authApi.get("/roles");
      setRoles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRegions = async () => {
    try {
      const data = await authApi.get("/regions");
      setRegions(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= PREFILL EDIT MODE =================
  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        full_name: user.full_name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        role_id: user.role_id || "",
        regions: user.regions || []
      });
    } else {
      setForm({
        username: "",
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role_id: "",
        regions: []
      });
    }
  }, [user]);

  if (!open) return null;

  // ================= REGION TOGGLE =================
  const toggleRegion = (id) => {
    setForm((prev) => {
      if (prev.regions.includes(id)) {
        return {
          ...prev,
          regions: prev.regions.filter((r) => r !== id)
        };
      } else {
        return {
          ...prev,
          regions: [...prev.regions, id]
        };
      }
    });
  };

  // ================= VALIDATION =================
  const validate = () => {
    if (!form.username || !form.email || !form.role_id) {
      return "Semua field wajib diisi";
    }

    if (!user) {
      if (!form.password || form.password.length < 6) {
        return "Password minimal 6 karakter";
      }
      if (form.password !== form.confirmPassword) {
        return "Password tidak sama";
      }
    }

    return null;
  };

  // ================= SAVE =================
  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (user) {
        // UPDATE USER
        await authApi.put(`/users/${user.id}`, {
          username: form.username,
          full_name: form.full_name,
          email: form.email,
          role_id: Number(form.role_id),
          account_status: user.account_status,
          regions: form.regions 
        });

      } else {
        // CREATE USER
        await authApi.post("/users", {
          username: form.username,
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role_id: Number(form.role_id),
          regions: form.regions // kirim array regions
        });
      }

      onClose();
      onSaved();

    } catch (e) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };




 return (
  <>
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ marginBottom: 20 }}>
          {user ? "Edit User" : "Add User"}
        </h2>

        {/* ================= BASIC INFO ================= */}
        <section style={section}>
          <h4>Basic Information</h4>

          <div style={grid}>
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
            />

            <input
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            {!user && (
              <>
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword: e.target.value
                    })
                  }
                />
              </>
            )}
          </div>
        </section>

        {/* ================= ROLE ================= */}
        <section style={section}>
          <h4>Role</h4>

          <select
            value={form.role_id}
            onChange={(e) => {
              setForm({
                ...form,
                role_id: e.target.value,
              });
            }}
          >
            <option value="">-- Pilih Role --</option>

            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </section>

        {/* ================= REGION ================= */}
        <section style={section}>
          <h4>Region Access</h4>
          <div style={checkboxContainer}>
            {regions.map((region) => (
              <label key={region.id} style={checkboxItem}>
                <input
                  type="checkbox"
                  checked={form.regions.includes(region.id)}
                  onChange={() => toggleRegion(region.id)}
                />
                {region.name}
              </label>
            ))}
          </div>
        </section>

        {error && (
          <div style={{ color: "red", marginBottom: 10 }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: "right", marginTop: 20 }}>
          <button onClick={onClose} disabled={saving}>
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ marginLeft: 10 }}
          >
            {saving ? "Saving..." : "Save User"}
          </button>
        </div>
      </div>
    </div>
  </>
);
}

// ================= STYLE =================

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const modal = {
  background: "white",
  padding: 32,
  borderRadius: 16,
  width: 720,
  maxHeight: "90vh",
  overflowY: "auto"
};

const section = {
  marginBottom: 24
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16
};

const checkboxContainer = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12
};

const checkboxItem = {
  display: "flex",
  alignItems: "center",
  gap: 8
};
