// Get the canvas and context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set the canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Define the player properties
let player = {
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpSpeed: 10,
    gravity: 0.5,
    doubleJump: false,
    onGround: false
};

// Define the platform properties
let platform = {
    x: 0,
    y: canvas.height - 50,
    width: canvas.width,
    height: 50
};

// Define the block properties
let block = {
    x: canvas.width / 2 - 25,
    y: platform.y - 50,
    width: 50,
    height: 50
};

// Define the game state
let gameState = 'lobby';

// Add event listeners
document.getElementById('play-button').addEventListener('click', () => {
    gameState = 'game';
    document.getElementById('lobby-screen').style.display = 'none';
    canvas.style.display = 'block';
    mainLoop();
});

// Main game loop
function mainLoop() {
    if (gameState === 'game') {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the platform
        ctx.fillStyle = '#666';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Draw the block
        ctx.fillStyle = '#888';
        ctx.fillRect(block.x, block.y, block.width, block.height);

        // Draw the player
        ctx.fillStyle = '#f00';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Update the player position
        player.x += player.velocityX;
        player.y += player.velocityY;

        // Apply gravity
        player.velocityY += player.gravity;

        // Check for collision with the platform
        if (player.y + player.height > platform.y && player.x + player.width > platform.x && player.x < platform.x + platform.width) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.onGround = true;
            player.doubleJump = false;
        } else {
            player.onGround = false;
        }

        // Check for collision with the block
        if (player.x + player.width > block.x && player.x < block.x + block.width && player.y + player.height > block.y && player.y < block.y + block.height) {
            player.y = block.y - player.height;
            player.velocityY = 0;
            player.onGround = true;
            player.doubleJump = false;
        } else {
            player.onGround = false;
        }

        // Handle keyboard input
        if (isKeyPressed('w') && player.onGround) {
            player.velocityY = -player.jumpSpeed;
            player.onGround = false;
        } else if (isKeyPressed('w') && !player.onGround && !player.doubleJump) {
            player.velocityY = -player.jumpSpeed;
            player.doubleJump = true;
        }

        if (isKeyPressed('a')) {
            player.velocityX = -player.speed;
        } else if (isKeyPressed('d')) {
            player.velocityX = player.speed;
        } else {
            player.velocityX = 0;
        }

        // Request the next frame
        requestAnimationFrame(mainLoop);
    }
}

// Check if a key is pressed
let keysPressed = {};
document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});
function isKeyPressed(key) {
    return keysPressed[key] === true;
}
