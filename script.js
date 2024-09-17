const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Set background color
ctx.fillStyle = '#000000'; // Black
ctx.fillRect(0, 0, canvas.width, canvas.height);

const balls = [];
const gravity = 0.2;
const friction = 0.99;
const spawnRate = 100; // milliseconds between spawns
const maxBallsPerSpawn = 3; // Maximum number of balls to spawn in one interval
let isMouseDown = false;
let spawnInterval;

// Function to interpolate between two colors
function interpolateColor(color1, color2, factor) {
    const result = color1.slice(1).match(/.{2}/g).map(hex => parseInt(hex, 16));
    const end = color2.slice(1).match(/.{2}/g).map(hex => parseInt(hex, 16));
    const interpolated = result.map((start, i) => Math.round(start + (end[i] - start) * factor));
    return `#${interpolated.map(value => value.toString(16).padStart(2, '0')).join('')}`;
}

// Function to create a new ball with transition properties
function createBall(x, y) {
    const ball = {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        radius: 10,
        colorStart: '#ff0000', // Red
        colorEnd: '#0000ff',   // Blue
        colorFactor: 0,        // Factor to control the color transition
        colorChangeSpeed: 0.01 // Speed of color transition
    };
    balls.push(ball);
}

function spawnBalls(x, y) {
    if (isMouseDown) {
        for (let i = 0; i < maxBallsPerSpawn; i++) {
            const offsetX = (Math.random() - 0.5) * 20; // Random offset
            const offsetY = (Math.random() - 0.5) * 20; // Random offset
            createBall(x + offsetX, y + offsetY);
        }
        if (isMouseDown) {
            clearInterval(spawnInterval);
            spawnInterval = setInterval(() => {
                spawnBalls(x, y);
            }, spawnRate);
        }
    }
}

canvas.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    spawnBalls(event.clientX, event.clientY);
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
    clearInterval(spawnInterval);
});

canvas.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        spawnBalls(event.clientX, event.clientY);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'r' || event.key === 'R') {
        balls.length = 0; // Reset all balls
    }
});

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function resolveCollision(ball1, ball2) {
    const xVelocityDiff = ball1.vx - ball2.vx;
    const yVelocityDiff = ball1.vy - ball2.vy;

    const xDist = ball2.x - ball1.x;
    const yDist = ball2.y - ball1.y;

    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
        const angle = -Math.atan2(ball2.y - ball1.y, ball2.x - ball1.x);

        const m1 = ball1.radius;
        const m2 = ball2.radius;

        const u1 = rotate({x: ball1.vx, y: ball1.vy}, angle);
        const u2 = rotate({x: ball2.vx, y: ball2.vy}, angle);

        const v1 = {x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y};
        const v2 = {x: u2.x * (m2 - m1) / (m1 + m2) + u1.x * 2 * m1 / (m1 + m2), y: u1.y};

        const vFinal1 = rotate(v1, -angle);
        const vFinal2 = rotate(v2, -angle);

        ball1.vx = vFinal1.x;
        ball1.vy = vFinal1.y;

        ball2.vx = vFinal2.x;
        ball2.vy = vFinal2.y;
    }
}

function rotate(velocity, angle) {
    return {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background with black color
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        ball.vy += gravity; // Apply gravity
        ball.y += ball.vy;
        ball.vx *= friction;
        ball.x += ball.vx;

        // Update color transition
        ball.colorFactor += ball.colorChangeSpeed;
        if (ball.colorFactor > 1) {
            ball.colorChangeSpeed *= -1; // Reverse direction
            ball.colorFactor = 1; // Clamp to 1
        } else if (ball.colorFactor < 0) {
            ball.colorChangeSpeed *= -1; // Reverse direction
            ball.colorFactor = 0; // Clamp to 0
        }
        const color = interpolateColor(ball.colorStart, ball.colorEnd, ball.colorFactor);

        // Collision detection with borders
        if (ball.y + ball.radius > canvas.height) {
            ball.y = canvas.height - ball.radius;
            ball.vy *= -friction;
        }
        if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.vx *= -friction;
        }
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx *= -friction;
        }

        // Collision detection with other balls
        for (let j = i + 1; j < balls.length; j++) {
            const otherBall = balls[j];
            if (distance(ball.x, ball.y, otherBall.x, otherBall.y) < ball.radius + otherBall.radius) {
                resolveCollision(ball, otherBall);
            }
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }
    requestAnimationFrame(update);
}

update();
