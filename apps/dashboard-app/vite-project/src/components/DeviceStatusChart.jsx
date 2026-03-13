import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DeviceStatusChart({ summary }) {

  const data = [
    { name:"Online", value:summary.online, color:"#22c55e"},
    { name:"Warning", value:summary.warning, color:"#f59e0b"},
    { name:"Critical", value:summary.critical, color:"#ef4444"},
    { name:"Offline", value:summary.offline, color:"#64748b"},
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