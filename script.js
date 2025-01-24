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
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
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

  // Surround the Ground with Larger, Less Steep Pyramids
  const pyramidGeometry = new THREE.ConeGeometry(10, 5, 4); // Larger base, less steep height
  const pyramidMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 }); // Red pyramids

  const pyramidPositions = [
    { x: -20, z: -20 },
    { x: -20, z: 20 },
    { x: 20, z: -20 },
    { x: 20, z: 20 },
    { x: 0, z: -20 },
    { x: 0, z: 20 },
    { x: -20, z: 0 },
    { x: 20, z: 0 },
  ];

  const collidableObjects = []; // Collect pyramids for collision detection

  pyramidPositions.forEach((pos) => {
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.set(pos.x, 2.5, pos.z); // Adjust height to align with the ground
    pyramid.castShadow = true;
    pyramid.receiveShadow = true;
    scene.add(pyramid);

    // Use THREE.ConeGeometry vertices to define collision shape
    const vertices = pyramidGeometry.attributes.position.array;
    const pyramidFaces = [];
    for (let i = 0; i < vertices.length; i += 9) {
      const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
      const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
      const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
      pyramidFaces.push([v1, v2, v3]);
    }
    collidableObjects.push({ mesh: pyramid, faces: pyramidFaces }); // Store pyramid mesh and faces for collision
  });

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

  function checkCollision(position) {
    for (const object of collidableObjects) {
      const mesh = object.mesh;
      const faces = object.faces;

      for (const face of faces) {
        const [v1, v2, v3] = face;
        const worldV1 = v1.clone().applyMatrix4(mesh.matrixWorld);
        const worldV2 = v2.clone().applyMatrix4(mesh.matrixWorld);
        const worldV3 = v3.clone().applyMatrix4(mesh.matrixWorld);

        const normal = new THREE.Triangle(worldV1, worldV2, worldV3).normal();
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, worldV1);

        if (plane.distanceToPoint(position) < 0.5) {
          return { normal, plane }; // Return collision info
        }
      }
    }
    return null; // No collision
  }

  function slideAlongSurface(direction, collision) {
    const slideDirection = direction.clone();
    if (collision) {
      const { normal } = collision;
      slideDirection.sub(normal.multiplyScalar(normal.dot(slideDirection)));
    }
    return slideDirection;
  }

  function updatePlayer() {
    const speed = 0.1; // Movement speed
    let direction = new THREE.Vector3();

    // Calculate forward and right vectors based on camera rotation
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // Ignore vertical movement
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)); // Right is perpendicular to forward and up

    // Adjust movement direction based on key presses
    if (keys['w']) direction.add(forward);
    if (keys['s']) direction.add(forward.negate());
    if (keys['a']) direction.add(right.negate());
    if (keys['d']) direction.add(right);

    // Normalize direction
    direction.normalize();

    // Predict new position for horizontal movement
    const newPosition = camera.position.clone().add(direction.multiplyScalar(speed));

    // Check for collision
    const collision = checkCollision(newPosition);
    if (collision) {
      const slideDirection = slideAlongSurface(direction, collision);
      const slidePosition = camera.position.clone().add(slideDirection.multiplyScalar(speed));
      camera.position.copy(slidePosition);
    } else {
      camera.position.copy(newPosition);
    }

    // Handle jumping
    if (keys[' ']) {
      if (!isJumping) {
        velocityY = jumpStrength; // Apply jump strength
        isJumping = true; // Prevent double-jumping
      }
    }

    // Apply gravity and vertical movement
    velocityY += gravity;
    const newYPosition = camera.position.y + velocityY;

    // Check for collision for vertical movement
    const verticalCollision = checkCollision(new THREE.Vector3(camera.position.x, newYPosition, camera.position.z));
    if (!verticalCollision) {
      camera.position.y = newYPosition;
    } else {
      velocityY = 0; // Stop vertical velocity on collision
    }

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
