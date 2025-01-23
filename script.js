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
  directionalLight.position.set(0, 50, 0); // Move the sun higher up in the air
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Add a Sun Sphere
  const sunGeometry = new THREE.SphereGeometry(3, 32, 32); // Increase the size of the sun
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00, emissive: 0xffdd88 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 50, 0); // Match the position of the directional light
  scene.add(sun);

  // Create Ground
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Green ground
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to lay flat
  ground.receiveShadow = true;
  scene.add(ground);

  // Create Simple House
  // House Base
  const houseBaseGeometry = new THREE.BoxGeometry(4, 3, 4);
  const houseBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Brown walls
  const houseBase = new THREE.Mesh(houseBaseGeometry, houseBaseMaterial);
  houseBase.position.set(0, 1.5, 0); // Center above the ground
  houseBase.castShadow = true;
  houseBase.receiveShadow = true;
  scene.add(houseBase);

  // Roof
  const roofGeometry = new THREE.ConeGeometry(3.5, 2, 4);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 }); // Red roof
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.set(0, 4, 0); // Position on top of the house base
  roof.rotation.y = Math.PI / 4; // Rotate to align with the base
  roof.castShadow = true;
  scene.add(roof);

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

  // WASD and Jump Controls
  const keys = {};
  document.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
  document.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

  let isJumping = false; // To prevent double-jumping
  let velocityY = 0; // Vertical velocity for jumping
  const gravity = -0.005; // Gravity affecting the player
  const jumpStrength = 0.15; // Jump height

  // Collision Detection Setup
  const collidableObjects = [houseBase, roof];

  function checkCollision(newPosition) {
    const cameraBox = new THREE.Box3().setFromCenterAndSize(newPosition, new THREE.Vector3(1, 1, 1));
    for (const object of collidableObjects) {
      const objectBox = new THREE.Box3().setFromObject(object);
      if (cameraBox.intersectsBox(objectBox)) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }

  function updatePlayer() {
    const speed = 0.1; // Movement speed
    const direction = new THREE.Vector3(); // Movement direction

    // Calculate forward and right vectors based on camera rotation
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // Ignore vertical movement
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)); // Right is perpendicular to forward and up

    // Adjust movement direction based on key presses
    if (keys['w']) direction.add(forward); // Move forward
    if (keys['s']) direction.add(forward.negate()); // Move backward
    if (keys['a']) direction.add(right.negate()); // Move left
    if (keys['d']) direction.add(right); // Move right

    // Normalize the direction vector (to avoid diagonal speed boost)
    direction.normalize();

    // Calculate the new position
    const newPosition = camera.position.clone().add(direction.multiplyScalar(speed));

    // Check for collisions
    if (!checkCollision(newPosition)) {
      camera.position.copy(newPosition);
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
