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
  const canvas = document.getElementById('game-canvas');
  canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
  document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      console.log('Pointer locked');
    } else {
      console.log('Pointer unlocked');
    }
  });
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

  const centerX = 0;
  const centerZ = 0;
  const centerHeight = buildingPositions[2][2] * 2;
  camera.lookAt(centerX, centerHeight, centerZ);
  camera.rotation.order = "YXZ";

  // Add Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Add Directional Light
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

  // Add Walls and Ceiling
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

    const wallBox = new THREE.Box3().setFromObject(wallMesh);
    collidableObjects.push(wallMesh);
  });

  const ceilingGeometry = new THREE.PlaneGeometry(102, 102);
  const ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0xadd8e6, side: THREE.DoubleSide });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, 102, 0);
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);

  // Add Buildings
  buildingPositions.forEach((row, i) => {
    row.forEach((heightMultiplier, j) => {
      const posX = (i - 2) * 12;
      const posZ = (j - 2) * 12;
      const height = heightMultiplier * 2;
      const buildingGeometry = new THREE.BoxGeometry(10, height, 10);
      const building = new THREE.Mesh(buildingGeometry, new THREE.MeshStandardMaterial({ color: 0x333333 }));
      building.position.set(posX, height / 2, posZ);

      const platformGeometry = new THREE.PlaneGeometry(10, 10);
      const platform = new THREE.Mesh(platformGeometry, new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
      platform.rotation.x = -Math.PI / 2;
      platform.position.set(building.position.x, building.position.y + height / 2 + 0.1, building.position.z);
      scene.add(platform);
      verticalCollidableObjects.push(platform);

      scene.add(building);
      collidableObjects.push(building);
    });
  });

  // WASD and Jump Controls
  const keys = {};
  let velocityY = 0;
  let canDoubleJump = false;
  const gravity = -0.01;
  const movementSpeed = 0.2;

  document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && velocityY === 0) {
      velocityY = 0.3;
    } else if (e.key === ' ' && canDoubleJump) {
      velocityY = 0.2;
      canDoubleJump = false;
    }
  });
  document.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

  function updatePlayer() {
    let direction = new THREE.Vector3();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (keys['w']) direction.add(forward);
    if (keys['s']) direction.add(forward.clone().negate());
    if (keys['a']) direction.add(right.clone().negate());
    if (keys['d']) direction.add(right);

    if (direction.length() > 0) direction.normalize();

    const nextPosition = camera.position.clone().add(direction.multiplyScalar(movementSpeed));

    let collision = false;
    for (const object of collidableObjects) {
      const objectBox = new THREE.Box3().setFromObject(object);
      const playerBox = new THREE.Box3().setFromCenterAndSize(nextPosition, new THREE.Vector3(1, 2, 1));
      if (objectBox.intersectsBox(playerBox)) {
        collision = true;
        break;
      }
    }

    if (!collision) {
      camera.position.x = nextPosition.x;
      camera.position.z = nextPosition.z;
    }

    for (const platform of verticalCollidableObjects) {
      const platformBox = new THREE.Box3().setFromObject(platform);
      if (
        camera.position.y >= platformBox.max.y - 0.3 &&
        nextPosition.y <= platformBox.max.y + 0.3 &&
        camera.position.x >= platformBox.min.x &&
        camera.position.x <= platformBox.max.x &&
        camera.position.z >= platformBox.min.z &&
        camera.position.z <= platformBox.max.z
      ) {
        camera.position.y = platformBox.max.y;
        velocityY = 0;
        canDoubleJump = true;
        collision = true;
        break;
      }
    }

    velocityY += gravity;
    camera.position.y += velocityY;

    if (camera.position.y < 1) {
      camera.position.y = 1;
      velocityY = 0;
      canDoubleJump = true;
    }

    if (camera.position.y < 1) {
      camera.position.y = 1;
      velocityY = 0;
      canDoubleJump = true;
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    renderer.render(scene, camera);
  }

  animate();
}
