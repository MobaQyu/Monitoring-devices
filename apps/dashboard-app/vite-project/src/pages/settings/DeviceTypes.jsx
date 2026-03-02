import { useEffect, useState } from "react";
import { monApi } from "../../services/apiService";
import { ICON_LIBRARY, DefaultIcon } from "../../utils/iconLibrary";
import "../../styles/setting.css";

export default function DeviceTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", icon_key: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTypes();
  }, []);

  async function fetchTypes() {
    try {
      const data = await monApi.get("/device-types");
      setTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed fetch device types", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", icon_key: "" });
    setShowForm(true);
  }

  function openEdit(type) {
    setEditing(type.id);
    setForm({
      name: type.name,
      icon_key: type.icon_key,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ name: "", icon_key: "" });
    setEditing(null);
    setShowForm(false);
    setError("");
  }

  async function handleSave() {
    try {
      setError("");

      if (!form.name || !form.icon_key) {
        return setError("Nama dan icon wajib diisi");
      }

      if (editing) {
        await monApi.put(`/device-types/${editing}`, form);
      } else {
        await monApi.post("/device-types", form);
      }

      resetForm();
      fetchTypes();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal simpan");
    }
  }

  async function handleDelete(type) {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus device type "${type.name}"?`
    );

    if (!confirmDelete) return;

    try {
      await monApi.delete(`/device-types/${type.id}`);
      fetchTypes();
    } catch (err) {
      alert(err.response?.data?.error);
    }
  }

  const filtered = types.filter((type) =>
    (type.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-title">
          Device Types Management
        </div>
        <button onClick={openCreate}>
          + Create Device Type
        </button>
      </div>

      <div className="table-toolbar">
        <input
          placeholder="Search device type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ICON PICKER FORM */}
      {showForm && (
        <div className="inline-form-vertical">
          <input
            placeholder="Device Type Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <div className="icon-picker">
            {Object.entries(ICON_LIBRARY).map(
              ([key, Icon]) => (
                <div
                  key={key}
                  className={`icon-option ${
                    form.icon_key === key
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setForm({
                      ...form,
                      icon_key: key,
                    })
                  }
                >
                  <Icon size={22} />
                  <span>{key}</span>
                </div>
              )
            )}
          </div>

          <div className="form-actions">
            <button onClick={handleSave}>
              {editing ? "Update" : "Save"}
            </button>

            <button
              className="delete"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="error-text">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Icon</th>
              <th>Icon Key</th>
              <th style={{ width: "160px" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  No device types found
                </td>
              </tr>
            ) : (
              filtered.map((type) => {
                const Icon =
                  ICON_LIBRARY[type.icon_key] ||
                  DefaultIcon;

                return (
                  <tr key={type.id}>
                    <td>{type.name}</td>
                    <td>
                      <Icon size={18} />
                    </td>
                    <td>{type.icon_key}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() =>
                            openEdit(type)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete"
                          onClick={() =>
                            handleDelete(type)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}