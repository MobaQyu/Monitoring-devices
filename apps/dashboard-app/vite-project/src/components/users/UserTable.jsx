import "./users.css";

export default function UserTable({
  users = [],
  regionMap = {},
  onEdit,
  onDelete,
  currentRole = "super_admin",
}) {
  const canManageUser = currentRole === "super_admin";

  return (
    <div className="user-table-wrapper">
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Regional</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="empty">
                Belum ada user
              </td>
            </tr>
          )}

          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email || "-"}</td>
              <td>
                <span className={`role role-${u.role}`}>
                  {u.role}
                </span>
              </td>
              <td>
  {u.role === "super_admin"
    ? "-"
    : regionMap[u.region_id] || "-"}
</td>

              <td>
                <span
                  className={`status ${
                    u.status === "active" ? "active" : "disabled"
                  }`}
                >
                  {u.status}
                </span>
              </td>
              <td>
                {canManageUser ? (
                  <div className="actions">
                    <button onClick={() => onEdit(u)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => onDelete(u.id)}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <span className="text-muted">No Access</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
