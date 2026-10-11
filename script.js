console.log("Updated shuffle code loaded");
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
    image: "Skin.jpg",
    audio: "audio/Skin.mp3",
    start: 34,
    end: 47
  },
  {
    name: "Stuck in Between",
    image: "Stuck in Between.jpg",
    audio: "audio/Stuck in Between.mp3",
    start: 38,
    end: 61
  }
];

// Create a player below the result.
const songAudio = document.createElement("audio");
songAudio.controls = true;
songAudio.hidden = true;
songAudio.preload = "metadata";
songAudio.style.margin = "16px 0";
songAudio.style.width = "min(320px, 100%)";
result.after(songAudio);

let currentAudioSong = null;
let audioRevealed = false;

function prepareAudio(song) {
  songAudio.pause();
  currentAudioSong = song;
  audioRevealed = false;

  songAudio.src = song.audio;
  songAudio.hidden = true;
  songAudio.muted = true;

  songAudio.play().catch(function () {});
}

function revealAudio() {
  if (!currentAudioSong) return;

  audioRevealed = true;
  songAudio.currentTime = currentAudioSong.start;
  songAudio.muted = false;
  songAudio.hidden = false;

  songAudio.play().catch(function () {
    console.log("Tap the audio player to hear your song.");
  });
}

// Stop at the end of the chosen clip.
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

const storageKey = "becky-song-results";
let songResults = [];

// Restore the list, or migrate the previous single saved result.
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
  console.log("Couldn't restore saved results.");
}

// Preload both images.
songs.forEach(function (song) {
  const image = new Image();
  image.src = song.image;
});

function showCover(song) {
  songCover.src = song.image;
  songCover.alt = song.name + " song cover";
}

function updateHistory() {
  resultsList.replaceChildren();

  songResults.forEach(function (name) {
    const item = document.createElement("li");
    item.textContent = name;
    resultsList.appendChild(item);
  });

  songHistory.hidden = songResults.length === 0;
}

function showResult(song) {
  description.hidden = true;
  mysteryCover.hidden = true;
  songCover.hidden = false;
  showCover(song);

  result.textContent = "You got: " + song.name + "!";
  spinButton.hidden = true;
  spinButton.disabled = false;
  anotherSetButton.hidden = false;
}

spinButton.addEventListener("click", function () {
  if (spinButton.disabled) return;

  mysteryCover.hidden = true;
  songCover.hidden = false;
  coverContainer.classList.remove("revealed");

  let chosenSong;

if (songResults.length === 1) {
  // Give the other song on their second play.
  chosenSong = songs.find(function (song) {
    return song.name !== songResults[0];
  });
} else {
  // Keep the first play random.
  chosenSong = songs[Math.floor(Math.random() * songs.length)];
}

  prepareAudio(chosenSong);
spinButton.disabled = true;
  spinButton.disabled = true;
  description.hidden = true;
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
        console.log("Couldn't save results in this browser.");
      }

      showResult(chosenSong);
updateHistory();
coverContainer.classList.add("revealed");
revealAudio();
    }
  }

  shuffle();
});

anotherSetButton.addEventListener("click", function () {
  // Bring back the mystery cover while keeping previous results.
    songAudio.pause();
  audioRevealed = false;
  songAudio.currentTime = 0;
  songAudio.hidden = true;
  description.hidden = false;
  mysteryCover.hidden = false;
  songCover.hidden = true;
  coverContainer.classList.remove("revealed");

  result.textContent = "";
  anotherSetButton.hidden = true;
  spinButton.hidden = false;
  spinButton.disabled = false;
  spinButton.textContent = "Find my song ✨";
});

// Show the latest result when reopening the page.
updateHistory();

if (songResults.length > 0) {
  const latestName = songResults[songResults.length - 1];
  const latestSong = songs.find(function (song) {
    return song.name === latestName;
  });

  showResult(latestSong);
}
