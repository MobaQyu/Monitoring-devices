import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/* ===== helper unit ===== */
function pickUnit(maxBps) {
  if (maxBps >= 1e9) return { div: 1e9, label: "Gbps" };
  if (maxBps >= 1e6) return { div: 1e6, label: "Mbps" };
  if (maxBps >= 1e3) return { div: 1e3, label: "Kbps" };
  return { div: 1, label: "bps" };
}

export default function TrafficChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        Menunggu data traffic…
      </p>
    );
  }

  const maxBps = Math.max(
    ...data.map((d) => Math.max(d.in ?? 0, d.out ?? 0)),
    1
  );

  const unit = pickUnit(maxBps);

  const scaled = data.map((d) => ({
    ...d,
    inScaled: (d.in ?? 0) / unit.div,
    outScaled: (d.out ?? 0) / unit.div,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={scaled} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" opacity={0.4} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          tickFormatter={(t) => new Date(t).toLocaleTimeString()}
        />
        <YAxis
          unit={` ${unit.label}`}
          tick={{ fontSize: 10 }}
          width={45}
        />
        <Tooltip
          formatter={(v) =>
            v == null || isNaN(v) ? "-" : `${v.toFixed(2)} ${unit.label}`
          }
          labelFormatter={(l) => new Date(l).toLocaleString()}
        />
        <Line
          type="monotone"
          dataKey="inScaled"
          stroke="#22c55e"
          strokeWidth={2}   // 🔥 lebih tipis
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="outScaled"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
