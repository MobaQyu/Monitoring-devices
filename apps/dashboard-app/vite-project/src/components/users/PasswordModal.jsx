import { useState } from "react";
import { authApi } from "../../services/apiService";

export default function PasswordModal({ open, onClose, user }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open || !user) return null;

  const handleSave = async () => {
    setError("");

    if (!password || !confirm) {
      return setError("Password wajib diisi");
    }

    if (password.length < 6) {
      return setError("Password minimal 6 karakter");
    }

    if (password !== confirm) {
      return setError("Password tidak sama");
    }

    try {
      setSaving(true);

      await authApi.put(`/users/${user.id}/password`, {
        password,
      });

      alert("Password berhasil diupdate");
      onClose();
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || "Gagal update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3>Update Password</h3>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          User: <b>{user.username}</b>
        </p>

        {error && <div style={errorBox}>{error}</div>}

        <input
          type="password"
          placeholder="Password baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Konfirmasi password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  width: 400,
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: 8,
  borderRadius: 6,
  marginBottom: 8,
};
