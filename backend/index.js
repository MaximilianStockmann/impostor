const WebSocket = require("ws");
const express = require("express");

const path = require("path");

const app = express();

app.use("/", express.static(path.resolve(__dirname, "../client")));

const expressServer = app.listen(3000);

console.log("Started HTTP Server on Port 3000");

const wsServer = new WebSocket.Server({
  noServer: true,
});

// wsServer.clients holds the client connections

wsServer.on("connection", (ws) => {
  console.log("established websocket connection");
  ws.on("message", (msg) => {
    console.log("Received message: ", msg.toString());
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    });
  });
});

expressServer.on("upgrade", async (request, socket, head) => {
  //handling upgrade(http to websocekt) event

  //emit connection when request accepted
  wsServer.handleUpgrade(request, socket, head, function done(ws) {
    wsServer.emit("connection", ws, request);
  });
});
