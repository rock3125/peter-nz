let invaderSvg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <rect x="6" y="0" width="12" height="3" fill="#FFFFFF"/>
  <rect x="3" y="3" width="18" height="3" fill="#FFFFFF"/>
  <rect x="0" y="6" width="24" height="9" fill="#FFFFFF"/>
  <rect x="6" y="6" width="3" height="3" fill="#000000"/>
  <rect x="15" y="6" width="3" height="3" fill="#000000"/>
  <rect x="3" y="15" width="3" height="6" fill="#FFFFFF"/>
  <rect x="18" y="15" width="3" height="6" fill="#FFFFFF"/>
  <rect x="9" y="15" width="6" height="3" fill="#FFFFFF"/>
</svg>`;

let invaderSvg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <rect x="6" y="0" width="12" height="3" fill="#FFFFFF"/>
  <rect x="3" y="3" width="18" height="3" fill="#FFFFFF"/>
  <rect x="0" y="6" width="24" height="9" fill="#FFFFFF"/>
  <rect x="6" y="6" width="3" height="3" fill="#000000"/>
  <rect x="15" y="6" width="3" height="3" fill="#000000"/>
  <rect x="0" y="0" width="3" height="6" fill="#FFFFFF"/>
  <rect x="21" y="0" width="3" height="6" fill="#FFFFFF"/>
  <rect x="6" y="15" width="3" height="6" fill="#FFFFFF"/>
  <rect x="15" y="15" width="3" height="6" fill="#FFFFFF"/>
</svg>`;

let tankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20">
  <path d="M18,0 h4 v6 h8 v4 h10 v10 H0 v-10 h10 v-4 h8 Z" fill="#00FF00"/>
