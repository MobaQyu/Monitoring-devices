import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LatencyChart from "./LatencyChart";
import TrafficChart from "./TrafficChart";
import { socket } from "../services/socket";
import { ICON_LIBRARY, DefaultIcon } from "../utils/iconLibrary";
import StatusBadge from "./StatusBadge";
import { monApi } from "../services/apiService";
import "../styles/device.css";

/* ================= HELPER ================= */

function formatUptime(value) {
  if (!value) return "N/A";

  let totalSeconds = Math.floor(Number(value) / 100);

  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;

  const minutes = Math.floor(totalSeconds / 60);

  return `${days}d ${hours}h ${minutes}m`;
}

function formatSpeed(bps) {
  if (!bps) return "0 Mbps";

  const mbps = bps / 1_000_000;

  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(2)} Gbps`;
  }

  if (mbps < 1) {
    return `${mbps.toFixed(3)} Mbps`;
  }

  return `${mbps.toFixed(2)} Mbps`;
}

/* ================= COMPONENT ================= */

export default function DeviceDetail({ device, onClose }) {
  const navigate = useNavigate();

  const [live, setLive] = useState(device);
  const [trafficHistory, setTrafficHistory] = useState([]);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const IconComponent =
  ICON_LIBRARY[live.icon_key] || DefaultIcon;

  /* ================= FETCH HISTORY ================= */

  useEffect(() => {
    if (!device) return;

    setLive(device);

    const loadData = async () => {
      try {
        const history = await monApi.get(`/devices/${device.id}/history`);

        const normalized = Array.isArray(history)
          ? history.map((p) => ({
              time: new Date(p.time),
              latency: p.latency,
              in: p.in,
              out: p.out,
            }))
          : [];

        setTrafficHistory(normalized);
        setLatencyHistory(normalized);
      } catch {
        setTrafficHistory([]);
        setLatencyHistory([]);
      }

      try {
        const logData = await monApi.get(`/devices/${device.id}/logs`);
        setLogs(Array.isArray(logData) ? logData : []);
      } catch {
        setLogs([]);
      }
    };

    loadData();
  }, [device]);

  /* ================= REALTIME ================= */

  useEffect(() => {
    if (!device) return;

    const onUpdate = (payload) => {
      if (payload.deviceId !== device.id) return;

      const point = {
        time: new Date(payload.metric.time),
        latency: payload.metric.latency,
        in: payload.metric.in,
        out: payload.metric.out,
      };

      setTrafficHistory((p) => [...p, point].slice(-120));
      setLatencyHistory((p) => [...p, point].slice(-120));

      setLive((prev) => ({
        ...prev,
        status: payload.status,
        latency: payload.metric.latency,
        uptime: payload.uptime,
        iface_speed: payload.ifaceSpeed,
      }));
    };

    socket.on("device:update", onUpdate);
    return () => socket.off("device:update", onUpdate);
  }, [device]);

  if (!device) return null;

  return (
    <div className="device-detail-overlay" onClick={onClose}>
      <div className="device-detail" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="device-detail-header">
          <div className="device-title">
  <div className="device-icon">
    <IconComponent size={22} strokeWidth={2.5} />
  </div>

  <h3>{live.name}</h3>

  <StatusBadge status={live.status} />
</div>

          <div className="device-actions">
            <button
              className="secondary"
              onClick={() => {
                onClose();
                navigate(`/devices?edit=${live.id}`);
              }}
            >
              Edit
            </button>
            <button onClick={onClose}>✕</button>
          </div>
        </div>

        {/* BODY */}
        <div className="device-detail-body">
          <div className="device-info">
            <Info label="IP" value={live.ip} />
            <Info label="Latency" value={`${live.latency ?? "-"} ms`} />
            <Info label="Uptime" value={formatUptime(live.uptime)} />
            <Info label="Interface" value={formatSpeed(live.iface_speed)} />
          </div>

          <div className="device-charts">
            <ChartBlock title="Traffic">
              <TrafficChart data={trafficHistory} />
            </ChartBlock>

            <ChartBlock title="Latency">
              <LatencyChart data={latencyHistory} />
            </ChartBlock>
          </div>
        </div>

        {/* LOG */}
        <div className="device-log-section">
          <b>Activity Log</b>
          <div className="device-log">
            {logs.length === 0 && (
              <span className="text-muted">Belum ada log</span>
            )}
            {logs.map((l, i) => (
              <div key={i} className="log-row">
                <span>
                  {new Date(Number(l.created_at)).toLocaleTimeString()}
                </span>
                <span>{l.status}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="primary" onClick={onClose}>
          Tutup
        </button>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENT ================= */

function Info({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

function ChartBlock({ title, children }) {
  return (
    <div className="chart-box">
      <div className="chart-title">{title}</div>
      <div className="chart-inner">{children}</div>
    </div>
  );
}