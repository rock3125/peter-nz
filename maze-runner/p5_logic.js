
let game_state = "game over"; // one of {game over, running, won}
let player = null;

// graphics
let explosion_svg = null;
let robot_svg = null;
let game_counter = 0;

function get_random_int(max) {
    return Math.floor(Math.random() * max);
}

function loadGraphics() {
    if (player) {
        player.girl_svg.push(loadImage("./graphics/girl1.svg"));
        player.girl_svg.push(loadImage("./graphics/girl2.svg"));
        player.girl_svg.push(loadImage("./graphics/girl3.svg"));
    }
    robot_svg = loadImage("./graphics/robot.svg");
    explosion_svg = loadImage("./graphics/explosion.svg")
}

// p5.js callback: load all graphics and set up
function preload(){
    loadGraphics()
}

// p5.js callback: set up the game size and modes
function setup() {
    createCanvas(w, h);
    imageMode(CENTER);
    rectMode(CENTER);
    angleMode(DEGREES);
    frameRate(30);
    player = new Player();
    player.reset();
    loadGraphics()
    maze = null;
    generate_maze();
    reset_robots();
}

// p5 js callback - draw the world
function draw() {
    game_counter += 1;

    background(0);
    stroke(255)
    draw_maze()
    player.draw()
    draw_robots()

    if (game_state !== "running" && keyIsDown(ENTER)) {
        maze = null;
        generate_maze();
        player.reset();
        reset_robots();
        game_state = "running";
    }

    if (game_state === "running" && keyIsDown(ESCAPE)) {
        game_state = "game over";
    }

    if (game_state === "running") {
        player.update()
        move_robots()

    } else {

        stroke(255)
        fill(255)
        textSize(20)
        text("Rock's Maze Runner v1.0", (w / 2) - 180, (h / 2) - 100)

        textSize(30)
        if (game_state === "won") {
            text("CONGRATULATIONS", (w / 2) - 210, (h / 2) - 200)
            text("you made it", (w / 2) - 150, (h / 2) - 160)

        } else {
            text("G A M E   O V E R", (w / 2) - 200, (h / 2) - 200)
        }

        textSize(20)
        text("press [enter] to start", (w / 2) - 160, h / 2 - 60)
        text("use cursor keys to move", (w / 2) - 180, (h / 2) - 30)
    }

}

