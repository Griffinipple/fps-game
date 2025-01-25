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
  camera.position.set(15, 2, 15); // Spawn away from the tower
  camera.rotation.order = "YXZ"; // Use YXZ order for proper FPS-style rotations

  // Add Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Add Directional Light (Sunlight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0, 50, 0); // Move the sun higher up in the air
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Add a Sun Sphere
  const sunGeometry = new THREE.SphereGeometry(3, 32, 32); // Increase the size of the sun
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 50, 0); // Match the position of the directional light
  scene.add(sun);

  // Create Brown Platform
  const platformGeometry = new THREE.PlaneGeometry(100, 100);
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x9c7f17 }); // Updated brown color for the platform
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.rotation.x = -Math.PI / 2; // Rotate to lay flat
  platform.receiveShadow = true;
  scene.add(platform);

  // Create Gray Tower in the Center
  const towerGeometry = new THREE.BoxGeometry(10, 5, 10); // Shorten block to allow jumping onto it
  const towerMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Gray color for the block
  const tower = new THREE.Mesh(towerGeometry, towerMaterial);
  tower.position.set(0, 2.5, 0); // Adjust position to match new height
  tower.castShadow = true;
  tower.receiveShadow = true;
  scene.add(tower);

  // Create a platform directly on top of the block
  const topPlatformGeometry = new THREE.PlaneGeometry(10, 10);
  const topPlatformMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 }); // Light gray color for the platform // Same color as the ground
  const topPlatform = new THREE.Mesh(topPlatformGeometry, topPlatformMaterial);
  topPlatform.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  topPlatform.position.set(0, 5.003, 0); // Raise the platform slightly higher
  topPlatform.receiveShadow = true;
  scene.add(topPlatform);

  // Add collision detection for the tower
  const towerBox = new THREE.Box3().setFromObject(tower);

  function handleTowerCollision() {
    // Check if player is above or within the tower's horizontal bounds
    const withinTowerX = camera.position.x >= towerBox.min.x && camera.position.x <= towerBox.max.x;
    const withinTowerZ = camera.position.z >= towerBox.min.z && camera.position.z <= towerBox.max.z;

    if (withinTowerX && withinTowerZ) {
      // Set player on top of the tower if within vertical range
      if (camera.position.y <= towerBox.max.y && camera.position.y >= towerBox.min.y) {
        camera.position.y = towerBox.max.y;
        velocityY = 0; // Reset vertical velocity
        isJumping = false; // Allow jumping again
      }
    }

    // Check for platform collision on top of the tower
    const platformHeight = 5; // Height of the platform above the tower
    if (
      withinTowerX &&
      withinTowerZ &&
      camera.position.y < platformHeight + 0.5 &&
      camera.position.y > platformHeight - 1.5
    ) {
      camera.position.y = platformHeight; // Set camera on the platform
      isJumping = false; // Allow jumping again
      velocityY = 0; // Reset vertical velocity
    }
}  // Pointer Lock for Mouse Look
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

  // WASD and Jump Controls
  const keys = {};
  document.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
  document.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

  let isJumping = false; // To prevent double-jumping
  let velocityY = 0; // Vertical velocity for jumping
  const gravity = -0.02; // Increased gravity affecting the player
  const jumpStrength = 0.45; // Jump height

  function updatePlayer() {
    const speed = 0.2; // Increased movement speed for smoother and faster movement
    const direction = new THREE.Vector3(); // Movement direction

    // Calculate forward and right vectors based on camera rotation
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // Ignore vertical movement
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)); // Right vector is perpendicular to forward and up

    // Adjust movement direction based on key presses
    if (keys['w']) direction.add(forward); // Move forward
    if (keys['s']) direction.add(forward.clone().negate()); // Move backward
    if (keys['a']) direction.add(right.clone().negate()); // Move left
    if (keys['d']) direction.add(right); // Move right

    // Normalize the direction vector (to avoid diagonal speed boost)
    direction.normalize();

    // Move the camera
    const nextPosition = camera.position.clone().add(direction.multiplyScalar(speed));
    const playerBox = new THREE.Box3().setFromCenterAndSize(nextPosition, new THREE.Vector3(1, 1, 1));

    // Check for collision with the tower
    if (!towerBox.intersectsBox(playerBox)) {
      camera.position.copy(nextPosition);
    }

    // Handle jumping
    if (keys[' ']) {
      if (!isJumping) {
        velocityY = jumpStrength; // Apply jump strength
        isJumping = true; // Prevent double-jumping
      }
    }

    // Apply gravity
    velocityY += gravity;
    camera.position.y += velocityY;

    // Prevent falling through the ground
    if (camera.position.y < 2) {
      camera.position.y = 2; // Reset to ground level
      isJumping = false; // Allow jumping again
      velocityY = 0; // Reset vertical velocity
    }
  }

  // Game Loop
  function animate() {
    requestAnimationFrame(animate);

    updatePlayer(); // Update player movement
    renderer.render(scene, camera); // Render the scene
  }

  animate(); // Start the game loop
}