</svg>`;

let imgInvader1, imgInvader2, imgTank;

let ship;
let invaders = [];
let lasers = [];
let enemyLasers = [];
let bunkers = [];
let invaderDirection = 1;

// Level and Speed tracking
let level = 1;
let baseInvaderSpeed = 0.3; // Slower start
let invaderSpeed = baseInvaderSpeed;

let score = 0;
let lives = 3;
let gameState = "PLAYING"; // PLAYING, LOST 

function preload() {
  imgInvader1 = loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(invaderSvg1));
  imgInvader2 = loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(invaderSvg2));
  imgTank = loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(tankSvg));
}

function setup() {
  createCanvas(800, 600); 
  ship = new Ship();
  createInvaders();
  createBunkers();
}

function createInvaders() {
  invaders = [];
  let rows = 5;
  let cols = 11; 
  
  let rowColors = [
    color(255, 50, 50),   // Red
    color(255, 150, 50),  // Orange
    color(255, 255, 50),  // Yellow
    color(50, 255, 50),   // Green
    color(50, 255, 255)   // Cyan
  ];
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let x = j * 50 + 150; 
      let y = i * 40 + 60;
      invaders.push(new Invader(x, y, rowColors[i]));
    }
  }
}

function createBunkers() {
  bunkers = [];
  for (let i = 0; i < 3; i++) {
    let bx = 125 + i * 225; 
    let by = height - 120;
    bunkers.push(new Bunker(bx, by));
  }
}

function draw() {
  background(0);
  
  if (gameState === "PLAYING") {
    playGame();
  } else if (gameState === "LOST") {
    displayMessage("GAME OVER", "Score: " + score);
  }
}

function playGame() {
  // UI
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text("Score: " + score, 10, 10);
  textAlign(CENTER, TOP);
  text("Level: " + level, width / 2, 10);
  textAlign(RIGHT, TOP);
  text("Lives: " + lives, width - 10, 10);

  // Bunkers show
  for (let bunker of bunkers) {
    bunker.show();
  }

  // Ship update & show
  ship.show();
  ship.move();
  
  // Invader edge detection
  let edgeHit = false;
  for (let invader of invaders) {
    if (invader.x + invader.r > width || invader.x - invader.r < 0) {
      edgeHit = true;
      break;
    }
  }
  
  if (edgeHit) {
    invaderDirection *= -1;
    for (let invader of invaders) {
      invader.shiftDown();
    }
  }
  
  // Enemy firing logic
  // Shoot slightly more often on higher levels
  let fireRate = max(20, 60 - (level * 5)); 
  if (frameCount % fireRate === 0 && invaders.length > 0) {
    let randomInvader = random(invaders);
    enemyLasers.push(new Laser(randomInvader.x, randomInvader.y, "ENEMY"));
  }

  // Invader logic
  for (let i = invaders.length - 1; i >= 0; i--) {
    let invader = invaders[i];
    invader.show();
    invader.move();
    
    // Check if invader reaches player
    if (invader.y + invader.r >= ship.y) {
      gameState = "LOST";
    }

    // Check collision with bunkers (invaders destroy blocks on touch)
    for (let bunker of bunkers) {
      for (let j = bunker.blocks.length - 1; j >= 0; j--) {
        let b = bunker.blocks[j];
        if (invader.x + invader.r > b.x && invader.x - invader.r < b.x + b.w &&
            invader.y + invader.r > b.y && invader.y - invader.r < b.y + b.h) {
          bunker.blocks.splice(j, 1);
        }
      }
    }
  }

  // Lasers logic (Player)
  for (let i = lasers.length - 1; i >= 0; i--) {
    let laser = lasers[i];
    laser.show();
    laser.update();
    
    // Check collision with invaders
    for (let j = invaders.length - 1; j >= 0; j--) {
      let invader = invaders[j];
      if (laser.hits(invader)) {
        invaders.splice(j, 1);
        laser.toDelete = true;
        score += 10;
        
        // Slightly increase speed as fewer invaders remain
        invaderSpeed += 0.005; 
        
        break; // Laser destroyed, break out of invader loop
      }
    }

    // Check collision with bunkers
    if (!laser.toDelete) {
      for (let bunker of bunkers) {
        for (let j = bunker.blocks.length - 1; j >= 0; j--) {
          if (laser.hitsBlock(bunker.blocks[j])) {
            bunker.blocks.splice(j, 1);
            laser.toDelete = true;
            break;
          }
        }
        if (laser.toDelete) break;
      }
    }
    
    // Remove if off screen or hit
    if (laser.toDelete || laser.y < 0) {
      lasers.splice(i, 1);
    }
  }
  
  // Enemy Lasers logic
  for (let i = enemyLasers.length - 1; i >= 0; i--) {
    let laser = enemyLasers[i];
    laser.show();
    laser.update();
    
    if (laser.hits(ship)) {
      lives--;
      
      // Clear all active lasers on screen so the player has a breather
      enemyLasers = [];
      lasers = [];
      
      // Reset player position to the center
      ship.x = width / 2 - ship.width / 2;
      
      if (lives <= 0) {
        gameState = "LOST";
      }
      break; // Stop processing any further lasers this frame
    }

    // Check collision with bunkers
    if (!laser.toDelete) {
      for (let bunker of bunkers) {
        for (let j = bunker.blocks.length - 1; j >= 0; j--) {
          if (laser.hitsBlock(bunker.blocks[j])) {
            bunker.blocks.splice(j, 1);
            laser.toDelete = true;
            break;
          }
        }
        if (laser.toDelete) break;
      }
    }
    
    if (laser.toDelete || laser.y > height) {
      enemyLasers.splice(i, 1);
    }
  }
  
  // Check Level Complete condition
  if (invaders.length === 0) {
    level++;
    baseInvaderSpeed += 0.2; // Increase starting speed for the new level
    invaderSpeed = baseInvaderSpeed; // Reset current speed to the new base
    invaderDirection = 1; // Reset movement direction
    lasers = []; // Clear remaining lasers
    enemyLasers = [];
    createInvaders(); // Spawn new wave
  }
}

function displayMessage(msg1, msg2) {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text(msg1, width / 2, height / 2 - 20);
  textSize(24);
  text(msg2, width / 2, height / 2 + 30);
}

function keyPressed() {
  if (key === ' ' && gameState === "PLAYING") {
    // Limit to 1 active player projectile
    if (lasers.length === 0) {
      lasers.push(new Laser(ship.x + ship.width / 2, ship.y, "PLAYER"));
    }
  }
}

class Ship {
  constructor() {
    this.width = 50; 
    this.height = 25;
    this.x = width / 2 - this.width / 2;
    this.y = height - this.height - 20;
    this.speed = 6;
  }
  
  show() {
    image(imgTank, this.x, this.y, this.width, this.height);
  }
  
  move() {
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= this.speed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.speed;
    }
    this.x = constrain(this.x, 0, width - this.width);
  }
}

class Invader {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.r = 16; 
    this.color = col; 
    this.scoreValue = 10;
  }
  
  show() {
    let currentImg = floor(frameCount / 30) % 2 === 0 ? imgInvader1 : imgInvader2;
    tint(this.color);
    image(currentImg, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
    noTint(); 
  }
  
  move() {
    this.x += invaderDirection * invaderSpeed;
  }
  
  shiftDown() {
    this.y += this.r * 2;
  }
}

class Laser {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.r = 3;
    this.type = type; 
    this.toDelete = false;
  }
  
  show() {
    fill(255, 0, 0); 
    noStroke();
    rect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 4);
  }
  
  update() {
    if (this.type === "PLAYER") {
      this.y -= 10; 
    } else {
      this.y += 7;
    }
  }
  
  hits(target) {
    // Define the exact bounding box of the laser (a rectangle)
    let lLeft = this.x - this.r;
    let lRight = this.x + this.r;
    let lTop = this.y - this.r;
    let lBottom = this.y + this.r * 3;
    
    if (this.type === "PLAYER") {
      // Use exact bounding box for the Invader sprite
      let iLeft = target.x - target.r;
      let iRight = target.x + target.r;
      let iTop = target.y - target.r;
      let iBottom = target.y + target.r;
      
      return (lRight >= iLeft && lLeft <= iRight &&
              lBottom >= iTop && lTop <= iBottom);
              
    } else if (this.type === "ENEMY") {
      // Use exact bounding box for the Ship sprite
      return (lRight >= target.x && lLeft <= target.x + target.width &&
              lBottom >= target.y && lTop <= target.y + target.height);
    }
    return false;
  }

  hitsBlock(b) {
    let lLeft = this.x - this.r;
    let lRight = this.x + this.r;
    let lTop = this.y - this.r;
    let lBottom = this.y + this.r * 3;
    
    return (lRight >= b.x && lLeft <= b.x + b.w &&
            lBottom >= b.y && lTop <= b.y + b.h);
  }
}

class Bunker {
  constructor(x, y) {
    this.blocks = [];
    this.x = x;
    this.y = y;
    let blockSize = 10; 
    let rows = 6;
    let cols = 10;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r >= 3 && c >= 3 && c <= 6) continue;
        if (r === 0 && (c === 0 || c === cols - 1)) continue;
        
        this.blocks.push({
          x: x + c * blockSize,
          y: y + r * blockSize,
          w: blockSize,
          h: blockSize
        });
      }
    }
  }
  
  show() {
    fill(0, 255, 0); 
    noStroke();
    for (let b of this.blocks) {
      rect(b.x, b.y, b.w, b.h);
    }
  }
}