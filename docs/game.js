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
  elements.progressFill1 = document.getElementById("progressFill1");
  elements.progressText1 = document.getElementById("progressText1");
  elements.progressFill2 = document.getElementById("progressFill2");
  elements.progressText2 = document.getElementById("progressText2");

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
  showGreenLight();
  playAudio("./audios/audio_green.mp3");
  scheduleNextLightChange();
}

function scheduleNextLightChange() {
  if (!gameState.isGameActive) return;
  const minTime = gameState.isGreenLight ? 2000 : 3000;
  const maxTime = gameState.isGreenLight ? 5000 : 8000;
  const randomTime = Math.random() * (maxTime - minTime) + minTime;

  gameState.lightChangeTimeout = setTimeout(toggleLight, randomTime);
}

function toggleLight() {
  if (!gameState.isGameActive) return;
  gameState.isGreenLight = !gameState.isGreenLight;

  if (gameState.isGreenLight) {
    showGreenLight();
    playAudio("./audios/audio_green.mp3");
  } else {
    showRedLight();
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
  const el = elements[playerKey];
  player.lastMoveTime = Date.now();
  player.isMoving = true;
  player.moveCount++;

  el.firstElementChild.classList.add("bounce");
  setTimeout(() => {
    el.firstElementChild.classList.remove("bounce");
    player.isMoving = false;
  }, 200);

  if (!gameState.isGreenLight) {
    eliminatePlayer(playerKey);
    return;
  }

  const moveDistance = 3;
  let newX = player.x;
  let newY = player.y;
  if (direction === "up") newY = Math.max(5, newY - moveDistance);
  if (direction === "down") newY = Math.min(90, newY + moveDistance);
  if (direction === "left") newX = Math.max(5, newX - moveDistance);
  if (direction === "right") newX = Math.min(95, newX + moveDistance);
  player.x = newX;
  player.y = newY;
  updatePlayerPosition(playerKey);
  updateProgress();
  if (newY <= 15) victory(playerKey);

  const animParts = ["step1", "step2", "shin1", "shin2"];
  animParts.forEach((cls) => {
    el.querySelectorAll("." + cls).forEach((part) => part.classList.add(cls));
  });
  setTimeout(() => {
    animParts.forEach((cls) => {
      el.querySelectorAll("." + cls).forEach((part) =>
        part.classList.remove(cls)
      );
    });
    player.isMoving = false;
  }, 200);

  el.querySelectorAll(".arm").forEach((arm) =>
    arm.classList.add("step1", "step2")
  );
  el.querySelectorAll(".leg").forEach((leg) =>
    leg.classList.add("shin1", "shin2")
  );
  setTimeout(() => {
    el.querySelectorAll(".arm").forEach((arm) =>
      arm.classList.remove("step1", "step2")
    );
    el.querySelectorAll(".leg").forEach((leg) =>
      leg.classList.remove("shin1", "shin2")
    );
  }, 200);
}

function updatePlayerPosition(playerKey) {
  const el = elements[playerKey];
  const player = gameState.players[playerKey];
  el.style.left = player.x + "%";
  el.style.bottom = 100 - player.y + "%";
}

function updateProgress() {
  const p1 = ((90 - gameState.players.player1.y) / 75) * 100;
  const p2 = ((90 - gameState.players.player2.y) / 75) * 100;
  elements.progressFill1.style.width = p1 + "%";
  elements.progressText1.textContent = Math.round(p1) + "%";
  elements.progressFill2.style.width = p2 + "%";
  elements.progressText2.textContent = Math.round(p2) + "%";
}

function eliminatePlayer(playerKey) {
  gameState.isGameActive = false;
  elements[playerKey].classList.add("eliminated");
  clearTimeout(gameState.lightChangeTimeout);
  clearInterval(gameState.gameInterval);

  setTimeout(() => {
    const t = gameState.currentTimer.toFixed(1);
    const p = Math.max(0, ((90 - gameState.players[playerKey].y) / 75) * 100);
    elements.finalStats.innerHTML = `Player: ${playerKey.toUpperCase()}<br>Time Remaining: ${t}s<br>Progress: ${Math.round(
      p
    )}%<br>Moves Made: ${gameState.players[playerKey].moveCount}`;
    elements.gameOver.classList.remove("hidden");
    playAudio("./audios/audio_eliminated.mp3");
  }, 1000);
}

function victory(playerKey) {
  gameState.isGameActive = false;
  clearTimeout(gameState.lightChangeTimeout);
  clearInterval(gameState.gameInterval);
  const t = gameState.currentTimer.toFixed(1);
  elements.victoryStats.innerHTML = `Player: ${playerKey.toUpperCase()}<br>Time Left: ${t}s<br>Total Moves: ${
    gameState.players[playerKey].moveCount
  }<br>🏆 YOU SURVIVED! 🏆`;
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
        eliminatePlayer("player2");
      }
    }
  }, 100);
}

