// Retro Space Invaders in Pure JS and SVG
// Faithful replica of the 1978 original arcade game

// Global error catcher for visual debugging
window.onerror = function(message, source, lineno, colno, error) {
  const errorMsg = `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nStack: ${error ? error.stack : 'N/A'}`;
  console.error(errorMsg);
  let errDiv = document.getElementById('debug-error-overlay');
  if (!errDiv) {
    errDiv = document.createElement('div');
    errDiv.id = 'debug-error-overlay';
    errDiv.style.position = 'absolute';
    errDiv.style.top = '10px';
    errDiv.style.left = '10px';
    errDiv.style.right = '10px';
    errDiv.style.background = 'rgba(255, 0, 0, 0.9)';
    errDiv.style.color = 'white';
    errDiv.style.padding = '15px';
    errDiv.style.fontFamily = 'monospace';
    errDiv.style.fontSize = '12px';
    errDiv.style.zIndex = '99999';
    errDiv.style.whiteSpace = 'pre-wrap';
    errDiv.style.border = '2px solid white';
    document.body.appendChild(errDiv);
  }
  errDiv.textContent = errorMsg;
  return false;
};

// -------------------------------------------------------------
// 1. STATE MACHINE & CONFIG
// -------------------------------------------------------------
const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  EXPLODING: 'EXPLODING', // Player dying animation pause
  WIN: 'WIN',             // Wave complete transition
  GAME_OVER: 'GAME_OVER'
};

let currentState = STATES.MENU;
let score = 0;
let highScore = parseInt(localStorage.getItem('space_invaders_hi_score') || '0', 10);
let lives = 3;
let wave = 1;
let gameTime = 0;

// Dimensions matching original arcade aspect ratio
const CANVAS_WIDTH = 224;
const CANVAS_HEIGHT = 256;

// -------------------------------------------------------------
// 2. INPUT HANDLER
// -------------------------------------------------------------
const keys = {
  Left: false,
  Right: false,
  Space: false
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.Left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.Right = true;
  if (e.key === ' ') {
    keys.Space = true;
    e.preventDefault(); // Prevent page scrolling
  }
  
  if (e.key === 'p' || e.key === 'P') {
    if (currentState === STATES.PLAYING) {
      currentState = STATES.PAUSED;
      updateOverlay();
    } else if (currentState === STATES.PAUSED) {
      currentState = STATES.PLAYING;
      updateOverlay();
    }
  }

  if (e.key === 'Enter') {
    if (currentState === STATES.MENU) {
      initAudio();
      startGame();
    } else if (currentState === STATES.GAME_OVER) {
      startGame();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.Left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.Right = false;
  if (e.key === ' ') keys.Space = false;
});

  // Mobile Controls
  const joystick = document.getElementById('joystick');
  const btnFire = document.getElementById('btn-fire');

  if (joystick && btnFire) {
    const updateJoystick = (e) => {
      // Use targetTouches to ensure we track the touch specifically on the joystick,
      // fallback to changedTouches, or finally clientX for mouse events.
      let clientX;
      if (e.targetTouches && e.targetTouches.length > 0) {
        clientX = e.targetTouches[0].clientX;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
      } else {
        clientX = e.clientX;
      }
      const rect = joystick.getBoundingClientRect();
      const x = clientX - rect.left;
      const mid = rect.width / 2;
      
      if (x < mid) {
        keys.Left = true;
        keys.Right = false;
      } else {
        keys.Left = false;
        keys.Right = true;
      }
    };

    // Touch events
    joystick.addEventListener('touchstart', (e) => { e.preventDefault(); updateJoystick(e); }, { passive: false });
    joystick.addEventListener('touchmove', (e) => { e.preventDefault(); updateJoystick(e); }, { passive: false });
    joystick.addEventListener('touchend', (e) => {
      e.preventDefault();
      keys.Left = false;
      keys.Right = false;
    }, { passive: false });
    joystick.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      keys.Left = false;
      keys.Right = false;
    }, { passive: false });

    // Mouse events as fallback for touch-screen laptops or for testing
    joystick.addEventListener('mousedown', (e) => { updateJoystick(e); });
    joystick.addEventListener('mousemove', (e) => { if(e.buttons === 1) updateJoystick(e); });
    joystick.addEventListener('mouseup', () => { keys.Left = false; keys.Right = false; });
    joystick.addEventListener('mouseleave', () => { keys.Left = false; keys.Right = false; });

    btnFire.addEventListener('touchstart', (e) => {
      e.preventDefault();
      keys.Space = true;
      
      // Also handle start/restart on fire button if in appropriate state
      if (currentState === STATES.MENU || currentState === STATES.GAME_OVER) {
        initAudio();
        startGame();
      }
    }, { passive: false });
    
    btnFire.addEventListener('touchend', (e) => {
      e.preventDefault();
      keys.Space = false;
    }, { passive: false });

    // Mouse events for fire button
    btnFire.addEventListener('mousedown', () => { keys.Space = true; });
    btnFire.addEventListener('mouseup', () => { keys.Space = false; });
  }


