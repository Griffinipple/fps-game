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
  let playerHealth = 100;
  let ammoCount = 10;

  // Create Scene, Camera, and Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Position the camera
  camera.position.set(0, 2, 5);
  camera.rotation.order = "YXZ";

  // Add Ambient and Directional Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0, 50, 0);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Add a Sun Sphere
  const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 50, 0);
  scene.add(sun);

  // Create Ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Generate Buildings Procedurally
  function createBuilding(x, z, width, depth, height) {
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const ladderMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    // Add ladder to the building
    const ladderGeometry = new THREE.BoxGeometry(2, height, 0.5);
    const ladder = new THREE.Mesh(ladderGeometry, ladderMaterial);
    ladder.position.set(x - width / 2 - 1, height / 2, z);
    ladder.castShadow = true;
    ladder.receiveShadow = true;
    ladder.userData.isLadder = true;
    scene.add(ladder);

    // Add collision detection
    building.userData.collisionBox = new THREE.Box3().setFromObject(building);
    collidableObjects.push(building, ladder);
  }

  function generateBuildings(count) {
    for (let i = 0; i < count; i++) {
      const width = Math.random() * 10 + 5;
      const depth = Math.random() * 10 + 5;
      const height = Math.random() * 20 + 10;

      const x = Math.random() * 100 - 50;
      const z = Math.random() * 100 - 50;

      createBuilding(x, z, width, depth, height);
    }
  }

  generateBuildings(10); // Create 10 random buildings

  // Check Ladder Collision
  function checkLadderCollision() {
    const playerBox = new THREE.Box3().setFromCenterAndSize(camera.position, new THREE.Vector3(1, 1, 1));
    for (const object of collidableObjects) {
      if (object.userData.isLadder) {
        const ladderBox = new THREE.Box3().setFromObject(object);
        if (ladderBox.intersectsBox(playerBox)) {
          return object;
        }
      }
    }
    return null;
  }

  // Load Gun Model
  const loader = new THREE.GLTFLoader();
  loader.load(
    '/assets/models/weapon.glb',
    (gltf) => {
      const gun = gltf.scene;
      gun.scale.set(0.5, 0.5, 0.5);
      gun.position.set(0.6, -0.5, -1);
      gun.rotation.set(0, Math.PI / 2, 0);
      camera.add(gun);
    },
    undefined,
    (error) => {
      console.error('Error loading model:', error);
    }
  );

  // Shooting Mechanism
  const projectiles = [];
  function shoot() {
    if (ammoCount <= 0) return;
    ammoCount--;

    const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const projectileMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

    const barrelOffset = new THREE.Vector3(0, -0.5, -1);
    projectile.position.copy(camera.localToWorld(barrelOffset));

    const velocity = new THREE.Vector3();
    camera.getWorldDirection(velocity);
    velocity.multiplyScalar(1);

    projectile.userData.velocity = velocity;
    scene.add(projectile);
    projectiles.push(projectile);
  }

  window.addEventListener('mousedown', () => shoot());

  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i];
      projectile.position.add(projectile.userData.velocity);

      for (const object of collidableObjects) {
        const objectBox = new THREE.Box3().setFromObject(object);
        const projectileBox = new THREE.Box3().setFromObject(projectile);

        if (objectBox.intersectsBox(projectileBox)) {
          scene.remove(projectile);
          projectiles.splice(i, 1);
          break;
        }
      }

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

  canvas.addEventListener('click', () => canvas.requestPointerLock());

  let yaw = 0;
  let pitch = 0;

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas) {
      const sensitivity = 0.002;
      yaw -= event.movementX * sensitivity;
      pitch -= event.movementY * sensitivity;
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
      camera.rotation.set(pitch, yaw, 0);
    }
  });

  // Player Movement and Gravity
  const keys = {};
  document.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
  document.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

  let isJumping = false;
  let velocityY = 0;
  const gravity = -0.005;
  const jumpStrength = 0.15;

  function updatePlayer() {
    const speed = 0.1;
    let direction = new THREE.Vector3();

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (keys['w']) direction.add(forward);
    if (keys['s']) direction.sub(forward);
    if (keys['a']) direction.sub(right);
    if (keys['d']) direction.add(right);

    direction.normalize();

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

    if (!checkLadderCollision()) {
      velocityY += gravity;
      camera.position.y += velocityY;

      if (camera.position.y < 1) {
        camera.position.y = 1;
        velocityY = 0;
        isJumping = false;
      }
    } else if (keys['w']) {
      velocityY = 0.05;
    }

    if (keys[' '] && !isJumping) {
      velocityY = jumpStrength;
      isJumping = true;
    }
  }

  // Update UI
  function updateUI() {
    const healthBar = document.getElementById('health-bar');
    healthBar.style.width = `${playerHealth}%`;

    const ammoCounter = document.getElementById('ammo-counter');
    ammoCounter.textContent = `Ammo: ${ammoCount}`;
  }

  // Game Loop
  function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    updateProjectiles();
    updateUI();
    renderer.render(scene, camera);
  }

  animate();
}
