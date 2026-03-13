import { createContext, useContext, useEffect, useState } from "react";
import { monitorSocket } from "../services/monitorSocket";

const AlertContext = createContext();

export function AlertProvider({ children }) {

  const [alerts, setAlerts] = useState({}); 
  // object map {deviceId : alert}

  useEffect(() => {

    const handler = (payload) => {

      const deviceId = payload.device?.id;
      const deviceName = payload.device?.name;
      const latency = payload.metric?.latency;
      const status = payload.status;

      setAlerts(prev => {

        const updated = { ...prev };

        if (
          status === "warning" ||
          status === "critical" ||
          status === "offline"
        ) {

          updated[deviceId] = {
            deviceId,
            deviceName,
            status,
            latency,
            time: Date.now()
          };

        }

        if (status === "online") {
          delete updated[deviceId];
        }

        return updated;

      });

    };

    monitorSocket.on("device:update", handler);

    return () => {
      monitorSocket.off("device:update", handler);
    };

  }, []);

  return (
    <AlertContext.Provider
      value={{ alerts: Object.values(alerts) }}
    >
      {children}
    </AlertContext.Provider>
  );

}

export function useAlerts() {
  return useContext(AlertContext);
}