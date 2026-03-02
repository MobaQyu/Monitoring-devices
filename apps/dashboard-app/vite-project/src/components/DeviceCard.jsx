import StatusBadge from "./StatusBadge";
import { can } from "../utils/can";
import { ICON_LIBRARY, DefaultIcon } from "../utils/iconLibrary";
import {
  Globe,
  MapPin,
  Zap,
  Pencil,
  Trash,
} from "lucide-react";

const getLatencyColor = (latency) => {
  if (!latency && latency !== 0) return "text-gray-400";
  if (latency < 50) return "text-green-500";
  if (latency < 100) return "text-yellow-500";
  return "text-red-500";
};

export default function DeviceCard({
  device,
  trafficData,
  onClick,
  onEdit,
  onDelete,
}) {

  const IconComponent =
  ICON_LIBRARY[device.icon_key] || DefaultIcon;

  return (
    <div
      className={`device-card ${device.status}`}
      onClick={onClick}
    >
      {/* TOP */}
      <div className="card-header">
        <div className="device-icon">
          <IconComponent size={20} strokeWidth={2.5} />
        </div>

        <StatusBadge status={device.status || "offline"} />
      </div>

      {/* NAME */}
      <h3 className="device-title">
        {device.name}
      </h3>

      {/* INFO */}
      <div className="device-info">

        <div className="info-row">
          <Globe size={16} />
          <span>{device.ip}</span>
        </div>

        <div className="info-row">
          <MapPin size={16} />
          <span>{device.region_name}</span>
        </div>

        <div className="info-row">
          <Zap size={16} />
          <span className={getLatencyColor(device.latency)}>
            {device.latency ?? "-"} {device.latency != null && "ms"}
          </span>
        </div>

      </div>

      {/* ACTIONS */}
      {(can("update_device") || can("delete_device")) && (
        <div className="card-actions">

          {can("update_device") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Pencil size={18} />
            </button>
          )}

          {can("delete_device") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash size={18} />
            </button>
          )}

        </div>
      )}
    </div>
  );
}