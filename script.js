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
  const spawnPoints = [
    { x: -40, y: 2, z: -40 },
    { x: 40, y: 2, z: -40 },
    { x: -40, y: 2, z: 40 },
    { x: 40, y: 2, z: 40 }
  ];

  const randomSpawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  camera.position.set(randomSpawn.x, randomSpawn.y, randomSpawn.z);
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

  // Add Buildings
  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const buildingPositions = [];
  const gridSize = 10;
  const spacing = 20;

  for (let i = -gridSize / 2; i < gridSize / 2; i++) {
    for (let j = -gridSize / 2; j < gridSize / 2; j++) {
      const posX = i * spacing;
      const posZ = j * spacing;
      if (Math.abs(posX) <= 50 && Math.abs(posZ) <= 50) { // Ensure buildings spawn only within the platform
        buildingPositions.push({
          x: posX,
          z: posZ,
          width: 10 + Math.random() * 5,
          depth: 10 + Math.random() * 5,
        });
      }
    }
  }

  buildingPositions.forEach((pos) => {
    const height = Math.random() * 20 + 10;
    const buildingGeometry = new THREE.BoxGeometry(pos.width, height, pos.depth);
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(pos.x, height / 2, pos.z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    const buildingBox = new THREE.Box3().setFromObject(building);
    building.userData.collisionBox = buildingBox;
    collidableObjects.push(building);
  });

  // Resize Event Listener
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
  document.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
  document.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

  let velocityY = 0;
  const gravity = -0.01;
  const movementSpeed = 0.2;

  function updatePlayer() {
    let direction = new THREE.Vector3();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (keys['w']) direction.add(forward);
    if (keys['s']) direction.add(forward.negate());
    if (keys['a']) direction.add(right.negate());
    if (keys['d']) direction.add(right);

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
