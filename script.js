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
camera.position.set(0, 1.6, 5); // Start slightly above the ground

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Create the ground
const groundGeometry = new THREE.PlaneGeometry(50, 50); // Large ground plane
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x008800 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to lay flat
ground.receiveShadow = true;
scene.add(ground);

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

// Gun model placeholder (simple box)
const gunGeometry = new THREE.BoxGeometry(0.5, 0.3, 1); // Simple rectangular gun
const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const gun = new THREE.Mesh(gunGeometry, gunMaterial);
gun.position.set(0.5, -0.5, -1); // Bottom-right corner relative to the camera
camera.add(gun);

// Crosshair (HTML-based)
const crosshair = document.createElement("div");
crosshair.id = "crosshair";
crosshair.style.position = "absolute";
crosshair.style.top = "50%";
crosshair.style.left = "50%";
crosshair.style.width = "10px";
crosshair.style.height = "10px";
crosshair.style.background = "red";
crosshair.style.borderRadius = "50%";
crosshair.style.transform = "translate(-50%, -50%)";
crosshair.style.zIndex = "1000";
document.body.appendChild(crosshair);

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

    // Simulate friction
    newVelocity.x *= 0.9;
    newVelocity.z *= 0.9;

    // Move the camera
    camera.position.add(newVelocity);

    // Prevent sinking below the ground
    if (camera.position.y < 1.6) {
        camera.position.y = 1.6; // Set ground level
        isOnGround = true;
        velocity.y = 0; // Reset vertical velocity
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
                velocity.y += jumpStrength; // Jump
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

// Game loop
function animate() {
    requestAnimationFrame(animate);

    updateMovement(); // Check and apply movement
    renderer.render(scene, camera); // Render the scene
}

animate();
