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

app.use("/image", express.static("images"));
ConnectDB.connect_DB();

app.use("/api/", UserRoute);
app.use("/api/", ChatRoute);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log("listening on port", port);
});
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

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
