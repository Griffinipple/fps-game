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
      // Ensure buildings are within the platform bounds
      if (posX >= -50 && posX <= 50 && posZ >= -50 && posZ <= 50) {
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

  // Gun and Ammo System
  const loader = new THREE.GLTFLoader();
  let bulletsInClip = 30;
  let totalAmmo = Infinity; // Infinite total ammo for reloading
  const clipSize = 30;
  const reloadTime = 1500; // 1.5 seconds
  let isReloading = false;

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
      console.error('Failed to load the gun model:', error);
    }
);

  const projectiles = [];

  function shoot() {
    if (bulletsInClip > 0 && !isReloading) {
      bulletsInClip--;
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
    } else if (bulletsInClip === 0 && !isReloading) {
      reload();
    }
  }

  function reload() {
    if (totalAmmo > 0 && !isReloading) {
      isReloading = true;
      setTimeout(() => {
        const ammoToReload = Math.min(clipSize, totalAmmo);
        bulletsInClip = ammoToReload;
        totalAmmo = totalAmmo === Infinity ? Infinity : totalAmmo - ammoToReload;
        isReloading = false;
      }, reloadTime);
    }
  }

  window.addEventListener('mousedown', () => {
    shoot();
  });

  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i];
      projectile.position.add(projectile.userData.velocity);

      // Check collision with collidable objects
      for (const object of collidableObjects) {
        const objectBox = new THREE.Box3().setFromObject(object);
        const projectileBox = new THREE.Box3().setFromObject(projectile);
        if (objectBox.intersectsBox(projectileBox)) {
          scene.remove(projectile);
          projectiles.splice(i, 1);
          break;
        }
      }

      // Remove if out of bounds
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
  const gravity = -0.005;

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
    if (keys['s']) direction.add(forward.negate());
    if (keys['a']) direction.add(right.negate());
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
    updateProjectiles();
    renderer.render(scene, camera);
  }

  animate();
}
