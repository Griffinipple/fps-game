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
  const collidableObjects = [];
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

  // Create Ground and Roads
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Gray ground for roads
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to lay flat
  ground.receiveShadow = true;
  scene.add(ground);

  // Add Rectangular Buildings with Ladders
  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark gray buildings
  const ladderMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Light gray ladders

  const buildingHeights = [10, 15, 20, 25, 30]; // Possible heights for buildings

  const buildingPositions = [
    { x: -20, z: -20, width: 10, depth: 10 },
    { x: 20, z: -20, width: 15, depth: 10 },
    { x: -20, z: 20, width: 12, depth: 12 },
    { x: 20, z: 20, width: 10, depth: 15 },
  ];

  buildingPositions.forEach((pos) => {
    const height = buildingHeights[Math.floor(Math.random() * buildingHeights.length)]; // Random height
    const buildingGeometry = new THREE.BoxGeometry(pos.width, height, pos.depth);
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(pos.x, height / 2, pos.z); // Position above the ground
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    // Add collision detection for the building
    const buildingBox = new THREE.Box3().setFromObject(building);
    building.userData.collisionBox = buildingBox;
    collidableObjects.push(building);

    // Add a ladder to one side of the building
    const ladderGeometry = new THREE.BoxGeometry(2, height, 0.5);
    const ladder = new THREE.Mesh(ladderGeometry, ladderMaterial);
    ladder.position.set(pos.x - pos.width / 2 - 1, height / 2, pos.z); // Position ladder on the side of the building
    ladder.castShadow = true;
    ladder.receiveShadow = true;
    ladder.userData.isLadder = true; // Add user data to identify ladders
    scene.add(ladder);
  });

  let onLadder = false;


  function checkLadderCollision() {
    const playerBox = new THREE.Box3().setFromCenterAndSize(camera.position, new THREE.Vector3(1, 1, 1));
    for (const object of collidableObjects) {
      if (object.userData.isLadder) {
        const ladderBox = new THREE.Box3().setFromObject(object);
        if (ladderBox.intersectsBox(playerBox)) {
          return true;
        }
      }
    }
    return false;
}

  // Load and Add Gun Model to the Bottom Right of the Screen
  const loader = new THREE.GLTFLoader();
  loader.load('/assets/models/weapon.glb', (gltf) => {
    const gun = gltf.scene;
    gun.scale.set(0.5, 0.5, 0.5); // Adjust the scale of the gun
    gun.position.set(0.6, -0.5, -1); // Position the gun in front of the camera
    gun.rotation.set(0, Math.PI / 2, 0); // Rotate the gun as needed
    camera.add(gun); // Add the gun as a child of the camera
  });

  // Shooting Mechanism
  const projectiles = [];

  function shoot() {
    const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const projectileMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 }); // Gray projectile
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

    // Position the projectile at the gun's barrel (front of the camera)
    const barrelOffset = new THREE.Vector3(0, -0.5, -1);
    projectile.position.copy(camera.localToWorld(barrelOffset));

    // Set projectile velocity
    const velocity = new THREE.Vector3();
    camera.getWorldDirection(velocity);
    velocity.multiplyScalar(1); // Adjust speed

    projectile.userData.velocity = velocity;
    scene.add(projectile);
    projectiles.push(projectile);
  }

  window.addEventListener('mousedown', () => {
    shoot();
  });

  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i];
      projectile.position.add(projectile.userData.velocity);

      // Remove the projectile if it goes out of bounds
      if (
        Math.abs(projectile.position.x) > 50 ||
        Math.abs(projectile.position.y) > 50 ||
        Math.abs(projectile.position.z) > 50
      ) {
        scene.remove(projectile);
        projectiles.splice(i, 1);
      }
    }
  }

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
  const gravity = -0.01; // Stronger gravity
  const jumpStrength = 0.25; // Higher jump

  function updatePlayer() {
    const speed = 0.2; // Increased movement speed
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

    // Move the camera
    const nextPosition = camera.position.clone().add(direction.multiplyScalar(speed));
    let collision = false;
    for (const object of collidableObjects) {
      const objectBox = new THREE.Box3().setFromObject(object);
      const playerBox = new THREE.Box3().setFromCenterAndSize(nextPosition, new THREE.Vector3(1, 1, 1));
      if (objectBox.intersectsBox(playerBox)) {
        collision = true;
        break;
      }
    }
    if (!collision) {
      camera.position.copy(nextPosition);
    }

    // Gravity and Jump Handling
    if (!checkLadderCollision()) {
      velocityY += gravity;
      camera.position.y += velocityY;

      if (camera.position.y < 1) {
        camera.position.y = 1;
        velocityY = 0;
        isJumping = false;
      }
    } else if (keys['w']) {
      onLadder = true;
      velocityY = 0.05; // Climbing speed
    }

    // Jump
    if (keys[' '] && !isJumping) {
      velocityY = jumpStrength;
      isJumping = true;
    }
  }

  // Game Loop
  function animate() {
    requestAnimationFrame(animate);

    updatePlayer(); // Update player movement
    updateProjectiles(); // Update projectile movement
    renderer.render(scene, camera); // Render the scene
  }

  animate(); // Start the game loop
}
