import { useEffect, useState, useCallback } from "react";
import { User, Bell, Sun, Moon, LogOut, Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAlerts } from "../context/AlertContext";
import { logout, getUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {

  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { theme, setTheme } = useTheme();
  const { alerts } = useAlerts();

  const navigate = useNavigate();
  const user = getUser();

  /* ================= LOGOUT ================= */

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [navigate]);

  /* ================= FULLSCREEN ================= */

  const toggleFullscreen = useCallback(() => {

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }

  }, []);

  /* ================= CLOCK ================= */

  useEffect(() => {

    const updateClock = () => setTime(new Date());

    updateClock();

    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);

  }, []);

  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const timeStr = time.toLocaleTimeString();

  return (
    <div className="navbar">

      {/* LEFT */}
      <div className="navbar-left">
        <span className="navbar-title">Network Monitor</span>
      </div>

      {/* CENTER */}
      <div className="navbar-center">
        <div className="navbar-time">{timeStr}</div>
        <div className="navbar-date">{dateStr}</div>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">

        {/* ALERT COUNTER */}
        <div
          className="nav-icon"
         onClick={() =>
  navigate("/", {
    state: { scrollTo: "alerts" }
  })
}
        >
          <Bell size={20} />

          {alerts.length > 0 && (
            <span className="badge">
              {alerts.length}
            </span>
          )}

        </div>

        {/* FULLSCREEN */}
        <button
          className="nav-icon-button"
          onClick={toggleFullscreen}
        >
          {isFullscreen
            ? <Minimize2 size={18} />
            : <Maximize2 size={18} />}
        </button>

        {/* THEME */}
        <button
          className="nav-icon-button"
          onClick={() =>
            setTheme(theme === "light" ? "dark" : "light")
          }
        >
          {theme === "light"
            ? <Moon size={18} />
            : <Sun size={18} />}
        </button>

        {/* USER */}
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