
let maze = null;

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = {top: true, right: true, bottom: true, left: true};
        this.visited = false;
        this.isStart = false;   // Flag to identify the start cell
        this.isEnd = false;     // Flag to identify the end cell
    }

    draw(size) {
        const x = this.x * size;
        const y = this.y * size;
        if (this.isStart) {
            fill(maze_color, maze_color + 20, maze_color); // green
            stroke(maze_color, maze_color + 20, maze_color);
        } else if (this.isEnd) {
            fill(maze_color + 20, maze_color, maze_color); // red
            stroke(maze_color + 20, maze_color, maze_color);
        } else {
            fill(maze_color, maze_color, maze_color); // normal
            stroke(maze_color, maze_color, maze_color);
        }
        rect(x + size / 2, y + size / 2, size, size);

        stroke(0,0,0)
        fill(0,0,0)
        if (this.walls.top) {
            line(x, y, x + size, y);
        }
        if (this.walls.right) {
            line(x + size, y, x + size, y + size);
        }
        if (this.walls.bottom) {
            line(x + size, y + size, x, y + size);
        }
        if (this.walls.left) {
            line(x, y + size, x, y);
        }
    }

    checkNeighbors(grid, rows, cols) {
        let neighbors = [];
        let directions = [
            [0, -1, 'top', 'bottom'],
            [1, 0, 'right', 'left'],
            [0, 1, 'bottom', 'top'],
            [-1, 0, 'left', 'right']
        ];

        directions.forEach(([dx, dy, prop, opposite]) => {
            let nx = this.x + dx;
            let ny = this.y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !grid[ny][nx].visited) {
                neighbors.push({cell: grid[ny][nx], wall: prop, opposite: opposite});
            }
        });

        return neighbors.length > 0 ? neighbors : undefined;
    }
}

function generate_maze() {
    if (maze)
        return;

    let grid = [];
    for (let y = 0; y < rows; y++) {
        grid[y] = [];
        for (let x = 0; x < cols; x++) {
            grid[y][x] = new Cell(x, y);
        }
    }

    let stack = [];
    let current = grid[0][0];
    current.visited = true;

    do {
        let next = current.checkNeighbors(grid, rows, cols);
        if (next) {
            let chosen = next[Math.floor(Math.random() * next.length)];
            chosen.cell.visited = true;
            stack.push(current);
            current.walls[chosen.wall] = false;
            chosen.cell.walls[chosen.opposite] = false;
            current = chosen.cell;
        } else if (stack.length > 0) {
            current = stack.pop();
        }
    } while (stack.length > 0);

    grid[0][0].isStart = true; // Marking the start cell
    grid[rows - 1][cols - 1].isEnd = true; // Marking the end cell
    maze = grid;
}


function draw_maze() {
    if (!maze)
        return;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            maze[y][x].draw(cell_size);
        }
    }
}
