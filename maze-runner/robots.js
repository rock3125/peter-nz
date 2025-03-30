
let robots = [];

const robot_height = cell_size;
const robot_width = cell_size / 2;

function reset_robots() {
    robots = [];
    const col_start = Math.max(Math.floor(cols / 4), 2)
    const row_start = Math.max(Math.floor(rows / 4), 2)
    let width = cols - col_start * 2
    let height = rows - row_start * 2
    if (width <= 0 || height <= 0) {
        width = 1;
        height = 1;
    }
    for (let i = 0; i < num_robots; i++) {
        robots.push({
            x: ((col_start + get_random_int(width)) * cell_size) + cell_size * 0.5,
            y: ((row_start + get_random_int(height)) * cell_size) + cell_size * 0.5,
            tx: 0, // target x and y
            ty: 0,
            // robot path finding
            visited: Array.from({length: rows}, () => Array(cols).fill(false)),
            path: [],
            stack: [],
        })
    }
}

// draw the bad guys
function draw_robots() {
    for (let robot of robots) {
        image(robot_svg, robot.x, robot.y, robot_width, robot_height)
    }
}

// have we been here before?
function has_visited(robot, cell_x, cell_y) {
    return robot.visited[cell_x][cell_y]
}

function is_valid(cell_x, cell_y) {
    return cell_x >= 0 && cell_x < cols && cell_y >= 0 && cell_y <= rows;
}

// Initiates or continues DFS from the last stopped point
function dfs(robot) {

    if (robot.stack.length === 0) {
        // If stack is empty, start from the beginning or defined start point
        let cell_x = Math.floor(robot.x / cell_size);
        let cell_y = Math.floor(robot.y / cell_size);
        robot.stack.push([cell_x, cell_y]); // Assuming starting point is (0, 0)
        robot.tx = robot.x;
        robot.ty = robot.y;
    }

    // move to the next position
    if (robot.x < robot.tx) {
        robot.x += 1
        return false;
    }
    if (robot.x > robot.tx) {
        robot.x -= 1
        return false;
    }
    if (robot.y < robot.ty) {
        robot.y += 1
        return false;
    }
    if (robot.y > robot.ty) {
        robot.y -= 1
        return false;
    }

    while (robot.stack.length > 0) {
        const [x, y] = robot.stack.pop();

        robot.tx = x * cell_size + cell_size * 0.5;
        robot.ty = y * cell_size + cell_size * 0.5;

        // Skip if out of bounds or already visited
        if (robot.visited[x][y]) {
            continue;
        }

        // Mark robot's cell as visited
        robot.visited[x][y] = true;
        robot.path.push([x, y]);

        // Destination reached (could be defined differently based on the maze)
        if (x === 0 && y === 0) {
            return true; // Return true when the destination is reached
        }

        // Push adjacent cells to stack: down, right, up, left if they are valid
        if (is_valid_move(x, y, x + 1, y))
            robot.stack.push([x + 1, y])

        if (is_valid_move(x, y, x, y + 1))
            robot.stack.push([x, y + 1])

        if (is_valid_move(x, y, x - 1, y))
            robot.stack.push([x - 1, y])

        if (is_valid_move(x, y, x, y - 1))
            robot.stack.push([x, y - 1])

        return false;
    }

    return false; // Return false when no path leads to the destination
}

// move the bad guys
function move_robots() {
    for (let robot of robots) {
        dfs(robot)
    }
}
