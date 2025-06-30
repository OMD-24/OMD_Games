// game.js

let gameState = {
  isGreenLight: false,
  isGameActive: false,
  players: {
    player1: { x: 40, y: 90, moveCount: 0, isMoving: false, lastMoveTime: 0 },
    player2: { x: 60, y: 90, moveCount: 0, isMoving: false, lastMoveTime: 0 },
  },
  gameStartTime: 0,
  currentTimer: 45.6,
  lightChangeTimeout: null,
  dollLookTimeout: null,
  gameInterval: null,
};

const elements = {};

window.addEventListener("DOMContentLoaded", () => {
  elements.player1 = document.getElementById("player1");
  elements.player2 = document.getElementById("player2");
  elements.dollImage = document.getElementById("dollImage");
  elements.lightIndicator = document.getElementById("lightIndicator");
  elements.gameStatus = document.getElementById("gameStatus");
  elements.timer = document.getElementById("timer");
  elements.progressFill = document.getElementById("progressFill");
  elements.progressText = document.getElementById("progressText");
  elements.instructions = document.getElementById("instructions");
  elements.gameOver = document.getElementById("gameOver");
  elements.victory = document.getElementById("victory");
  elements.finalStats = document.getElementById("finalStats");
  elements.victoryStats = document.getElementById("victoryStats");

  document.querySelectorAll(".control-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const player = btn.dataset.player;
      const dir = btn.dataset.dir;
      movePlayer(player, dir);
    });
  });

  updateProgress();
});

function startGame() {
  elements.instructions.classList.add("hidden");
  elements.gameOver.classList.add("hidden");
  elements.victory.classList.add("hidden");
  gameState.isGameActive = true;
  gameState.gameStartTime = Date.now();
  gameState.currentTimer = 45.6;
  elements.timer.textContent = gameState.currentTimer.toFixed(1);

  gameState.players.player1 = {
    x: 40,
    y: 90,
    moveCount: 0,
    isMoving: false,
    lastMoveTime: 0,
  };
  gameState.players.player2 = {
    x: 60,
    y: 90,
    moveCount: 0,
    isMoving: false,
    lastMoveTime: 0,
  };

  updatePlayerPosition("player1");
  updatePlayerPosition("player2");
  updateProgress();
  startGameTimer();

  gameState.isGreenLight = true;
  elements.lightIndicator.className = "light-indicator bg-green-500";
  elements.gameStatus.textContent = "GREEN LIGHT - GO!";
  elements.dollImage.src = "./images/back.png";
  playAudio("./audios/audio_green.mp3");
  scheduleNextLightChange();
}

function scheduleNextLightChange() {
  if (!gameState.isGameActive) return;
  const minTime = gameState.isGreenLight ? 2000 : 3000;
  const maxTime = gameState.isGreenLight ? 5000 : 8000;
  const randomTime = Math.random() * (maxTime - minTime) + minTime;

  gameState.lightChangeTimeout = setTimeout(() => {
    toggleLight();
  }, randomTime);
}

function toggleLight() {
  if (!gameState.isGameActive) return;

  gameState.isGreenLight = !gameState.isGreenLight;

  if (gameState.isGreenLight) {
    elements.lightIndicator.className = "light-indicator bg-green-500";
    elements.gameStatus.textContent = "GREEN LIGHT - GO!";
    elements.dollImage.src = "./images/back.png";
    playAudio("./audios/audio_green.mp3");
  } else {
    elements.lightIndicator.className = "light-indicator bg-red-500";
    elements.gameStatus.textContent = "RED LIGHT - STOP!";
    elements.dollImage.src = "./images/front.png";
    playAudio("./audios/audio_red.mp3");

    ["player1", "player2"].forEach((playerKey) => {
      const player = gameState.players[playerKey];
      if (player.isMoving || Date.now() - player.lastMoveTime < 300) {
        setTimeout(() => {
          if (!gameState.isGreenLight && gameState.isGameActive) {
            eliminatePlayer(playerKey);
          }
        }, 500);
      }
    });
  }

  scheduleNextLightChange();
}