// Click to focus and start/restart the game
window.addEventListener('click', () => {
  if (currentState === STATES.MENU) {
    initAudio();
    startGame();
  } else if (currentState === STATES.GAME_OVER) {
    startGame();
  }
});

// -------------------------------------------------------------
// 3. PIXEL ART SPRITES & SVG PATHS
// -------------------------------------------------------------
// Helper to turn 1/0 pixel art matrices into compact SVG paths
function matrixToPath(matrix) {
  let d = "";
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === '1') {
        d += `M${x},${y}h1v1h-1z `;
      }
    }
  }
  return d;
}

// 8x8 Octopus (Top row, 30 pts)
const OCTOPUS_M1 = [
  "   11   ",
  "  1111  ",
  " 111111 ",
  "11 11 11",
  "11111111",
  "  1  1  ",
  " 1 11 1 ",
  "1 1  1 1"
];
const OCTOPUS_M2 = [
  "   11   ",
  "  1111  ",
  " 111111 ",
  "11 11 11",
  "11111111",
  " 1 11 1 ",
  "1      1",
  " 1    1 "
];

// 11x8 Crab (Middle rows, 20 pts)
const CRAB_M1 = [
  "  1     1  ",
  "   1   1   ",
  "  1111111  ",
  " 11 111 11 ",
  "11111111111",
  "1 1111111 1",
  "1 1     1 1",
  "   11   11 "
];
const CRAB_M2 = [
  "  1     1  ",
  "1  1   1  1",
  "1 1111111 1",
  "111 111 111",
  "11111111111",
  "  1111111  ",
  "  1     1  ",
  " 1       1 "
];

// 12x8 Squid (Bottom rows, 10 pts)
const SQUID_M1 = [
  "    1111    ",
  " 1111111111 ",
  "111111111111",
  "111  11  111",
  "111111111111",
  "   11  11   ",
  "  11 11 11  ",
  "11        11"
];
const SQUID_M2 = [
  "    1111    ",
  " 1111111111 ",
  "111111111111",
  "111  11  111",
  "111111111111",
  "  111  111  ",
  " 11      11 ",
  "  11    11  "
];

// 16x7 Mystery UFO
const UFO_M = [
  "     111111     ",
  "   1111111111   ",
  "  111111111111  ",
  " 11 11 11 11 11 ",
  "1111111111111111",
  "   11  11  11   ",
  "    1      1    "
];

// 15x8 Player Tank
const PLAYER_M = [
  "       1       ",
  "      111      ",
  "      111      ",
  " 1111111111111 ",
  "111111111111111",
  "111111111111111",
  "111111111111111",
  "111111111111111"
];

// Player explosion frames for animation
const PLAYER_EXP1 = [
  "       1       ",
  "   1  111  1   ",
  "  1    1    1  ",
  " 11 1 1 1 1 11 ",
  "1  1  1  1  1  1",
  " 1   1 1 1   1 ",
  "  1         1  ",
  "   1       1   "
];

const PLAYER_EXP2 = [
  "               ",
  "   1       1   ",
  "  1  1   1  1  ",
  " 1    1 1    1 ",
  "1      1      1",
  " 1    1 1    1 ",
  "  1  1   1  1  ",
  "   1       1   "
];

// Compile paths
const PATHS = {
  OCTOPUS: [matrixToPath(OCTOPUS_M1), matrixToPath(OCTOPUS_M2)],
  CRAB: [matrixToPath(CRAB_M1), matrixToPath(CRAB_M2)],
  SQUID: [matrixToPath(SQUID_M1), matrixToPath(SQUID_M2)],
  UFO: matrixToPath(UFO_M),
  PLAYER: matrixToPath(PLAYER_M),
  PLAYER_EXP: [matrixToPath(PLAYER_EXP1), matrixToPath(PLAYER_EXP2)]
};

