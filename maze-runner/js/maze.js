export class Maze {
    constructor(sizeCategory) {
        this.cellSize = 40; // pixel size of one grid block
        
        // Define maze grid dimensions based on category
        switch (sizeCategory) {
            case 'small':
                this.cols = 25; // 1000px
                this.rows = 19; // 760px
                break;
            case 'large':
                this.cols = 61; // 2440px
                this.rows = 45; // 1800px
                break;
            case 'medium':
            default:
                this.cols = 41; // 1640px
                this.rows = 31; // 1240px
                break;
        }

        // Must be odd dimensions for the generation algorithm to work with walls
        if (this.cols % 2 === 0) this.cols++;
        if (this.rows % 2 === 0) this.rows++;

        this.width = this.cols * this.cellSize;
        this.height = this.rows * this.cellSize;

        this.grid = []; // 1 = wall, 0 = path
        this.startPos = { x: 1, y: 1 };
        this.exitPos = { x: this.cols - 2, y: this.rows - 2 };

        this.generate();
    }

    generate() {
        // Initialize grid with all walls
        for (let y = 0; y < this.rows; y++) {
            let row = [];
            for (let x = 0; x < this.cols; x++) {
                row.push(1);
            }
            this.grid.push(row);
        }

        // Recursive Backtracker
        const stack = [];
        let current = { x: 1, y: 1 };
        this.grid[current.y][current.x] = 0;
        stack.push(current);

        const getUnvisitedNeighbors = (pos) => {
            const neighbors = [];
            const dirs = [
                { dx: 0, dy: -2 }, // Up
                { dx: 2, dy: 0 },  // Right
                { dx: 0, dy: 2 },  // Down
                { dx: -2, dy: 0 }  // Left
            ];

            for (const dir of dirs) {
                const nx = pos.x + dir.dx;
                const ny = pos.y + dir.dy;
                if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1 && this.grid[ny][nx] === 1) {
                    neighbors.push({ x: nx, y: ny, wallX: pos.x + dir.dx / 2, wallY: pos.y + dir.dy / 2 });
                }
            }
            return neighbors;
        };

        while (stack.length > 0) {
            current = stack[stack.length - 1];
            const neighbors = getUnvisitedNeighbors(current);

            if (neighbors.length > 0) {
                // Choose a random neighbor
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Remove the wall between current and next
                this.grid[next.wallY][next.wallX] = 0;
                
                // Mark next as visited
                this.grid[next.y][next.x] = 0;
                
                stack.push({ x: next.x, y: next.y });
            } else {
                stack.pop();
            }
        }

        // Ensure start and exit are open
        this.grid[this.startPos.y][this.startPos.x] = 0;
        this.grid[this.exitPos.y][this.exitPos.x] = 0;
        
        // Let's create an exit portal representation (e.g., value 2)
        this.grid[this.exitPos.y][this.exitPos.x] = 2;
    }

    isWall(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);

        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
            return true; // Out of bounds is wall
        }

        return this.grid[gridY][gridX] === 1;
    }

    isExit(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        return gridX === this.exitPos.x && gridY === this.exitPos.y;
    }

    draw(ctx, camera) {
        // Only draw visible cells based on camera
        const startCol = Math.max(0, Math.floor(camera.x / this.cellSize));
        const endCol = Math.min(this.cols, Math.ceil((camera.x + camera.width) / this.cellSize));
        const startRow = Math.max(0, Math.floor(camera.y / this.cellSize));
        const endRow = Math.min(this.rows, Math.ceil((camera.y + camera.height) / this.cellSize));

        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const cell = this.grid[y][x];
                const screenX = x * this.cellSize - camera.x;
                const screenY = y * this.cellSize - camera.y;

                if (cell === 1) {
                    ctx.fillStyle = '#333'; // Wall color
                    ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
                    ctx.strokeStyle = '#00f';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(screenX, screenY, this.cellSize, this.cellSize);
                } else if (cell === 2) {
                    // Exit
                    ctx.fillStyle = '#0f0'; // Exit color
                    ctx.fillRect(screenX + 5, screenY + 5, this.cellSize - 10, this.cellSize - 10);
                } else {
                    // Path
                    ctx.fillStyle = '#111';
                    ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
                }
            }
        }
    }
}