import { io } from "socket.io-client";
import { getToken, logout, isTokenExpired } from "./authService";

const SOCKET_URL = "http://localhost:3003";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false, // ⬅️ penting
});

/* ================= CONNECT SOCKET ================= */

export function connectSocket() {
  const token = getToken();

  // 🔐 token tidak ada / expired
  if (!token || isTokenExpired(token)) {
    logout();
    window.location.href = "/login";
    return;
  }

  // kirim token ke socket backend
  socket.auth = { token };
  socket.connect();
}

/* ================= HANDLE AUTH ERROR ================= */

socket.on("connect_error", (err) => {
  console.error("Socket error:", err.message);

  if (
    err.message === "Unauthorized" ||
    err.message === "jwt expired"
  ) {
    logout();
    window.location.href = "/login";
  }
});


socket.on("forceLogout", (data) => {
  alert(data.message || "Account disabled");

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/login";
});
