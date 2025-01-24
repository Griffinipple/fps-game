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
const verticalCollidableObjects = []; // Separate set for vertical collision handling
const buildingPositions = [
    [1, 1, 1, 1, 1],
    [1, 2.25, 2.25, 2.25, 1],
    [1, 2.25, 3.5, 2.25, 1],
    [1, 2.25, 2.25, 2.25, 1],
    [1, 1, 1, 1, 1]
];
  // Create Scene, Camera, and Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Position the camera
  const spawnPoints = [
    { x: -29.5, y: 2, z: -29.5 }, // Top-left corner
    { x: 29.5, y: 2, z: -29.5 },  // Top-right corner
    { x: -29.5, y: 2, z: 29.5 },  // Bottom-left corner
    { x: 29.5, y: 2, z: 29.5 }    // Bottom-right corner
  ];

  

  // Ensure player spawns outside towers and within walls
  let randomSpawn;
  do {
    randomSpawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  } while (
    collidableObjects.some((object) => {
      const objectBox = new THREE.Box3().setFromObject(object);
      return (
        randomSpawn.x > objectBox.min.x &&
        randomSpawn.x < objectBox.max.x &&
        randomSpawn.z > objectBox.min.z &&
        randomSpawn.z < objectBox.max.z
      );
    })
  );
  camera.position.set(randomSpawn.x, randomSpawn.y, randomSpawn.z);

  // Find the tallest tower (center tower in this case)
  const centerX = (2 - 2) * 12; // Center X based on the grid
  const centerZ = (2 - 2) * 12; // Center Z based on the grid
  const centerHeight = buildingPositions[2][2] * 2; // Height multiplier * 2
  camera.lookAt(centerX, centerHeight / 2, centerZ);
  // Find the tallest tower (center tower in this case)
  camera.rotation.order = "YXZ";

  // Add Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Add Directional Light (Sunlight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0, 50, 0);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Create Ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add Surrounding Box
  // Add light blue walls and ceiling
  const walls = [
    { position: [0, 51, -30], rotation: [0, 0, 0] }, // Back wall
    { position: [0, 51, 30], rotation: [0, Math.PI, 0] }, // Front wall
    { position: [-30, 51, 0], rotation: [0, Math.PI / 2, 0] }, // Left wall
    { position: [30, 51, 0], rotation: [0, -Math.PI / 2, 0] }, // Right wall
  ];
  walls.forEach((wall) => {
    const wallGeometry = new THREE.PlaneGeometry(102, 102);
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xadd8e6, side: THREE.DoubleSide });
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(...wall.position);
    wallMesh.rotation.set(...wall.rotation);
    scene.add(wallMesh);

    // Add wall to collidable objects
    const wallBox = new THREE.Box3().setFromObject(wallMesh);
    wallMesh.userData.collisionBox = wallBox;
    collidableObjects.push(wallMesh);
  });

  // Add ceiling
  const ceilingGeometry = new THREE.PlaneGeometry(102, 102);
  const ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0xadd8e6, side: THREE.DoubleSide });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, 102, 0);
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);
  

  // Add Buildings
  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  

  buildingPositions.forEach((row, i) => {
    row.forEach((heightMultiplier, j) => {
      const posX = (i - 2) * 12;
      const posZ = (j - 2) * 12;
      const height = heightMultiplier * 2;
      const width = 10;
      const depth = 10;
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(posX, height / 2, posZ);

      // Add a flat platform to the top of the building
      const platformGeometry = new THREE.PlaneGeometry(width, depth);
      const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.rotation.x = -Math.PI / 2; // Make it horizontal
      platform.position.set(building.position.x, building.position.y + height / 2 + 0.01, building.position.z); // Position it at the top of the building
      platform.receiveShadow = true;
      scene.add(platform);
      // Add platform to collidable objects
      const platformBox = new THREE.Box3().setFromObject(platform);
      platform.userData.collisionBox = platformBox;
      verticalCollidableObjects.push(platform);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);

      const buildingBox = new THREE.Box3().setFromObject(building);
      const buildingTop = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(building.position.y + height / 2));
      building.userData.collisionBox = buildingBox;
      collidableObjects.push(building);
    });
  }); // Resize Event Listener
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Pointer Lock for Mouse Movement
  const canvas = renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
  document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas) {
      const sensitivity = 0.002;
      camera.rotation.y -= event.movementX * sensitivity;
      camera.rotation.x -= event.movementY * sensitivity;
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
  });

  // WASD Movement with Gravity
  const keys = {};
  document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === ' ' && velocityY === 0) {
      velocityY = 0.3; // Initial jump
    } else if (e.key.toLowerCase() === ' ' && canDoubleJump) {
      velocityY = 0.2; // Double jump
      canDoubleJump = false;
    }
  });
  document.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

  let velocityY = 0;
