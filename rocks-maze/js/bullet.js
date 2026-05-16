export class Bullet {
    constructor(x, y, dirX, dirY, isEnemy, maze) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.speed = 10;
        this.isEnemy = isEnemy; // True if robot fired, false if player fired
        this.maze = maze;
        this.active = true;
        this.radius = 3;
    }

    update() {
        if (!this.active) return;

        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;

        // Check wall collision
        if (this.maze.isWall(this.x, this.y)) {
            this.active = false;
        }
    }

    draw(ctx, camera) {
        if (!this.active) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.fillStyle = this.isEnemy ? '#f00' : '#ff0';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.isEnemy ? '#f00' : '#ff0';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    }
}