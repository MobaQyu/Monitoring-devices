import { useEffect, useState } from "react";
import { monApi } from "../services/apiService";

export default function TopBandwidthConsumers() {

  const [devices, setDevices] = useState([]);

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

  }, []);

  /* ================= HITUNG TOP BANDWIDTH ================= */

  const top = [...devices]
    .sort((a, b) => (b.traffic || 0) - (a.traffic || 0))
    .slice(0, 10);

  return (

    <div className="badnwidth-table">

      <h3>Top Bandwidth Consumers</h3>

      <table className="bandwidth-table">

        <thead>
          <tr>
            <th>Device</th>
            <th>Traffic</th>
          </tr>
        </thead>

        <tbody>

          {top.length === 0 ? (

            <tr>
              <td colSpan="2">No bandwidth data</td>
            </tr>

          ) : (

            top.map((d) => (

              <tr key={d.id}>

                <td>{d.name || `Device ${d.id}`}</td>

                <td>{formatMbps(d.traffic)}</td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}

function formatMbps(value) {

  if (!value) return "-";

  return (value / 1000000).toFixed(2) + " Mbps";

}