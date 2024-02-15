const WebSocket = require("ws");
const express = require("express");

const path = require("path");

const app = express();

app.use("/", express.static(path.resolve(__dirname, "../client")));

const expressServer = app.listen(3000);

const playerConnections = {};
let currentPlayerId = 0;

console.log("Started HTTP Server on Port 3000");

const wsServer = new WebSocket.Server({
  noServer: true,
});

// wsServer.clients holds the client connections

wsServer.on("connection", (ws) => {
  console.log("established websocket connection");
  const playerId = assignPlayerId(ws);
  updatePlayerConnections(playerId, ws);

  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      Object.keys(playerConnections).forEach((id) => {
        client.send("joined " + id);
      });
    }
  });

  ws.on("message", (msg) => {
    console.log("Received message: ", msg.toString());
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client === ws) {
        client.send(`To player ${playerId}: ${msg.toString()}`);
      }
    });
  });

  ws.on("close", () => {
    const id = Object.keys(playerConnections).find(
      (key) => playerConnections[key] === ws
    );
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("left " + id);
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

function assignPlayerId(ws) {
  console.log(wsServer.clients);
  const playerId = currentPlayerId;
  currentPlayerId += 1;
  ws.emit(playerId);
  return playerId;
}

function updatePlayerConnections(id, ws) {
  playerConnections[id] = ws;
}
