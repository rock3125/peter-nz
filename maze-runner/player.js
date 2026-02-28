

class Player {

    constructor() {
        this.reset()
        this.girl_svg = []
    }

    reset() {
        this.bullets = [];
        this.x = cell_size / 2;
        this.y = cell_size / 2;
        this.animation = 0;
        this.dir = {x :0, y: 0};
    }

    draw() {
        // draw the girl at the current animation
        if (this.animation < this.girl_svg.length) {
            image(this.girl_svg[this.animation], this.x, this.y, player_width, player_height)
        }
        // draw the bullets of the girl
        this.draw_bullets()
    }

    // update logic
    update() {
        let dy = 0;
        let dx = 0;

        let speed = 1;
        if (keyIsDown(SHIFT)) {
            speed = 2;
        }

        if (keyIsDown(UP_ARROW)) {
            dy = -speed;
        } else if (keyIsDown(DOWN_ARROW)) {
            dy = speed;
        }

        if (keyIsDown(LEFT_ARROW)) {
            dx = -speed;
        } else if (keyIsDown(RIGHT_ARROW)) {
            dx = speed;
        }

        if (keyIsDown(32)) { // 32 is Space
            this.shoot();
        }

        if (dx !== 0 || dy !== 0) {
            // bullets can't go diagonal
            let bullet_dx = dx;
            let bullet_dy = dy;
            if (dx !== 0 && dy !== 0) { // not both
                bullet_dy = 0
            }
            this.dir = { x: bullet_dx, y: bullet_dy };

            // set player direction
            const new_xy = move_if_possible(this.x, this.y, dx, dy,
                player_width * 0.5, player_height * 0.6, player_height * 0.4)
            this.x = new_xy.x;
            this.y = new_xy.y;
        }

        if (dx !== 0 || dy !== 0) {
            if (game_counter % 3 === 0) {
                this.animation = (this.animation + 1) % this.girl_svg.length;
            }
        } else {
            this.animation = 0;
        }

        const target_box_x = (cols - 1) * cell_size + (cell_size * 0.5);
        const target_box_y = (rows - 1) * cell_size + (cell_size * 0.5);
        const target_delta_x = Math.abs(this.x - target_box_x);
        const target_delta_y = Math.abs(this.y - target_box_y);
        if (target_delta_x < 10 && target_delta_y < 30) {
            game_state = "won";
        }

        this.update_bullets()
    }

    shoot() {
        // Only shoot if we have a direction
        if (this.dir.x === 0 && this.dir.y === 0) return;

        // Rate limiting: Only one bullet every 20 frames
        if (game_counter % 4 === 0) {
            this.bullets.push({
                x: this.x,
                y: this.y,
                dx: this.dir.x,
                dy: this.dir.y
            });
        }
    }

    update_bullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];

            // Move the bullet based on the speed and the player's last direction
            b.x += b.dx * bullet_speed;
            b.y += b.dy * bullet_speed;

            // 1. Check for wall collisions using move_if_possible
            // We use a tiny radius (1 pixel) for the bullet
            let check = move_if_possible(b.x, b.y, b.dx, b.dy,
                player_width * 0.5, player_height * 0.5, player_width * 0.4);
            if (check.x === b.x && check.y === b.y) {
                this.bullets.splice(i, 1); // Hit a wall, remove bullet
                continue;
            }

            // 2. Check for robot collisions
            for (let j = robots.length - 1; j >= 0; j--) {
                let r = robots[j];
                let d = dist(b.x, b.y, r.x, r.y);
                if (d < cell_size * 0.5) {
                    robots.splice(j, 1); // Destroy robot
                    this.bullets.splice(i, 1); // Remove bullet
                    break;
                }
            }

            // 3. Remove bullets that go off-screen
            if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
                this.bullets.splice(i, 1);
            }
        }
    }

    draw_bullets() {
        fill(255, 255, 0); // Yellow bullets
        noStroke();
        for (let b of this.bullets) {
            ellipse(b.x, b.y, 5, 5);
        }
    }

}

