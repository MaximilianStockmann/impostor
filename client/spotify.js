const clientId = "fbf7ad7aa9d74a60ac9880683927258d"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
let chosenDevice;
const playBtn = document.getElementById("play");

export let accessToken;

if (!code) {
  redirectToAuthCodeFlow(clientId);
} else {
  accessToken = await getAccessToken(clientId, code);
  const profile = await fetchProfile(accessToken);
  console.log(profile); // Profile data logs to console

  playBtn.addEventListener("click", (event) => {
    playSong(accessToken);
  });

  try {
    const pbStatus = await getPlaybackStatus(accessToken);
    console.log(pbStatus);
  } catch {}

  try {
    const devices = await getDevices(accessToken);
    console.log(devices);
    renderDevices(devices);
  } catch {}

  populateUI(profile);
}

export async function redirectToAuthCodeFlow(clientId) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:3000");
  params.append(
    "scope",
    "user-read-private user-read-email user-read-playback-state user-modify-playback-state"
  );
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function getAccessToken(clientId, code) {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://localhost:3000");
  params.append("code_verifier", verifier);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchProfile(token) {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return await result.json();
}

function populateUI(profile) {
  document.getElementById("displayName").innerText = profile.display_name;
  if (profile.images[0]) {
    const profileImage = new Image(200, 200);
    profileImage.src = profile.images[0].url;
    document.getElementById("avatar").appendChild(profileImage);
    document.getElementById("imgUrl").innerText = profile.images[0].url;
  }
  document.getElementById("id").innerText = profile.id;
  document.getElementById("email").innerText = profile.email;
  document.getElementById("uri").innerText = profile.uri;
  document
    .getElementById("uri")
    .setAttribute("href", profile.external_urls.spotify);
  document.getElementById("url").innerText = profile.href;
  document.getElementById("url").setAttribute("href", profile.href);
}

export async function getPlaybackStatus(token) {
  const result = await fetch("https://api.spotify.com/v1/me/player", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    let data = result.json();
    return data;
  } catch (e) {
    console.log("It's fine");
    return {};
  }
}

export async function getDevices(token) {
  const result = await fetch("https://api.spotify.com/v1/me/player/devices", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    let data = result.json();
    return data;
  } catch (e) {
    return {};
  }
}

function renderDevices(devices) {
  const deviceList = document.getElementById("devices");

  devices.devices.forEach((device) => {
    const entry = document.createElement("button");
    entry.addEventListener("click", (ev) => {
      chosenDevice = device;
      console.log(chosenDevice);
    });
    entry.innerText = device.name;
    deviceList.appendChild(entry);
  });
}

export async function playSong(token, songId) {
  const requestBody = {
    uris: [`spotify:track:${songId}`],
    position_ms: 0,
  };

  const result = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${chosenDevice.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    }
  );
}