// -------------------------------------------------------------
// 4. PROCEDURAL SOUNDS (Web Audio API Synthesizer)
// -------------------------------------------------------------
let audioContext = null;

function initAudio() {
  if (audioContext) return;
  // Initialize context on standard user interaction
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

// Simple synthesizer play helpers
function playLaser() {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioContext.currentTime);
  // Sweet high-pitched sweep up
  osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.12);
  
  gain.gain.setValueAtTime(0.08, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.12);
}

function playAlienDeath() {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, audioContext.currentTime);
  osc.frequency.linearRampToValueAtTime(40, audioContext.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0.12, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.15);
}

function playPlayerExplosion() {
  if (!audioContext) return;
  // Synthesize noise explosion
  const bufferSize = audioContext.sampleRate * 0.5; // 0.5 seconds
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Fill buffer with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseNode = audioContext.createBufferSource();
  noiseNode.buffer = buffer;
  
  // Custom filter to make it rumbling and deep
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.5);
  
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.25, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  
  noiseNode.start();
  noiseNode.stop(audioContext.currentTime + 0.5);
}

// Decending Heartbeat Bass notes (4 notes loop)
const heartbeatFreqs = [110, 98, 87, 73]; // A2, G2, F2, D2
function playHeartbeat(index) {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(heartbeatFreqs[index % 4], audioContext.currentTime);
  
  gain.gain.setValueAtTime(0.25, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.18);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.18);
}

// Looping red UFO siren
let ufoOsc = null;
let ufoGain = null;
let ufoLfo = null;
function startUFOSiren() {
  if (!audioContext || ufoOsc) return;
  
  ufoOsc = audioContext.createOscillator();
  ufoGain = audioContext.createGain();
  
  ufoOsc.type = 'triangle';
  ufoOsc.frequency.setValueAtTime(600, audioContext.currentTime);
  
  // Modulate frequency to create the wailing siren effect
  ufoLfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();
  ufoLfo.frequency.value = 6; // Speed of wail
  lfoGain.gain.value = 150; // Range of wail (450Hz to 750Hz)
  
  ufoLfo.connect(lfoGain);
  lfoGain.connect(ufoOsc.frequency);
  
  ufoGain.gain.setValueAtTime(0.06, audioContext.currentTime);
  
  ufoOsc.connect(ufoGain);
  ufoGain.connect(audioContext.destination);
  
  ufoLfo.start();
  ufoOsc.start();
}

function stopUFOSiren() {
  if (ufoOsc) {
    try {
      ufoOsc.stop();
    } catch(e) {}
    ufoOsc = null;
    ufoGain = null;
  }
  if (ufoLfo) {
    try {
      ufoLfo.stop();
    } catch(e) {}
    ufoLfo = null;
  }
}

// -------------------------------------------------------------
// 5. GAME ENTITIES & INITIALIZATION
// -------------------------------------------------------------
let player = {
  x: 105,
  y: 226,
  width: 15,
  height: 8,
  speed: 80, // Pixels per second
  bullet: null,
  explodingFrame: 0,
  explosionTime: 0
};

let aliens = [];
let gridX = 20;
let gridY = 40;
let gridDir = 1;
let tickTimer = 0;
let heartbeatIndex = 0;
let alienStepSize = 3;
let shouldDrop = false;

// Aliens grid spec: 11 columns, 5 rows
const ALIEN_COLS = 11;
const ALIEN_ROWS = 5;
const ALIEN_WIDTH = 12;
const ALIEN_HEIGHT = 8;
const ALIEN_COL_SPACING = 16;
const ALIEN_ROW_SPACING = 12;

let ufo = {
  x: -20,
  y: 20,
  width: 16,
  height: 7,
  speed: 40,
  active: false,
  timer: 0,
  nextSpawn: 0
};

let enemyMissiles = [];
let nextEnemyFireTime = 0;

// Destructible Bunkers Setup
// 4 bunkers. Each made of 12x8 blocks of 2x2 pixels.
let bunkerBlocks = [];

