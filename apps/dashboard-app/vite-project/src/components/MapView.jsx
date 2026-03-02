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
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  Layers,
  GitBranch,
  Server,
  AlertTriangle
} from "lucide-react";

const LIGHT =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function AutoFit({ devices }) {
  const map = useMap();
  const prevCountRef = useRef(0);

  useEffect(() => {
    const validDevices = devices.filter(
      (d) => d.lat != null && d.lng != null
    );

    if (validDevices.length === 0) return;
    if (prevCountRef.current === validDevices.length) return;

    prevCountRef.current = validDevices.length;

    if (validDevices.length === 1) {
      map.setView(
        [Number(validDevices[0].lat), Number(validDevices[0].lng)],
        13
      );
      return;
    }

    const bounds = L.latLngBounds(
      validDevices.map((d) => [
        Number(d.lat),
        Number(d.lng),
      ])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [devices, map]);

  return null;
}

export default function MapView({ devices, onSelectDevice }) {
  const { theme } = useTheme();

  const [showCluster, setShowCluster] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const [showCoreOnly, setShowCoreOnly] = useState(false);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);

  // 🔥 Filter devices berdasarkan toggle
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (showCoreOnly && !d.is_core) return false;
      if (showOfflineOnly && d.status !== "offline") return false;
      return true;
    });
  }, [devices, showCoreOnly, showOfflineOnly]);

  const renderMarkers = () =>
  filteredDevices.map((d) => {
    if (!d.lat || !d.lng) return null;

    const latencyColor =
      !d.latency
        ? "gray"
        : d.latency < 100
        ? "green"
        : d.latency < 250
        ? "orange"
        : "red";

    const statusColor =
      d.status === "online"
        ? "green"
        : d.status === "warning"
        ? "orange"
        : "red";

    return (
      <Marker
        key={d.id}
        position={[Number(d.lat), Number(d.lng)]}
        icon={createLeafletIcon(d.icon_key, d.status, d.is_core)}
        eventHandlers={{
          click: (e) => {
            e.target.openPopup();
          },
        }}
      >
        <Popup
            autoClose={true}
            closeOnClick={true}
            closeButton={true}
          >
          <div className="map-popup">

            {/* HEADER */}
            <div className="popup-header">
              <span className={`status-dot ${statusColor}`} />
              <strong>{d.name}</strong>
            </div>

            {/* INFO */}
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
              <span>{d.uptime ? `${d.uptime}%` : "-"}</span>
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

  return (
    <MapContainer
      center={[-6.2, 106.8]}
      zoom={6}
      style={{ flex: 1}}
    >
      <TileLayer
        attribution="&copy; OSM &copy; CARTO"
        url={theme === "dark" ? DARK : LIGHT}
      />

      <AutoFit devices={filteredDevices} />

      {/* MARKERS */}
      {showCluster ? (
        <MarkerClusterGroup chunkedLoading>
          {renderMarkers()}
        </MarkerClusterGroup>
      ) : (
        renderMarkers()
      )}

      {/* RELATION LINES */}
      {showLines &&
        filteredDevices.map((d) => {
          if (!d.parent_device_id) return null;

          const parent = filteredDevices.find(
            (p) => p.id === d.parent_device_id
          );

          if (!parent || !parent.lat || !parent.lng) return null;

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
                [Number(parent.lat), Number(parent.lng)],
                [Number(d.lat), Number(d.lng)],
              ]}
              pathOptions={{
                color,
                dashArray: "6,6",
                weight: 3,
              }}
            />
          );
        })}

      {/* CONTROL PANEL */}
      
      <div className="map-toolbar">
  <button
    className={showCluster ? "active" : ""}
    onClick={() => setShowCluster(!showCluster)}
    title="Toggle Cluster"
  >
    <Layers size={20} strokeWidth={2.2} />
  </button>

  <button
    className={showLines ? "active" : ""}
    onClick={() => setShowLines(!showLines)}
    title="Toggle Relation Lines"
  >
    <GitBranch size={20} strokeWidth={2.2} />
  </button>

  <button
    className={showCoreOnly ? "active" : ""}
    onClick={() => setShowCoreOnly(!showCoreOnly)}
    title="Show Core Only"
  >
    <Server size={20} strokeWidth={2.2} />
  </button>

  <button
    className={showOfflineOnly ? "active" : ""}
    onClick={() => setShowOfflineOnly(!showOfflineOnly)}
    title="Show Offline Only"
  >
    <AlertTriangle size={20} strokeWidth={2.2} />
  </button>
</div>
    </MapContainer>
  );
}