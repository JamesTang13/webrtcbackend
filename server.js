// const express = require("express");
// const dotenv = require("dotenv");
// const http = require("http");

// //Load env vars
// dotenv.config({ path: "./config/config.env" });

// const app = express();

// const server = http.createServer(app);

// const io = require("socket.io")(server, { origins: "*:*" });
// app.use(express.static(__dirname + "/public"));
// io.sockets.on("error", (e) => console.log(e));

// const PORT = process.env.PORT || 5000;

// app.listen(
//   PORT,
//   console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
// );

// let broadcaster;

// io.sockets.on("connection", (socket) => {
//   socket.on("broadcaster", () => {
//     broadcaster = socket.id;
//     socket.broadcast.emit("broadcaster");
//   });
//   socket.on("watcher", () => {
//     socket.to(broadcaster).emit("watcher", socket.id);
//   });
//   socket.on("disconnect", () => {
//     socket.to(broadcaster).emit("disconnectPeer", socket.id);
//   });
//   socket.on("offer", (id, message) => {
//     socket.to(id).emit("offer", socket.id, message);
//   });
//   socket.on("answer", (id, message) => {
//     socket.to(id).emit("answer", socket.id, message);
//   });
//   socket.on("candidate", (id, message) => {
//     socket.to(id).emit("candidate", socket.id, message);
//   });
//   socket.on("comment", (id, message) => {
//     socket.to(id).emit("comment", socket.id, message);
//   });
// });

const express = require("express");

var io = require("socket.io")({
  path: "/io/webrtc",
});

const app = express();
const port = 8080;

// app.get('/', (req, res) => res.send('Hello World!!!!!'))

//https://expressjs.com/en/guide/writing-middleware.html
app.use(express.static(__dirname + "/build"));
app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/build/index.html");
});

const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);

io.listen(server);

// default namespace
io.on("connection", (socket) => {
  console.log("connected");
});

// https://www.tutorialspoint.com/socket.io/socket.io_namespaces.htm
const peers = io.of("/webrtcPeer");

// keep a reference of all socket connections
let connectedPeers = new Map();

peers.on("connection", (socket) => {
  console.log(socket.id);
  socket.emit("connection-success", { success: socket.id });

  connectedPeers.set(socket.id, socket);

  socket.on("disconnect", () => {
    console.log("disconnected");
    connectedPeers.delete(socket.id);
  });

  socket.on("offerOrAnswer", (data) => {
    // send to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type);
        socket.emit("offerOrAnswer", data.payload);
      }
    }
  });

  socket.on("candidate", (data) => {
    // send candidate to the other peer(s) if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      // don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload);
        socket.emit("candidate", data.payload);
      }
    }
  });
});
