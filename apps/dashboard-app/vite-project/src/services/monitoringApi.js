const API = "http://localhost:3001/api/devices";

// helper ambil token
function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

/* ================= GET ================= */

export async function getDevices() {
  const r = await fetch(API, {
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!r.ok) {
    throw new Error("Gagal ambil devices");
  }

  return r.json();
}

/* ================= CREATE ================= */

export async function createDevice(data) {
  const r = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  const result = await r.json();

  if (!r.ok) {
    throw new Error(result.error || result.message || "Gagal create device");
  }

  return result;
}

/* ================= UPDATE ================= */

export async function updateDevice(id, data) {
  const r = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  const result = await r.json();

  if (!r.ok) {
    throw new Error(result.error || "Gagal update device");
  }

  return result;
}

/* ================= DELETE ================= */

export async function deleteDevice(id) {
  const r = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  const result = await r.json();

  if (!r.ok) {
    throw new Error(result.error || "Gagal hapus device");
  }

  return result;
}

/* ================= REGIONS ================= */
export async function getRegions() {
  const r = await fetch("http://localhost:3003/api/regions", {
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!r.ok) throw new Error("Gagal ambil regions");

  return r.json();
}