function initBunkers() {
  bunkerBlocks = [];
  const bunkerLayout = [
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,0,0,0,0,1,1,1,1],
    [1,1,1,0,0,0,0,0,0,1,1,1],
    [1,1,1,0,0,0,0,0,0,1,1,1]
  ];

  const bunkerPositionsX = [25, 75, 125, 175];
  const bunkerY = 196;

  bunkerPositionsX.forEach((bx, bIndex) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 12; c++) {
        if (bunkerLayout[r][c] === 1) {
          bunkerBlocks.push({
            id: `b-${bIndex}-${r}-${c}`,
            x: bx + c * 2,
            y: bunkerY + r * 2,
            width: 2,
            height: 2,
            alive: true
          });
        }
      }
    }
  });

  renderBunkers();
}

function initAliens() {
  aliens = [];
  gridX = 18;
  gridY = 44 + (wave - 1) * 6; // Move down starting position slightly in higher waves
  if (gridY > 80) gridY = 80;  // Cap vertical drop start
  gridDir = 1;

  for (let r = 0; r < ALIEN_ROWS; r++) {
    // Row 0 = Octopus, Rows 1 & 2 = Crab, Rows 3 & 4 = Squid (as per dev.md spec)
    let type = 'OCTOPUS';
    let pts = 30;
    let fill = '#ff00ff'; // Colorful arcade colors!
    
    if (r === 1 || r === 2) {
      type = 'CRAB';
      pts = 20;
      fill = '#00ffff';
    } else if (r === 3 || r === 4) {
      type = 'SQUID';
      pts = 10;
      fill = '#ffff00';
    }

    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        id: `a-${r}-${c}`,
        row: r,
        col: c,
        type: type,
        pts: pts,
        fill: fill,
        width: ALIEN_WIDTH,
        height: ALIEN_HEIGHT,
        alive: true,
        frame: 0
      });
    }
  }

  tickTimer = 0;
  heartbeatIndex = 0;
  nextEnemyFireTime = Math.random() * 2 + 1; // Spawning starts enemy fire timer
}

function startGame() {
  score = 0;
  lives = 3;
  wave = 1;
  gameTime = 0;
  player.x = 105;
  player.bullet = null;
  enemyMissiles = [];
  ufo.active = false;
  ufo.nextSpawn = Math.random() * 15 + 15; // 15-30s
  stopUFOSiren();

  initAliens();
  initBunkers();

  currentState = STATES.PLAYING;
  updateOverlay();
}

function startNextWave() {
  wave++;
  gameTime = 0;
  player.bullet = null;
  enemyMissiles = [];
  ufo.active = false;
  ufo.nextSpawn = Math.random() * 15 + 15;
  stopUFOSiren();

  initAliens();
  initBunkers(); // Reset bunkers for each wave

  currentState = STATES.PLAYING;
  updateOverlay();
}

// -------------------------------------------------------------
// 6. RENDER ENGINE (DYNAMIC DOM SVG RECREATION)
// -------------------------------------------------------------
const entityLayer = document.getElementById('entity-layer');
const bunkerLayer = document.getElementById('bunker-layer');
const uiLayer = document.getElementById('ui-layer');
const overlayLayer = document.getElementById('overlay-layer');

function renderBunkers() {
  bunkerLayer.innerHTML = '';
  bunkerBlocks.forEach(b => {
    if (b.alive) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', b.id);
      rect.setAttribute('x', b.x);
      rect.setAttribute('y', b.y);
      rect.setAttribute('width', b.width);
      rect.setAttribute('height', b.height);
      rect.setAttribute('fill', '#00ff00');
      bunkerLayer.appendChild(rect);
    }
  });
}

function updateBunkerBlockInDOM(blockId) {
  const el = document.getElementById(blockId);
  if (el) el.remove();
}

function renderUI() {
  // Draw Top scores and Bottom green bar + lives
  let uiHTML = `
    <!-- Top HUD -->
    <text x="5" y="10" fill="#ffffff" font-size="6" letter-spacing="0.5">SCORE</text>
    <text x="5" y="18" fill="#00ff00" font-size="6" letter-spacing="0.5">${pad(score, 4)}</text>
    
    <text x="75" y="10" fill="#ffffff" font-size="6" letter-spacing="0.5">HI-SCORE</text>
    <text x="75" y="18" fill="#00ff00" font-size="6" letter-spacing="0.5">${pad(highScore, 4)}</text>

    <text x="175" y="10" fill="#ffffff" font-size="6" letter-spacing="0.5">WAVE</text>
    <text x="175" y="18" fill="#ffffff" font-size="6" letter-spacing="0.5">${pad(wave, 2)}</text>

    <!-- Bottom Separator Green Line -->
    <rect x="0" y="242" width="224" height="1" fill="#00ff00" />
    
    <!-- Lives Text & Icons -->
    <text x="5" y="252" fill="#ffffff" font-size="6">${lives}</text>
  `;

  // Draw lives as mini tank sprites (each spacing 18 pixels)
  for (let i = 0; i < lives - 1; i++) {
    const lx = 16 + i * 18;
    uiHTML += `
      <path transform="translate(${lx}, 246) scale(0.8)" d="${PATHS.PLAYER}" fill="#00ff00" />
    `;
  }

  uiLayer.innerHTML = uiHTML;
}

