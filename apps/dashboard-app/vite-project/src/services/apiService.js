import { getToken, logout, isTokenExpired } from "./authService";

/* ===== API BASE ===== */
const AUTH_BASE = "http://localhost:3003/api"; // user-service
const MON_BASE  = "http://localhost:3001/api"; // monitoring-service

/* ===== GENERIC REQUEST ===== */
async function request(base, path, options = {}) {
  const token = getToken();

  // 🔐 PRE-CHECK TOKEN EXPIRED
  if (token && isTokenExpired(token)) {
    logout();
    window.location.href = "/login";
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
  });

  // 🔴 AUTO HANDLE 401
  if (res.status === 401) {
    logout();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (res.status === 204) return null;

  return res.json();
}

/* ================= AUTH API (USER SERVICE) ================= */

export const authApi = {
  login: (data) =>
    request(AUTH_BASE, "/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (path) => request(AUTH_BASE, path),
  post: (path, body) =>
    request(AUTH_BASE, path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: (path, body) =>
    request(AUTH_BASE, path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: (path, body) =>
    request(AUTH_BASE, path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (path) =>
    request(AUTH_BASE, path, {
      method: "DELETE",
    }),
    
};

/* ================= MONITORING API ================= */

export const monApi = {
  get: (path) => request(MON_BASE, path),

  post: (path, body) =>
    request(MON_BASE, path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (path, body) =>
    request(MON_BASE, path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (path) =>
    request(MON_BASE, path, {
      method: "DELETE",
    }),
};
