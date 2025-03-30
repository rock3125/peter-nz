
const player_height = cell_size;
const player_width = cell_size / 2;

let player = {}

function reset_player() {
    player = {
        x: cell_size / 2,
        y: cell_size / 2,
        animation: 0,
        direction: 1, // left -1, right 1
    }
}

function draw_player() {
    if (girl_svg) {
        image(girl_svg[player.animation], player.x, player.y, player_width, player_height)
    }
}

function player_keys() {
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

    if (dx !== 0 || dy !== 0) {
        const new_xy = move_if_possible(player.x, player.y, dx, dy,
            player_width * 0.5, player_height * 0.6, player_height * 0.4)
        player.x = new_xy.x;
        player.y = new_xy.y;
    }

    if (dx !== 0 || dy !== 0) {
        if (game_counter % 3 === 0) {
            player.animation = (player.animation + 1) % girl_svg.length;
        }
    } else {
        player.animation = 0;
    }

    const target_box_x = (cols - 1) * cell_size + (cell_size * 0.5);
    const target_box_y = (rows - 1) * cell_size + (cell_size * 0.5);
    const target_delta_x = Math.abs(player.x - target_box_x);
    const target_delta_y = Math.abs(player.y - target_box_y);
    if (target_delta_x < 10 && target_delta_y < 30) {
        game_state = "won";
    }

}