function updateOverlay() {
  overlayLayer.innerHTML = '';

  if (currentState === STATES.MENU) {
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlay.innerHTML = `
      <rect width="224" height="256" fill="rgba(0,0,0,0.85)" />
      <text x="112" y="70" fill="#00ff00" font-size="12" text-anchor="middle" letter-spacing="1">SPACE</text>
      <text x="112" y="88" fill="#00ff00" font-size="12" text-anchor="middle" letter-spacing="1">INVADERS</text>
      
      <!-- Interactive Points Table details -->
      <g transform="translate(48, 120)">
        <path transform="scale(0.8)" d="${PATHS.UFO}" fill="#ff1a1a" />
        <text x="18" y="6" fill="#ffffff" font-size="5"> = ? MYSTERY</text>
      </g>
      <g transform="translate(48, 136)">
        <path transform="scale(0.8)" d="${PATHS.OCTOPUS[0]}" fill="#ff00ff" />
        <text x="18" y="6" fill="#ffffff" font-size="5"> = 30 PTS</text>
      </g>
      <g transform="translate(48, 152)">
        <path transform="scale(0.8)" d="${PATHS.CRAB[0]}" fill="#00ffff" />
        <text x="18" y="6" fill="#ffffff" font-size="5"> = 20 PTS</text>
      </g>
      <g transform="translate(48, 168)">
        <path transform="scale(0.8)" d="${PATHS.SQUID[0]}" fill="#ffff00" />
        <text x="18" y="6" fill="#ffffff" font-size="5"> = 10 PTS</text>
      </g>

      <text x="112" y="210" fill="#ffffff" font-size="6" text-anchor="middle" class="flash">PRESS ENTER TO START</text>
      <text x="112" y="235" fill="#888888" font-size="4" text-anchor="middle">REPLICA OF THE 1978 ARCADE CLASSIC</text>
    `;
    overlayLayer.appendChild(overlay);
  } else if (currentState === STATES.PAUSED) {
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlay.innerHTML = `
      <rect width="224" height="256" fill="rgba(0,0,0,0.6)" />
      <text x="112" y="128" fill="#00ff00" font-size="10" text-anchor="middle" letter-spacing="1">PAUSED</text>
      <text x="112" y="145" fill="#ffffff" font-size="5" text-anchor="middle">PRESS [P] TO RESUME</text>
    `;
    overlayLayer.appendChild(overlay);
  } else if (currentState === STATES.GAME_OVER) {
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlay.innerHTML = `
      <rect width="224" height="256" fill="rgba(0,0,0,0.85)" />
      <text x="112" y="110" fill="#ff1a1a" font-size="12" text-anchor="middle" letter-spacing="1">GAME OVER</text>
      <text x="112" y="130" fill="#ffffff" font-size="6" text-anchor="middle">SCORE: ${score}</text>
      <text x="112" y="145" fill="#00ff00" font-size="6" text-anchor="middle">HI-SCORE: ${highScore}</text>
      <text x="112" y="190" fill="#ffffff" font-size="6" text-anchor="middle" class="flash">PRESS ENTER TO PLAY AGAIN</text>
    `;
    overlayLayer.appendChild(overlay);
  }
}

