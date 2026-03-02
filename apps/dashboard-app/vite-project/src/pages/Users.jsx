import { useEffect, useState, useMemo } from "react";
import { authApi } from "../services/apiService";
import UserModal from "../components/users/UserModal";
import PasswordModal from "../components/users/PasswordModal";
import "../styles/Users.css";
import { socket, connectSocket } from "../services/socket";
import {
  UserRoundCog,
  UserLock,
  UserX,
  UserMinus,
  Users as UsersIcon,
  UserCheck,
  Wifi
} from "lucide-react";
import AddRoleModal from "../components/users/RoleModal";
import AddRegionModal from "../components/users/RegionModal";



export default function Users() {

  const currentUser =
    JSON.parse(localStorage.getItem("user")) || {};

  const canManage =
    currentUser.permissions?.includes("manage_user");

  /* ================= STATE ================= */

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);



  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [activityPage, setActivityPage] = useState(1);
  const activityLimit = 10;


  /* ================= FETCH ================= */

  const fetchUsers = async () => {
    const data = await authApi.get("/users/with-status");

    setUsers(
      data.map(u => ({
        ...u,
        account_status: u.account_status || "active",
        is_online: u.is_online ?? false
      }))
    );
  };

  const fetchRoles = async () => {
    const data = await authApi.get("/roles");
    setRoles(data);
  };

  const fetchRegions = async () => {
    const data = await authApi.get("/regions");
    setRegions(data);
  };

  const fetchSummary = async () => {
    const data = await authApi.get("/users/summary");
    setSummary(data);
  };

  const fetchActivity = async () => {
    const data = await authApi.get("/users/activity?limit=10");
    setActivities(data);
  };

  const reloadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchUsers(),
      fetchSummary(),
      fetchActivity()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
    fetchRoles();
    fetchRegions();
  }, []);

  /* ================= SOCKET ================= */
  useEffect(() => {

  connectSocket();

  const handler = (payload) => {
  const onlineIds = payload.users.map(u => Number(u.id));

  setUsers(currentUsers => {
    if (!currentUsers.length) return currentUsers;

    return currentUsers.map(user => ({
      ...user,
      is_online: onlineIds.includes(user.id)
    }));
  });

  setSummary(prev => ({
    ...prev,
    online_users: payload.total
  }));
};


  socket.on("onlineUsersUpdate", handler);

  return () => {
    socket.off("onlineUsersUpdate", handler);
  };
}, []); // ⬅️ kosong. JANGAN pakai dependency

  /* ================= DELETE ================= */

  const handleDelete = async (user) => {
    if (user.id === currentUser.id) return;

    if (!window.confirm(`Delete ${user.username}?`)) return;

    await authApi.delete(`/users/${user.id}`);
    reloadAll();
  };

  /* ================= STATUS ================= */

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser.id) return;

    const nextStatus =
      user.account_status === "active"
        ? "suspended"
        : "active";

    await authApi.patch(`/users/${user.id}/status`, {
      account_status: nextStatus,
    });

    reloadAll();
  };

  /* ================= FILTER ================= */

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        u.username.toLowerCase().includes(keyword) ||
        (u.email || "").toLowerCase().includes(keyword);

      const matchRole =
        roleFilter === "all" ||
        String(u.role_id) === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const totalPage =
    Math.ceil(filteredUsers.length / limit);

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * limit,
    page * limit
  );

  const regionMap = Object.fromEntries(
    regions.map(r => [r.id, r.name])
  );

  const timeAgo = (date) => {
    const diff = Math.floor(
      (Date.now() - date) / 1000
    );

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
  const totalActivityPage = Math.ceil(
  activities.length / activityLimit
);

const paginatedActivities = activities.slice(
  (activityPage - 1) * activityLimit,
  activityPage * activityLimit
);


return (
  <div className="users-page">

    {/* ================= HEADER ================= */}
   <div className="users-header">
  <h2>User Management</h2>

  <div className="header-actions">
    <button
      className="btn primary"
      onClick={() => {
        setEditingUser(null);
        setOpen(true);
      }}
    >
      + Add User
    </button>

    <button
      className="btn secondary"
      onClick={() => setShowRoleModal(true)}
    >
      + Add Role
    </button>

    <button
      className="btn secondary"
      onClick={() => setShowRegionModal(true)}
    >
      + Add Region
    </button>
  </div>
</div>


    {/* ================= SUMMARY ================= */}
    <div className="summary-cards">

      <div className="summary-card blue">
        <UsersIcon size={20} />
        <span>Total</span>
        <p>{summary.total_users || 0}</p>
      </div>

      <div className="summary-card green">
        <UserCheck size={20} />
        <span>Active</span>
        <p>{summary.active_users || 0}</p>
      </div>

      <div className="summary-card orange">
        <UserX size={20} />
        <span>Suspended</span>
        <p>{summary.suspended_users || 0}</p>
      </div>

      <div className="summary-card purple">
        <Wifi size={20} />
        <span>Online</span>
        <p>{summary.online_users || 0}</p>
      </div>

    </div>

    {/* ================= FILTER ================= */}
    <div className="users-filter">
      <input
        placeholder="Search user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        <option value="all">All Roles</option>
        {roles.map(r => (
          <option key={r.id} value={String(r.id)}>
            {r.name}
          </option>
        ))}
      </select>
    </div>

    {/* ================= TABLE ================= */}
    <div className="table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Regions</th>
            <th>Status</th>
            <th>Online</th>
            <th>Last Login</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
  {paginatedUsers.map((u, i) => (
    <tr key={u.id}>
      <td>{(page - 1) * limit + i + 1}</td>

      <td>{u.username}</td>

      <td>{u.email || "-"}</td>

      <td>{u.role_name}</td>

      <td>
        {u.regions?.length
          ? u.regions.map(id => regionMap[id]).join(", ")
          : "-"}
      </td>

    <td>
  <span
    className={`status-pill ${u.account_status}`}
  >
    {u.account_status}
  </span>
</td>

<td>
  <span
    className={`status-pill ${u.is_online ? "online" : "offline"}`}
  >
    {u.is_online ? "Online" : "Offline"}
  </span>
</td>


      {/* LAST LOGIN */}
      <td>
        {u.last_login ? timeAgo(u.last_login) : "-"}
      </td>

      {/* ACTION */}
      <td className="actions">
        <button onClick={() => {
          setEditingUser(u);
          setOpen(true);
        }}>
          <UserRoundCog size={16} />
        </button>

        <button onClick={() => setPasswordUser(u)}>
          <UserLock size={16} />
        </button>

        <button onClick={() => handleToggleStatus(u)}>
          <UserX size={16} />
        </button>

        <button
          className="danger"
          onClick={() => handleDelete(u)}
        >
          <UserMinus size={16} />
        </button>
      </td>
    </tr>
  ))}
</tbody>

      </table>
      <div className="table-pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Prev
        </button>

        <span>
          Page {page} / {totalPage}
        </span>

        <button
          disabled={page === totalPage}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
</div>


    </div>

    {/* ================= RECENT ACTIVITY ================= */}
          <div className="users-activity-section">
   <h3>Recent Activity</h3>
            <div className="activity-table-wrapper">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedActivities.map((act, i) => (
                    <tr key={act.id}>
                      <td>{(activityPage - 1) * activityLimit + i + 1}</td>
                      <td>{act.username}</td>
                      <td>{act.action}</td>
                      <td>{timeAgo(act.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
		<div className="activity-pagination">
        <button
          disabled={activityPage === 1}
          onClick={() => setActivityPage(p => p - 1)}
        >
          Prev
        </button>
        <button
          disabled={activityPage === totalActivityPage}
          onClick={() => setActivityPage(p => p + 1)}
        >
          Next
        </button>

      </div>
    </div>
 
        <span>
          Page {activityPage} / {totalActivityPage}
        </span>

    <UserModal
      open={open}
      user={editingUser}
      onClose={() => setOpen(false)}
      onSaved={reloadAll}
    />

    <PasswordModal
      open={!!passwordUser}
      user={passwordUser}
      onClose={() => setPasswordUser(null)}
    />
    <AddRoleModal
      open={showRoleModal}
      onClose={() => setShowRoleModal(false)}
      onSaved={async () => {
        setShowRoleModal(false);
        await fetchRoles();
      }}
    />

    <AddRegionModal
      open={showRegionModal}
      onClose={() => setShowRegionModal(false)}
      onSaved={async () => {
        setShowRegionModal(false);
        await fetchRegions();
      }}
    />
  </div>
);
}
 