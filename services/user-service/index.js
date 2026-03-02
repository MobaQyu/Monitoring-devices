const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const regionRoutes = require("./regionRoutes");
const userRoutes = require("./userRoutes");

const JWT_SECRET = "super_secret_key";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/regions", regionRoutes);
// 🔥 ROLE & PERMISSION MANAGEMENT
const roleRoutes = require("./role.routes");
app.use("/api/roles", roleRoutes);

/* ================= HTTP + SOCKET ================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const onlineUsers = new Map();
app.set("onlineUsers", onlineUsers);



app.set("forceLogoutUser", forceLogoutUser);
function forceLogoutUser(userId, reason = "Account disabled") {
  const user = onlineUsers.get(Number(userId));

  if (!user) return;

  const socketId = user.socketId;
  const socket = io.sockets.sockets.get(socketId);

  if (socket) {
    socket.emit("forceLogout", { message: reason });
    socket.disconnect(true);
  }

  onlineUsers.delete(Number(userId));
  
  console.log("ONLINE USERS MAP KEYS:", [...onlineUsers.keys()]);
  console.log("TRYING LOGOUT USER:", userId);

}



/* ================= SOCKET AUTH ================= */

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

/* ================= CONNECTION ================= */

io.on("connection", (socket) => {
  const userId = Number(socket.user.id);
  const username = socket.user.username;

  onlineUsers.set(userId, {
    socketId: socket.id,
    username,
    connectedAt: Date.now()
  });

  console.log(`🟢 User online: ${username}`);

  io.emit("onlineUsersUpdate", {
    total: onlineUsers.size,
    users: Array.from(onlineUsers.entries()).map(([id, data]) => ({
      id,
      username: data.username,
      connectedAt: data.connectedAt
    }))
  });


  socket.on("disconnect", () => {
    onlineUsers.delete (Number(userId));
    console.log(`🔴 User offline: ${username}`);

    io.emit("onlineUsersUpdate", {
      total: onlineUsers.size,
      users: Array.from(onlineUsers.entries()).map(([id, data]) => ({
        id,
        username: data.username,
        connectedAt: data.connectedAt
      }))
    });
  });
});

/* ================= EXPORT ONLINE USERS ================= */

app.get("/api/users/online", (req, res) => {
  res.json({
    total_online: onlineUsers.size,
    users: Array.from(onlineUsers.entries()).map(([id, data]) => ({
      id,
      username: data.username,
      connectedAt: data.connectedAt
    }))
  });
});

/* ================= START ================= */

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`👤 User Service running at http://localhost:${PORT}`);
});
