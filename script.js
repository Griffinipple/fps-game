// Elements
const lobby = document.getElementById('lobby');
const playButton = document.getElementById('play-button');
const gameDiv = document.getElementById('game');

// Play button click event
playButton.addEventListener('click', () => {
  // Hide the lobby
  lobby.style.display = 'none';

  // Show the game canvas
  gameDiv.style.display = 'block';

  // Start the game
  startGame();
});

function startGame() {
  // Create Scene, Camera, and Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Position the camera
  camera.position.set(0, 2, 5); // Start above the ground
  camera.rotation.order = "YXZ"; // Use YXZ order for proper FPS-style rotations

  // Add Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Add Directional Light (Sunlight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(10, 10, -10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Add a Sun Sphere
  const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00, emissive: 0xffdd88 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(10, 10, -10);
  scene.add(sun);

  // Add a Platform (Ground)
  const platformGeometry = new THREE.PlaneGeometry(50, 50);
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Green for grass
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.rotation.x = -Math.PI / 2; // Rotate to lie flat
  platform.receiveShadow = true;
  scene.add(platform);

  // Pointer Lock for Mouse Look
  const canvas = renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
  document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  // Mouse Look Variables
  let yaw = 0; // Horizontal rotation (left/right)
  let pitch = 0; // Vertical rotation (up/down)

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas) {
      const sensitivity = 0.002; // Mouse sensitivity
      yaw -= event.movementX * sensitivity; // Rotate horizontally
      pitch -= event.movementY * sensitivity; // Rotate vertically

      // Clamp the pitch to avoid flipping (up/down rotation)
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

      camera.rotation.set(pitch, yaw, 0);
    }
  });

  // WASD Controls
  const keys = {};
  document.addEventListener('keydown', (e) => (keys[e.key] = true));
  document.addEventListener('keyup', (e) => (keys[e.key] = false));

  function updatePlayer() {
    const speed = 0.1; // Movement speed
    const direction = new THREE.Vector3(); // Movement direction

    // Calculate forward and right vectors based on camera rotation
    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, -Math.cos(yaw + Math.PI / 2));

    // Adjust movement direction based on key presses
    if (keys['w']) direction.add(forward.negate()); // Move forward
    if (keys['s']) direction.add(forward); // Move backward
    if (keys['a']) direction.add(right); // Move left
    if (keys['d']) direction.add(right.negate(); // Move right

    // Normalize the direction vector (to avoid diagonal speed boost)
    direction.normalize();

    // Move the camera
    camera.position.add(direction.multiplyScalar(speed));
  }

  // Game Loop
  function animate() {
    requestAnimationFrame(animate);

    updatePlayer(); // Update player movement
    renderer.render(scene, camera); // Render the scene
  }

  animate(); // Start the game loop
}
