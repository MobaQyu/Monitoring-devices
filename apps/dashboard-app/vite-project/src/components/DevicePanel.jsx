import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { monApi, authApi } from "../services/apiService";
import { getRegionId } from "../services/authService";
import { can } from "../utils/can";
import "../styles/panel.css"

/* ================= IP VALIDATION ================= */


const ipRegex =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export default function DevicePanel({
  mode = "add",
  data = null,
  onClose,
  onSaved,
}) {
  /* ================= USER CONTEXT ================= */

  const user = JSON.parse(localStorage.getItem("user"));
  const userRegions = user?.regions || [];
  const canViewAllRegion = can("view_all_region");
  const canAssignAllRegion = can("assign_device_all_region");
  const userRegionId = getRegionId();

  const [deviceTypes, setDeviceTypes] = useState([]);
  /* ================= STATE ================= */
  const [coreDevices, setCoreDevices] = useState([]);
  const [regions, setRegions] = useState([]);
  const [isCore, setIsCore] = useState(data?.is_core || 0);
  const [parentId, setParentId] = useState(data?.parent_device_id || "");

  const [form, setForm] = useState({
  name: data?.name ?? "",
  ip: data?.ip ?? "",
  device_type_id: data?.device_type_id ?? "",
  region_id:
    data?.region_id ??
    (canViewAllRegion ? "" : userRegions[0] || ""),
  iface_index: data?.iface_index ?? 1,
  lat: data?.lat ?? -6.2,
  lng: data?.lng ?? 106.8,

  // 🔥 THRESHOLDS
  latency_warning_ms: data?.latency_warning_ms ?? 200,
  latency_critical_ms: data?.latency_critical_ms ?? 500,
  traffic_warning_percent: data?.traffic_warning_percent ?? 70,
  traffic_critical_percent: data?.traffic_critical_percent ?? 90,
});
  const [ipError, setIpError] = useState("");
  const [submitError, setSubmitError] = useState("");

  /* ================= LOAD DEVICES ================= */ 
  useEffect(() => {
  async function loadDeviceTypes() {
    try {
      const data = await monApi.get("/device-types");
      setDeviceTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load device types error:", err);
      setDeviceTypes([]);
    }
  }

  loadDeviceTypes();
}, []);
  /* ================= LOAD CORE DEVICES ================= */
  useEffect(() => {
  async function loadCoreDevices() {
    try {
      const result = await monApi.get("/devices?limit=9999");
      const all = Array.isArray(result.data) ? result.data : [];

      const cores = all.filter((d) => d.is_core === 1);

      setCoreDevices(cores);
    } catch {
      setCoreDevices([]);
    }
  }

  loadCoreDevices();
}, []);
  /* ================= LOAD REGIONS ================= */

  useEffect(() => {
    async function loadRegions() {
      try {
        const data = await authApi.get("/regions");
        setRegions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Gagal load regions", err);
        setRegions([]);
      }
    }

    loadRegions();
  }, []);

  /* ================= AVAILABLE REGIONS ================= */

  const availableRegions = canViewAllRegion
    ? regions
    : regions.filter((r) => userRegions.includes(r.id));

  /* ================= MAP SETUP ================= */

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = L.map("device-map").setView(
      [form.lat, form.lng],
      6
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap",
      }
    ).addTo(mapRef.current);

    markerRef.current = L.marker([
      form.lat,
      form.lng,
    ]).addTo(mapRef.current);

    mapRef.current.on("click", (e) => {
      markerRef.current.setLatLng(e.latlng);
      setForm((prev) => ({
        ...prev,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      }));
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /* ===== FIX LEAFLET SIZE WHEN MODAL OPEN ===== */

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, []);

  /* ================= SUBMIT ================= */

  const submit = async () => {
    setSubmitError("");

    if (!form.name.trim()) {
      return setSubmitError("Nama device wajib diisi");
    }

    if (!ipRegex.test(form.ip)) {
      return setSubmitError("Format IP address tidak valid");
    }

    if (!form.region_id) {
      return setSubmitError("Region wajib dipilih");
    }

  const payload = {
  name: form.name.trim(),
  ip: form.ip.trim(),
  device_type_id: Number(form.device_type_id),
  region_id: Number(form.region_id),
  lat: form.lat,
  lng: form.lng,
  iface_index: form.iface_index,
  is_core: isCore,
  parent_device_id: isCore ? null : parentId || null,
  latency_warning_ms: form.latency_warning_ms,
  latency_critical_ms: form.latency_critical_ms,
  traffic_warning_percent: form.traffic_warning_percent,
  traffic_critical_percent: form.traffic_critical_percent,
};

    try {
      if (mode === "edit") {
        await monApi.put(`/devices/${data.id}`, payload);
      } else {
        await monApi.post("/devices", payload);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setSubmitError(
        err.message || "Gagal menyimpan device"
      );
    }
  };

  /* ================= UI ================= */

 return (
  <div className="device-overlay" onClick={onClose}>
    <div
      className="device-modal"
      onClick={(e) => e.stopPropagation()}
    >

      {/* HEADER */}
      <div className="device-modal-header">
        <div>
          <h2>
            {mode === "edit" ? "Edit Device" : "Add Device"}
          </h2>
          <p>
            Configure device network and monitoring settings
          </p>
        </div>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="device-modal-body">

        {/* LEFT SIDE */}
        <div className="device-form">

          <div className="form-group">
            <label>Device Name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Enter device name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>IP Address</label>
              <input
                value={form.ip}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({ ...form, ip: value });

                  setIpError(
                    ipRegex.test(value) || value === ""
                      ? ""
                      : "Format IP tidak valid"
                  );
                }}
                placeholder="192.168.1.1"
              />
              {ipError && (
                <small className="error-text">
                  {ipError}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>SNMP Index</label>
              <input
                type="number"
                min={1}
                value={form.iface_index}
                onChange={(e) =>
                  setForm({
                    ...form,
                    iface_index: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Device Type</label>
              <select
                value={form.device_type_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    device_type_id: Number(e.target.value),
                  })
                }
              >
                <option value="">Select device type</option>
                {deviceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Region</label>
              <select
                value={form.region_id}
                disabled={!canAssignAllRegion && !canViewAllRegion}
                onChange={(e) =>
                  setForm({
                    ...form,
                    region_id: Number(e.target.value),
                  })
                }
              >
                {canViewAllRegion && (
                  <option value="">Select region</option>
                )}
                {availableRegions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Device Pusat */}
<div className="form-group">
  <label>
    <input
      type="checkbox"
      checked={isCore === 1}
      onChange={(e) => {
        const checked = e.target.checked;
        setIsCore(checked ? 1 : 0);

        if (checked) {
          setParentId("");
        }
      }}
    />
    Jadikan Device Pusat
  </label>
</div>

{/* Parent Device */}
<div className="form-group">
  <label>Parent Device</label>
  <select
    value={parentId}
    onChange={(e) => setParentId(e.target.value)}
    disabled={isCore === 1}
  >
    <option value="">None</option>
    {coreDevices
      .filter((d) => d.id !== data?.id) // jangan pilih dirinya sendiri
      .map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
  </select>
</div>
              <div className="form-group">
    <label>Latency Warning (ms)</label>
    <input
      type="number"
      value={form.latency_warning_ms}
      onChange={(e) =>
        setForm({
          ...form,
          latency_warning_ms: Number(e.target.value),
        })
      }
    />
  </div>

  <div className="form-group">
    <label>Latency Critical (ms)</label>
    <input
      type="number"
      value={form.latency_critical_ms}
      onChange={(e) =>
        setForm({
          ...form,
          latency_critical_ms: Number(e.target.value),
        })
      }
    />
  </div>

</div>

<div className="form-row">

  <div className="form-group">
    <label>Traffic Warning (%)</label>
    <input
      type="number"
      value={form.traffic_warning_percent}
      onChange={(e) =>
        setForm({
          ...form,
          traffic_warning_percent: Number(e.target.value),
        })
      }
    />
  </div>

  <div className="form-group">
    <label>Traffic Critical (%)</label>
    <input
      type="number"
      value={form.traffic_critical_percent}
      onChange={(e) =>
        setForm({
          ...form,
          traffic_critical_percent: Number(e.target.value),
        })
      }
    />
  </div>
</div>
        </div>

        {/* RIGHT SIDE - MAP */}
        <div className="device-map-section">
          <div className="map-header">
            Select Location
          </div>

          <div id="device-map" className="device-map" />

          <div className="map-coords">
            Lat: {form.lat.toFixed(4)} | Lng:{" "}
            {form.lng.toFixed(4)}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="device-modal-footer">
        {submitError && (
          <div className="error-text">
            ⚠ {submitError}
          </div>
        )}

        <div className="footer-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>

          <button className="btn-primary" onClick={submit}>
            {mode === "edit" ? "Update Device" : "Create Device"}
          </button>
        </div>
      </div>

    </div>
  </div>
);
}