// Elements
const lobby = document.getElementById('lobby');
const playButton = document.getElementById('play-button');
const gameDiv = document.getElementById('game');

// Play Button Event Listener
playButton.addEventListener('click', () => {
  // Hide the lobby
  lobby.style.display = 'none';

  // Show the game canvas
  gameDiv.style.display = 'block';

  // Start the game
  startGame();
});

// Game Initialization
function startGame() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Add lighting
  const light = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(light);

  // Load Models (Gun and Enemy)
  const loader = new THREE.GLTFLoader();

  let gun, enemy;

  loader.load('/assets/models/gun.glb', (gltf) => {
    gun = gltf.scene;
    gun.position.set(0, -1, -2);
    camera.add(gun);
    scene.add(camera);
  });

  loader.load('/assets/models/enemy.glb', (gltf) => {
    enemy = gltf.scene;
    enemy.position.set(0, 0, -5);
    scene.add(enemy);
  });

  // Basic controls
  const keys = {};
  document.addEventListener('keydown', (e) => (keys[e.key] = true));
  document.addEventListener('keyup', (e) => (keys[e.key] = false));

  function updatePlayer() {
    if (keys['w']) camera.position.z -= 0.1;
    if (keys['s']) camera.position.z += 0.1;
    if (keys['a']) camera.position.x -= 0.1;
    if (keys['d']) camera.position.x += 0.1;
  }

  // Game loop
  function animate() {
    requestAnimationFrame(animate);

    updatePlayer();

    if (gun) gun.rotation.y += 0.01;
    if (enemy) enemy.rotation.y += 0.01;

    renderer.render(scene, camera);
  }

  animate();
}
