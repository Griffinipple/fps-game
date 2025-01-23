// Basic setup (unchanged)
const canvas = document.getElementById("gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5); // Start position

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Load models (unchanged)
const loader = new THREE.GLTFLoader();
loader.load('assets/models/weapon.glb', (gltf) => {
    const weapon = gltf.scene;
    weapon.scale.set(0.5, 0.5, 0.5);
    weapon.position.set(0, -0.5, -1.5);
    camera.add(weapon); // Attach weapon to the camera
    scene.add(camera);
});
loader.load('assets/models/enemy.glb', (gltf) => {
    const enemy = gltf.scene;
    enemy.scale.set(1, 1, 1);
    enemy.position.set(0, 0, -10);
    scene.add(enemy);
});

// Movement variables
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

// Mouse look around
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

---

### **2. Shooting Mechanics**

We'll use **raycasting** to detect collisions with enemies when the player shoots.

---

#### Adding Shooting Mechanics to **script.js**
```javascript
// Raycaster for shooting
const raycaster = new THREE.Raycaster();
const shootDirection = new THREE.Vector3();

// Listen for shooting (mouse click)
document.addEventListener("mousedown", () => {
    // Get the direction the camera is facing
    camera.getWorldDirection(shootDirection);
    raycaster.set(camera.position, shootDirection);

    // Check for intersections with objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const target = intersects[0].object;
        // Remove the object if it's an enemy
        if (target.name === "enemy") {
            scene.remove(target);
            console.log("Enemy hit!");
        }
    }
});

// Mark the enemy model so we can detect it
loader.load('assets/models/enemy.glb', (gltf) => {
    const enemy = gltf.scene;
    enemy.name = "enemy";
    enemy.scale.set(1, 1, 1);
    enemy.position.set(0, 0, -10);
    scene.add(enemy);
});

// Game loop (unchanged)
function animate() {
    requestAnimationFrame(animate);

    // Update movement
    updateMovement();

    renderer.render(scene, camera);
}

animate();
