import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function OnlineTrendChart({ devices }) {

  if (!devices || devices.length === 0) {
    return <p style={{fontSize:12,color:"#6b7280"}}>No data</p>;
  }

  const online = devices.filter(d => d.status === "online").length;
  const offline = devices.length - online;

  const data = [
    { name:"Online", value:online, color:"#22c55e"},
    { name:"Offline", value:offline, color:"#64748b"},
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