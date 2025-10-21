let player;
let bullets = [];
let enemies = [];
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;

let port;
let connectionButton, zeroButton;
let joystickX = 512;
let joystickY = 512;
let joystickClick = false;
let externalButtonClick = false;
let cursorX = 400;
let cursorY = 300;

let bgMusicPlayer, shootSynth, explosionSoundPlayer;
let canvas;

let spaceshipImg;
let asteroidSheet;
let asteroidFrames = [];

function preload() {
  spaceshipImg = loadImage("spaceship.png");
  asteroidSheet = loadImage("asteroids.png");
}

function setup() {
  canvas = createCanvas(600, 400);
  canvas.elt.tabIndex = '1';
  canvas.elt.focus();

  port = createSerial();
  connectionButton = createButton('Connect');
  connectionButton.position(10, height + 10);
  connectionButton.mousePressed(connectToSerial);

  zeroButton = createButton('Zero Joystick');
  zeroButton.position(100, height + 10);
  zeroButton.mousePressed(zero);
  textSize(32);

  player = new Player();

  // Load asteroid frames from spritesheet (2 rows x 16 cols)
  let frameW = asteroidSheet.width / 16;
  let frameH = asteroidSheet.height / 2;
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 16; x++) {
      asteroidFrames.push(asteroidSheet.get(x * frameW, y * frameH, frameW, frameH));
    }
  }

  // Setup Tone.js audio
  bgMusicPlayer = new Tone.Player("background-music.mp3").toDestination();
  bgMusicPlayer.loop = true;
  bgMusicPlayer.sync().start(0);

  shootSynth = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
  }).toDestination();

  explosionSoundPlayer = new Tone.Player("explosion.mp3").toDestination();

  noLoop();
}

function connectToSerial() {
  port.open('Arduino', 9600);
}

function zero() {
  if (port.opened()) {
    port.write('zero\n');
  }
}

function draw() {
  background(0);

  let str = port.readUntil('\n');
  if (str !== "") {
    str = str.trim();
    const values = str.split(',');
    if (values.length === 4) {
      joystickX = Number(values[0]);
      joystickY = Number(values[1]);
      joystickClick = Number(values[2]) === 1;
      externalButtonClick = Number(values[3]) === 1;
    }
  }

  let dx = map(joystickX, 1023, 0, -1, 1);
  let dy = map(joystickY, 1023, 0, -1, 1);
  if (abs(dx) < 0.1) dx = 0;
  if (abs(dy) < 0.1) dy = 0;

  cursorX += dx * 5;
  cursorY += dy * 5;
  cursorX = constrain(cursorX, 0, width);
  cursorY = constrain(cursorY, 0, height);

  player.x = cursorX - player.w / 2;

  if (!gameStarted) {
    textAlign(CENTER, CENTER);
    textSize(24);
    fill(255);
    text("Click to Start", width / 2, height / 2);
    return;
  }

  if (gameOver) {
    textSize(32);
    fill(255, 0, 0);
    text("Game Over", width / 2, height / 2);
    textSize(16);
    fill(255);
    text("Press R to Restart", width / 2, height / 2 + 40);
    return;
  }

  player.show();

  if ((joystickClick || externalButtonClick) && !gameOver && gameStarted) {
    bullets.push(new Bullet(player.x + player.w / 2));
    shootSynth.triggerAttackRelease("C5", "8n");
    sendLEDSignal();
    joystickClick = false;
    externalButtonClick = false;
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    if (bullets[i].offscreen()) {
      bullets.splice(i, 1);
    }
  }

  if (frameCount % 60 === 0) {
    enemies.push(new Enemy());
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].show();

    if (enemies[i].offscreen()) {
      enemies.splice(i, 1);
      continue;
    }

    if (enemies[i].hitsPlayer(player)) {
      enemies.splice(i, 1);
      lives--;
      if (lives <= 0) {
        gameOver = true;
        return;
      }
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (enemies[i] && enemies[i].hits(bullets[j])) {
        explosionSoundPlayer.start();
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 10;
        break;
      }
    }
  }

  fill(255);
  textSize(16);
  text("Score: " + score, 30, 20);
  text("Lives: " + lives, 30, 40);
}

function mousePressed() {
  if (!gameStarted) {
    Tone.start().then(() => {
      bgMusicPlayer.start();
      Tone.Transport.start();
      gameStarted = true;
      loop();
    });
  }
}

function keyPressed() {
  if (key === ' ') {
    bullets.push(new Bullet(player.x + player.w / 2));
    shootSynth.triggerAttackRelease("C5", "8n");
    sendLEDSignal();
  } else if ((key === 'r' || key === 'R') && gameOver) {
    restartGame();
  }
}

function restartGame() {
  score = 0;
  lives = 3;
  bullets = [];
  enemies = [];
  gameOver = false;
  loop();
}

function sendLEDSignal() {
  if (port.opened()) {
    port.write('LED_ON\n');
    setTimeout(() => {
      port.write('LED_OFF\n');
    }, 100);
  }
}

// ---------------------------
// Player Class
class Player {
  constructor() {
    this.x = width / 2;
    this.w = spaceshipImg.width * 0.15;
    this.h = spaceshipImg.height * 0.15;
  }

  show() {
    image(spaceshipImg, this.x, height - this.h - 10, this.w, this.h);
  }
}

// ---------------------------
// Bullet Class
class Bullet {
  constructor(x) {
    this.x = x;
    this.y = height - 30;
    this.r = 4;
    this.speed = 7;
  }

  update() {
    this.y -= this.speed;
  }

  show() {
    fill(255);
    ellipse(this.x, this.y, this.r * 2);
  }

  offscreen() {
    return this.y < 0;
  }
}

// ---------------------------
// Enemy Class
class Enemy {
  constructor() {
    this.frame = random(asteroidFrames);
    this.w = this.frame.width * 0.6;
    this.h = this.frame.height * 0.6;
    this.x = random(width - this.w);
    this.y = -this.h;
    this.speed = 2 + score / 100;
  }

  update() {
    this.y += this.speed;
  }

  show() {
    image(this.frame, this.x, this.y, this.w, this.h);
  }

  offscreen() {
    return this.y - this.h / 2 > height;
  }

  hits(bullet) {
    let d = dist(this.x + this.w / 2, this.y + this.h / 2, bullet.x, bullet.y);
    return d < this.w / 2;
  }

  hitsPlayer(player) {
    return (
      this.y + this.h > height - player.h - 10 &&
      this.x + this.w > player.x &&
      this.x < player.x + player.w
    );
  }
}
