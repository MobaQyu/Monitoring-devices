import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function AlertSeverityChart({ alerts }) {

  if (!alerts || alerts.length === 0) {
    return <p style={{fontSize:12,color:"#6b7280"}}>No alerts</p>;
  }

  const map = {
    critical: 0,
    warning: 0,
    info: 0
  };

  alerts.forEach(a => {
    const key = a.status || "info";
    if (map[key] !== undefined) map[key]++;
  });

  const data = [
    { name: "Critical", value: map.critical, color: "#ef4444" },
    { name: "Warning", value: map.warning, color: "#f59e0b" },
    { name: "Info", value: map.info, color: "#3b82f6" },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>

        <Pie
          data={data}
          dataKey="value"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
        >
          {data.map((entry,i)=>(
            <Cell key={i} fill={entry.color}/>
          ))}
        </Pie>

        <Tooltip/>

      </PieChart>
    </ResponsiveContainer>
  );
}