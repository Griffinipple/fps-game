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

  // Add Lighting
  const light = new THREE.AmbientLight(0xffffff, 0.8); // Soft ambient light
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true; // Enable shadows
  scene.add(directionalLight);

  // Create the platform (ground)
  const platformGeometry = new THREE.PlaneGeometry(50, 50); // Large ground plane
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Green for grass
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.rotation.x = -Math.PI / 2; // Rotate to lie flat
  platform.receiveShadow = true; // Enable shadow reception
  scene.add(platform);

  // Load Models (Gun and Enemy)
  const loader = new THREE.GLTFLoader();

  let gun, enemy;

  // Load gun model
  loader.load('/assets/models/gun.glb', (gltf) => {
    gun = gltf.scene;
    gun.position.set(0, -1, -2); // Position the gun
    camera.add(gun); // Attach the gun to the camera
    scene.add(camera);
  });

  // Load enemy model
  loader.load('/assets/models/enemy.glb', (gltf) => {
    enemy = gltf.scene;
    enemy.position.set(0, 1, -5); // Place enemy slightly above the ground
    enemy.castShadow = true; // Enable enemy to cast shadows
    scene.add(enemy);
  });

  // Enable Pointer Lock for Mouse Look
  const canvas = renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
  document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  let yaw = 0, pitch = 0; // Camera rotation angles

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas) {
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      yaw -= movementX * 0.002; // Adjust sensitivity here
      pitch -= movementY * 0.002;

      // Clamp the pitch to avoid flipping upside down
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

      camera.rotation.set(pitch, yaw, 0);
    }
  });

  // Basic Player Controls (WASD)
  const keys = {};
  document.addEventListener('keydown', (e) => (keys[e.key] = true));
  document.addEventListener('keyup', (e) => (keys[e.key] = false));

  function updatePlayer() {
    const speed = 0.1;

    const forward = new THREE.Vector3(
      Math.sin(yaw),
      0,
      -Math.cos(yaw)
    );
    const right = new THREE.Vector3(
      Math.sin(yaw + Math.PI / 2),
      0,
      -Math.cos(yaw + Math.PI / 2)
    );

    if (keys['w']) camera.position.add(forward.multiplyScalar(speed));
    if (keys['s']) camera.position.add(forward.multiplyScalar(-speed));
    if (keys['a']) camera.position.add(right.multiplyScalar(-speed));
    if (keys['d']) camera.position.add(right.multiplyScalar(speed));
  }

  // Game Loop
  function animate() {
    requestAnimationFrame(animate);

    updatePlayer(); // Update player movement

    if (gun) gun.rotation.y += 0.01; // Rotate the gun slightly for effect
    if (enemy) enemy.rotation.y += 0.01; // Rotate the enemy slightly

    renderer.render(scene, camera); // Render the scene
  }

  animate(); // Start the game loop
}
