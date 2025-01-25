// Get the canvas and context
let scene, camera, renderer, player, platform, block, projectile;

// Define the player properties
let playerProperties = {
    x: 0,
    y: 0,
    z: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    speed: 5,
    jumpSpeed: 10,
    gravity: 0.5,
    doubleJump: false,
    onGround: false,
    health: 100
};

// Define the platform properties
let platformProperties = {
    x: 0,
    y: -10,
    z: 0,
    width: 100,
    height: 10,
    depth: 100
};

// Define the block properties
let blockProperties = {
    x: 0,
    y: 0,
    z: 0,
    width: 10,
    height: 10,
    depth: 10
};

// Define the projectile properties
let projectileProperties = {
    x: 0,
    y: 0,
    z: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    speed: 10
};

// Define the game state
let gameState = 'lobby';

// Add event listeners
document.getElementById('play-button').addEventListener('click', () => {
    gameState = 'game';
    document.getElementById('lobby-screen').style.display = 'none';
    init();
    animate();
});

// Initialize the scene
function init() {
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333);

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Create the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create the player
    let playerGeometry = new THREE.SphereGeometry(5, 32, 32);
    playerGeometry.scale(1, 2, 1); // Make the player's body elliptical
    let playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.x = playerProperties.x;
    player.position.y = playerProperties.y;
    player.position.z = playerProperties.z;
    scene.add(player);

    // Create the platform
    let platformGeometry = new THREE.BoxGeometry(platformProperties.width, platformProperties.height, platformProperties.depth);
    let platformMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
    platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.x = platformProperties.x;
    platform.position.y = platformProperties.y;
    platform.position.z = platformProperties.z;
    scene.add(platform);

    // Create the block
    let blockGeometry = new THREE.BoxGeometry(blockProperties.width, blockProperties.height, blockProperties.depth);
    let blockMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.x = blockProperties.x;
    block.position.y = blockProperties.y;
    block.position.z = blockProperties.z;
    scene.add(block);

    // Create the health bar
    let healthBar = document.createElement('div');
    healthBar.style.position = 'absolute';
    healthBar.style.top = '10px';
    healthBar.style.left = '10px';
    healthBar.style.width = '200px';
    healthBar.style.height = '20px';
    healthBar.style.backgroundColor = 'red';
    healthBar.style.border = '1px solid black';
    document.body.appendChild(healthBar);

    // Lock the cursor
    document.addEventListener('mousemove', (e) => {
        if (gameState === 'game') {
            let movementX = e.movementX || e.mozMovementX || e.webkitMovementX;
            let movementY = e.movementY || e.mozMovementY || e.webkitMovementY;
            camera.rotation.x += movementY * 0.01;
            camera.rotation.y += movementX * 0.01;
        }
    });

    // Shoot projectile
    document.addEventListener('click', () => {
        if (gameState === 'game') {
            let projectileGeometry = new THREE.SphereGeometry(1, 32, 32);
            let projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
            projectile.position.x = player.position.x;
            projectile.position.y = player.position.y;
            projectile.position.z = player.position.z;
            scene.add(projectile);
            projectileProperties.x = player.position.x;
            projectileProperties.y = player.position.y;
            projectileProperties.z = player.position.z;
            projectileProperties.velocityX = Math.sin(camera.rotation.y) * projectileProperties.speed;
            projectileProperties.velocityY = Math.sin(camera.rotation.x) * projectileProperties.speed;
            projectileProperties.velocityZ = Math.cos(camera.rotation.y) * projectileProperties.speed;
        }
    });
}

// Animate the scene
function animate() {
    if (gameState === 'game') {
        // Update the player position
        player.position.x += playerProperties.velocityX;
        player.position.y += playerProperties.velocityY;
        player.position.z += playerProperties.velocityZ;

        // Apply gravity
        playerProperties.velocityY += playerProperties.gravity;

        // Check for collision with the platform
        if (player.position.y + 10 > platform.position.y + platformProperties.height / 2 && player.position.x + 10 > platform.position.x - platformProperties.width / 2 && player.position.x - 10 < platform.position.x + platformProperties.width / 2 && player.position.z + 10 > platform.position.z - platformProperties.depth / 2 && player.position.z - 10 < platform.position.z + platformProperties.depth / 2) {
            player.position.y = platform.position.y + platformProperties.height / 2 - 10;
            playerProperties.velocityY = 0;
            playerProperties.onGround = true;
            playerProperties.doubleJump = false;
        } else {
            playerProperties.onGround = false;
        }

        // Check for collision with the block
        if (player.position.x + 10 > block.position.x - blockProperties.width / 2 && player.position.x - 10 < block.position.x + blockProperties.width / 2 && player.position.y + 10 > block.position.y - blockProperties.height / 2 && player.position.y - 10 < block.position.y + blockProperties.height / 2 && player.position.z + 10 > block.position.z - blockProperties.depth / 2 && player.position.z - 10 < block.position.z + blockProperties.depth / 2) {
            player.position.y = block.position.y - blockProperties.height / 2 - 10;
            playerProperties.velocityY = 0;
            playerProperties.onGround = true;
            playerProperties.doubleJump = false;
        } else {
            playerProperties.onGround = false;
        }

        // Handle keyboard input
        if (isKeyPressed('w')) {
            playerProperties.velocityZ = -playerProperties.speed;
        } else if (isKeyPressed('s')) {
            playerProperties.velocityZ = playerProperties.speed;
        } else {
            playerProperties.velocityZ = 0;
        }

        if (isKeyPressed('a')) {
            playerProperties.velocityX = -playerProperties.speed;
        } else if (isKeyPressed('d')) {
            playerProperties.velocityX = playerProperties.speed;
        } else {
            playerProperties.velocityX = 0;
        }

        if (isKeyPressed(' ') && playerProperties.onGround) {
            playerProperties.velocityY = -playerProperties.jumpSpeed;
            playerProperties.onGround = false;
        } else if (isKeyPressed(' ') && !playerProperties.onGround && !playerProperties.doubleJump) {
            playerProperties.velocityY = -playerProperties.jumpSpeed;
            playerProperties.doubleJump = true;
        }

        // Update the projectile position
        if (projectile) {
            projectile.position.x += projectileProperties.velocityX;
            projectile.position.y += projectileProperties.velocityY;
            projectile.position.z += projectileProperties.velocityZ;
        }

        // Render the scene
        renderer.render(scene, camera);

        // Request the next frame
        requestAnimationFrame(animate);
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
