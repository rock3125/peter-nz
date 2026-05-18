# Project Specification: Classic Space Invaders (p5.js)

This document outlines the technical specification and architecture for a classic, 2D arcade-style Space Invaders game built using JavaScript and the p5.js library.

## 1. Game Overview
The player controls a defense cannon at the bottom of the screen, moving horizontally to destroy waves of descending alien invaders while avoiding enemy fire.

### Core Mechanics

Player Control: Left/Right movement, single-shot firing.

### Enemies: 
A grid of aliens that moves horizontally, shifts down upon hitting a screen edge, and speeds up as their numbers dwindle.

## Win Condition: 

Destroy all alien invaders.

### Lose Condition: 

Any alien reaches the player's vertical level, or the player loses all lives.


## 2. Controls & Input

The game relies entirely on keyboard input mapped via p5.js isKeyDown() or keyPressed() functions.

### Input Key Action Behavior

Left Arrow    Move Left   Moves the player ship left at a constant velocity.
Right Arrow   Move Right  Moves the player ship right at a constant velocity.
Spacebar  Fire Laser      Spawns a single player projectile moving upward. 

Limit to 1 active projectile at a time.


## 3. Technical Architecture & Classes

The game will be structured using Object-Oriented Programming (OOP) in JavaScript, utilizing p5.js 

lifecycle methods (setup() and draw()).

### Core ClassesShip (Player)
Properties: x, y, width, height, speed, lives.
Methods: 
  show(): Renders the ship (green rectangle or custom sprite).
  move(direction): Updates x position based on input; constrains within canvas boundaries.

### Invader (Enemy)
Properties: x, y, r (radius/size), alive (boolean), scoreValue.
Methods: 
  show(): Renders the invader if alive.
  move(xDir, yDir): Updates position based on the global swarm direction.

### Laser (Projectile)
Properties: x, y, r, toDelete (flag for cleanup), type (PLAYER or ENEMY).
Methods:
  show(): Renders the laser as a vertical line or small rectangle.
  update(): Moves vertically (up for player, down for enemies).
  hits(target): Uses a bounding box or circle-collision formula to detect a hit.

## 4. Game Loop & Logic (p5.js Implementation)

setup() 
- Initialize a canvas (e.g., $600 \times 400$ pixels).
- Instantiate the Ship.
- Create a 2D array/grid of Invader objects (e.g., 5 rows of 10 aliens).
- Initialize empty arrays for player and enemy Laser objects.

draw()
Background: Clear the screen with a black background (background(0)).

Player Update: Check key inputs, update ship position, and render.

Invader Swarm Logic:
- Loop through all invaders to calculate if any hit the canvas edge.
  If an edge is hit, trigger a global flag to shift the entire grid down and reverse horizontal direction.

Render and update positions of living invaders.

Projectiles & Collisions:
Update and render active lasers.
Check for collisions: Player Laser vs. Invader, and Enemy Laser vs. Ship.Splice/remove lasers flagged with toDelete to prevent memory leaks.

UI/HUD: Display current score and remaining lives at the top of the canvas.

## 5. Assets & StylingGraphics: 
Retro 8-bit styling using basic p5.js 2D primitives (rect(), ellipse()) or minimalist pixel art sprites.
Color Palette: Black background, green player ship, white/magenta invaders, and red lasers.

Audio (Optional Stretch Goal): Basic synth bleeps using the p5.sound library for firing and explosions.
