import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import LatencyChart from "../components/LatencyChart";
import TrafficChart from "../components/TrafficChart";
import { monApi } from "../services/apiService";

export default function DeviceDetailPage() {
  const { id } = useParams();

  const [range, setRange] = useState("1H");
  const [latency, setLatency] = useState([]);
  const [traffic, setTraffic] = useState([]);

  // ===== FETCH DATA =====
  useEffect(() => {
    const load = async () => {
      try {
        const lat = await monApi.get(
          `/monitor/latency?range=${range}&deviceId=${id}`
        );

        const traf = await monApi.get(
          `/monitor/traffic?range=${range}&deviceId=${id}`
        );

        setLatency(
          lat.slice(-200).map((d) => ({
            time: new Date(d.time),
            latency: d.latency ?? 0,
          }))
        );

        setTraffic(
          traf.slice(-200).map((d) => ({
            time: new Date(d.time),
            in: d.in_bps,
            out: d.out_bps,
          }))
        );
      } catch (err) {
        console.error("FETCH ERROR:", err);
        setLatency([]);
        setTraffic([]);
      }
    };

    load();
  }, [range, id]);

  // ===== EXPORT (PASTI WORK) =====
  const handleExport = async (type) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/monitor/export?type=${type}&range=${range}&deviceId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_${id}_${range}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("EXPORT ERROR:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Device Detail #{id}</h2>

      {/* RANGE */}
      <div style={{ marginBottom: 20 }}>
        {["1H", "24H", "7D"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              marginRight: 10,
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: range === r ? "#2563eb" : "#e5e7eb",
              color: range === r ? "#fff" : "#000",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* EXPORT */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => handleExport("latency")}
          style={{ marginRight: 10 }}
        >
          Export Latency CSV
        </button>

        <button onClick={() => handleExport("traffic")}>
          Export Traffic CSV
        </button>
      </div>

      {/* LATENCY */}
      <h3>Latency</h3>
      <div style={{ width: "100%", height: 300 }}>
        <LatencyChart data={latency} />
      </div>

      {/* TRAFFIC */}
      <h3 style={{ marginTop: 30 }}>Traffic</h3>
      <div style={{ width: "100%", height: 300 }}>
        <TrafficChart data={traffic} />
      </div>
    </div>
  );
}