import { accessToken, chosenDevice, playSong } from "./spotify.js";

//Websocekt variables
const url = "ws://localhost:3000/myWebsocket";
let mywsServer;

//DOM Elements
const myMessages = document.getElementById("messages");
const myInput = document.getElementById("message");
const sendBtn = document.getElementById("send");
const joinBtn = document.getElementById("join");

let isWsOpen = false;

let name;

let playersInLobby = [];

export let ws;

sendBtn.disabled = true;
sendBtn.addEventListener("click", sendMsg, false);
joinBtn.addEventListener("click", joinLobby);

// TODO make page request current lobby status on reload

//Sending message from client
function sendMsg() {
  const text = myInput.value;
  msgGeneration(text, "Client");
  mywsServer.send("play " + text);
}

//Creating DOM element to show received messages on browser page
function msgGeneration(msg, from) {
  const newMessage = document.createElement("h5");
  newMessage.innerText = `${from} says: ${msg}`;
  myMessages.appendChild(newMessage);
}

function updateLobby() {
  const lobby = document.getElementById("lobby");
  const players = [];
  playersInLobby.forEach((playerInLobby) => {
    const player = document.createElement("div");
    const name = document.createElement("h3");
    const status = document.createElement("h4");

    status.innerText = "Not ready";
    addEventListener("ready", (e) => {
      console.log(`e.detail: ${e.detail}, playerInLobby: ${playerInLobby}`);
      if (e.detail === playerInLobby) {
        status.innerText = "Ready";
      }
    });

    name.innerText = playerInLobby;

    player.appendChild(name);
    player.appendChild(status);
    players.push(player);
  });
  lobby.replaceChildren(...players);
}

function connectWs() {
  mywsServer = new WebSocket(url);

  //enabling send message when connection is open
  mywsServer.onopen = () => {
    mywsServer.send("name " + name);
    sendBtnCheck();
    mywsServer.send("get lobby");
  };

  //handling message event
  mywsServer.onmessage = function (event) {
    const { data } = event;
    if (data.startsWith("joined")) {
      checkLobby(mywsServer);
    } else if (data.startsWith("left")) {
      checkLobby(mywsServer);
    } else if (data.startsWith("play")) {
      const songId = data.split(" ")[1];
      playSong(accessToken, songId);
    } else if (data.startsWith("lobby")) {
      const players = data.split(" ");
      players.shift();
      players.pop();
      console.log(players);
      playersInLobby = players;
      updateLobby();
    } else if (data.startsWith("ready")) {
      const readyPlayer = data.split(" ")[1];
      console.log("In Ready branch");
      doReadyPlayer(readyPlayer);
    } else {
      msgGeneration(data, "Server");
    }
  };

  isWsOpen = true;
  return mywsServer;
}

function joinLobby() {
  console.log("Just checking");
  name = document.getElementById("choose-name").value;
  ws = connectWs();
  sendBtnCheck();
}

export function sendBtnCheck() {
  console.log(isWsOpen);
  if (isWsOpen == true && chosenDevice != undefined) sendBtn.disabled = false;
  else {
    sendBtn.disabled = true;
  }
}

function checkLobby(ws) {
  ws.send("get lobby");
}

// TODO rn when a new player joins they don't see the ready status of the others correctly, because there is no check for this
function doReadyPlayer(readyPlayer) {
  console.log(readyPlayer);
  const readyEvent = new CustomEvent("ready", { detail: readyPlayer });
  dispatchEvent(readyEvent);
}
