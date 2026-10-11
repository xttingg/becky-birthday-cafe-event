const spinButton = document.getElementById("spin-button");
const result = document.getElementById("result");
const songCover = document.getElementById("song-cover");
const coverContainer = document.querySelector(".cover-container");
const mysteryCover = document.getElementById("mystery-cover");
const anotherSetButton = document.getElementById("another-set-button");
const songHistory = document.getElementById("song-history");
const resultsList = document.getElementById("results-list");
const description = document.getElementById("description");

// These files contain only the chorus, so no timestamp jump is needed.
const songs = [
  { name: "Skin", photocard: "3D photocard A", image: "Skin.jpg", audio: "audio/skin-chorus.mp3" },
  { name: "Stuck in Between", photocard: "3D photocard B", image: "Stuck in Between.jpg", audio: "audio/stuck-in-between-chorus.mp3" }
];

const storageKey = "becky-song-results";
let songResults = [];
try {
  const saved = localStorage.getItem(storageKey);
  if (saved !== null) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      songResults = parsed.filter(name => songs.some(song => song.name === name));
    }
  } else {
    const oldName = localStorage.getItem("becky-song");
    if (songs.some(song => song.name === oldName)) {
      songResults = [oldName];
      localStorage.setItem(storageKey, JSON.stringify(songResults));
      localStorage.removeItem("becky-song");
    }
  }
} catch (error) {
  console.log("Couldn't restore results.", error);
}

songs.forEach(song => {
  const image = new Image();
  image.src = song.image;
});

const songAudio = document.createElement("audio");
songAudio.controls = false;
songAudio.hidden = true;
songAudio.preload = "auto";
document.body.appendChild(songAudio);

const musicButton = document.createElement("button");
musicButton.type = "button";
musicButton.hidden = true;
musicButton.textContent = "▶ Play song";
musicButton.style.margin = "10px 0";
musicButton.style.fontSize = "14px";
musicButton.style.padding = "10px 18px";
result.after(musicButton);

let audioRevealed = false;
let audioVersion = 0;

function updateMusicButton() {
  musicButton.textContent = songAudio.paused ? "▶ Play song" : "❚❚ Pause song";
}

function stopAudio() {
  audioVersion++;
  audioRevealed = false;
  songAudio.pause();
  musicButton.hidden = true;
}

function prepareAudio(song) {
  stopAudio();
  const version = audioVersion;
  songAudio.src = song.audio;
  songAudio.muted = true;
  // Try to prepare audio during the fan's tap, keeping it silent.
  songAudio.play().then(() => {
    if (version === audioVersion && !audioRevealed) {
      songAudio.pause();
      songAudio.currentTime = 0;
    }
  }).catch(() => {});
}

function playMusic() {
  songAudio.muted = false;
  songAudio.play().then(updateMusicButton).catch(() => {
    updateMusicButton();
  });
}

function revealAudio() {
  audioRevealed = true;
  musicButton.hidden = false;
  playMusic();
}

songAudio.addEventListener("play", updateMusicButton);
songAudio.addEventListener("pause", updateMusicButton);
songAudio.addEventListener("ended", updateMusicButton);

musicButton.addEventListener("click", () => {
  if (!audioRevealed) return;
  if (songAudio.paused) {
    if (songAudio.ended) songAudio.currentTime = 0;
    playMusic();
  } else {
    songAudio.pause();
  }
});

function showCover(song) {
  songCover.src = song.image;
  songCover.alt = song.name + " song cover";
}

function updateHistory() {
  resultsList.replaceChildren();
  songResults.forEach(name => {
    const song = songs.find(song => song.name === name);
    const item = document.createElement("li");
    item.textContent = song.name + " + " + song.photocard;
    resultsList.appendChild(item);
  });
  songHistory.hidden = songResults.length === 0;
}

function showResult(song) {
  description.hidden = true;
  mysteryCover.hidden = true;
  songCover.hidden = false;
  showCover(song);
  result.textContent = "You got: " + song.name + " + " + song.photocard + "!";
  spinButton.hidden = true;
  spinButton.disabled = false;
  anotherSetButton.hidden = false;
}

function showStart() {
  stopAudio();
  description.hidden = false;
  mysteryCover.hidden = false;
  songCover.hidden = true;
  coverContainer.classList.remove("revealed");
  result.textContent = "";
  anotherSetButton.hidden = true;
  spinButton.hidden = false;
  spinButton.disabled = false;
  spinButton.textContent = "Find my song ✨";
}

spinButton.addEventListener("click", () => {
  if (spinButton.disabled) return;
  const chosenSong = songResults.length === 1
    ? songs.find(song => song.name !== songResults[0])
    : songs[Math.floor(Math.random() * songs.length)];

  spinButton.disabled = true;
  prepareAudio(chosenSong);
  description.hidden = true;
  mysteryCover.hidden = true;
  songCover.hidden = false;
  coverContainer.classList.remove("revealed");
  spinButton.textContent = "Finding your song…";
  result.textContent = "";

  let switches = 0;
  let coverIndex = 0;
  function shuffle() {
    showCover(songs[coverIndex]);
    coverIndex = (coverIndex + 1) % songs.length;
    switches++;
    if (switches < 14) {
      setTimeout(shuffle, 80 + switches * 20);
    } else {
      songResults.push(chosenSong.name);
      try {
        localStorage.setItem(storageKey, JSON.stringify(songResults));
      } catch (error) {
        console.log("Couldn't save results.", error);
      }
      showResult(chosenSong);
      updateHistory();
      coverContainer.classList.add("revealed");
      revealAudio();
    }
  }
  shuffle();
});

anotherSetButton.addEventListener("click", showStart);
updateHistory();
showStart();