function pad(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

// -------------------------------------------------------------
// 7. PHYSICS & COLLISION DETECTION (AABB)
// -------------------------------------------------------------
function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// -------------------------------------------------------------
// 8. GAME UPDATE LOOP (STATE SIMULATION)
// -------------------------------------------------------------
let lastTime = 0;

function gameLoop(time) {
  if (!lastTime) lastTime = time;
  let dt = (time - lastTime) / 1000;
  // Cap delta time to prevent clipping during frame drops/tab switching
  if (dt > 0.1) dt = 0.1;
  lastTime = time;

  if (currentState === STATES.PLAYING) {
    updatePlaying(dt);
  } else if (currentState === STATES.EXPLODING) {
    updateExploding(dt);
  }

  // Draw current frame of entities
  renderEntities();

  requestAnimationFrame(gameLoop);
}

// Tick interval is scaled by remaining aliens count (Dynamic speedup!)
function getTickInterval(activeCount) {
  // 55 aliens alive: 0.9s per step
  // 1 alien alive: 0.05s per step (blazing fast!)
  const ratio = activeCount / (ALIEN_COLS * ALIEN_ROWS);
  return 0.04 + 0.86 * ratio;
}

function updatePlaying(dt) {
  gameTime += dt;
  const activeCount = aliens.filter(a => a.alive).length;
  if (activeCount === 0) {
    currentState = STATES.WIN;
    setTimeout(() => {
      startNextWave();
    }, 1500);
    return;
  }

  // A. PLAYER MOVEMENT
  if (keys.Left) {
    player.x -= player.speed * dt;
  }
  if (keys.Right) {
    player.x += player.speed * dt;
  }
  // Clamp boundaries to screen padding
  player.x = Math.max(2, Math.min(player.x, CANVAS_WIDTH - player.width - 2));

  // B. PLAYER BULLET MOVEMENT & SHOOTING
  if (keys.Space && !player.bullet) {
    player.bullet = {
      x: player.x + 7,
      y: player.y - 4,
      width: 1.5,
      height: 4,
      speed: 160
    };
    playLaser();
  }

  if (player.bullet) {
    player.bullet.y -= player.bullet.speed * dt;
    if (player.bullet.y < 0) {
      player.bullet = null;
    }
  }

  // C. ALIENS GRID RHYTHMIC STEPPED MOVEMENT
  tickTimer += dt;
  const currentInterval = getTickInterval(activeCount);
  if (tickTimer >= currentInterval) {
    tickTimer = 0;
    
    // Play heartbeat procedural bass pitch
    playHeartbeat(heartbeatIndex);
    heartbeatIndex++;

    // Check if any leftmost/rightmost active alien has hit boundary buffer
    let minActiveCol = ALIEN_COLS;
    let maxActiveCol = -1;
    aliens.forEach(a => {
      if (a.alive) {
        if (a.col < minActiveCol) minActiveCol = a.col;
        if (a.col > maxActiveCol) maxActiveCol = a.col;
      }
    });

    const activeLeftX = gridX + minActiveCol * ALIEN_COL_SPACING;
    const activeRightX = gridX + maxActiveCol * ALIEN_COL_SPACING + ALIEN_WIDTH;

    if (shouldDrop) {
      gridY += 8; // Drop down
      gridDir *= -1; // Change direction
      shouldDrop = false;

      // Check for Invasion Defeat: lowest active alien crosses player's threshold
      let maxActiveY = 0;
      aliens.forEach(a => {
        if (a.alive) {
          const ay = gridY + a.row * ALIEN_ROW_SPACING + ALIEN_HEIGHT;
          if (ay > maxActiveY) maxActiveY = ay;
        }
      });

      if (maxActiveY >= player.y) {
        triggerGameOver();
        return;
      }
    } else {
      // Predict next boundary
      const nextLeftX = activeLeftX + gridDir * alienStepSize;
      const nextRightX = activeRightX + gridDir * alienStepSize;

      if (nextLeftX < 5 || nextRightX > 219) {
        shouldDrop = true; // Mark to drop on subsequent tick
      }
      gridX += gridDir * alienStepSize;
    }

    // Toggle animations on tick step
    aliens.forEach(a => {
      if (a.alive) {
        a.frame = a.frame === 0 ? 1 : 0;
      }
    });
  }

  // D. ENEMY RETALIATION FIRE
  nextEnemyFireTime -= dt;
  if (nextEnemyFireTime <= 0) {
    // Collect columns valid to shoot: bottom-most active alien in each column
    const shooterCandidates = [];
    for (let c = 0; c < ALIEN_COLS; c++) {
      let bottomAlien = null;
      for (let r = ALIEN_ROWS - 1; r >= 0; r--) {
        const a = aliens.find(al => al.row === r && al.col === c);
        if (a && a.alive) {
          bottomAlien = a;
          break;
        }
      }
      if (bottomAlien) {
        shooterCandidates.push(bottomAlien);
      }
    }

    if (shooterCandidates.length > 0) {
      // Pick random active shooter
      const shooter = shooterCandidates[Math.floor(Math.random() * shooterCandidates.length)];
      const ax = gridX + shooter.col * ALIEN_COL_SPACING + 5;
      const ay = gridY + shooter.row * ALIEN_ROW_SPACING + ALIEN_HEIGHT;

      // Squiggly or Plunger type enemy missiles (2 styles, move down)
      enemyMissiles.push({
        x: ax,
        y: ay,
        width: 2,
        height: 5,
        speed: 75 + wave * 5, // slightly faster with wave count
        type: Math.random() > 0.5 ? 'squiggly' : 'plunger'
      });
    }
    // Random interval based on current active count to make intense speedup
    nextEnemyFireTime = Math.random() * (0.3 + 1.2 * (activeCount / 55)) + 0.15;
  }

  // E. ENEMY MISSILE UPDATE (Loop backwards safely)
  for (let i = enemyMissiles.length - 1; i >= 0; i--) {
    const m = enemyMissiles[i];
    m.y += m.speed * dt;
    if (m.y > CANVAS_HEIGHT) {
      enemyMissiles.splice(i, 1);
    }
  }

  // F. RED UFO (MYSTERY SAUCER) UPDATE
  ufo.timer += dt;
  if (!ufo.active && gameTime > ufo.nextSpawn) {
    ufo.active = true;
    ufo.x = -ufo.width;
    startUFOSiren();
  }

  if (ufo.active) {
    ufo.x += ufo.speed * dt;
    if (ufo.x > CANVAS_WIDTH) {
      ufo.active = false;
      ufo.nextSpawn = gameTime + Math.random() * 20 + 20; // reset
      stopUFOSiren();
    }
  }

  // G. COLLISION CHECKING
  if (currentState !== STATES.PLAYING) return;

  // 1. Player Bullet vs Aliens
  if (player.bullet) {
    for (let i = 0; i < aliens.length; i++) {
      const a = aliens[i];
      if (a.alive) {
        const ax = gridX + a.col * ALIEN_COL_SPACING;
        const ay = gridY + a.row * ALIEN_ROW_SPACING;
        const alienBounds = { x: ax, y: ay, width: a.width, height: a.height };

        if (checkCollision(player.bullet, alienBounds)) {
          a.alive = false;
          player.bullet = null;
          score += a.pts;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('space_invaders_hi_score', highScore);
          }
          playAlienDeath();
          renderUI();
          break;
        }
      }
    }
  }

  if (currentState !== STATES.PLAYING) return;

  // 2. Player Bullet vs UFO
  if (player.bullet && ufo.active) {
    const ufoBounds = { x: ufo.x, y: ufo.y, width: ufo.width, height: ufo.height };
    if (checkCollision(player.bullet, ufoBounds)) {
      ufo.active = false;
      player.bullet = null;
      stopUFOSiren();
      // Original arcade random score selection (50, 100, 150, 300)
      const ufoPoints = [50, 100, 150, 300];
      const ptsEarned = ufoPoints[Math.floor(Math.random() * ufoPoints.length)];
      score += ptsEarned;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('space_invaders_hi_score', highScore);
      }
      playAlienDeath();
      renderUI();

      // Simple visual indicator of UFO bonus score hit
      showBonusIndicator(ufo.x, ufo.y, ptsEarned);
      ufo.nextSpawn = gameTime + Math.random() * 20 + 20;
    }
  }

  if (currentState !== STATES.PLAYING) return;

  // 3. Player Bullet vs Bunker Blocks
  if (player.bullet) {
    for (let b = 0; b < bunkerBlocks.length; b++) {
      const block = bunkerBlocks[b];
      if (block.alive && checkCollision(player.bullet, block)) {
        block.alive = false;
        player.bullet = null;
        updateBunkerBlockInDOM(block.id);
        break;
      }
    }
  }

  if (currentState !== STATES.PLAYING) return;

  // 4. Enemy Missiles vs Bunker Blocks (Loop backwards safely)
  for (let i = enemyMissiles.length - 1; i >= 0; i--) {
    const m = enemyMissiles[i];
    let hit = false;
    for (let b = 0; b < bunkerBlocks.length; b++) {
      const block = bunkerBlocks[b];
      if (block.alive && checkCollision(m, block)) {
        block.alive = false;
        updateBunkerBlockInDOM(block.id);
        hit = true;
        break;
      }
    }
    if (hit) {
      enemyMissiles.splice(i, 1);
    }
  }

  if (currentState !== STATES.PLAYING) return;

  // 5. Enemy Missiles vs Player (Loop backwards safely)
  for (let i = enemyMissiles.length - 1; i >= 0; i--) {
    const m = enemyMissiles[i];
    if (checkCollision(m, player)) {
      enemyMissiles.splice(i, 1);
      triggerPlayerDeath();
      break;
    }
  }
}

