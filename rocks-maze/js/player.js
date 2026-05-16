import { createPlayerSVG } from './graphics.js';

export class Player {
    constructor(maze) {
        this.maze = maze;
        this.radius = 12; // Collision radius
        // Center of starting cell
        this.x = maze.startPos.x * maze.cellSize + maze.cellSize / 2;
        this.y = maze.startPos.y * maze.cellSize + maze.cellSize / 2;
        this.speed = 4;
        
        // Input state is now shared via a static property to avoid listener duplication
        if (!Player.inputState) {
            Player.inputState = {
                keys: {
                    ArrowUp: false,
                    ArrowDown: false,
                    ArrowLeft: false,
                    ArrowRight: false,
                    Space: false
                },
                joystick: { x: 0, y: 0 }
            };
            this.setupInputs();
        }
        
        this.keys = Player.inputState.keys;
        this.joystick = Player.inputState.joystick;
        
        this.direction = { dx: 1, dy: 0 }; // Default facing right
        this.angle = 0;

        this.img = createPlayerSVG('#0a0');
        
        // Animation
        this.walkCycle = 0;
        this.isMoving = false;
    }

    setupInputs() {
        const state = Player.inputState;

        window.addEventListener('keydown', (e) => {
            if (state.keys.hasOwnProperty(e.code) || e.code === 'Space') {
                if (e.code === 'Space') {
                    state.keys.Space = true;
                } else {
                    state.keys[e.code] = true;
                }
                // Prevent default scrolling for arrows and space
                if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                    e.preventDefault();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (state.keys.hasOwnProperty(e.code) || e.code === 'Space') {
                if (e.code === 'Space') {
                    state.keys.Space = false;
                } else {
                    state.keys[e.code] = false;
                }
            }
        });

        // Virtual Controls (Touch)
        const virtualControls = document.getElementById('virtual-controls');
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice && virtualControls) {
            virtualControls.style.display = 'flex';
            
            const joystickBase = document.getElementById('joystick-base');
            const joystickStick = document.getElementById('joystick-stick');
            const fireBtn = document.getElementById('fire-btn');
            
            // Joystick logic
            let joystickCenter = { x: 0, y: 0 };
            let maxRadius = 50; // Half of joystick-base width
            let touchId = null;

            const updateJoystick = (clientX, clientY) => {
                let dx = clientX - joystickCenter.x;
                let dy = clientY - joystickCenter.y;
                let distance = Math.hypot(dx, dy);
                
                if (distance > maxRadius) {
                    dx = (dx / distance) * maxRadius;
                    dy = (dy / distance) * maxRadius;
                }
                
                joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
                
                // Normalize joystick vector between -1 and 1
                state.joystick.x = dx / maxRadius;
                state.joystick.y = dy / maxRadius;
            };

            const resetJoystick = () => {
                joystickStick.style.transform = `translate(-50%, -50%)`;
                state.joystick.x = 0;
                state.joystick.y = 0;
                touchId = null;
            };

            joystickBase.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (touchId === null) {
                    const touch = e.changedTouches[0];
                    touchId = touch.identifier;
                    const rect = joystickBase.getBoundingClientRect();
                    joystickCenter = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                    updateJoystick(touch.clientX, touch.clientY);
                }
            });

            joystickBase.addEventListener('touchmove', (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === touchId) {
                        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                        break;
                    }
                }
            });

            joystickBase.addEventListener('touchend', (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === touchId) {
                        resetJoystick();
                        break;
                    }
                }
            });
            
            joystickBase.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === touchId) {
                        resetJoystick();
                        break;
                    }
                }
            });

            // Fire button logic
            fireBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                state.keys.Space = true;
                fireBtn.classList.add('active');
            });

            fireBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                state.keys.Space = false;
                fireBtn.classList.remove('active');
            });
            
            fireBtn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                state.keys.Space = false;
                fireBtn.classList.remove('active');
            });
        }
    }

    update() {
        let dx = 0;
        let dy = 0;

        // Keyboard movement
        if (this.keys.ArrowUp) dy -= this.speed;
        if (this.keys.ArrowDown) dy += this.speed;
        if (this.keys.ArrowLeft) dx -= this.speed;
        if (this.keys.ArrowRight) dx += this.speed;

        // Joystick movement (overrides keyboard if active)
        if (this.joystick.x !== 0 || this.joystick.y !== 0) {
            dx = this.joystick.x * this.speed;
            dy = this.joystick.y * this.speed;
        }

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