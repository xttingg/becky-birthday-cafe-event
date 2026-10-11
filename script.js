const spinButton = document.getElementById("spin-button");
const result = document.getElementById("result");
const songCover = document.getElementById("song-cover");
const coverContainer = document.querySelector(".cover-container");
const mysteryCover = document.getElementById("mystery-cover");
const anotherSetButton = document.getElementById("another-set-button");
const songHistory = document.getElementById("song-history");
const resultsList = document.getElementById("results-list");
const description = document.getElementById("description");

const songs = [
  {
    name: "Skin",
    photocard: "3D photocard A",
    image: "Skin.jpg",
    audio: "audio/Skin.mp3",
    start: 34,
    end: 47
  },
  {
    name: "Stuck in Between",
    photocard: "3D photocard B",
    image: "Stuck in Between.jpg",
    audio: "audio/Stuck in Between.mp3",
    start: 38,
    end: 61
  }
];

// Save results in this browser.
const storageKey = "becky-song-results";
let songResults = [];

try {
  const savedList = localStorage.getItem(storageKey);

  if (savedList !== null) {
    const parsedList = JSON.parse(savedList);

    if (Array.isArray(parsedList)) {
      songResults = parsedList.filter(function (name) {
        return songs.some(function (song) {
          return song.name === name;
        });
      });
    }
  } else {
    const oldName = localStorage.getItem("becky-song");

    if (songs.some(function (song) {
      return song.name === oldName;
    })) {
      songResults = [oldName];
      localStorage.setItem(storageKey, JSON.stringify(songResults));
      localStorage.removeItem("becky-song");
    }
  }
} catch (error) {
  console.log("Couldn't restore saved results.", error);
}

// Preload the covers.
songs.forEach(function (song) {
  const image = new Image();
  image.src = song.image;
});

// Hidden audio player.
const songAudio = document.createElement("audio");
songAudio.controls = false;
songAudio.hidden = true;
songAudio.preload = "auto";
document.body.appendChild(songAudio);

// Small sound button instead of the media player.
const musicButton = document.createElement("button");
musicButton.type = "button";
musicButton.textContent = "▶ Play song";
musicButton.hidden = true;
musicButton.style.margin = "10px 0";
musicButton.style.fontSize = "14px";
musicButton.style.padding = "10px 18px";
result.after(musicButton);

let currentAudioSong = null;
let audioRevealed = false;

function stopAudio() {
  audioRevealed = false;
  songAudio.pause();
  musicButton.hidden = true;
}

function prepareAudio(song) {
  stopAudio();
  currentAudioSong = song;
  songAudio.src = song.audio;
  songAudio.muted = true;

  // Prepare playback during the original button tap.
  songAudio.play().catch(function (error) {
    console.log("Audio preparation:", error.name);
  });
}

function playChorus() {
  if (!currentAudioSong || !audioRevealed) return;

  songAudio.currentTime = currentAudioSong.start;
  songAudio.muted = false;

  songAudio.play().catch(function (error) {
    musicButton.textContent = "▶ Play song";
    console.log("Tap Play song to start audio.", error);
  });
}

function revealAudio() {
  audioRevealed = true;
  musicButton.hidden = false;
  musicButton.textContent = "▶ Play song";

  if (songAudio.readyState >= 1) {
    playChorus();
  }
}

// Handle audio that finishes loading after the reveal.
songAudio.addEventListener("loadedmetadata", function () {
  if (audioRevealed) {
    playChorus();
  }
});

songAudio.addEventListener("play", function () {
  musicButton.textContent = "❚❚ Pause song";
});

songAudio.addEventListener("pause", function () {
  musicButton.textContent = "▶ Play song";
});

// Stop the clip and return to its beginning.
songAudio.addEventListener("timeupdate", function () {
  if (
    audioRevealed &&
    currentAudioSong &&
    songAudio.currentTime >= currentAudioSong.end
  ) {
    songAudio.pause();
    songAudio.currentTime = currentAudioSong.start;
  }
});

musicButton.addEventListener("click", function () {
  if (!currentAudioSong || !audioRevealed) return;

  if (songAudio.paused) {
    if (
      songAudio.currentTime < currentAudioSong.start ||
      songAudio.currentTime >= currentAudioSong.end
    ) {
      songAudio.currentTime = currentAudioSong.start;
    }

    songAudio.muted = false;

    songAudio.play().catch(function (error) {
      console.log("Couldn't play the song.", error);
    });
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

  songResults.forEach(function (name) {
    const song = songs.find(function (song) {
      return song.name === name;
    });

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

  result.textContent =
    "You got: " + song.name + " + " + song.photocard + "!";

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

spinButton.addEventListener("click", function () {
  if (spinButton.disabled) return;

  let chosenSong;

  if (songResults.length === 1) {
    // Second play gives the other song and photocard.
    chosenSong = songs.find(function (song) {
      return song.name !== songResults[0];
    });
  } else {
    // First and third onwards are random.
    chosenSong = songs[Math.floor(Math.random() * songs.length)];
  }

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

// Open on the mystery cover, keeping previous history.
updateHistory();
showStart();
