import { createPlayerSVG } from './graphics.js';

export class Player {
    constructor(maze) {
        this.maze = maze;
        this.radius = 12; // Collision radius
        // Center of starting cell
        this.x = maze.startPos.x * maze.cellSize + maze.cellSize / 2;
        this.y = maze.startPos.y * maze.cellSize + maze.cellSize / 2;
        this.speed = 4;
        
        // Input state
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };
        
        this.direction = { dx: 1, dy: 0 }; // Default facing right
        this.angle = 0;

        this.img = createPlayerSVG('#0a0');
        
        // Animation
        this.walkCycle = 0;
        this.isMoving = false;

        this.setupInputs();
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.code) || e.code === 'Space') {
                if (e.code === 'Space') {
                    this.keys.Space = true;
                } else {
                    this.keys[e.code] = true;
                }
                // Prevent default scrolling for arrows and space
                if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                    e.preventDefault();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.code) || e.code === 'Space') {
                if (e.code === 'Space') {
                    this.keys.Space = false;
                } else {
                    this.keys[e.code] = false;
                }
            }
        });
    }

    update() {
        let dx = 0;
        let dy = 0;

        if (this.keys.ArrowUp) dy -= this.speed;
        if (this.keys.ArrowDown) dy += this.speed;
        if (this.keys.ArrowLeft) dx -= this.speed;
        if (this.keys.ArrowRight) dx += this.speed;

        this.isMoving = dx !== 0 || dy !== 0;

        if (this.isMoving) {
            this.walkCycle += 0.2;
            
            // Normalize direction for shooting
            const len = Math.hypot(dx, dy);
            this.direction.dx = dx / len;
            this.direction.dy = dy / len;
            
            // Calculate angle for rotation
            this.angle = Math.atan2(this.direction.dy, this.direction.dx);
        }

        // Collision detection (check bounding box against maze walls)
        // Check X axis
        if (dx !== 0) {
            const nextX = this.x + dx;
            if (!this.checkCollision(nextX, this.y)) {
                this.x = nextX;
            } else {
                // Slide along wall if possible
                const slideX = this.x + Math.sign(dx);
                if (!this.checkCollision(slideX, this.y)) this.x = slideX;
            }
        }

        // Check Y axis
        if (dy !== 0) {
            const nextY = this.y + dy;
            if (!this.checkCollision(this.x, nextY)) {
                this.y = nextY;
            } else {
                 // Slide along wall if possible
                 const slideY = this.y + Math.sign(dy);
                 if (!this.checkCollision(this.x, slideY)) this.y = slideY;
            }
        }
    }

    checkCollision(newX, newY) {
        // Points to check around the player
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

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Bobbing animation
        if (this.isMoving) {
            const bob = Math.sin(this.walkCycle) * 2;
            ctx.translate(0, bob);
        }
        
        // Rotate towards direction
        ctx.rotate(this.angle);

        // Draw image centered
        if (this.img.complete) {
            ctx.drawImage(this.img, -20, -20, 40, 40);
        } else {
            // Fallback
            ctx.fillStyle = '#0a0';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}