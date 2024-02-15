//Websocekt variables
const url = "ws://localhost:3000/myWebsocket";
const mywsServer = new WebSocket(url);

//DOM Elements
const myMessages = document.getElementById("messages");
const myInput = document.getElementById("message");
const sendBtn = document.getElementById("send");
console.log(sendBtn);
let playersInLobby = [];

sendBtn.disabled = true;
sendBtn.addEventListener("click", sendMsg, false);

//Sending message from client
function sendMsg() {
  const text = myInput.value;
  msgGeneration(text, "Client");
  mywsServer.send(text);
}

//Creating DOM element to show received messages on browser page
function msgGeneration(msg, from) {
  const newMessage = document.createElement("h5");
  newMessage.innerText = `${from} says: ${msg}`;
  myMessages.appendChild(newMessage);
}

function addPlayerToLobby(id) {
  if (!playersInLobby.includes("Player " + id)) {
    playersInLobby.push("Player " + id);
  }
  updateLobby();
}

function removePlayerFromLobby(id) {
  playersInLobby = playersInLobby.filter((player) => {
    return player != "Player " + id;
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

//enabling send message when connection is open
mywsServer.onopen = function () {
  sendBtn.disabled = false;
};

//handling message event
mywsServer.onmessage = function (event) {
  const { data } = event;
  if (data.startsWith("joined")) {
    const id = data.split(" ")[1];
    addPlayerToLobby(id);
  } else if (data.startsWith("left")) {
    const id = data.split(" ")[1];
    removePlayerFromLobby(id);
  } else {
    msgGeneration(data, "Server");
  }
};