function showBonusIndicator(x, y, points) {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', x);
  text.setAttribute('y', y + 5);
  text.setAttribute('fill', '#ff0000');
  text.setAttribute('font-size', '5');
  text.textContent = points;
  entityLayer.appendChild(text);
  
  setTimeout(() => {
    text.remove();
  }, 1000);
}

function triggerPlayerDeath() {
  lives--;
  renderUI();
  playPlayerExplosion();
  stopUFOSiren();

  if (lives <= 0) {
    triggerGameOver();
  } else {
    currentState = STATES.EXPLODING;
    player.explodingFrame = 0;
    player.explosionTime = 0;
    player.totalDeathTime = 0;
  }
}

function updateExploding(dt) {
  player.explosionTime += dt;
  if (player.explosionTime >= 0.15) {
    player.explosionTime = 0;
    player.explodingFrame = player.explodingFrame === 0 ? 1 : 0;
  }

  // Expired 1.5s total duration
  if (!player.totalDeathTime) player.totalDeathTime = 0;
  player.totalDeathTime += dt;
  if (player.totalDeathTime >= 1.5) {
    player.totalDeathTime = 0;
    player.x = 105; // Reset position to center
    enemyMissiles = []; // Clear field
    currentState = STATES.PLAYING;
  }
}

function triggerGameOver() {
  currentState = STATES.GAME_OVER;
  stopUFOSiren();
  updateOverlay();
}

