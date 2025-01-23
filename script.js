// Get the canvas element
const canvas = document.getElementById("gameCanvas");

// Set up Three.js renderer
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create the scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 1.6, 5); // Spawn position

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Load GLTF models
const loader = new THREE.GLTFLoader();

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

// Spawn some enemies
for (let i = 0; i < 5; i++) {
    const x = (Math.random() - 0.5) * 20; // Random X position
    const z = (Math.random() - 0.5) * 20; // Random Z position
    spawnEnemy(new THREE.Vector3(x, 0, z));
}

// Move enemies toward the player
function updateEnemies() {
    enemies.forEach((enemy) => {
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, enemy.position).normalize();
        enemy.position.add(direction.multiplyScalar(enemySpeed));

        // Check if the enemy reaches the player
        if (enemy.position.distanceTo(camera.position) < 1) {
            console.log("Enemy reached the player!");
            // Add health reduction logic here if needed
        }
    });
}

// Bullets
const bullets = [];
const bulletSpeed = 0.5;

// Shoot bullets
function shootBullet() {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8); // Bullet shape
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(geometry, material);

    bullet.position.copy(camera.position);

    // Get shooting direction
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

        // Remove bullets if they go out of range
        if (bullet.position.length() > 50) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

// Listen for shooting
document.addEventListener("mousedown", shootBullet);

// Player Movement
const moveSpeed = 0.1;
const rotationSpeed = 0.002;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Pointer Lock API for mouse control
document.body.addEventListener("click", () => {
    canvas.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
        document.addEventListener("mousemove", onMouseMove, false);
    } else {
        document.removeEventListener("mousemove", onMouseMove, false);
    }
});

// Mouse look
function onMouseMove(event) {
    camera.rotation.y -= event.movementX * rotationSpeed;
    camera.rotation.x -= event.movementY * rotationSpeed;
    camera.rotation.x = Math.max(Math.min(camera.rotation.x, Math.PI / 2), -Math.PI / 2); // Limit vertical rotation
}

// Keyboard controls
document.addEventListener("keydown", (event) => {
    switch (event.code) {
        case "KeyW":
            moveForward = true;
            break;
        case "KeyS":
            moveBackward = true;
            break;
        case "KeyA":
            moveLeft = true;
            break;
        case "KeyD":
            moveRight = true;
            break;
    }
});

document.addEventListener("keyup", (event) => {
    switch (event.code) {
        case "KeyW":
            moveForward = false;
            break;
        case "KeyS":
            moveBackward = false;
            break;
        case "KeyA":
            moveLeft = false;
            break;
        case "KeyD":
            moveRight = false;
            break;
    }
});

// Update player movement
function updateMovement() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    if (moveForward) camera.position.add(forward.multiplyScalar(moveSpeed));
    if (moveBackward) camera.position.add(forward.multiplyScalar(-moveSpeed));
    if (moveLeft) camera.position.add(right.multiplyScalar(-moveSpeed));
    if (moveRight) camera.position.add(right.multiplyScalar(moveSpeed));
}

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Update game logic
    updateMovement();
    updateBullets();
    updateEnemies();

    // Render the scene
    renderer.render(scene, camera);
}

animate();
