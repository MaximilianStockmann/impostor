const WebSocket = require("ws");
const express = require("express");

const path = require("path");

const app = express();

app.use("/", express.static(path.resolve(__dirname, "../client")));

const expressServer = app.listen(3000);

let playerConnections = [];
let currentPlayerId = 0;

console.log("Started HTTP Server on Port 3000");

const wsServer = new WebSocket.Server({
  noServer: true,
});

// wsServer.clients holds the client connections

wsServer.on("connection", (ws) => {
  const playerId = assignPlayerId(ws);
  updatePlayerConnections(playerId, ws);

  ws.on("message", (msg) => {
    messageHandler(ws, msg.toString());
  });

  ws.on("close", () => {
    const id = getWsId(ws);

    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("left " + getConncectionById(id).name);
      }
    });
    playerConnections = playerConnections.filter((conn) => conn.id !== id);
  });
});

expressServer.on("upgrade", async (request, socket, head) => {
  //handling upgrade(http to websocekt) event

  //emit connection when request accepted
  wsServer.handleUpgrade(request, socket, head, function done(ws) {
    wsServer.emit("connection", ws, request);
  });
});

// TODO replace with uuids at some point
function assignPlayerId(ws) {
  const playerId = currentPlayerId;
  currentPlayerId += 1;
  return playerId;
}

function updatePlayerConnections(id, ws) {
  playerConnections.push(new PlayerConnection(id, ws));
}

function playSongForAll(songId) {
  playerConnections.forEach((conn) => {
    playSong(conn.ws, songId);
  });
}

function playSong(ws, songId) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(`play ${songId}`);
  }
}

function getWsId(ws) {
  const wsId = playerConnections.find((conn) => conn.ws === ws).id;
  return wsId;
}

// TODO rn only names without spaces are possible, fix
function messageHandler(ws, msg) {
  if (msg.startsWith("name")) {
    msg = msg.split(" ")[1];
    const id = getWsId(ws);
    const conn = getConncectionById(id);
    conn.name = msg;

    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("joined " + conn.name);
      }
    });
  } else if (msg.startsWith("play")) {
    msg = msg.split(" ")[1];
    wsServer.clients.forEach((client) => {
      playSong(client, msg);
    });
  } else if (msg.startsWith("get lobby")) {
    let playerString = "";
    playerConnections.forEach((conn) => {
      playerString += conn.name;
      playerString += " ";
    });
    ws.send("lobby " + playerString);
  }
}

function getConncectionById(id) {
  return playerConnections.find((connection) => connection.id === id);
}

class PlayerConnection {
  constructor(id, ws) {
    this.id = id;
    this.ws = ws;
    this.name = "";
  }
}
