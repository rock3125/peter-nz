import { createRobotSVG } from './graphics.js';

export class Robot {
    constructor(maze, player, level) {
        this.maze = maze;
        this.player = player;
        this.radius = 12;
        this.speed = 2;
        this.active = true;
        this.shootChance = 0.01 * level * 5;

        this.spawn(maze);
        
        // Pick random initial direction
        this.directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        this.currentDir = this.directions[Math.floor(Math.random() * this.directions.length)];
        this.angle = Math.atan2(this.currentDir.dy, this.currentDir.dx);

        this.img = createRobotSVG('#f00');
        this.walkCycle = Math.random() * 10;
        
        this.lastShotTime = 0;
        this.shootCooldown = 1500; // ms
    }

    spawn(maze) {
        let spawned = false;
        while (!spawned) {
            const rx = Math.floor(Math.random() * maze.cols);
            const ry = Math.floor(Math.random() * maze.rows);
            // Don't spawn on walls, and keep away from start
            if (maze.grid[ry][rx] === 0 && (rx > 3 || ry > 3)) {
                this.x = rx * maze.cellSize + maze.cellSize / 2;
                this.y = ry * maze.cellSize + maze.cellSize / 2;
                spawned = true;
            }
        }
    }

    update(currentTime, bullets) {
        if (!this.active) return;

        this.walkCycle += 0.1;

        // Try moving forward
        let nextX = this.x + this.currentDir.dx * this.speed;
        let nextY = this.y + this.currentDir.dy * this.speed;

        // Check if hitting wall or center of cell (decision point)
        const cellCenterHit = this.isNearCellCenter();
        
        if (this.checkCollision(nextX, nextY) || (cellCenterHit && Math.random() < 0.1)) {
            // Hit a wall or randomly deciding to turn at an intersection
            this.chooseNewDirection();
        } else {
            this.x = nextX;
            this.y = nextY;
        }

        this.angle = Math.atan2(this.currentDir.dy, this.currentDir.dx);

        // Line of Sight check is handled in main.js
    }

    isNearCellCenter() {
        const cx = Math.floor(this.x / this.maze.cellSize) * this.maze.cellSize + this.maze.cellSize / 2;
        const cy = Math.floor(this.y / this.maze.cellSize) * this.maze.cellSize + this.maze.cellSize / 2;
        return Math.abs(this.x - cx) < this.speed && Math.abs(this.y - cy) < this.speed;
    }

    chooseNewDirection() {
        // Snap to center of cell to turn cleanly
        this.x = Math.floor(this.x / this.maze.cellSize) * this.maze.cellSize + this.maze.cellSize / 2;
        this.y = Math.floor(this.y / this.maze.cellSize) * this.maze.cellSize + this.maze.cellSize / 2;

        const validDirs = [];
        for (const dir of this.directions) {
            const testX = this.x + dir.dx * this.maze.cellSize;
            const testY = this.y + dir.dy * this.maze.cellSize;
            if (!this.checkCollision(testX, testY)) {
                validDirs.push(dir);
            }
        }

        if (validDirs.length > 0) {
            // Avoid going immediately backwards if there are other options
            const forwardDirs = validDirs.filter(d => d.dx !== -this.currentDir.dx || d.dy !== -this.currentDir.dy);
            if (forwardDirs.length > 0) {
                this.currentDir = forwardDirs[Math.floor(Math.random() * forwardDirs.length)];
            } else {
                this.currentDir = validDirs[Math.floor(Math.random() * validDirs.length)];
            }
        }
    }

    checkCollision(newX, newY) {
        const points = [
            { x: newX - this.radius, y: newY - this.radius },
            { x: newX + this.radius, y: newY - this.radius },
            { x: newX - this.radius, y: newY + this.radius },
            { x: newX + this.radius, y: newY + this.radius }
        ];

        for (let p of points) {
            if (this.maze.isWall(p.x, p.y)) return true;
        }
        return false;
    }

    hasLineOfSight() {
        // Simple line of sight: must be aligned on X or Y axis, and no walls between
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        // Only check if within reasonable range
        if (dist > 300) return false;

        // Check axis alignment
        const alignedX = Math.abs(dx) < this.maze.cellSize / 2;
        const alignedY = Math.abs(dy) < this.maze.cellSize / 2;

        if (!alignedX && !alignedY) return false;

        // Check walls in between using raycasting
        const steps = dist / (this.maze.cellSize / 2);
        const stepX = dx / steps;
        const stepY = dy / steps;

        let checkX = this.x;
        let checkY = this.y;

        for (let i = 0; i < steps; i++) {
            if (this.maze.isWall(checkX, checkY)) {
                return false;
            }
            checkX += stepX;
            checkY += stepY;
        }

        // Must be facing the player
        if (alignedX) {
            if (Math.sign(dy) !== this.currentDir.dy) return false;
        } else {
            if (Math.sign(dx) !== this.currentDir.dx) return false;
        }

        return true;
    }

    tryShoot(currentTime, bullets) {
        if (currentTime - this.lastShotTime > this.shootCooldown) {
            // Import Bullet dynamically or pass the class? We pass bullets array and Bullet class is imported in main, wait, better to construct here or pass a callback.
            // Let's create an event or just push to bullets.
            this.lastShotTime = currentTime;
            return true; // Indicate we want to shoot
        }
        return false;
    }

    draw(ctx, camera) {
        if (!this.active) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Bobbing animation
        const bob = Math.sin(this.walkCycle) * 2;
        ctx.translate(0, bob);
        
        ctx.rotate(this.angle);

        if (this.img.complete) {
            ctx.drawImage(this.img, -20, -20, 40, 40);
        }

        ctx.restore();
    }
}