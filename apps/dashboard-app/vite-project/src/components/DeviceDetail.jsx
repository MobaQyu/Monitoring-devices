import { useEffect, useState } from "react";
import LatencyChart from "./LatencyChart";
import TrafficChart from "./TrafficChart";
import { socket } from "../services/socket";
import DeviceIcon from "./DeviceIcon";
import StatusBadge from "./StatusBadge";
import { monApi } from "../services/apiService";

/* ================= DEVICE DETAIL COMPONENT ================= */

export default function DeviceDetail({ device, onClose }) {
  const [live, setLive] = useState(device);
  const [trafficHistory, setTrafficHistory] = useState([]);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [logs, setLogs] = useState([]);

  /* ================= FETCH HISTORY + LOG ================= */
  useEffect(() => {
    if (!device) return;

    setLive(device);

    const loadHistoryAndLogs = async () => {
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
      } catch (err) {
        console.error("FETCH HISTORY ERROR:", err);
        setTrafficHistory([]);
        setLatencyHistory([]);
      }

      try {
        const logData = await monApi.get(`/devices/${device.id}/logs`);
        setLogs(Array.isArray(logData) ? logData : []);
      } catch (err) {
        console.error("FETCH LOG ERROR:", err);
        setLogs([]);
      }
    };

    loadHistoryAndLogs();
  }, [device]);

  /* ================= REALTIME SOCKET ================= */
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
        type: payload.type ?? prev.type,
      }));
    };

    socket.on("device:update", onUpdate);
    return () => socket.off("device:update", onUpdate);
  }, [device]);

  if (!device) return null;

  return (
   <div className="device-detail-overlay" onClick={onClose}>
      <div
        className="device-detail"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="device-detail-header">
          <div className="device-title">
            <DeviceIcon type={live.type} />
            <h3>{live.name}</h3>
            <StatusBadge status={live.status} />
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="device-detail-body">
          <div className="device-info">
            <Info label="IP" value={live.ip} />
            <Info label="Status" value={live.status} />
            <Info
              label="Latency"
              value={`${live.latency ?? "-"} ms`}
            />
            <Info
              label="Uptime"
              value={live.uptime ?? "N/A"}
            />
            <Info
              label="Interface"
              value={live.iface_speed ?? "N/A"}
            />
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
        <div>
          <b>Activity Log</b>
          <div className="device-log">
            {logs.length === 0 && (
              <span className="text-muted">
                Belum ada log
              </span>
            )}
            {logs.map((l, i) => (
              <div key={i} className="log-row">
                <span>
                  {new Date(
                    Number(l.created_at)
                  ).toLocaleTimeString()}
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
      <b>{label}</b>
      <span>{value}</span>
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
