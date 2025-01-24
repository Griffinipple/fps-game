// Game Modules
class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
    this.loader = new THREE.GLTFLoader();
    this.player = new Player(this.camera, this.scene, this.loader);
    this.environment = new Environment(this.scene);
    this.hud = new HUD();
    this.projectiles = [];
    this.collidableObjects = [];
    this.isReloading = false;
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupEventListeners();
    this.player.spawnPlayer();
    this.environment.createGround();
    this.environment.createBuildings(this.collidableObjects);
    this.startGameLoop();
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupEventListeners() {
    window.addEventListener('mousedown', () => this.player.shoot(this.projectiles, this.collidableObjects));
    document.addEventListener('keydown', (e) => (this.player.keys[e.key.toLowerCase()] = true));
    document.addEventListener('keyup', (e) => (this.player.keys[e.key.toLowerCase()] = false));

    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => canvas.requestPointerLock());
    document.addEventListener('mousemove', (event) => this.player.handleMouseMovement(event, canvas));
  }

  startGameLoop() {
    const animate = () => {
      this.hud.update(this.player.bulletsInClip, this.player.totalAmmo, this.player.clipSize);
      this.player.updatePlayerPosition(this.collidableObjects);
      this.updateProjectiles();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(animate);
    };
    animate();
  }

  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update();

      // Check collision with collidable objects
      for (const object of this.collidableObjects) {
        if (projectile.checkCollision(object)) {
          this.scene.remove(projectile.mesh);
          this.projectiles.splice(i, 1);
          break;
        }
      }

      // Remove if out of bounds
      if (projectile.isOutOfBounds()) {
        this.scene.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }
}

class Player {
  constructor(camera, scene, loader) {
    this.camera = camera;
    this.scene = scene;
    this.loader = loader;
    this.keys = {};
    this.velocityY = 0;
    this.gravity = -0.005;
    this.bulletsInClip = 30;
    this.totalAmmo = Infinity;
    this.clipSize = 30;
    this.reloadTime = 1500; // 1.5 seconds
    this.gun = null;
    this.playerModel = null;
  }

  spawnPlayer() {
    const spawnPoints = [
      { x: -40, y: 2, z: -40 },
      { x: 40, y: 2, z: -40 },
      { x: -40, y: 2, z: 40 },
      { x: 40, y: 2, z: 40 },
    ];
    const randomSpawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    this.camera.position.set(randomSpawn.x, randomSpawn.y, randomSpawn.z);
    this.camera.rotation.order = "YXZ";

    this.loader.load('/assets/models/player.glb', (gltf) => {
      this.playerModel = gltf.scene;
      this.scene.add(this.playerModel);
    });

    this.loader.load('/assets/models/weapon.glb', (gltf) => {
      this.gun = gltf.scene;
      this.gun.scale.set(0.5, 0.5, 0.5);
      this.gun.position.set(0.6, -0.5, -1);
      this.camera.add(this.gun);
    });
  }

  shoot(projectiles, collidableObjects) {
    if (this.bulletsInClip > 0) {
      this.bulletsInClip--;
      const projectile = new Projectile(this.camera);
      projectiles.push(projectile);
      this.scene.add(projectile.mesh);
    } else {
      this.reload();
    }
  }

  reload() {
    if (this.totalAmmo > 0) {
      setTimeout(() => {
        const ammoToReload = Math.min(this.clipSize, this.totalAmmo);
        this.bulletsInClip = ammoToReload;
        this.totalAmmo -= ammoToReload;
      }, this.reloadTime);
    }
  }

  handleMouseMovement(event, canvas) {
    if (document.pointerLockElement === canvas) {
      const sensitivity = 0.002;
      this.camera.rotation.y -= event.movementX * sensitivity;
      this.camera.rotation.x -= event.movementY * sensitivity;
      this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
    }
  }

  updatePlayerPosition(collidableObjects) {
    const speed = 0.2;
    let direction = new THREE.Vector3();

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (this.keys['w']) direction.add(forward);
    if (this.keys['s']) direction.add(forward.negate());
    if (this.keys['a']) direction.add(right.negate());
    if (this.keys['d']) direction.add(right);

    direction.normalize();
    const nextPosition = this.camera.position.clone().add(direction.multiplyScalar(speed));

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
      this.camera.position.copy(nextPosition);
    }

    this.velocityY += this.gravity;
    const groundLevel = 1;
    this.camera.position.y += this.velocityY;
    if (this.camera.position.y < groundLevel) {
      this.camera.position.y = groundLevel;
      this.velocityY = 0;
    }

    if (this.playerModel) {
      this.playerModel.position.copy(this.camera.position);
      this.playerModel.rotation.y = this.camera.rotation.y;
    }
  }
}

class Environment {
  constructor(scene) {
    this.scene = scene;
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  createBuildings(collidableObjects) {
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const gridSize = 10;
    const spacing = 20;

    for (let i = -gridSize / 2; i < gridSize / 2; i++) {
      for (let j = -gridSize / 2; j < gridSize / 2; j++) {
        const posX = i * spacing;
        const posZ = j * spacing;
        if (posX >= -50 && posX <= 50 && posZ >= -50 && posZ <= 50) {
          const height = Math.random() * 20 + 10;
          const buildingGeometry = new THREE.BoxGeometry(10, height, 10);
          const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
          building.position.set(posX, height / 2, posZ);
          building.castShadow = true;
          this.scene.add(building);

          const buildingBox = new THREE.Box3().setFromObject(building);
          building.userData.collisionBox = buildingBox;
          collidableObjects.push(building);
        }
      }
    }
  }
}

class HUD {
  constructor() {
    this.hud = document.createElement('div');
    this.hud.style.position = 'absolute';
    this.hud.style.top = '10px';
    this.hud.style.left = '10px';
    this.hud.style.color = 'white';
    this.hud.style.fontSize = '20px';
    this.hud.style.zIndex = '1000';
    document.body.appendChild(this.hud);
  }

  update(bulletsInClip, totalAmmo, clipSize) {
    this.hud.innerHTML = `Bullets: ${bulletsInClip} / ${clipSize} <br> Total Ammo: ${totalAmmo === Infinity ? '&#8734;' : totalAmmo}`;
  }
}

class Projectile {
  constructor(camera) {
    this.geometry = new THREE.SphereGeometry(0.1, 8, 8);
    this.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    const barrelOffset = new THREE.Vector3(0, -0.5, -1);
    this.mesh.position.copy(camera.localToWorld(barrelOffset));

    this.velocity = new THREE.Vector3();
    camera.getWorldDirection(this.velocity);
    this.velocity.multiplyScalar(1);
  }

  update() {
    this.mesh.position.add(this.velocity);
  }

  checkCollision(object) {
    const objectBox = new THREE.Box3().setFromObject(object);
    const projectileBox = new THREE.Box3().setFromObject(this.mesh);
    return objectBox.intersectsBox(projectileBox);
  }

  isOutOfBounds() {
    return (
      Math.abs(this.mesh.position.x) > 50 ||
      Math.abs(this.mesh.position.y) > 50 ||
      Math.abs(this.mesh.position.z) > 50
    );
  }
}

// Start Game
const lobby = document.getElementById('lobby');
const playButton = document.getElementById('play-button');

playButton.addEventListener('click', () => {
  lobby.style.display = 'none';
  document.getElementById('game').style.display = 'block';
  new Game();
});
