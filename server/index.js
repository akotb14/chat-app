//----library-----
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ConnectDB from "./models/connect_db.js";
import UserRoute from "./router/user.router.js";
import ChatRoute from "./router/chat.router.js";
import { Server } from "socket.io";
import bodyParser from "body-parser";
const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());

app.get("/",(req,res) =>{
  res.send("hello world")
})

app.use("/image", express.static("images"));
ConnectDB.connect_DB();

app.use("/api/", UserRoute);
app.use("/api/", ChatRoute);

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log("listening on port", port);
});
// Socket.IO enforces CORS on its handshake, and the origin here must be where
// the *client* is served from — not this server's own URL. Comma-separate to
// allow several (e.g. local dev plus the deployed front end).
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    credentials: true,
  },
});

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  })
);
global.onlineUsers = new Map();
const userOnline = [];
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });
  
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.recieve);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.message);
    }
  });
});

export const onlineU = global.onlineUsers;
export default app;