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
camera.position.set(0, 1.6, 5); // Slightly above the ground

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Load GLTF models
const loader = new THREE.GLTFLoader();

// Load weapon
loader.load('assets/models/weapon.glb', function (gltf) {
    const weapon = gltf.scene;
    weapon.scale.set(0.5, 0.5, 0.5); // Scale down
    weapon.position.set(0, -0.5, -1.5); // Position relative to camera
    camera.add(weapon); // Attach the weapon to the camera
    scene.add(camera);
});

// Load enemy
loader.load('assets/models/enemy.glb', function (gltf) {
    const enemy = gltf.scene;
    enemy.scale.set(1, 1, 1); // Default scale
    enemy.position.set(0, 0, -10); // Place enemy in front of the player
    scene.add(enemy);
});

// Load environment
loader.load('assets/models/environment.glb', function (gltf) {
    const environment = gltf.scene;
    environment.scale.set(10, 10, 10); // Scale the environment
    environment.position.set(0, -5, 0); // Position the environment
    scene.add(environment);
});

// Handle resizing
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Render the scene
    renderer.render(scene, camera);
}

animate();
