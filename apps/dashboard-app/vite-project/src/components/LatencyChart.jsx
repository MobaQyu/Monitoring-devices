import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function LatencyChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        Menunggu data latency…
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" opacity={0.4} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          tickFormatter={(t) => new Date(t).toLocaleTimeString()}
        />
        <YAxis
          unit=" ms"
          tick={{ fontSize: 10 }}
          width={40}
        />
        <Tooltip
          formatter={(v) => `${v} ms`}
          labelFormatter={(l) => new Date(l).toLocaleString()}
        />
        <Line
          type="monotone"
          dataKey="latency"
          stroke="#f97316"
          strokeWidth={2}   // 🔥 lebih tipis
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
