import { useEffect, useState } from "react";
import { authApi } from "../../services/apiService";

export default function UserForm({
  form,
  setForm,
  editing,
  setValid,
  setErrorMessage,
}) {
  const [regions, setRegions] = useState([]);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  // ================= FETCH REGIONS =================
  useEffect(() => {
    authApi.get("/regions").then(setRegions).catch(console.error);
  }, []);

  // ================= VALIDATION =================
  useEffect(() => {
    const newErrors = {};

    // email format
    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      newErrors.email = "Format email tidak valid";
    }

    // password only for CREATE
    if (!editing) {
      if (!form.password || form.password.length < 6) {
        newErrors.password = "Password minimal 6 karakter";
      }

      if (form.password !== confirmPassword) {
        newErrors.confirmPassword = "Password tidak sama";
      }
    }

    setErrors(newErrors);
  }, [form.email, form.password, confirmPassword, editing]);

  // ================= FORM VALID =================
  useEffect(() => {
    const valid =
      Object.keys(errors).length === 0 &&
      form.username &&
      form.email &&
      form.role_id &&
      (
        editing || // 🔥 EDIT → region tidak wajib
        form.role_id === 3 || // super_admin role_id = 3
        form.region_id
      ) &&
      (editing || form.password);

    setValid?.(!!valid);
  }, [errors, form, editing, setValid]);

  // ================= ERROR MESSAGE =================
  useEffect(() => {
    let msg = "";

    if (!form.username) msg = "Username wajib diisi";
    else if (!form.email) msg = "Email wajib diisi";
    else if (errors.email) msg = errors.email;
    else if (!editing && errors.password) msg = errors.password;
    else if (!editing && errors.confirmPassword)
      msg = errors.confirmPassword;
    else if (
      !editing &&
      form.role_id !== 3 && // super_admin role_id = 3
      !form.region_id
    )
      msg = "Region wajib dipilih";

    setErrorMessage?.(msg);
  }, [errors, form, editing, setErrorMessage]);

  return (
    <div style={grid}>
      <Input
        label="Username"
        value={form.username}
        onChange={(v) => setForm({ ...form, username: v })}
      />

      <Input
        label="Email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        error={errors.email}
      />

      {!editing && (
        <>
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
          />
        </>
      )}

      <Select
        label="Role"
        value={form.role_id}
        onChange={(v) =>
          setForm({
            ...form,
            role_id: Number(v),
          })
        }
      />

      {form.role_id !== 3 && (
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Region (Pelindo)</label>
          <select
            value={form.region_id ?? ""}
            onChange={(e) =>
              setForm({ ...form, region_id: Number(e.target.value) })
            }
            style={input}
          >
            <option value="">-- Pilih Region --</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/* ===== INPUT ===== */
function Input({ label, value, onChange, type = "text", error }) {
  return (
    <div>
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...input,
          borderColor: error ? "#ef4444" : "#d1d5db",
        }}
      />
      {error && <small style={{ color: "#ef4444" }}>{error}</small>}
    </div>
  );
}

/* ===== ROLE SELECT ===== */
function Select({ label, value, onChange }) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={input}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="super_admin">Super Admin</option>
      </select>
    </div>
  );
}

/* ===== STYLES ===== */
const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const input = {
  width: "100%",
  padding: 8,
  borderRadius: 8,
  border: "1px solid #d1d5db",
};
