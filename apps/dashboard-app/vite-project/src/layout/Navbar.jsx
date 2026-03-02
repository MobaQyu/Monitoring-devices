import { useEffect, useState, useRef, useMemo } from "react";
import { User, Bell, Sun, Moon, LogOut } from "lucide-react";
import { monitorSocket } from "../services/monitorSocket";
import { useTheme } from "../context/ThemeContext";
import { logout, getUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const [time, setTime] = useState(new Date());
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const user = getUser();

  /* ================= LOGOUT ================= */
  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  /* ================= CLOCK ================= */
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= SOCKET ALERT ================= */
  useEffect(() => {
    const handler = (payload) => {
      if (
        payload.status === "warning" ||
        payload.status === "offline" ||
        payload.status === "critical"
      ) {
        setAlerts((prev) => {
          const existing = prev.find(
            (a) => a.deviceId === payload.deviceId
          );

          if (existing) {
            return prev.map((a) =>
              a.deviceId === payload.deviceId
                ? {
                    ...a,
                    status: payload.status,
                    latency: payload.latency,
                    time: Date.now(),
                  }
                : a
            );
          }

          return [
            ...prev,
            {
              deviceId: payload.deviceId,
              status: payload.status,
              latency: payload.latency,
              time: Date.now(),
            },
          ];
        });
      }

      if (payload.status === "online") {
        setAlerts((prev) =>
          prev.filter((a) => a.deviceId !== payload.deviceId)
        );
      }
    };

    monitorSocket.on("device:update", handler);
    return () =>
      monitorSocket.off("device:update", handler);
  }, []);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const close = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () =>
      document.removeEventListener("mousedown", close);
  }, []);

  /* ================= SORT ALERT ================= */
  const sortedAlerts = useMemo(() => {
    const priority = { critical: 3, warning: 2, offline: 1 };
    return [...alerts].sort(
      (a, b) => priority[b.status] - priority[a.status]
    );
  }, [alerts]);

  const hasCritical = alerts.some(
    (a) => a.status === "critical"
  );

  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = time.toLocaleTimeString();

  return (
    <div className="navbar">
      {/* LEFT */}
      <div className="navbar-left">
        <span className="navbar-title">
          Network Monitor
        </span>
      </div>

      {/* CENTER */}
      <div className="navbar-center">
        <div className="navbar-time">{timeStr}</div>
        <div className="navbar-date">{dateStr}</div>
      </div>

      {/* RIGHT */}
      <div className="navbar-right" ref={bellRef}>
        {/* Notification */}
        <div
          className="nav-icon"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Bell size={18} />
          {alerts.length > 0 && (
            <span
              className={`badge ${
                hasCritical ? "critical" : ""
              }`}
            >
              {alerts.length}
            </span>
          )}
        </div>

        {open && (
          <div className="dropdown">
            <div className="dropdown-header">
              Notifications
              {alerts.length > 0 && (
                <button
                  className="clear-btn"
                  onClick={() => setAlerts([])}
                >
                  Clear All
                </button>
              )}
            </div>

            {sortedAlerts.length === 0 && (
              <div className="dropdown-empty">
                Tidak ada peringatan
              </div>
            )}

            {sortedAlerts.map((a) => (
              <div
                key={a.deviceId}
                className={`dropdown-item ${a.status}`}
              >
                <div className="item-title">
                  Device #{a.devi}
                </div>

                <div className="item-meta">
                  {a.status === "critical"
                    ? "🚨 Critical"
                    : a.status === "warning"
                    ? "⚠ Warning"
                    : "🔴 Offline"}

                  {a.latency != null &&
                    ` • ${a.latency} ms`}
                </div>

                <div className="item-time">
                  {new Date(a.time).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Theme Toggle */}
        <button
          className="nav-icon-button"
          onClick={() =>
            setTheme(
              theme === "light" ? "dark" : "light"
            )
          }
        >
          {theme === "light" ? (
            <Moon size={18} />
          ) : (
            <Sun size={18} />
          )}
        </button>

        {/* User */}
        <div className="nav-user">
          <User size={18} />
          <span className="username">
            {user?.username || "User"}
          </span>
          <LogOut
            size={18}
            className="logout-icon"
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}