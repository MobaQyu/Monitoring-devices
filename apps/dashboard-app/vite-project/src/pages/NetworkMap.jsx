import { useEffect, useState, useRef } from "react";
import MapView from "../components/MapView";
import DeviceDetail from "../components/DeviceDetail";
import { monApi } from "../services/apiService";
import { monitorSocket } from "../services/monitorSocket";
import { connectSocket } from "../services/socket";
import "../styles/map.css";

export default function NetworkMap({ mapTheme }) {
  const [devices, setDevices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const bufferRef = useRef([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const result = await monApi.get("/devices?limit=9999");
        setDevices(Array.isArray(result.data) ? result.data : []);
      } catch {
        setDevices([]);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    connectSocket();

    const createdHandler = (device) => {
      setDevices((prev) => [device, ...prev]);
    };

    const updatedHandler = (device) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? device : d))
      );
    };

    const deletedHandler = (id) => {
      setDevices((prev) => prev.filter((d) => d.id !== id));
    };

    const runtimeHandler = (data) => {
      bufferRef.current.push(data);
    };

    monitorSocket.on("device:created", createdHandler);
    monitorSocket.on("device:updated", updatedHandler);
    monitorSocket.on("device:deleted", deletedHandler);
    monitorSocket.on("device:update", runtimeHandler);

    return () => {
      monitorSocket.off("device:created", createdHandler);
      monitorSocket.off("device:updated", updatedHandler);
      monitorSocket.off("device:deleted", deletedHandler);
      monitorSocket.off("device:update", runtimeHandler);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (bufferRef.current.length === 0) return;

      setDevices((prev) => {
        let updated = [...prev];

        bufferRef.current.forEach((data) => {
          updated = updated.map((d) =>
            d.id === data.deviceId
              ? {
                  ...d,
                  status: data.status,
                  latency: data.latency,
                }
              : d
          );
        });

        bufferRef.current = [];
        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const selectedDevice = devices.find((d) => d.id === selectedId);

  const summary = {
    online: devices.filter(d => d.status === "online").length,
    warning: devices.filter(d => d.status === "warning").length,
    offline: devices.filter(d => d.status === "offline").length,
    critical: devices.filter(d => d.status === "critical").length,
  };

  return (
    <div className="dashboard-full">
      <MapView
        devices={devices}
        onSelectDevice={setSelectedId}
        mapTheme={mapTheme}
      />

      {/* FLOATING SUMMARY */}
      <div className="floating-summary">
        <div className="summary-item green">🟢 Online {summary.online}</div>
        <div className="summary-item orange">🟡 Warning {summary.warning}</div>
        <div className="summary-item red">🔴 Offline {summary.offline}</div>
        <div className="summary-item critical">🚨 Critical {summary.critical}</div>
      </div>

      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
