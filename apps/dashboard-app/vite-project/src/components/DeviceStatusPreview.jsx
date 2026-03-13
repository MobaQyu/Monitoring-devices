import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Globe, MapPin, Zap } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { ICON_LIBRARY, DefaultIcon } from "../utils/iconLibrary";

const getLatencyColor = (latency) => {
  if (!latency && latency !== 0) return "text-gray-400";
  if (latency < 50) return "text-green-500";
  if (latency < 100) return "text-yellow-500";
  return "text-red-500";
};

export default function DeviceStatusPreview({ devices }) {

  const navigate = useNavigate();

  /* ================= RANDOM DEVICE ================= */

  const preview = useMemo(() => {

    if (!devices) return [];

    const shuffled = [...devices].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, 7);

  }, [devices]);

  return (

    <div className="device-preview-grid">

      {preview.map(device => {

        const IconComponent =
          ICON_LIBRARY[device.icon_key] || DefaultIcon;

        return (

          <div
            key={device.id}
            className={`device-preview-card ${device.status}`}
            onClick={()=>{
              navigate("/devices");
              localStorage.setItem("openDeviceId", device.id);
            }}
          >

            {/* HEADER */}
            <div className="device-preview-header">

              <div className="device-icon">
                <IconComponent size={18} strokeWidth={2.5} />
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
                <Globe size={16}/>
                <span>{device.ip || "-"}</span>
              </div>

              <div className="info-row">
                <MapPin size={16}/>
                <span>{device.region_name || "-"}</span>
              </div>

              <div className="info-row">
                <Zap size={16}/>
                <span className={getLatencyColor(device.latency)}>
                  {device.latency ?? "-"} {device.latency != null && "ms"}
                </span>
              </div>

            </div>

          </div>

        );

      })}

      {/* VIEW MORE */}
      <div
        className="device-preview-more"
        onClick={()=>navigate("/devices")}
      >
        View All Devices →
      </div>

    </div>

  );

}