let currentAudio = null;
function playAudio(path) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(path);
  currentAudio.play().catch(() => {});
}

document.addEventListener("keydown", (e) => {
  if (!gameState.isGameActive) return;
  const keyMap = {
    ArrowUp: ["player2", "up"],
    ArrowDown: ["player2", "down"],
    ArrowLeft: ["player2", "left"],
    ArrowRight: ["player2", "right"],
    w: ["player1", "up"],
    W: ["player1", "up"],
    s: ["player1", "down"],
    S: ["player1", "down"],
    a: ["player1", "left"],
    A: ["player1", "left"],
    d: ["player1", "right"],
    D: ["player1", "right"],
  };
  const [player, dir] = keyMap[e.key] || [];
  if (player) movePlayer(player, dir);
});

function getAngryDollHTML() {
  return `
    <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[130px] rounded-full hair z-20 flex items-center justify-center">
      <div class="relative w-[100px] h-[100px] bg-[#f5d6b4] rounded-full flex items-center justify-center">
        <div class="absolute top-[35%] left-[24%] w-[16px] h-[16px] bg-[#c79b82] opacity-40 rounded-full"></div>
        <div class="absolute top-[35%] right-[24%] w-[16px] h-[16px] bg-[#c79b82] opacity-40 rounded-full"></div>
        <div class="absolute top-[37%] left-[26%] w-[12px] h-[12px] bg-red-600 rounded-full eye-glow"></div>
        <div class="absolute top-[37%] right-[26%] w-[12px] h-[12px] bg-red-600 rounded-full eye-glow"></div>
        <div class="absolute top-[28%] left-[20%] w-[26px] h-[5px] bg-black rotate-[-45deg] rounded-full"></div>
        <div class="absolute top-[28%] right-[20%] w-[26px] h-[5px] bg-black rotate-[45deg] rounded-full"></div>
        <div class="absolute bottom-[26%] left-1/2 transform -translate-x-1/2 translate-y-1 text-[10px] text-white font-bold">&#9632;&#9632;&#9632;</div>
        <div class="absolute top-[45%] left-1/2 w-[6px] h-[6px] bg-[#d1a28a] rounded-full transform -translate-x-1/2 opacity-30"></div>
      </div>
    </div>`;
}

function showGreenLight() {
  elements.lightIndicator.className = "w-5 h-5 rounded-full bg-green-500";
  elements.gameStatus.textContent = "GREEN LIGHT - GO!";
  elements.dollImage.innerHTML = `<div class='w-[100px] h-[100px] rounded-full hair relative'></div>`;
}

function showRedLight() {
  elements.lightIndicator.className = "w-5 h-5 rounded-full bg-red-500";
  elements.gameStatus.textContent = "RED LIGHT - STOP!";
  elements.dollImage.innerHTML = getAngryDollHTML();
}
