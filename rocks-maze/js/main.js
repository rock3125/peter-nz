import { Maze } from './maze.js';
import { Player } from './player.js';
import { Robot } from './robot.js';
import { Bullet } from './bullet.js';

class Game {
    constructor() {
        this.app = document.getElementById('app');
        this.introScreen = document.getElementById('intro-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultScreen = document.getElementById('result-screen');
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.levelDisplay = document.getElementById('level-display');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');

        // Buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('continue-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('restart-btn').addEventListener('click', () => this.showIntro());

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.level = 1;
        this.mazeSize = 'medium';
        this.isRunning = false;
        this.lastTime = 0;

        // Player shooting control
        this.lastPlayerShot = 0;
        this.playerShootCooldown = 500;

        // Entities
        this.maze = null;
        this.player = null;
        this.robots = [];
        this.bullets = [];
        this.explosions = [];

        this.camera = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
    }

    resize() {
        // Match canvas size to container
        this.canvas.width = this.gameScreen.clientWidth;
        this.canvas.height = this.gameScreen.clientHeight;
        if (this.camera) {
            this.camera.width = this.canvas.width;
            this.camera.height = this.canvas.height;
        }
    }

    showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        if (screen) screen.classList.add('active');
    }

    showIntro() {
        this.level = 1;
        this.showScreen(this.introScreen);
        this.isRunning = false;
    }

    startGame() {
        this.mazeSize = document.getElementById('maze-size').value;
        this.level = 1;
        this.initLevel();
    }

    nextLevel() {
        this.level++;
        this.initLevel();
    }

    initLevel() {
        this.showScreen(this.gameScreen);
        this.resize(); // Ensure canvas is sized correctly before drawing
        this.levelDisplay.innerText = `Level: ${this.level}`;
        
        this.maze = new Maze(this.mazeSize);
        this.player = new Player(this.maze);
        
        this.bullets = [];
        this.explosions = [];
        this.robots = [];

        // Determine number of robots based on level and size
        let baseRobots = this.mazeSize === 'small' ? 3 : (this.mazeSize === 'large' ? 10 : 5);
        let robotCount = baseRobots + (this.level * 2);

        for (let i = 0; i < robotCount; i++) {
            this.robots.push(new Robot(this.maze, this.player));
        }

        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    gameOver(won) {
        this.isRunning = false;
        this.showScreen(this.resultScreen);
        
        const continueBtn = document.getElementById('continue-btn');
        const restartBtn = document.getElementById('restart-btn');

        if (won) {
            this.resultTitle.innerText = "Level Complete!";
            this.resultTitle.style.color = "#0f0";
            this.resultMessage.innerText = "You found the exit.";
            continueBtn.style.display = "inline-block";
        } else {
            this.resultTitle.innerText = "Game Over";
            this.resultTitle.style.color = "#f00";
            this.resultMessage.innerText = "You died.";
            continueBtn.style.display = "none";
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;
        requestAnimationFrame((t) => this.loop(t));

        // const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(currentTime);
        this.draw();
    }

    update(currentTime) {
        this.player.update();

        // Check if player reached exit
        if (this.maze.isExit(this.player.x, this.player.y)) {
            this.gameOver(true);
            return;
        }

        // Player shooting
        if (this.player.keys.Space && currentTime - this.lastPlayerShot > this.playerShootCooldown) {
            this.lastPlayerShot = currentTime;
            this.bullets.push(new Bullet(
                this.player.x, this.player.y, 
                this.player.direction.dx, this.player.direction.dy, 
                false, this.maze
            ));
        }

        // Update bullets
        this.bullets.forEach(b => b.update());
        // Clean up inactive bullets
        this.bullets = this.bullets.filter(b => b.active);

        // Update robots
        this.robots.forEach(robot => {
            if (robot.active) {
                robot.update(currentTime, this.bullets);
                // Robot shooting logic
                if (Math.random() < robot.shootChance && robot.hasLineOfSight() && robot.tryShoot(currentTime, this.bullets)) {
                     this.bullets.push(new Bullet(
                        robot.x, robot.y, 
                        robot.currentDir.dx, robot.currentDir.dy, 
                        true, this.maze
                    ));
                }
            }
        });

        // Update explosions
        this.explosions = this.explosions.filter(exp => {
            exp.life--;
            return exp.life > 0;
        });

        this.checkCollisions();
        this.updateCamera();
    }

    checkCollisions() {
        for (let bullet of this.bullets) {
            if (!bullet.active) continue;

            if (bullet.isEnemy) {
                // Check player hit
                const dist = Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y);
                if (dist < this.player.radius + bullet.radius) {
                    bullet.active = false;
                    this.createExplosion(this.player.x, this.player.y, '#0f0');
                    this.gameOver(false);
                }
            } else {
                // Check robot hit
                for (let robot of this.robots) {
                    if (robot.active) {
                        const dist = Math.hypot(bullet.x - robot.x, bullet.y - robot.y);
                        if (dist < robot.radius + bullet.radius) {
                            bullet.active = false;
                            robot.active = false;
                            this.createExplosion(robot.x, robot.y, '#f00');
                            break; // Bullet destroyed, stop checking robots
                        }
                    }
                }
            }
        }
    }

    createExplosion(x, y, color) {
        this.explosions.push({
            x: x, y: y, color: color, life: 20, maxLife: 20
        });
    }

    updateCamera() {
        // Center camera on player
        this.camera.x = this.player.x - this.camera.width / 2;
        this.camera.y = this.player.y - this.camera.height / 2;

        // Clamp camera to maze bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.maze.width - this.camera.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.maze.height - this.camera.height));
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.maze.draw(this.ctx, this.camera);
        
        // Draw bullets
        this.bullets.forEach(b => b.draw(this.ctx, this.camera));

        // Draw robots
        this.robots.forEach(r => r.draw(this.ctx, this.camera));

        // Draw player
        this.player.draw(this.ctx, this.camera);

        // Draw explosions
        this.explosions.forEach(exp => {
            const screenX = exp.x - this.camera.x;
            const screenY = exp.y - this.camera.y;
            const radius = (1 - exp.life / exp.maxLife) * 30;
            const alpha = exp.life / exp.maxLife;

            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${exp.color === '#f00' ? '255,0,0' : '0,255,0'}, ${alpha})`;
            this.ctx.fill();
            
            // Particles
            for(let i=0; i<5; i++) {
                this.ctx.beginPath();
                const ang = Math.random() * Math.PI * 2;
                const dist = Math.random() * radius;
                this.ctx.arc(screenX + Math.cos(ang)*dist, screenY + Math.sin(ang)*dist, 2, 0, Math.PI*2);
                this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
                this.ctx.fill();
            }
        });
    }
}

// Initialize on load
window.onload = () => {
    new Game();
};