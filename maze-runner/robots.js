
let robots = [];

function reset_robots() {
    robots = [];
    const col_start = Math.max(Math.floor(cols / 4), 2);
    const row_start = Math.max(Math.floor(rows / 4), 2);

    for (let i = 0; i < num_robots; i++) {
        robots.push({
            x: ((col_start + get_random_int(cols - col_start * 2)) * cell_size) + cell_size * 0.5,
            y: ((row_start + get_random_int(rows - row_start * 2)) * cell_size) + cell_size * 0.5,
            tx: 0,
            ty: 0,
            path: [] // We will store the calculated path here
        });
        // Set initial target to current position to prevent immediate jumping
        robots[i].tx = robots[i].x;
        robots[i].ty = robots[i].y;
    }
}

function get_bfs_path(start_x, start_y, target_x, target_y) {
    let queue = [[start_x, start_y, []]];
    let visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    visited[start_y][start_x] = true;

    while (queue.length > 0) {
        let [x, y, path] = queue.shift();

        if (x === target_x && y === target_y) return path;

        // Check 4 directions
        const neighbors = [
            { nx: x, ny: y - 1 }, // Up
            { nx: x, ny: y + 1 }, // Down
            { nx: x - 1, ny: y }, // Left
            { nx: x + 1, ny: y }  // Right
        ];

        for (let { nx, ny } of neighbors) {
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) {
                if (is_valid_move(x, y, nx, ny)) {
                    visited[ny][nx] = true;
                    queue.push([nx, ny, [...path, { x: nx, y: ny }]]);
                }
            }
        }
    }
    return []; // No path found
}

// draw the bad guys
function draw_robots() {
    for (let robot of robots) {
        image(robot_svg, robot.x, robot.y, robot_width, robot_height)
    }
}

// move the bad guys
function move_robots() {
    for (let robot of robots) {
        // 1. Smooth movement towards the current target (tx, ty)
        if (robot.x < robot.tx) {
            robot.x += robot_speed;
            if (robot.x > robot.tx) robot.x = robot.tx;
        }
        else if (robot.x > robot.tx) {
            robot.x -= robot_speed;
            if (robot.x < robot.tx) robot.x = robot.tx;
        }
        if (robot.y < robot.ty) {
            robot.y += robot_speed;
            if (robot.y > robot.ty) robot.y = robot.ty;
        }
        else if (robot.y > robot.ty) {
            robot.y -= robot_speed;
            if (robot.y < robot.ty) robot.y = robot.ty;
        }

        // 2. If reached target, get the next step from the path
        if (robot.x === robot.tx && robot.y === robot.ty) {
            const bot_cell_x = Math.floor(robot.x / cell_size);
            const bot_cell_y = Math.floor(robot.y / cell_size);
            const player_cell_x = Math.floor(player.x / cell_size);
            const player_cell_y = Math.floor(player.y / cell_size);

            // Recalculate path to player
            robot.path = get_bfs_path(bot_cell_x, bot_cell_y, player_cell_x, player_cell_y);

            if (robot.path.length > 0) {
                const nextStep = robot.path[0];
                robot.tx = nextStep.x * cell_size + cell_size * 0.5;
                robot.ty = nextStep.y * cell_size + cell_size * 0.5;
            }
        }

        // 3. Check for collision with player (Game Over logic)
        if (dist(robot.x, robot.y, player.x, player.y) < cell_size * 0.4) {
            game_state = "lost";
        }
    }
}