let canDoubleJump = false; // Track double jump ability
  const gravity = -0.01;
  const movementSpeed = 0.2;

  function updatePlayer() {
    let direction = new THREE.Vector3(); // Reset direction on every update

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (keys['w']) direction.add(forward.clone());
    if (keys['s']) direction.add(forward.clone().negate());
    if (keys['a']) direction.add(right.clone().negate());
    if (keys['d']) direction.add(right.clone());

    direction.normalize();

    const nextPosition = camera.position.clone().add(direction.multiplyScalar(movementSpeed));

    let collision = false;
    for (const object of collidableObjects) {
      const objectBox = new THREE.Box3().setFromObject(object);
      const playerBox = new THREE.Box3().setFromCenterAndSize(nextPosition, new THREE.Vector3(1, 2, 1));

      if (objectBox.intersectsBox(playerBox)) {
        collision = true;
        break;
      }

      // Check if the player is landing on top of the object
      if (
        nextPosition.y <= objectBox.max.y + 0.3 &&
        camera.position.y >= objectBox.max.y - 0.3 &&
        nextPosition.x >= objectBox.min.x &&
        nextPosition.x <= objectBox.max.x &&
        nextPosition.z >= objectBox.min.z &&
        nextPosition.z <= objectBox.max.z
      ) {
        camera.position.y = objectBox.max.y; // Align player with the top of the building
        velocityY = 0; // Reset vertical velocity
        canDoubleJump = true; // Allow double jump again
        collision = true;
        break;
      }
    }

    for (const platform of verticalCollidableObjects) {
      const platformBox = new THREE.Box3().setFromObject(platform);
      if (
        nextPosition.y <= platformBox.max.y + 0.3 &&
        camera.position.y >= platformBox.max.y - 0.3 &&
        nextPosition.x >= platformBox.min.x &&
        nextPosition.x <= platformBox.max.x &&
        nextPosition.z >= platformBox.min.z &&
        nextPosition.z <= platformBox.max.z
      ) {
        camera.position.y = platformBox.max.y;
        velocityY = 0;
        canDoubleJump = true;
        collision = true;
        break;
      }
    }

    if (!collision) {
      camera.position.copy(nextPosition);
    }

    velocityY += gravity;
    const groundLevel = 1; // Height of the ground
    camera.position.y += velocityY;
    if (camera.position.y < groundLevel) {
      camera.position.y = groundLevel;
      velocityY = 0;
      canDoubleJump = true; // Reset double jump when touching the ground
    }
  }
    }
      

      // Check if the player is landing on top of the object
      if (
        nextPosition.y <= objectBox.max.y + 0.3 && // Slightly increase buffer
        camera.position.y >= objectBox.max.y - 0.3 &&
        nextPosition.x >= objectBox.min.x &&
        nextPosition.x <= objectBox.max.x &&
        nextPosition.z >= objectBox.min.z &&
        nextPosition.z <= objectBox.max.z
      ) {
        camera.position.y = objectBox.max.y; // Align player with the top of the building
        velocityY = 0; // Reset vertical velocity
        canDoubleJump = true; // Allow double jump again
        collision = true;
      }
    } if (!collision) {
      camera.position.copy(nextPosition);
    }

    velocityY += gravity;
    const groundLevel = 1; // Height of the ground
    camera.position.y += velocityY;
    if (camera.position.y < groundLevel) {
      camera.position.y = groundLevel;
      velocityY = 0;
      canDoubleJump = true; // Reset double jump when touching the ground
    }
  }

  // Game Loop
  function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    renderer.render(scene, camera);
  }

  animate();
}
