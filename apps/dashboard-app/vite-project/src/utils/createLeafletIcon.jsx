import React from "react";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import DeviceIcon from "../components/DeviceIcon.jsx";


export function createLeafletIcon(type, status, isCore = false) {
  const color =
    status === "online"
      ? "#16a34a"
      : status === "warning"
      ? "#facc15"
      : "#dc2626";

  const isOffline = status === "offline";
  const size = isCore ? 36 : 30;
  const html = renderToStaticMarkup(
    <div
      className={isOffline ? "pulse-offline" : ""}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 0 2px white",
      }}
    >
      <DeviceIcon type={type} size={16} color="white" />
    </div>
  );

  return L.divIcon({
    className: "", 
    html,
    iconSize: [size, size],
  });
}
