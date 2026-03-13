import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { monApi } from "../services/apiService";
import { socket } from "../services/socket";

/* COMPONENTS */
import TrafficChart from "../components/TrafficChart";
import LatencyChart from "../components/LatencyChart";
import TopBandwidthConsumers from "../components/TopBandwidthConsumers";
import DeviceStatusPreview from "../components/DeviceStatusPreview";

import DeviceStatusChart from "../components/DeviceStatusChart";
import DeviceTypeChart from "../components/DeviceTypeChart";
import RegionDeviceChart from "../components/RegionDeviceChart";
import AlertSeverityChart from "../components/AlertSerevityChart";
import OnlineTrendChart from "../components/OnlineTrendChart";

import { useAlerts } from "../context/AlertContext";

/* STYLE */
import "../styles/dashboard.css";

export default function Dashboard() {

  const navigate = useNavigate();
  const location = useLocation();
  const { alerts } = useAlerts();

  const [devices, setDevices] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [latencyData, setLatencyData] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedRegion, setSelectedRegion] = useState("all");

  /* ================= FETCH DEVICES ================= */

  useEffect(() => {

    const fetchDevices = async () => {
      try {
        const res = await monApi.get("/devices?limit=9999");
        setDevices(Array.isArray(res.data) ? res.data : []);
      } catch {
        setDevices([]);
      }
    };

    fetchDevices();

    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);

  }, []);

  /* ================= REALTIME DEVICE UPDATE ================= */

useEffect(() => {

  const handler = (payload) => {

  const { device, status, metric } = payload;

  setDevices(prev =>
    prev.map(d =>
      d.id === device.id
        ? { ...d, status, latency: metric?.latency ?? d.latency }
        : d
    )
  );

  if(metric){

    setTrafficData(prev => [
      ...prev.slice(-30),
      { time: metric.time, in: metric.in, out: metric.out }
    ]);

    setLatencyData(prev => [
      ...prev.slice(-30),
      { time: metric.time, latency: metric.latency }
    ]);

  }

};

  socket.on("device:update", handler);

  return () => socket.off("device:update", handler);

}, []);

/* ================= MONITORING DATA ================= */

