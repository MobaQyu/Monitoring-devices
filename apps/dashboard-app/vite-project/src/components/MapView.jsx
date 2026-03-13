import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Polyline,
  Popup,
} from "react-leaflet";
import { createLeafletIcon } from "../utils/createLeafletIcon.jsx";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "../styles/map.css";
import {
  GitBranch,
  Server,
  AlertTriangle
} from "lucide-react";

/* ================= TILE ================= */

const LIGHT =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

/* ================= ICON CACHE ================= */

const iconCache = new Map();

/* ================= AUTOFIT ================= */

function AutoFit({ devices }) {
  const map = useMap();
  const prevCountRef = useRef(0);

  useEffect(() => {
    const valid = devices.filter(d => d.lat && d.lng);
    if (!valid.length) return;
    if (prevCountRef.current === valid.length) return;

    prevCountRef.current = valid.length;

    if (valid.length === 1) {
      map.setView([+valid[0].lat, +valid[0].lng], 13);
      return;
    }

    const bounds = L.latLngBounds(
      valid.map(d => [+d.lat, +d.lng])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [devices.length, map]);

  return null;
}

/* ================= MAPVIEW ================= */

export default function MapView({ devices, onSelectDevice }) {
  const { theme } = useTheme();

  const [showLines, setShowLines] = useState(false);
  const [showCoreOnly, setShowCoreOnly] = useState(false);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);

  /* ================= FILTER ================= */

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (showCoreOnly && !d.is_core) return false;
      if (showOfflineOnly && d.status !== "offline") return false;
      return true;
    });
  }, [devices, showCoreOnly, showOfflineOnly]);

  /* ================= FAST LOOKUP ================= */

  const deviceMap = useMemo(() => {
    const map = new Map();
    filteredDevices.forEach(d => map.set(d.id, d));
    return map;
  }, [filteredDevices]);

  /* ================= MARKERS ================= */

  const markers = useMemo(() => {
    return filteredDevices.map(d => {
      if (!d.lat || !d.lng) return null;

      const key = `${d.icon_key}-${d.status}-${d.is_core}`;
      let icon = iconCache.get(key);

      if (!icon) {
        icon = createLeafletIcon(d.icon_key, d.status, d.is_core);
        iconCache.set(key, icon);
      }

      const statusColor =
        d.status === "online"
          ? "green"
          : d.status === "warning"
          ? "orange"
          : "red";

      const latencyColor =
        !d.latency
          ? "gray"
          : d.latency < 100
          ? "green"
          : d.latency < 250
          ? "orange"
          : "red";

      return (
        <Marker
          key={d.id}
          position={[+d.lat, +d.lng]}
          icon={icon}
        >
          <Popup>
            <div className="map-popup">

              <div className="popup-header">
                <span className={`status-dot ${statusColor}`} />
                <strong>{d.name}</strong>
              </div>

              <div className="popup-row">
                <span>Status</span>
                <span className={`status-text ${statusColor}`}>
                  {d.status}
                </span>
              </div>

              <div className="popup-row">
                <span>IP</span>
                <span>{d.ip || "-"}</span>
              </div>

              <div className="popup-row">
                <span>Latency</span>
                <span className={`latency-badge ${latencyColor}`}>
                  {d.latency ? `${d.latency} ms` : "-"}
                </span>
              </div>

              <div className="popup-row">
                <span>Region</span>
                <span>{d.region_name || "-"}</span>
              </div>

              <div className="popup-row">
                <span>Type</span>
                <span>{d.device_type_name || "-"}</span>
              </div>

              <div className="popup-row">
                <span>Uptime</span>
                <span>{d.uptime ? `${d.uptime}%` : "-"}
                </span>
              </div>

              {d.parent_name && (
                <div className="popup-row">
                  <span>Parent</span>
                  <span>{d.parent_name}</span>
                </div>
              )}

              <button
                className="popup-detail-btn"
                onClick={() => onSelectDevice(d.id)}
              >
                View Detail
              </button>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [filteredDevices, onSelectDevice]);

  /* ================= RELATION LINES ================= */

  const lines = useMemo(() => {
    if (!showLines) return null;

    return filteredDevices.map(d => {
      if (!d.parent_device_id) return null;

      const parent = deviceMap.get(d.parent_device_id);
      if (!parent?.lat || !parent?.lng) return null;

      const color =
        d.status === "online"
          ? "#16a34a"
          : d.status === "warning"
          ? "#facc15"
          : "#dc2626";

      return (
        <Polyline
          key={`link-${d.id}`}
          positions={[
            [+parent.lat, +parent.lng],
            [+d.lat, +d.lng],
          ]}
          pathOptions={{
            color,
            dashArray: "6,6",
            weight: 3,
          }}
        />
      );
    });
  }, [showLines, filteredDevices, deviceMap]);

  /* ================= RENDER ================= */

  return (
    <MapContainer
      preferCanvas={true}   
      center={[-6.2, 106.8]}
      zoom={6}
      style={{ flex: 1 }}
    >
      <TileLayer
        attribution="&copy; OSM & CARTO"
        url={theme === "dark" ? DARK : LIGHT}
      />

      <AutoFit devices={filteredDevices} />

      {markers}
      {lines}

      <div className="map-toolbar">
        <button
          className={showLines ? "active" : ""}
          onClick={() => setShowLines(!showLines)}
        >
          <GitBranch size={20} />
        </button>

        <button
          className={showCoreOnly ? "active" : ""}
          onClick={() => setShowCoreOnly(!showCoreOnly)}
        >
          <Server size={20} />
        </button>

        <button
          className={showOfflineOnly ? "active" : ""}
          onClick={() => setShowOfflineOnly(!showOfflineOnly)}
        >
          <AlertTriangle size={20} />
        </button>
      </div>
    </MapContainer>
  );
}