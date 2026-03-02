import {
  Server,
  Router,
  Monitor,
  Network,
  Cctv,
} from "lucide-react";

/**
 * DeviceIcon
 * dipakai di:
 * - Device Card
 * - Device Detail
 * - Map (via createLeafletIcon)
 */
export default function DeviceIcon({ type, size = 18, color = "#2563eb" }) {
  const t = (type || "").toLowerCase();

  switch (t) {
    case "server":
      return <Server size={size} color={color} />;
    case "router":
      return <Router size={size} color={color} />;
    case "switch":
      return <Network size={size} color={color} />;
    case "cctv":
      return <Cctv size={size} color={color} />;
    case "pc":
      return <Monitor size={size} color={color} />;
    default:
      return <Monitor size={size} color={color} />;
  }
}
