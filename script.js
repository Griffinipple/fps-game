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
  camera.position.set(0, 2, 5); // Move the camera up and back
  camera.lookAt(0, 0, 0); // Make the camera face the center of the scene

  // Add Ambient Light (soft light everywhere)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Increase intensity
  scene.add(ambientLight);

  // Add Directional Light (like sunlight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Bright sunlight
  directionalLight.position.set(10, 10, -10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Add a helper to see where the directional light is
  const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 2);
  scene.add(lightHelper);

  // Add a Platform (Ground)
  const platformGeometry = new THREE.PlaneGeometry(50, 50);
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Green for grass
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.rotation.x = -Math.PI / 2; // Rotate to lie flat
  platform.receiveShadow = true;
  scene.add(platform);

  // Add a Sun Sphere
  const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00, emissive: 0xffdd88 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(10, 10, -10);
  scene.add(sun);

  // Pointer Lock for Mouse Look
  const canvas = renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
  document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  // Mouse Look Variables
  let yaw = 0, pitch = 0;

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas) {
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      yaw -= movementX * 0.002;
      pitch -= movementY * 0.002;

      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

      camera.rotation.set(pitch, yaw, 0);
    }
  });

  // WASD Controls
  const keys = {};
  document.addEventListener('keydown', (e) => (keys[e.key] = true));
  document.addEventListener('keyup', (e) => (keys[e.key] = false));

  function updatePlayer() {
    const speed = 0.1;

    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, -Math.cos(yaw + Math.PI / 2));

    if (keys['w']) camera.position.add(forward.multiplyScalar(speed));
    if (keys['s']) camera.position.add(forward.multiplyScalar(-speed));
    if (keys['a']) camera.position.add(right.multiplyScalar(-speed));
    if (keys['d']) camera.position.add(right.multiplyScalar(speed));
  }

  // Game Loop
  function animate() {
    requestAnimationFrame(animate);

    updatePlayer(); // Update player movement
    renderer.render(scene, camera); // Render the scene
  }

  animate(); // Start the game loop
}
