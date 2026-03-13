import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DeviceTypeChart({ devices }) {

  if (!devices || devices.length === 0) {
    return <p style={{fontSize:12,color:"#6b7280"}}>No device data</p>;
  }

  const map = {};

  devices.forEach(d => {
    const type = d.type || "Unknown";
    map[type] = (map[type] || 0) + 1;
  });

  const colors = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  const data = Object.entries(map).map(([name,value],i)=>({
    name,
    value,
    color:colors[i % colors.length]
  }));

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