const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { checkDevices } = require("./services/monitorService");
const deviceRoutes = require("./routes/deviceRoutes");
const deviceTypeRoutes = require("./routes/deviceTypeRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/device-types", deviceTypeRoutes);

/* ===== ROUTES ===== */
app.get("/", (_, res) => {
  res.json({ ok: true, service: "monitoring-service" });
});

app.use("/api/devices", deviceRoutes);

/* ===== SERVER + SOCKET ===== */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
app.set("io", io);

/* ===== FIRST RUN ===== */
(async () => {
  try {
    await checkDevices(io);
  } catch (e) {
    console.error("INIT MONITOR ERROR:", e.message);
  }
})();

/* ===== MONITOR LOOP ===== */
setInterval(async () => {
  try {
    await checkDevices(io);
  } catch (err) {
    console.error("MONITOR LOOP ERROR:", err.message);
  }
}, 30000);

/* ===== START ===== */
server.listen(3001, () => {
  console.log("🚀 Backend running on http://localhost:3001");
});