useEffect(() => {

  const fetchMonitoring = async () => {
    try {

      const trafficRes = await monApi.get("/monitor/traffic");
      const latencyRes = await monApi.get("/monitor/latency");

      /* TRAFFIC (biarkan seperti sebelumnya supaya chart tetap muncul) */
      setTrafficData(trafficRes || {});

      /* LATENCY supaya tidak putus */
      if (latencyRes && latencyRes.data) {

        let last = 0;

        const fixedLatency = latencyRes.data.map(d => {

          if (d.latency !== null) {
            last = d.latency;
          }

          return {
            ...d,
            latency: last
          };

        });

        setLatencyData({
          ...latencyRes,
          data: fixedLatency
        });

      } else {
        setLatencyData(latencyRes || {});
      }

    } catch (err) {

      console.error("Monitoring fetch error:", err);

      setTrafficData({});
      setLatencyData({});

    }
  };

  fetchMonitoring();

  const interval = setInterval(fetchMonitoring, 30000);
  return () => clearInterval(interval);

}, []);

  /* ================= REGION LIST ================= */

  const regions = useMemo(() => {

    const set = new Set();

    devices.forEach(d => {
      if (d.region_name) set.add(d.region_name);
    });

    return ["all", ...Array.from(set)];

  }, [devices]);

  /* ================= FILTER DEVICES ================= */

  const regionDevices = useMemo(() => {

    if (selectedRegion === "all") return devices;

    return devices.filter(
      d => d.region_name === selectedRegion
    );

  }, [devices, selectedRegion]);

  /* ================= DEVICE SUMMARY ================= */

  const summary = useMemo(() => {

    let online = 0;
    let warning = 0;
    let critical = 0;
    let offline = 0;

    regionDevices.forEach(d => {

      if (d.status === "online") online++;
      else if (d.status === "warning") warning++;
      else if (d.status === "critical") critical++;
      else if (d.status === "offline") offline++;

    });

    return { online, warning, critical, offline };

  }, [regionDevices]);

  /* ================= NETWORK HEALTH ================= */

  const totalDevices = regionDevices.length;

  const healthScore = totalDevices === 0
    ? 100
    : Math.round(
        ((summary.online + summary.warning * 0.5) / totalDevices) * 100
      );

  /* ================= DEVICE MAP ================= */

  const deviceMap = useMemo(() => {

    return Object.fromEntries(
      regionDevices.map(d => [d.id, d])
    );

  }, [regionDevices]);

  /* ================= FILTER ALERTS ================= */

  const filteredAlerts = useMemo(() => {

    const term = search.toLowerCase();

    return alerts.filter(alert => {

      const device = deviceMap[alert.deviceId];

      if (!device) return false;

      const name =
        alert.deviceName ??
        device?.name ??
        "";

      return name.toLowerCase().includes(term);

    });

  }, [alerts, search, deviceMap]);

  /* ================= SCROLL TO ALERTS ================= */

  useEffect(() => {

    if (location.state?.scrollTo === "alerts") {

      const el = document.getElementById("alerts");

      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

    }

  }, [location]);

  return (
    <div className="dashboard">

      {/* REGION FILTER */}

      <div className="dashboard-filter">

        <select
          value={selectedRegion}
          onChange={(e)=>setSelectedRegion(e.target.value)}
        >

          {regions.map(region => (

            <option key={region} value={region}>
              {region === "all" ? "All Regions" : region}
            </option>

          ))}

        </select>

      </div>

      {/* SUMMARY */}

      <div className="summary-grid">

        <div className="health-card">
          <div className="health-score">{healthScore}%</div>
          <span>Network Health</span>
        </div>

        <div className="summary-card online">
          <span>Online</span>
          <h3>{summary.online}</h3>
        </div>

        <div className="summary-card warning">
          <span>Warning</span>
          <h3>{summary.warning}</h3>
        </div>

        <div className="summary-card critical">
          <span>Critical</span>
          <h3>{summary.critical}</h3>
        </div>

        <div className="summary-card offline">
          <span>Offline</span>
          <h3>{summary.offline}</h3>
        </div>

      </div>

      {/* PERFORMANCE */}

      <div className="chart-grid">

        <div className="chart-card">
          <h3>Network Traffic</h3>
          <TrafficChart data={trafficData}/>
        </div>

        <div className="chart-card">
          <h3>Latency</h3>
          <LatencyChart data={latencyData}/>
        </div>

      </div>

      {/* DISTRIBUTION */}

      <div className="chart-row">

        <div className="chart-card">
          <h3>Status</h3>
          <DeviceStatusChart summary={summary}/>
        </div>

        <div className="chart-card">
          <h3>Device Types</h3>
          <DeviceTypeChart devices={regionDevices}/>
        </div>

        <div className="chart-card">
          <h3>Regions</h3>
          <RegionDeviceChart devices={regionDevices}/>
        </div>

        <div className="chart-card">
          <h3>Alert Severity</h3>
          <AlertSeverityChart alerts={filteredAlerts}/>
        </div>

        <div className="chart-card">
          <h3>Online Ratio</h3>
          <OnlineTrendChart devices={regionDevices}/>
        </div>

      </div>

      <DeviceStatusPreview devices={regionDevices}/>

      {/* ALERTS */}

      <div className="bottom-grid">

        <div className="bandwidth-panel">
          <TopBandwidthConsumers/>
        </div>

        <div className="alert-panel" id="alerts">

          <div className="alert-header">

            <h3>Active Alerts</h3>

            <input
              placeholder="Search device..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="alert-search"
            />

          </div>

          <table className="alerts-table">

            <thead>
              <tr>
                <th>Device</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>

              {filteredAlerts.length === 0 ? (

                <tr>
                  <td colSpan="4">No active alerts</td>
                </tr>

              ) : (

                filteredAlerts.map(alert => {

                  const device = deviceMap[alert.deviceId];

                  const deviceName =
                    alert.deviceName ??
                    device?.name ??
                    `Device ${alert.deviceId}`;

                  return (

                    <tr
                      key={alert.deviceId}
                      className={`alert-row ${alert.status}`}
                      onClick={() => {

                        navigate("/devices");
                        localStorage.setItem("openDeviceId", alert.deviceId);

                      }}
                    >

                      <td>{deviceName}</td>

                      <td className={`alert-status ${alert.status}`}>
                        {alert.status}
                      </td>

                      <td>
                        {alert.latency ?? "-"} {alert.latency != null && "ms"}
                      </td>

                      <td>
                        {new Date(alert.time).toLocaleTimeString()}
                      </td>

                    </tr>

                  );

                })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}