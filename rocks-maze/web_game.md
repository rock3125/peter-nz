# Rock's Maze Game - pure Javascript Web App

Create a Javascript/HTML based web application (single page) with Javascript classes.

## Core Features

### Game
- **introduction screen**: A welcome page, shown after game over, or initially.  Display `Rock's Maze` as a title prominently.  Showing a maze in the background.
- **limited screen area**: The maze is larger than the visible area of the screen.  The user can select the size of the maze being: small, medium, large.
- **scrolling**: the player moves using the cursor keys through the maze, and cannot move through walls.
- **the maze**: a 2d maze that is larger than then screen render area in all cases.  The maze always has a starting point and an exit point that is reachable.
- **gun**: the player can shoot a gun in the direction she is moving by pressing the space bar.  The bullet stops when it hits a maze wall or an enemy robot.
- **graphics**: the player and enenmy robots consist of animating svg graphics with colour that show rudimentary walking animation.
- **game over**: the game is over when the player gets to the exit, at which stage a different screen is shown congratulating the user, and moving the user onto the next level with more robots.
- **game over**: the game is over when the player is hit but a robot's bullet.  A screen is shown showing *game over, you died*.
- **robots**: a series of enemy robots navigates the maze randomly.  The higher the game level, or the bigger the maze, the more robots.
- **guns**: the robots have guns and will fire at the player when she is inline / directly in line with the gun.
- **explosion**: a robot is destroyed if it is hit by the player's bullet and a small explosion shows, removing the robot.
- **classes**: create Javascript classes in separate files for the robots, player, and maze.
