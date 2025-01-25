// Elements
const lobby = document.getElementById('lobby');
const playButton = document.getElementById('play-button');
const gameDiv = document.getElementById('game');

// Play button click event
playButton.addEventListener('click', () => {
  initializeGame();
});

function initializeGame() {
  // Hide the lobby and show the game canvas
  lobby.style.display = 'none';
  gameDiv.style.display = 'block';

  // Request pointer lock for better movement control
  const canvas = document.getElementById('game-canvas');
  canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
  canvas.requestPointerLock();

  // Start the game
  setupScene();
}

document.addEventListener('pointerlockchange', () => {
  const canvas = document.getElementById('game-canvas');
  if (document.pointerLockElement === canvas) {
    console.log('Pointer locked');
  } else {
    console.log('Pointer unlocked');
  }
});

function setupScene() {
  const collidableObjects = [];
  const buildingPositions = [
    [1, 1, 1, 1, 1],
    [1, 2.25, 2.25, 2.25, 1],
    [1, 2.25, 3.5, 2.25, 1],
    [1, 2.25, 2.25, 2.25, 1],
    [1, 1, 1, 1, 1]
  ];

  const scene = new THREE.Scene();
  const camera = setupCamera(collidableObjects, buildingPositions);
  const renderer = setupRenderer();

  setupLighting(scene);
  setupEnvironment(scene, buildingPositions, collidableObjects);

  setupControls(camera, collidableObjects);

  // Start the animation loop
  animate(scene, camera, renderer);
}

function setupCamera(collidableObjects, buildingPositions) {
  const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

  const spawnPoints = [
    { x: -29.5, y: 2, z: -29.5 },
    { x: 29.5, y: 2, z: -29.5 },
    { x: -29.5, y: 2, z: 29.5 },
    { x: 29.5, y: 2, z: 29.5 }
  ];

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

  const centerHeight = buildingPositions[2][2] * 2;
  camera.lookAt(0, centerHeight / 2, 0);

  return camera;
}

function setupRenderer() {
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  return renderer;
}

function setupLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0, 50, 0);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
}

function setupEnvironment(scene, buildingPositions, collidableObjects) {
  // Create ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Create walls and ceiling
  const walls = [
    { position: [0, 51, -30], rotation: [0, 0, 0] },
    { position: [0, 51, 30], rotation: [0, Math.PI, 0] },
    { position: [-30, 51, 0], rotation: [0, Math.PI / 2, 0] },
    { position: [30, 51, 0], rotation: [0, -Math.PI / 2, 0] }
  ];

  walls.forEach((wall) => {
    const wallGeometry = new THREE.PlaneGeometry(102, 102);
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xadd8e6, side: THREE.DoubleSide });
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(...wall.position);
    wallMesh.rotation.set(...wall.rotation);
    scene.add(wallMesh);
  });

  const ceilingGeometry = new THREE.PlaneGeometry(102, 102);
  const ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0xadd8e6, side: THREE.DoubleSide });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, 102, 0);
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);

  // Add buildings
  buildingPositions.forEach((row, i) => {
    row.forEach((heightMultiplier, j) => {
      const posX = (i - 2) * 12;
      const posZ = (j - 2) * 12;
      const height = heightMultiplier * 2;
      const buildingGeometry = new THREE.BoxGeometry(10, height, 10);
      const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(posX, height / 2, posZ);
      scene.add(building);

      collidableObjects.push(building);
    });
  });
}

function setupControls(camera, collidableObjects) {
  const keys = {};
  let mouseMovement = { x: 0, y: 0 };

  document.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
  document.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));
  document.addEventListener('mousemove', (e) => {
    mouseMovement.x = e.movementX * 0.002;
    mouseMovement.y = e.movementY * 0.002;
  });

  let velocityY = 0;
  const gravity = -0.01;
  const baseSpeed = 0.3;
  const sprintMultiplier = 1.5;
  const jumpStrength = 0.2;
  const smoothFactor = 0.9;
  let velocity = new THREE.Vector3();

  function updatePlayer() {
    let direction = new THREE.Vector3();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    let movementSpeed = baseSpeed;
    if (keys['shift']) movementSpeed *= sprintMultiplier;

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
      velocity.lerp(direction.multiplyScalar(movementSpeed), smoothFactor);
      camera.position.x += velocity.x;
      camera.position.z += velocity.z;
    }

    if (keys[' '] && Math.abs(velocityY) < 0.01) {
      velocityY = jumpStrength;
    }

    camera.rotation.y -= mouseMovement.x * 0.5;
    camera.rotation.x -= mouseMovement.y * 0.5;
    if (camera.rotation.x > Math.PI / 4) camera.rotation.x = Math.PI / 4;
    else if (camera.rotation.x < -Math.PI / 4) camera.rotation.x = -Math.PI / 4;

    mouseMovement.x = 0;
    mouseMovement.y = 0;

    velocityY += gravity;
    camera.position.y += velocityY;

    const groundLevel = 1;
    if (camera.position.y < groundLevel) {
      camera.position.y = groundLevel;
      velocityY = 0;
    }
  }

  function animatePlayer() {
    updatePlayer();
    requestAnimationFrame(animatePlayer);
  }

  animatePlayer();
}

function animate(scene, camera, renderer) {
  function renderLoop() {
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
  }
  renderLoop();
}
