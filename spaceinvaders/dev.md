# JavaScript Space Invaders: Detailed Development Plan

A structured, stage-by-stage development roadmap to build a faithful, arcade-accurate replica of the original 1978 *Space Invaders* using HTML5 Canvas and vanilla JavaScript.

---

## 📅 Roadmap Overview
* **Stage 1:** Engine Setup & The Game Loop
* **Stage 2:** Player Canvas & Core Movement
* **Stage 3:** The Alien Grid (Rhythmic Movement Engine)
* **Stage 4:** Collision Detection & Scoring System
* **Stage 5:** Enemy Attacks & Win/Loss Conditions
* **Stage 6:** Destructible Bunkers & The Mystery UFO
* **Stage 7:** Web Audio API & Retro Polish

---

## 🕹️ Stage 1: Setup & The Game Loop
Before handling game graphics or entity logic, you must establish the underlying core engine architecture.

### Tasks
1. **HTML Canvas Configuration**
   * Create an `index.html` featuring a single `<canvas>` element.
   * Target the original arcade aspect ratio. The original resolution was **224x256**, which can be scaled up (e.g., **448x512** or **896x1024** for modern monitors) while preserving crisp edges.
   * Set CSS styling for rendering precision: `image-rendering: pixelated;` or `image-rendering: crisp-edges;`.
2. **The Game Loop Architecture**
   * Implement a standard game loop using `requestAnimationFrame()`.
   * Standardize updates using time-deltas (`dt`) to guarantee consistent movement across screens with variable refresh rates (60Hz, 144Hz, etc.).
3. **State Engine Configuration**
   * Define an object or enum managing application states: `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`.
4. **Input Handler System**
   * Establish unified `keydown` and `keyup` listeners tracking the current boolean states of active keys (Left Arrow/A, Right Arrow/D, Spacebar).

---

## 🚀 Stage 2: Player Canvas & Movement
Bring the player-controlled tank to life with strict classic constraints.

### Tasks
1. **Player Rendering**
   * Draw the classic green base tank using native Canvas 2D context methods (`fillRect()`) or map a custom pixel-art sprite.
2. **Velocity & Boundaries**
   * Translate input flags into horizontal velocity updates. 
   * Constrain the player's position explicitly using canvas edge boundaries (`x = Math.max(min, Math.min(x, max))`).
3. **The Single-Bullet Constraint**
   * Implement the primary laser weapon triggered by the Spacebar.
   * **Strict Retro Constraint:** The player is strictly limited to **one active bullet** on screen at a time. The input handler must reject fire commands if a bullet entity currently exists.
   * Update bullet coordinates vertically upward and despawn the entity immediately upon crossing the top frame edge.

---

## 👾 Stage 3: The Alien Grid (The Invaders)
The most vital system to get right: recreating the precise mechanical timing of the iconic enemy armada.

### Tasks
1. **The Grid Data Structure**
   * Generate an 11-column by 5-row matrix (2D array) containing individual alien objects.
   * Populate rows according to the original layout:
     * Top Row: Octopus (30 Points)
     * Middle Two Rows: Crab (20 Points)
     * Bottom Two Rows: Squid (10 Points)
2. **Unified Stepped Grid Movement**
   * Unlike modern games, the invaders do not move continuously via smooth physics. They move as a single unit using fixed horizontal steps at regular time intervals (ticks).
3. **Edge Tracking and Dropping**
   * Monitor the boundary box of all remaining active aliens.
   * When any alien in the leftmost or rightmost active column reaches the boundary buffer, trigger a structural shift on the next tick: move the entire army down by a fixed vertical step, and invert the horizontal direction vector.
4. **The Dynamic Hardware Speedup (Acceleration)**
   * In the 1978 original, clearing aliens freed up CPU processing time, causing the remaining enemies to move faster.
   * Replicate this intentionally by calculating the step-interval duration as a linear function of remaining enemies:
     $$	ext{Tick Interval} = \left(

## 💥 Stage 4: Collision Detection & Scoring
Turn the visual objects into an interactive environment.

### Tasks
1. **AABB Collision Math**
   * Implement Axis-Aligned Bounding Box (AABB) checking functionality for simple, robust rectangle intersections:
     ```javascript
     function checkCollision(rect1, rect2) {
         return rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y;
     }
     ```
2. **Bullet Intersections**
   * Evaluate the active player bullet against every living alien in the grid array during each frame update.
   * Upon detecting a hit:
     * Deactivate the hit alien (flag as dead).
     * Terminate and remove the player bullet.
     * Increment the game score based on the target's row type.

---

## 🛑 Stage 5: Enemy Attacks & Win/Loss Conditions
Introduce stakes by giving the aliens the ability to fight back.

### Tasks
1. **Column-Based Firing Logic**
   * Implement a randomized countdown timer that commands enemies to retaliate.
   * **Constraint:** Only the lowest/bottom-most active alien in any given column can fire a missile. Filter the grid array to find valid shooters.
   * Support multiple enemy missiles on screen concurrently to maintain difficulty.
2. **Enemy Projectile vs. Player**
   * Track downward enemy missiles against the player tank bounding box.
   * On collision, deduct a life, clear active missiles, trigger a brief reset pause, and respawn the player at the center base.
3. **Defeat and Victory Triggers**
   * **Victory:** If the active alien count reaches 0, clear remaining projectiles, increment the wave counter, and spawn a new faster grid.
   * **Defeat (Game Over):** Triggered immediately when player lives hit 0, **OR** if the lowest row-coordinate of the moving alien grid passes below the player tank's y-coordinate threshold.

---

## 🛡️ Stage 6: Bunkers & The Mystery UFO
Flesh out the core gameplay with advanced arcade elements.

### Tasks
1. **Destructible Shield Matrix**
   * Spawn 4 defensive bunkers positioned horizontally above the player line.
   * Build each bunker out of a dense nested grid of tiny, breakable pixel blocks (e.g., 2x2 or 4x4 canvas units per structural block).
   * When any projectile (player or alien) hits a bunker element, destroy that specific sub-pixel block and terminate the bullet. This naturally yields dynamic, organic holes worn down by gunfire.
2. **The Mystery UFO (`Saucer`)**
   * Create an independent timer that occasionally triggers a red UFO to fly horizontally across the top section of the screen.
   * The UFO moves independently of the main alien grid's step timing.
   * If hit by a player bullet, reward a variable bonus score (randomized or cycling through historical arcade values like 50, 100, 150, or 300 points).

---

## 🔊 Stage 7: Audio, Juice & Polish
Audio feedback and visual presentation are vital to capture the mounting tension of the original game loop.

### Tasks
1. **The Procedural Heartbeat Engine**
   * The iconic audio engine tracks the rhythmic step of the invaders using 4 descending bass notes.
   * Tie note playback directly to the alien movement grid ticks. As the invaders accelerate, the interval between notes shrinks automatically, building an organic, mechanical sense of dread.
2. **Web Audio API Sound Effects**
   * Use the native Web Audio API to synthesize retro sound frequencies programmatically, or load legacy 8-bit sound samples (`.wav`) for:
     * Player firing (`player_shoot.wav`)
     * Alien destruction (`alien_killed.wav`)
     * Player explosion (`player_explosion.wav`)
     * Flying UFO looping siren (`ufo_lowpitch.wav`)
3. **Display UI**
   * Draw traditional arcade typography using pixelated custom web fonts or custom coordinate drawings.
   * Keep track of standard variables at the top of the viewport: `SCORE`, `HI-SCORE`, and remaining `LIVES` (represented by mini tank icons).

