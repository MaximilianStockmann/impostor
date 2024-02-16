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

function addPlayerToLobby(name) {
  if (!playersInLobby.includes("Player " + name)) {
    playersInLobby.push("Player " + name);
  }
  updateLobby();
}

function removePlayerFromLobby(name) {
  playersInLobby = playersInLobby.filter((player) => {
    return player != "Player " + name;
  });
  updateLobby();
}

function updateLobby() {
  const lobby = document.getElementById("lobby");
  const players = [];
  playersInLobby.forEach((playerInLobby) => {
    const player = document.createElement("h3");
    player.innerText = playerInLobby;
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
  };

  //handling message event
  mywsServer.onmessage = function (event) {
    const { data } = event;
    if (data.startsWith("joined")) {
      const name = data.split(" ")[1];
      addPlayerToLobby(name);
    } else if (data.startsWith("left")) {
      const id = data.split(" ")[1];
      removePlayerFromLobby(id);
    } else if (data.startsWith("play")) {
      const songId = data.split(" ")[1];
      playSong(accessToken, songId);
    } else {
      msgGeneration(data, "Server");
    }
  };

  isWsOpen = true;
}

function joinLobby() {
  console.log("Just checking");
  name = document.getElementById("choose-name").value;
  connectWs();
  sendBtnCheck();
}

export function sendBtnCheck() {
  console.log(isWsOpen);
  if (isWsOpen == true && chosenDevice != undefined) sendBtn.disabled = false;
  else {
    sendBtn.disabled = true;
  }
}
