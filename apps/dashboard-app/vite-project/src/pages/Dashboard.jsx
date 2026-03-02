import { useEffect, useState, } from "react";
import MapView from "../components/MapView";
import DeviceDetail from "../components/DeviceDetail";
import { monApi } from "../services/apiService";
import { monitorSocket } from "../services/monitorSocket";
import { socket, connectSocket } from "../services/socket";

const API = "http://localhost:3001/api/devices";

export default function Dashboard ({ mapTheme }) {
  const [devices, setDevices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // ===== AMBIL DATA =====

const fetchDevices = async () => {
  console.log("DEVICES:", devices);
  try {
    const result = await monApi.get("/devices?limit=9999");

    setDevices(Array.isArray(result.data) ? result.data : []);
  } catch {
    setDevices([]);
  }
};

  

  // ===== LOAD AWAL =====
  useEffect(() => {
    fetchDevices();
  }, []);

  // ===== POLLING 5 DETIK =====
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
    setDevices((prev) =>
      prev.filter((d) => d.id !== id)
    );
  };

  const runtimeHandler = (data) => {
    console.log("RUNTIME EVENT:", data);
    setDevices((prev) =>
      prev.map((d) =>
        d.id === data.deviceId
          ? {
              ...d,
              status: data.status,
              latency: data.latency,
            }
          : d
      )
    );
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

  const selectedDevice = Array.isArray(devices)
  ? devices.find(d => d.id === selectedId)
  : null;


  return (
    <div className="dashboard-full">
      <MapView
        devices={devices}
        onSelectDevice={setSelectedId}
        mapTheme={mapTheme}
      />

      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
