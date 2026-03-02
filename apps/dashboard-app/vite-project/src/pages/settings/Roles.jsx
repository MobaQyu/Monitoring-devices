import { useEffect, useState } from "react";
import { authApi } from "../../services/apiService";
import RoleModal from "../../components/users/RoleModal";
import "../../styles/setting.css";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRole, setSelectedRole] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    try {
      const data = await authApi.get("/roles");
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed fetch roles", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedRole(null);
    setShowModal(true);
  }

  function openEditModal(role) {
    setModalMode("edit");
    setSelectedRole(role);
    setShowModal(true);
  }

  async function handleDelete(role) {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus role "${role.name}"?`
    );

    if (!confirmDelete) return;

    try {
      await authApi.delete(`/roles/${role.id}`);
      fetchRoles();
    } catch (err) {
      alert(err.message || "Gagal menghapus role");
    }
  }

  const filteredRoles = roles.filter((role) => {
    const matchSearch = (role.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchFilter = filter ? role.name === filter : true;

    return matchSearch && matchFilter;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-title">Roles Management</div>
        <button onClick={openCreateModal}>
          + Create Role
        </button>
      </div>

      <div className="table-toolbar">
        <input
          placeholder="Search role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created</th>
              <th style={{ width: "160px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: 20 }}>
                  No roles found
                </td>
              </tr>
            ) : (
              filteredRoles.map((role) => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  <td>{role.description}</td>
                  <td>
                    {new Date(role.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openEditModal(role)}>
                        Edit
                      </button>
                      <button
                        className="delete"
                        onClick={() => handleDelete(role)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RoleModal
        open={showModal}
        mode={modalMode}
        role={selectedRole}
        onClose={() => setShowModal(false)}
        onSaved={() => {
          setShowModal(false);
          fetchRoles();
        }}
      />
    </div>
  );
}