import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

export default function MiniTrafficChart({ data }) {
  return (
    <div style={{ width: "100%", height: 55 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="in"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="out"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}