import { authApi } from "./apiService";
import { socket } from "./socket";

/* ================= LOGIN ================= */

export async function login(email, password) {
  const data = await authApi.login({ email, password });

  // simpan auth
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

/* ================= LOGOUT ================= */

export function logout() {
  localStorage.clear();

  if (socket?.connected) {
    socket.disconnect();
  }
}

/* ================= AUTH HELPERS ================= */

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function getRole() {
  const user = getUser();
  return user ? user.role : null;
}

export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;

  return !isTokenExpired(token);
}

export function getRegionId() {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.region_id ?? null;
}
 