function movePlayer(playerKey, direction) {
  if (!gameState.isGameActive) return;

  const player = gameState.players[playerKey];
  player.lastMoveTime = Date.now();
  player.isMoving = true;
  player.moveCount++;

  if (!gameState.isGreenLight) {
    eliminatePlayer(playerKey);
    return;
  }

  const moveDistance = 3;
  let newX = player.x;
  let newY = player.y;

  switch (direction) {
    case "up":
      newY = Math.max(5, newY - moveDistance);
      break;
    case "down":
      newY = Math.min(90, newY + moveDistance);
      break;
    case "left":
      newX = Math.max(5, newX - moveDistance);
      break;
    case "right":
      newX = Math.min(95, newX + moveDistance);
      break;
  }

  player.x = newX;
  player.y = newY;

  updatePlayerPosition(playerKey);
  updateProgress();

  if (newY <= 15) {
    victory(playerKey);
  }

  setTimeout(() => {
    player.isMoving = false;
  }, 200);
}

function updatePlayerPosition(playerKey) {
  const el = elements[playerKey];
  const player = gameState.players[playerKey];
  el.style.left = player.x + "%";
  el.style.bottom = 100 - player.y + "%";
}

function updateProgress() {
  const avgProgress =
    (Object.values(gameState.players).reduce(
      (sum, p) => sum + (90 - p.y) / 75,
      0
    ) /
      2) *
    100;
  elements.progressFill.style.width = avgProgress + "%";
  elements.progressText.textContent = Math.round(avgProgress) + "%";
}

function eliminatePlayer(playerKey) {
  gameState.isGameActive = false;
  elements[playerKey].classList.add("eliminated");

  clearTimeout(gameState.lightChangeTimeout);
  clearInterval(gameState.gameInterval);

  setTimeout(() => {
    const timeLeft = gameState.currentTimer.toFixed(1);
    const progress = Math.max(
      0,
      ((90 - gameState.players[playerKey].y) / 75) * 100
    );

    elements.finalStats.innerHTML = `
        Player: ${playerKey.toUpperCase()}<br>
        Time Remaining: ${timeLeft}s<br>
        Progress: ${Math.round(progress)}%<br>
        Moves Made: ${gameState.players[playerKey].moveCount}
      `;

    elements.gameOver.classList.remove("hidden");
    playAudio("./audios/audio_eliminated.mp3");
  }, 1000);
}

function victory(playerKey) {
  gameState.isGameActive = false;

  clearTimeout(gameState.lightChangeTimeout);
  clearInterval(gameState.gameInterval);

  const timeLeft = gameState.currentTimer.toFixed(1);

  elements.victoryStats.innerHTML = `
      Player: ${playerKey.toUpperCase()}<br>
      Time Left: ${timeLeft}s<br>
      Total Moves: ${gameState.players[playerKey].moveCount}<br>
      🏆 YOU SURVIVED! 🏆
    `;

  elements.victory.classList.remove("hidden");
}

function restartGame() {
  startGame();
}

function startGameTimer() {
  gameState.gameInterval = setInterval(() => {
    if (gameState.isGameActive && gameState.currentTimer > 0) {
      gameState.currentTimer -= 0.1;
      elements.timer.textContent = gameState.currentTimer.toFixed(1);

      if (gameState.currentTimer <= 0) {
        eliminatePlayer("player1");
      }
    }
  }, 100);
}

function playAudio(path) {
  const audio = new Audio(path);
  audio.play().catch(() => {});
}

document.addEventListener("keydown", (e) => {
  if (!gameState.isGameActive) return;

  switch (e.key) {
    case "ArrowUp":
      movePlayer("player2", "up");
      break;
    case "ArrowDown":
      movePlayer("player2", "down");
      break;
    case "ArrowLeft":
      movePlayer("player2", "left");
      break;
    case "ArrowRight":
      movePlayer("player2", "right");
      break;
    case "w":
    case "W":
      movePlayer("player1", "up");
      break;
    case "s":
    case "S":
      movePlayer("player1", "down");
      break;
    case "a":
    case "A":
      movePlayer("player1", "left");
      break;
    case "d":
    case "D":
      movePlayer("player1", "right");
      break;
  }
});
