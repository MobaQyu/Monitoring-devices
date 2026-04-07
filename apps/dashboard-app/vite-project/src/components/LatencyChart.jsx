import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
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
        
        {/* 🔥 GRADIENT */}
        <defs>
          <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 6" opacity={0.2} />

        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickFormatter={(t) => new Date(t).toLocaleTimeString()}
        />

        <YAxis
          unit=" ms"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          width={40}
        />

        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "none",
            borderRadius: 8,
            color: "#fff",
          }}
          formatter={(v) => `${v} ms`}
          labelFormatter={(l) => new Date(l).toLocaleString()}
        />

        {/* 🔥 AREA GLOW */}
        <Area
          type="monotone"
          dataKey="latency"
          stroke="none"
          fill="url(#latencyGradient)"
        />

        {/* 🔥 MAIN LINE */}
        <Line
          type="monotone"
          dataKey="latency"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
          connectNulls
          isAnimationActive={false} // 🔥 biar lebih ringan
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}