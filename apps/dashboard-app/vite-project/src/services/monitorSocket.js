import { io } from "socket.io-client";

export const monitorSocket = io("http://localhost:3001", {
  transports: ["websocket"],
});