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
  const playerId = assignPlayerId(ws);
  console.log("established websocket connection to player " + playerId);
  updatePlayerConnections(playerId, ws);

  ws.on("message", (msg) => {
    messageHandler(ws, msg.toString());
  });

  ws.on("close", () => {
    const id = getWsId(ws);
    console.log(
      "Connection to Player " + playerConnections[id].name + " closing"
    );

    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("left " + playerConnections[id].name);
      }
    });
    delete playerConnections[id];
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
  const playerId = currentPlayerId;
  currentPlayerId += 1;
  return playerId;
}

function updatePlayerConnections(id, ws) {
  playerConnections.id = id;
  playerConnections.ws = ws;
  playerConnections.name = undefined;
}

function playSongForAll(songId) {
  Object.keys(playerConnections).forEach((key) => {
    const ws = playerConnections[key];
    playSong(ws, songId);
  });
}

function playSong(ws, songId) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(`play ${songId}`);
  }
}

function getWsId(ws) {
  return Object.keys(playerConnections).find(
    (key) => playerConnections[key] === ws
  );
}

function messageHandler(ws, msg) {
  console.log("Received message: ", msg.toString());

  if (msg.startsWith("name")) {
    msg = msg.split(" ")[1];
    const id = getWsId(ws);
    playerConnections[id].name = msg;

    wsServer.clients.forEach((client) => {
      console.log(`Name: ${playerConnections[id].name}`);
      if (client.readyState === WebSocket.OPEN) {
        client.send("joined " + playerConnections[id].name);
      }
    });
  } else if (msg.startsWith("play")) {
    msg = msg.split(" ")[1];
    wsServer.clients.forEach((client) => {
      playSong(client, msg);
    });
  }
}