// -------------------------------------------------------------
// 9. RENDER DYNAMIC ENTITIES (COMPILING TO DOM SPEC)
// -------------------------------------------------------------
function renderEntities() {
  let entitiesHTML = '';

  // A. PLAYER TANK (Green Base Tank)
  if (currentState === STATES.PLAYING || currentState === STATES.PAUSED) {
    entitiesHTML += `<path id="player" transform="translate(${player.x}, ${player.y})" d="${PATHS.PLAYER}" fill="#00ff00" />`;
  } else if (currentState === STATES.EXPLODING) {
    const explosionPath = PATHS.PLAYER_EXP[player.explodingFrame];
    entitiesHTML += `<path id="player" transform="translate(${player.x}, ${player.y})" d="${explosionPath}" fill="#00ff00" />`;
  }

  // B. PLAYER BULLET
  if (player.bullet) {
    entitiesHTML += `<rect id="p-bullet" x="${player.bullet.x}" y="${player.bullet.y}" width="${player.bullet.width}" height="${player.bullet.height}" fill="#00ff00" />`;
  }

  // C. ALIENS GRID (Render each active alien)
  aliens.forEach(a => {
    if (a.alive) {
      const ax = gridX + a.col * ALIEN_COL_SPACING;
      const ay = gridY + a.row * ALIEN_ROW_SPACING;
      const path = PATHS[a.type][a.frame];
      entitiesHTML += `<path class="alien" id="${a.id}" transform="translate(${ax}, ${ay})" d="${path}" fill="${a.fill}" />`;
    }
  });

  // D. ENEMY MISSILES
  enemyMissiles.forEach((m, idx) => {
    // Wave or Squiggly zig-zag rendering
    let d = "";
    if (m.type === 'squiggly') {
      d = `M${m.x},${m.y} l-1,1 l1,1 l-1,1 l1,1 l-1,1`;
    } else {
      d = `M${m.x},${m.y} h2 v1 h-2 v1 h2 v1 h-2 v1 h2`;
    }
    entitiesHTML += `<path class="e-missile" transform="translate(0, 0)" d="${d}" stroke="#ffffff" stroke-width="0.8" fill="none" />`;
  });

  // E. RED UFO (Saucer)
  if (ufo.active) {
    entitiesHTML += `<path id="ufo" transform="translate(${ufo.x}, ${ufo.y})" d="${PATHS.UFO}" fill="#ff1a1a" />`;
  }

  entityLayer.innerHTML = entitiesHTML;
}

// -------------------------------------------------------------
// 10. SETUP & INITIATE RUN
// -------------------------------------------------------------
renderUI();
updateOverlay();
requestAnimationFrame(gameLoop);
