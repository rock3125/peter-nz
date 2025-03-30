/**
 * move a character of width and height in the maze if possible
 *
 * @param x where we are in pixels x
 * @param y where we are in pixels y
 * @param dx the proposed x direction (speed as well), < 0 is left, > 0 is right
 * @param dy the proposed y direction (with speed), < 0 is up, > 0 is down
 * @param half_width the width of this character from the center
 * @param height_up the height from the center going up
 * @param height_down the height of this character from the center going down
 * @returns {x, y} not modified if can't move
 */
function move_if_possible(x, y, dx, dy, half_width, height_up, height_down) {

    let cell_x = Math.floor(x / cell_size);
    let cell_y = Math.floor(y / cell_size);
    let new_cell_x = cell_x;
    let new_cell_y = cell_y;
    const current_cell = maze[cell_y][cell_x];

    if (dx < 0) {
        const new_x = x + dx - half_width;
        new_cell_x = Math.floor(new_x / cell_size);
        if (new_cell_x >= 0) {
            if (new_cell_x !== cell_x) {
                const left_cell = maze[cell_y][new_cell_x];
                if (!left_cell.walls.right && !current_cell.walls.left) {
                    x += dx;
                }
            } else {
                x += dx;
            }
        }
    } else if (dx > 0) {
        const new_x = x + dx + half_width;
        new_cell_x = Math.floor(new_x / cell_size);
        if (new_cell_x < cols) {
            if (new_cell_x !== cell_x) {
                const right_cell = maze[cell_y][new_cell_x];
                if (!right_cell.walls.left && !current_cell.walls.right) {
                    x += dx;
                }
            } else {
                x += dx;
            }
        }
    }

    if (dy < 0) {
        const new_y = y + dy - height_up;
        new_cell_y = Math.floor(new_y / cell_size);
        if (new_cell_y >= 0) {
            if (new_cell_y !== cell_y) {
                const top_cell = maze[new_cell_y][cell_x];
                if (!top_cell.walls.bottom && !current_cell.walls.top) {
                    y += dy;
                }
            } else {
                y += dy;
            }
        }
    } else if (dy > 0) {
        const new_y = y + dy + height_down;
        new_cell_y = Math.floor(new_y / cell_size);
        if (new_cell_y < rows) {
            if (new_cell_y !== cell_y) {
                const bottom_cell = maze[new_cell_y][cell_x];
                if (!bottom_cell.walls.top && !current_cell.walls.bottom) {
                    y += dy;
                }
            } else {
                y += dy;
            }
        }
    }

    return {x: x, y: y, new_cell_x: new_cell_x, new_cell_y: new_cell_y}
}


/**
 * for the bots - is the move from cell(x,y) -> new_cell(x,y) valid?
 *
 * @param cell_x
 * @param cell_y
 * @param new_cell_x
 * @param new_cell_y
 * @returns {boolean}
 */
function is_valid_move(cell_x, cell_y, new_cell_x, new_cell_y) {

    if (new_cell_x < 0 || new_cell_x >= cols)
        return false;
    if (new_cell_y < 0 || new_cell_y >= rows)
        return false;

    const current_cell = maze[cell_y][cell_x];

    if (new_cell_x < cell_x) {
        const left_cell = maze[cell_y][new_cell_x];
        if (left_cell.walls.right || current_cell.walls.left) {
            return false;
        }
    } else if (new_cell_x > cell_x) {
        const right_cell = maze[cell_y][new_cell_x];
        if (right_cell.walls.left || current_cell.walls.right) {
            return false;
        }
    }

    if (new_cell_y < cell_y) {
        const top_cell = maze[new_cell_y][cell_x];
        if (top_cell.walls.bottom || current_cell.walls.top) {
            return false;
        }
    } else if (new_cell_y > cell_y) {
        const bottom_cell = maze[new_cell_y][cell_x];
        if (bottom_cell.walls.top || current_cell.walls.bottom) {
            return false;
        }
    }

    return true;
}
