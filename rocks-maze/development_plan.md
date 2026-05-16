# Development Plan: Rock's Maze Game

This document outlines the detailed development plan for building **Rock's Maze**, a pure Javascript/HTML single-page web application. 

## Phase 1: Project Setup & UI Architecture
* **Task 1.1: Project Scaffolding**
  * Create the base directory structure (`css/`, `js/`, `assets/`).
  * Create the main `index.html` file that will house the single-page application.
  * Link external stylesheets and prepare script tags for ES6 modules/classes.
* **Task 1.2: UI Views Structure**
  * Set up HTML containers for the three primary game states: 
    * `intro-screen` (Title, background maze, size selectors, start button).
    * `game-container` (The viewport where the active game renders).
    * `result-screen` (Handles both "Game Over" and "Level Complete" messages).
* **Task 1.3: Base CSS Styling**
  * Implement styling to ensure the `game-container` has a fixed/limited visible area (viewport) with hidden overflow.
  * Style the introduction and result screens to overlay the game or hide/show appropriately.

## Phase 2: Core Game Engine & Maze Generation
* **Task 2.1: The `Maze` Class (`js/maze.js`)**
  * Implement a maze generation algorithm (e.g., Recursive Backtracker or Prim's Algorithm) that guarantees a solvable path from a designated Start to an Exit.
  * Support configurable dimensions based on user selection (Small, Medium, Large).
  * Expose methods to check for wall collisions given a coordinate.
* **Task 2.2: Camera and Viewport Rendering**
  * Develop a rendering loop (e.g., using HTML5 Canvas or absolute positioned DOM elements) to draw the maze.
  * Implement camera logic that calculates which portion of the maze to render based on a focus point (which will be the player), ensuring smooth scrolling.

## Phase 3: Player Implementation
* **Task 3.1: The `Player` Class (`js/player.js`)**
  * Create the class with properties for position, movement speed, and facing direction.
  * Implement keyboard event listeners (arrow keys) to update the player's intended position.
  * Implement a virtual joystick and fire button for Android browser devices.
* **Task 3.2: Player Collision & Camera Tracking**
  * Integrate the player's movement with the `Maze` class to prevent walking through walls.
  * Bind the camera/viewport focus point to the player's coordinates so the screen scrolls as they move.
* **Task 3.3: Player Graphics & Animation**
  * Design an inline SVG graphic for the player.
  * Implement rudimentary walking animations (e.g., alternating leg positions or body bobbing) driven by the movement state.

## Phase 4: Enemy Robots
* **Task 4.1: The `Robot` Class (`js/robot.js`)**
  * Create the class with position, direction, and state tracking.
  * Implement a navigation AI: robots should move continuously and randomly choose new valid paths when hitting walls or intersections.
* **Task 4.2: Robot Spawning Logic**
  * Create a system to spawn robots in valid, empty maze cells.
  * Tie the spawn count to the current level and the selected maze size.
* **Task 4.3: Robot Graphics & Animation**
  * Design an inline SVG graphic for the robots.
  * Implement walking animations similar to the player, perhaps with distinct enemy color schemes.

## Phase 5: Combat & Interaction System
* **Task 5.1: Projectile System**
  * Create a `Bullet` or `Projectile` class to handle moving bullets.
  * Bullets must travel in straight lines and be destroyed upon hitting a maze wall.
* **Task 5.2: Player Shooting**
  * Bind the Spacebar to a fire action.
  * Calculate the bullet's trajectory based on the player's current facing direction.
* **Task 5.3: Robot Line-of-Sight & Shooting**
  * Implement a line-of-sight algorithm (e.g., raycasting along the grid) to check if a straight, unobstructed path exists between a robot and the player.
  * Trigger the robot's shooting mechanism when the player enters this line of sight.
* **Task 5.4: Hit Detection & Explosions**
  * Continuously check for collisions between player bullets and robots, and robot bullets and the player.
  * If a robot is hit: destroy the robot instance, remove it from the rendering loop, and trigger an SVG/CSS explosion animation.
  * If the player is hit: trigger the Game Over state.

## Phase 6: Game Loop & State Management
* **Task 6.1: Main Game Controller**
  * Implement a central `Game` class or script that manages the `requestAnimationFrame` loop.
  * Update all entities (Player, Robots, Bullets, Camera) and render them every frame.
* **Task 6.2: State Transitions**
  * **Start -> Game**: Read the selected maze size, instantiate the Maze, Player, and Robots, and start the game loop.
  * **Game -> Next Level**: Detect when the player reaches the Maze Exit coordinate. Show the "Level Complete" UI, increment the difficulty/level counter, and re-initialize the board.
  * **Game -> Game Over**: Detect player death. Halt the game loop, show the "You Died" screen, and provide a button to reset to the Introduction screen.