// Import the necessary loader
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(light);

// Load GLTF Models
const loader = new THREE.GLTFLoader();

let gun, enemy;

// Load the gun model
loader.load('/assets/models/gun.glb', (gltf) => {
  gun = gltf.scene;
  gun.position.set(0, -1, -2); // Position relative to the camera
  camera.add(gun); // Attach gun to the camera for first-person view
  scene.add(camera);
}, undefined, (error) => console.error(error));

// Load the enemy model
loader.load('/assets/models/enemy.glb', (gltf) => {
  enemy = gltf.scene;
  enemy.position.set(0, 0, -5); // Place enemy in front of the player
  scene.add(enemy);
}, undefined, (error) => console.error(error));

// Basic player controls (WASD movement)
const keys = {};
document.addEventListener('keydown', (e) => (keys[e.key] = true));
document.addEventListener('keyup', (e) => (keys[e.key] = false));

function updatePlayer() {
  if (keys['w']) camera.position.z -= 0.1; // Move forward
  if (keys['s']) camera.position.z += 0.1; // Move backward
  if (keys['a']) camera.position.x -= 0.1; // Move left
  if (keys['d']) camera.position.x += 0.1; // Move right
}

// Game loop
function animate() {
  requestAnimationFrame(animate);

  updatePlayer();

  if (gun) gun.rotation.y += 0.01; // Slight rotation to show the gun
  if (enemy) enemy.rotation.y += 0.01; // Rotate enemy for effect

  renderer.render(scene, camera);
}
animate();
