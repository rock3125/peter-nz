
// 1080p resolution
const w = 900;
const h = 900;

// maze constants
const rows = 20;
const cols = 20;
const cell_size = h / cols;
const maze_color = 140;

const num_robots = Math.max(Math.floor(cols / 5), 1)

// player consts
const player_height = cell_size;
const player_width = cell_size / 2;
const bullet_speed = 5;

// robot consts
const robot_height = cell_size;
const robot_width = cell_size / 2;
const robot_speed = 1.5;

// The order determines the "priority" of the DFS path
const directions = [
    { dx: 0, dy: 1 },  // Down
    { dx: 1, dy: 0 },  // Right
    { dx: 0, dy: -1 }, // Up
    { dx: -1, dy: 0 }  // Left
];
