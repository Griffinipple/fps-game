// Get the canvas element
const canvas = document.getElementById("gameCanvas");

// Set up Three.js renderer
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create the scene and camera
const scene = new THREE.Scene();
scene.clear(); // Clear any previous objects in the scene

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 10, 0); // Spawn high above the environment's center

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Load GLTF models
const loader = new THREE.GLTFLoader();

// Array to hold collidable objects
const collidableObjects = [];
let environmentLoaded = false; // Track if the environment is already loaded

// Load the environment and add it to the scene
loader.load('assets/models/environment.glb', (gltf) => {
    if (environmentLoaded) return; // Prevent loading the environment multiple times
    environmentLoaded = true;

    const environment = gltf.scene;
    environment.scale.set(10, 10, 10); // Scale the environment
    environment.position.set(0, -5, 0); // Position it in the scene
    scene.add(environment);

    console.log("Environment successfully added to the scene");

    // Add all meshes in the environment to collidable objects
    environment.traverse((child) => {
        if (child.isMesh) {
            collidableObjects.push(child);
        }
    });
});

// Add gun (weapon model) to the camera
loader.load('assets/models/weapon.glb', (gltf) => {
    const weapon = gltf.scene;
    weapon.scale.set(0.5, 0.5, 0.5); // Scale the weapon
    weapon.position.set(0.5, -0.5, -1); // Bottom-right position
    weapon.rotation.set(0, Math.PI, 0); // Adjust rotation if needed
    camera.add(weapon); // Attach the weapon to the camera
});

// Player movement and gravity
const velocity = new THREE.Vector3(); // x, y, z movement
const gravity = -0.01; // Strength of gravity
const jumpStrength = 0.2; // How high the player can jump
let isOnGround = false; // Check if the player is on the ground

// Pointer Lock API for mouse input
const mouseSensitivity = 0.002;

function onMouseMove(event) {
    camera.rotation.y -= event.movementX * mouseSensitivity; // Horizontal rotation
    camera.rotation.x -= event.movementY * mouseSensitivity; // Vertical rotation
    camera.rotation.x = Math.max(Math.min(camera.rotation.x, Math.PI / 2), -Math.PI / 2); // Clamp vertical rotation
}

document.body.addEventListener("click", () => {
    canvas.requestPointerLock(); // Lock the pointer
});

document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
        document.addEventListener("mousemove", onMouseMove, false);
    } else {
        document.removeEventListener("mousemove", onMouseMove, false);
    }
});

// Enemies
const enemies = [];
const enemySpeed = 0.02;

// Function to spawn enemies
function spawnEnemy(position) {
    loader.load('assets/models/enemy.glb', (gltf) => {
        const enemy = gltf.scene;
        enemy.scale.set(1, 1, 1);
        enemy.position.copy(position);
        enemy.name = "enemy";
        scene.add(enemy);
        enemies.push(enemy);
    });
}

// Spawn random enemies
for (let i = 0; i < 5; i++) {
    const x = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    spawnEnemy(new THREE.Vector3(x, 0, z));
}

// Move enemies toward the player
function updateEnemies() {
    enemies.forEach((enemy) => {
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, enemy.position).normalize();
        enemy.position.add(direction.multiplyScalar(enemySpeed));

        if (enemy.position.distanceTo(camera.position) < 1) {
            console.log("Enemy reached the player!");
            // Add health reduction logic here
        }
    });
}

// Bullets
const bullets = [];
const bulletSpeed = 0.5;

// Shoot bullets
function shootBullet() {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(geometry, material);

    bullet.position.copy(camera.position);

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.userData.direction = direction;

    scene.add(bullet);
    bullets.push(bullet);
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bulletSpeed));

        // Check for collisions with enemies
        enemies.forEach((enemy) => {
            const distance = bullet.position.distanceTo(enemy.position);
            if (distance < 1) {
                console.log("Enemy hit!");
                scene.remove(enemy); // Remove enemy
                scene.remove(bullet); // Remove bullet
                enemies.splice(enemies.indexOf(enemy), 1);
                bullets.splice(i, 1);
            }
        });

        // Remove bullets if they go too far
        if (bullet.position.length() > 50) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

// Handle collisions with the environment
function checkCollisions(newPosition) {
    const playerBox = new THREE.Box3().setFromObject(camera);
    playerBox.translate(newPosition); // Simulate movement to the new position

    for (const object of collidableObjects) {
        const objectBox = new THREE.Box3().setFromObject(object);
        if (playerBox.intersectsBox(objectBox)) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

// Update player movement and gravity
function updateMovement() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    const newVelocity = velocity.clone();

    if (moveForward) newVelocity.add(forward.clone().multiplyScalar(0.1));
    if (moveBackward) newVelocity.add(forward.clone().multiplyScalar(-0.1));
    if (moveLeft) newVelocity.add(right.clone().multiplyScalar(-0.1));
    if (moveRight) newVelocity.add(right.clone().multiplyScalar(0.1));

    if (!isOnGround) newVelocity.y += gravity; // Apply gravity if not grounded

    // Calculate potential new position
    const newPosition = newVelocity.clone();

    // Check collisions for X and Z axes
    const noCollisionX = !checkCollisions(new THREE.Vector3(newPosition.x, 0, 0));
    const noCollisionZ = !checkCollisions(new THREE.Vector3(0, 0, newPosition.z));

    if (noCollisionX) camera.position.x += newVelocity.x;
    if (noCollisionZ) camera.position.z += newVelocity.z;

    // Check collision for Y axis (falling)
    const noCollisionY = !checkCollisions(new THREE.Vector3(0, newVelocity.y, 0));
    if (noCollisionY) {
        camera.position.y += newVelocity.y;
        isOnGround = false;
    } else {
        isOnGround = true;
        velocity.y = 0; // Reset vertical velocity
    }

    // Apply friction
    velocity.x *= 0.9;
    velocity.z *= 0.9;

    // Prevent sinking below the environment
    if (camera.position.y < 1.6) {
        camera.position.y = 1.6; // Set default ground level
        isOnGround = true;
    }
}

// Handle input
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;

document.addEventListener("keydown", (event) => {
    switch (event.code) {
        case "KeyW": moveForward = true; break;
        case "KeyS": moveBackward = true; break;
        case "KeyA": moveLeft = true; break;
        case "KeyD": moveRight = true; break;
        case "Space":
            if (isOnGround) {
                velocity.y += jumpStrength;
                isOnGround = false;
            }
            break;
    }
});

document.addEventListener("keyup", (event) => {
    switch (event.code) {
        case "KeyW": moveForward = false; break;
        case "KeyS": moveBackward = false; break;
        case "KeyA": moveLeft = false; break;
        case "KeyD": moveRight = false; break;
    }
});

// Shoot bullets
document.addEventListener("mousedown", shootBullet);

// Game loop
function animate() {
    requestAnimationFrame(animate);

    updateMovement(); // Check and apply player movement
    checkCollisions(); // Ensure the player doesn't pass through objects
    updateBullets(); // Handle bullets fired by the player
    updateEnemies(); // Move enemies toward the player

    renderer.render(scene, camera); // Render the scene
}

animate();
