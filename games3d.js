/**
 * Chunnu Munnu 3D Kids Arcade Engine (Three.js WebGL)
 * 100% Kid-Safe, Parent-Approved & YouTube Policy Compliant!
 * Zero real violence — colorful water balloons, sponge darts, and soap bubbles!
 *
 * Game 3: 💦 Water Splash Battle 3D (Free Fire Island Royale for Kids!)
 * Game 4: 🤖 Robot Tag 3D (Free Fire Clash Squad Arena for Kids!)
 */

class Chunnu3DManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.mode = 'toyfire'; // 'toyfire' or 'clash'
    this.character = 'chunnu';

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.animationId = null;

    // Controls
    this.keys = { forward: false, backward: false, left: false, right: false };
    this.cameraYaw = 0;
    this.cameraPitch = 0.28;
    this.cameraDist = 13;
    this.isDragging = false;
    this.prevPointerX = 0;
    this.prevPointerY = 0;

    // Game Entities
    this.player = null;
    this.parachute = null;
    this.isParachuting = false;
    this.bots = [];
    this.projectiles = [];
    this.crates = [];
    this.particles = [];
    this.turrets = [];

    // Safe Zone (Soap Bubble Foam Ring)
    this.stormRadius = 240;
    this.targetStormRadius = 35;
    this.stormCenter = { x: 0, z: 0 };
    this.stormMesh = null;

    // Stats
    this.score = 0;
    this.splashes = 0;
    this.buddiesLeft = 9;
    this.energy = 100;
    this.shield = 40;
    this.blasterType = 'bubbles'; // bubbles, triple, rocket
    this.wave = 1;
    this.maxWaves = 10;
    this.stars = 0;
    this.lastShotTime = 0;
    this.isGameOver = false;

    this.lastTime = performance.now();
    this.initEngine();
  }

  initEngine() {
    if (!window.THREE) return;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(800, 500, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(60, 800 / 500, 0.3, 800);

      this.setupControls();
    } catch (e) {
      console.warn('WebGL init error:', e);
    }
  }

  setupControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'Space') this.shoot();
      if (e.code === 'KeyE') this.toggleScope();
    });

    window.addEventListener('keyup', (e) => {
      if (!this.active) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
    });

    // Mouse & Touch Look / Aim
    const onPointerDown = (clientX, clientY, isTouch = false, isRightSide = false) => {
      if (!this.active) return;
      this.isDragging = true;
      this.prevPointerX = clientX;
      this.prevPointerY = clientY;

      // If parachuting, clicking instantly lands the player!
      if (this.isParachuting) {
        this.landInstantly();
        return;
      }

      // If clicked, fire shot!
      if (!isTouch || isRightSide) {
        this.shoot();
      }
    };

    const onPointerMove = (clientX, clientY) => {
      if (!this.active || !this.isDragging) return;
      const dx = clientX - this.prevPointerX;
      const dy = clientY - this.prevPointerY;
      this.prevPointerX = clientX;
      this.prevPointerY = clientY;

      this.cameraYaw -= dx * 0.007;
      this.cameraPitch = Math.max(0.08, Math.min(0.68, this.cameraPitch + dy * 0.005));
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', (e) => {
      onPointerDown(e.clientX, e.clientY, false, false);
    });
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onPointerUp);

    // Mobile Touches
    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.active) return;
      const rect = this.canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const isRight = (t.clientX - rect.left) > (rect.width * 0.4);
        onPointerDown(t.clientX, t.clientY, true, isRight);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        onPointerMove(t.clientX, t.clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', onPointerUp);
    this.canvas.addEventListener('touchcancel', onPointerUp);
  }

  // ==========================================
  // 3D Procedural Cartoon Humanoid Model (Kid-Friendly)
  // ==========================================
  createCharacterModel(shirtColorHex, isChunnu) {
    const group = new THREE.Group();

    // Friendly Cartoon Head
    const headGeo = new THREE.SphereGeometry(1.35, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 4.6;
    head.castShadow = true;
    group.add(head);

    // Big Cheerful Cartoon Eyes
    const eyeGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.45, 4.8, 1.15);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.45, 4.8, 1.35);
    group.add(leftEye, leftPupil);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.45, 4.8, 1.15);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.45, 4.8, 1.35);
    group.add(rightEye, rightPupil);

    // Cute Smile
    const smileGeo = new THREE.TorusGeometry(0.35, 0.08, 6, 8, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.rotation.x = Math.PI;
    smile.position.set(0, 4.25, 1.25);
    group.add(smile);

    // Signature Baseball Cap
    const capGeo = new THREE.SphereGeometry(1.42, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const capMat = new THREE.MeshStandardMaterial({ color: shirtColorHex });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 4.9;
    group.add(cap);

    const visorGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 8, 1, false, 0, Math.PI);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 4.8, 0.7);
    group.add(visor);

    // Torso / Shirt
    const torsoGeo = new THREE.BoxGeometry(2.4, 2.8, 1.5);
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColorHex, roughness: 0.6 });
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 2.7;
    torso.castShadow = true;
    group.add(torso);

    // Shorts
    const shortsGeo = new THREE.BoxGeometry(2.3, 1.3, 1.4);
    const shortsMat = new THREE.MeshStandardMaterial({ color: isChunnu ? 0x1e3a8a : 0x0369a1 });
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 1.5;
    shorts.castShadow = true;
    group.add(shorts);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.45, 0.4, 1.8, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const shoeGeo = new THREE.BoxGeometry(0.8, 0.5, 1.2);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });

    const leftLeg = new THREE.Group();
    const lLegMesh = new THREE.Mesh(legGeo, legMat);
    lLegMesh.position.y = -0.7;
    lLegMesh.castShadow = true;
    const lShoeMesh = new THREE.Mesh(shoeGeo, shoeMat);
    lShoeMesh.position.set(0, -1.4, 0.2);
    leftLeg.add(lLegMesh, lShoeMesh);
    leftLeg.position.set(-0.7, 1.4, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Group();
    const rLegMesh = new THREE.Mesh(legGeo, legMat);
    rLegMesh.position.y = -0.7;
    rLegMesh.castShadow = true;
    const rShoeMesh = new THREE.Mesh(shoeGeo, shoeMat);
    rShoeMesh.position.set(0, -1.4, 0.2);
    rightLeg.add(rLegMesh, rShoeMesh);
    rightLeg.position.set(0.7, 1.4, 0);
    group.add(rightLeg);

    // Arms holding Water Blaster
    const armGeo = new THREE.CylinderGeometry(0.38, 0.32, 2.2, 8);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-1.5, 2.6, 0.2);
    leftArm.rotation.x = -Math.PI / 4;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(1.5, 2.6, 0.2);
    rightArm.rotation.x = -Math.PI / 4;
    group.add(rightArm);

    // 💦 Colorful Water Balloon Blaster
    const blaster = new THREE.Group();
    const tankGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 8);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.2 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.rotation.x = Math.PI / 2;
    blaster.add(tank);

    const nozzleGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.z = 1.1;
    blaster.add(nozzle);

    blaster.position.set(1.2, 2.3, 1.4);
    group.add(blaster);

    return {
      group,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      blaster
    };
  }

  // ==========================================
  // GAME 3: 💦 Water Splash Battle 3D (Island Royale)
  // ==========================================
  startToyFire(character = 'chunnu') {
    this.mode = 'toyfire';
    this.character = character;
    this.active = true;
    this.isGameOver = false;
    this.score = 0;
    this.splashes = 0;
    this.buddiesLeft = 9;
    this.energy = 100;
    this.shield = 50;
    this.blasterType = 'bubbles';
    this.stormRadius = 240;
    this.projectiles = [];
    this.particles = [];
    this.crates = [];
    this.bots = [];

    this.canvas.style.display = 'block';

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'block';

    const hint = document.getElementById('arcade3DHint');
    if (hint) {
      hint.innerHTML = '🪂 PARACHUTE DROP! <br><span style="font-size:0.8rem;color:#fff;">(Tap anywhere to Land Instantly!)</span>';
      hint.style.display = 'block';
    }

    this.buildToyFireIsland();

    // Spawn Player
    const isChunnu = character === 'chunnu';
    const shirtColor = isChunnu ? 0xfacc15 : 0x38bdf8;
    const pParts = this.createCharacterModel(shirtColor, isChunnu);

    this.player = {
      ...pParts,
      x: 0,
      y: 60, // Starting parachute glide height
      z: 70,
      speed: 18,
      walkCycle: 0
    };
    this.player.group.position.set(0, 60, 70);
    this.scene.add(this.player.group);

    // Parachute
    this.isParachuting = true;
    this.createParachuteCanopy();

    // Spawn 8 Cute Playful Toy Bots
    this.spawnPlayfulBots();

    this.updateHUD();
    this.startLoop();
  }

  createParachuteCanopy() {
    this.parachute = new THREE.Group();
    const domeGeo = new THREE.SphereGeometry(6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 7.5;
    this.parachute.add(dome);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    [[-4, 4, -4], [4, 4, -4], [-4, 4, 4], [4, 4, 4]].forEach(coord => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(coord[0], coord[1], coord[2]),
        new THREE.Vector3(0, 0, 0)
      ]);
      this.parachute.add(new THREE.Line(geo, lineMat));
    });

    this.player.group.add(this.parachute);
  }

  landInstantly() {
    if (!this.isParachuting) return;
    this.isParachuting = false;
    this.player.y = 0;
    this.player.group.position.y = 0;
    if (this.parachute) {
      this.player.group.remove(this.parachute);
      this.parachute = null;
    }
    SFX.jump();
    const hint = document.getElementById('arcade3DHint');
    if (hint) hint.style.display = 'none';
    this.showFloatingMessage('✨ Superhero Landing! Ready to Play!');
  }

  buildToyFireIsland() {
    // Clear old scene items
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    // Sky & Lighting
    this.scene.background = new THREE.Color(0x7dd3fc);
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0035);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x4ade80, 0.8);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffbeb, 0.95);
    sun.position.set(100, 180, 80);
    sun.castShadow = true;
    this.scene.add(sun);

    // Ocean Plane
    const oceanGeo = new THREE.PlaneGeometry(1000, 1000);
    const oceanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -2;
    this.scene.add(ocean);

    // Green Island Island Terrain
    const islandGeo = new THREE.CylinderGeometry(250, 260, 6, 48);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.85 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -3;
    island.receiveShadow = true;
    this.scene.add(island);

    // Sandy Ring
    const sandGeo = new THREE.RingGeometry(245, 265, 48);
    const sandMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.05;
    this.scene.add(sand);

    // Cartoon Palm Trees
    const trunkGeo = new THREE.CylinderGeometry(0.7, 1.1, 6, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x92400e });
    const leavesGeo = new THREE.ConeGeometry(4.5, 7, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d });

    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 190;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3;
      trunk.castShadow = true;
      const leaves = new THREE.Mesh(leavesGeo, leavesMat);
      leaves.position.y = 7.5;
      leaves.castShadow = true;
      tree.add(trunk, leaves);
      tree.position.set(x, 0, z);
      this.scene.add(tree);
    }

    // 16 Colorful Toy Chests (Loot Crates)
    const crateGeo = new THREE.BoxGeometry(3.5, 3.5, 3.5);
    const crateColors = [0xf59e0b, 0x06b6d4, 0xec4899, 0x10b981];

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const dist = 25 + Math.random() * 170;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;

      const cMat = new THREE.MeshStandardMaterial({
        color: crateColors[i % crateColors.length],
        roughness: 0.5
      });
      const crate = new THREE.Mesh(crateGeo, cMat);
      crate.position.set(cx, 1.75, cz);
      crate.castShadow = true;
      this.scene.add(crate);

      const types = ['triple', 'rocket', 'juice', 'bubble_shield'];
      this.crates.push({
        mesh: crate,
        x: cx,
        z: cz,
        active: true,
        type: types[i % types.length]
      });
    }

    // Safe Bubble Ring (Translucent Cyan Soap Bubble Tide)
    const stormGeo = new THREE.CylinderGeometry(this.stormRadius, this.stormRadius, 80, 48, 1, true);
    const stormMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    this.stormMesh = new THREE.Mesh(stormGeo, stormMat);
    this.stormMesh.position.set(0, 40, 0);
    this.scene.add(this.stormMesh);
  }

  spawnPlayfulBots() {
    this.bots = [];
    const botNames = [
      'Teddy Bot 🧸', 'Dino Bot 🦖', 'Bunny Bot 🐰', 'Star Bot ⭐',
      'Sparky Bot ⚡', 'Sunny Bot ☀️', 'Cookie Bot 🍪', 'Puppy Bot 🐶'
    ];
    const colors = [
      0xec4899, 0x8b5cf6, 0x06b6d4, 0x10b981,
      0xf97316, 0x6366f1, 0x14b8a6, 0xd946ef
    ];

    botNames.forEach((name, i) => {
      const angle = (i / botNames.length) * Math.PI * 2 + 0.4;
      const dist = 50 + Math.random() * 120;
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;

      const botParts = this.createCharacterModel(colors[i % colors.length], false);
      botParts.group.position.set(bx, 0, bz);
      this.scene.add(botParts.group);

      this.bots.push({
        name,
        mesh: botParts.group,
        parts: botParts,
        x: bx,
        z: bz,
        energy: 100,
        alive: true,
        rotY: Math.random() * Math.PI * 2,
        shootCooldown: 2 + Math.random() * 2,
        walkCycle: 0
      });
    });
  }

  // ==========================================
  // GAME 4: 🤖 Robot Tag 3D (Wave Defense)
  // ==========================================
  startClashSquad(character = 'chunnu') {
    this.mode = 'clash';
    this.character = character;
    this.active = true;
    this.isGameOver = false;
    this.score = 0;
    this.wave = 1;
    this.stars = 0;
    this.energy = 100;
    this.projectiles = [];
    this.particles = [];
    this.turrets = [];
    this.bots = [];
    this.isParachuting = false;

    this.canvas.style.display = 'block';

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'block';

    const hint = document.getElementById('arcade3DHint');
    if (hint) hint.style.display = 'none';

    this.buildClashArena();

    // Spawn Player in Center
    const isChunnu = character === 'chunnu';
    const shirtColor = isChunnu ? 0xfacc15 : 0x38bdf8;
    const pParts = this.createCharacterModel(shirtColor, isChunnu);

    this.player = {
      ...pParts,
      x: 0,
      y: 0,
      z: 14,
      speed: 18,
      walkCycle: 0
    };
    this.player.group.position.set(0, 0, 14);
    this.scene.add(this.player.group);

    this.spawnWaveRobots();
    this.updateHUD();
    this.startLoop();
  }

  buildClashArena() {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.006);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.7);
    this.scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1);
    dirLight.position.set(50, 90, 50);
    this.scene.add(dirLight);

    // Neon Cyber-Toy Arena Floor
    const floorGeo = new THREE.CylinderGeometry(85, 88, 3, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Glowing Neon Rings
    const ringGeo = new THREE.RingGeometry(80, 84, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    this.scene.add(ring);

    // Toy Block Barricades
    const barGeo = new THREE.BoxGeometry(10, 4, 3);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    [
      { x: 22, z: 22, r: Math.PI / 4 },
      { x: -22, z: 22, r: -Math.PI / 4 },
      { x: 22, z: -22, r: -Math.PI / 4 },
      { x: -22, z: -22, r: Math.PI / 4 }
    ].forEach(b => {
      const mesh = new THREE.Mesh(barGeo, barMat);
      mesh.position.set(b.x, 2, b.z);
      mesh.rotation.y = b.r;
      this.scene.add(mesh);
    });

    // Central Star Beacon
    const beaconGeo = new THREE.CylinderGeometry(2.5, 2.5, 6, 12);
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 3;
    this.scene.add(beacon);

    const starOrbGeo = new THREE.SphereGeometry(1.8, 12, 12);
    const starOrbMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const orb = new THREE.Mesh(starOrbGeo, starOrbMat);
    orb.position.y = 7.5;
    this.scene.add(orb);
  }

  spawnWaveRobots() {
    const count = 4 + this.wave * 2;
    const isBoss = this.wave === 5 || this.wave === 10;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 65 + Math.random() * 12;
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;

      // Cute Friendly Toy Robot Mesh
      const botGroup = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(2.6, 3.2, 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isBoss && i === 0 ? 0xf59e0b : 0x06b6d4,
        roughness: 0.5
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 2.2;
      botGroup.add(body);

      // Antenna with Glowing Ball
      const antGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2);
      const ant = new THREE.Mesh(antGeo, bodyMat);
      ant.position.y = 4.2;
      const bulbGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 4.9;
      botGroup.add(ant, bulb);

      if (isBoss && i === 0) botGroup.scale.set(2, 2, 2);
      botGroup.position.set(rx, 0, rz);
      this.scene.add(botGroup);

      this.bots.push({
        mesh: botGroup,
        x: rx,
        z: rz,
        energy: (isBoss && i === 0 ? 250 : 35) + this.wave * 10,
        isBoss: isBoss && i === 0,
        speed: 6.5 + Math.random() * 3,
        alive: true
      });
    }

    SFX.drop();
    this.showFloatingMessage(`✨ Wave ${this.wave} Started! Friendly Robot Tag!`);
  }

  // ==========================================
  // Shooting & Water Balloons Mechanics
  // ==========================================
  shoot() {
    if (!this.active || this.isGameOver || this.isParachuting) return;

    const now = performance.now();
    const cooldown = this.blasterType === 'triple' ? 320 : 160;
    if (now - this.lastShotTime < cooldown) return;
    this.lastShotTime = now;

    SFX.laser();
    const dir = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
    const spawnPos = new THREE.Vector3(this.player.x, 2.4, this.player.z).add(dir.clone().multiplyScalar(2));

    if (this.blasterType === 'triple') {
      for (let i = -1; i <= 1; i++) {
        const sDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.16);
        this.createWaterBalloon(spawnPos, sDir, 65, 0x38bdf8, 22, true);
      }
    } else {
      this.createWaterBalloon(spawnPos, dir, 75, 0x06b6d4, 28, true);
    }
  }

  createWaterBalloon(pos, dir, speed, colorHex, damage, isPlayer) {
    const geo = new THREE.SphereGeometry(0.45, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      pos: mesh.position,
      vel: dir.clone().multiplyScalar(speed),
      damage,
      isPlayer,
      life: 2.0
    });
  }

  toggleScope() {
    const scopeEl = document.getElementById('arcade3DScope');
    if (scopeEl) {
      const isVisible = scopeEl.style.display === 'block';
      scopeEl.style.display = isVisible ? 'none' : 'block';
      this.cameraDist = isVisible ? 13 : 5;
      this.camera.fov = isVisible ? 60 : 32;
      this.camera.updateProjectionMatrix();
      SFX.laser();
    }
  }

  showFloatingMessage(msg) {
    const kf = document.getElementById('arcadeKillFeed');
    if (!kf) return;
    const item = document.createElement('div');
    item.className = 'kf-item';
    item.textContent = msg;
    kf.appendChild(item);
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 3200);
  }

  spawnSplashParticles(pos, colorHex = 0x38bdf8) {
    for (let i = 0; i < 7; i++) {
      const geo = new THREE.SphereGeometry(0.28, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      this.scene.add(p);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 10
      );
      this.particles.push({ mesh: p, vel, life: 0.45 });
    }
  }

  // ==========================================
  // Main Update Loop
  // ==========================================
  update(dt) {
    if (this.isGameOver) return;

    // 1. Parachute descent
    if (this.isParachuting) {
      this.player.y -= 14 * dt;
      if (this.player.y <= 0) {
        this.landInstantly();
      }
    }

    // 2. Player Movement
    let mx = 0;
    let mz = 0;
    if (this.keys.forward) mz -= 1;
    if (this.keys.backward) mz += 1;
    if (this.keys.left) mx -= 1;
    if (this.keys.right) mx += 1;

    if (mx !== 0 || mz !== 0) {
      const len = Math.hypot(mx, mz);
      mx /= len;
      mz /= len;

      const fwd = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      const rgt = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
      const move = fwd.multiplyScalar(-mz).add(rgt.multiplyScalar(mx));

      this.player.x += move.x * this.player.speed * dt;
      this.player.z += move.z * this.player.speed * dt;

      // Restrict to arena / island
      const maxDist = this.mode === 'toyfire' ? 245 : 78;
      const d = Math.hypot(this.player.x, this.player.z);
      if (d > maxDist) {
        this.player.x = (this.player.x / d) * maxDist;
        this.player.z = (this.player.z / d) * maxDist;
      }

      // Leg swings
      this.player.walkCycle += dt * 14;
      this.player.leftLeg.rotation.x = Math.sin(this.player.walkCycle) * 0.6;
      this.player.rightLeg.rotation.x = -Math.sin(this.player.walkCycle) * 0.6;
    } else {
      this.player.leftLeg.rotation.x = 0;
      this.player.rightLeg.rotation.x = 0;
    }

    this.player.group.position.set(this.player.x, this.player.y, this.player.z);
    this.player.group.rotation.y = this.cameraYaw + Math.PI;

    // 3. Storm (Soap Bubble Ring) Shrinking in ToyFire
    if (this.mode === 'toyfire') {
      if (this.stormRadius > this.targetStormRadius) {
        this.stormRadius = Math.max(this.targetStormRadius, this.stormRadius - dt * 3.5);
        this.stormMesh.scale.set(this.stormRadius / 240, 1, this.stormRadius / 240);
      }
      const dStorm = Math.hypot(this.player.x, this.player.z);
      if (dStorm > this.stormRadius && !this.isParachuting) {
        this.energy -= dt * 5;
        SFX.hit();
        if (this.energy <= 0) this.triggerGameOver(false);
      }

      // Crate collection
      this.crates.forEach(c => {
        if (!c.active) return;
        const dc = Math.hypot(this.player.x - c.x, this.player.z - c.z);
        if (dc < 4.2) {
          c.active = false;
          c.mesh.visible = false;
          SFX.powerup();

          if (c.type === 'triple') {
            this.blasterType = 'triple';
            this.showFloatingMessage('✨ Unlocked TRIPLE WATER BLASTER!');
          } else if (c.type === 'juice') {
            this.energy = Math.min(100, this.energy + 40);
            this.showFloatingMessage('🧃 Drank Mango Juice! (+40 Energy)');
          } else {
            this.shield = Math.min(100, this.shield + 40);
            this.showFloatingMessage('🛡️ Bubble Armor Vest Active (+40)!');
          }
        }
      });
    }

    // 4. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.pos.add(p.vel.clone().multiplyScalar(dt));
      p.life -= dt;

      if (p.life <= 0 || p.pos.y <= 0.4) {
        this.spawnSplashParticles(p.pos);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check hit Bots
      if (p.isPlayer) {
        let hit = false;
        for (let b of this.bots) {
          if (!b.alive) continue;
          const db = Math.hypot(p.pos.x - b.x, p.pos.z - b.z);
          if (db < (b.isBoss ? 4.2 : 2.5)) {
            hit = true;
            b.energy -= p.damage;
            SFX.pop();
            this.spawnSplashParticles(p.pos, 0xfacc15);

            if (b.energy <= 0) {
              b.alive = false;
              b.mesh.visible = false;
              if (this.mode === 'toyfire') {
                this.splashes++;
                this.score += 150;
                this.buddiesLeft--;
                this.showFloatingMessage(`🎉 ${this.character === 'chunnu' ? 'Chunnu' : 'Munnu'} splashed ${b.name}!`);
                if (this.buddiesLeft <= 1) this.triggerGameOver(true);
              } else {
                this.stars += b.isBoss ? 50 : 15;
                this.score += b.isBoss ? 300 : 80;
                SFX.coin();
              }
            }
            break;
          }
        }
        if (hit) {
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }

    // 5. Update Bots
    if (this.mode === 'toyfire') {
      this.bots.forEach(b => {
        if (!b.alive) return;
        const dCenter = Math.hypot(b.x, b.z);
        if (dCenter > this.stormRadius) {
          b.energy -= dt * 6;
          if (b.energy <= 0) {
            b.alive = false;
            b.mesh.visible = false;
            this.buddiesLeft--;
            this.showFloatingMessage(`🌊 Bubble Tide tagged ${b.name}!`);
            if (this.buddiesLeft <= 1) this.triggerGameOver(true);
            return;
          }
        }

        // Move towards safe center or wander
        if (dCenter > this.stormRadius * 0.8) {
          const a = Math.atan2(-b.z, -b.x);
          b.x += Math.cos(a) * 11 * dt;
          b.z += Math.sin(a) * 11 * dt;
        } else {
          b.x += Math.sin(b.rotY) * 6 * dt;
          b.z += Math.cos(b.rotY) * 6 * dt;
          if (Math.random() < 0.02) b.rotY += (Math.random() - 0.5) * 2;
        }

        b.mesh.position.set(b.x, 0, b.z);
        b.mesh.rotation.y = b.rotY;
      });
    } else {
      // Clash Squad Bots chase player
      for (let i = this.bots.length - 1; i >= 0; i--) {
        const b = this.bots[i];
        if (!b.alive) {
          this.bots.splice(i, 1);
          continue;
        }
        const a = Math.atan2(this.player.z - b.z, this.player.x - b.x);
        b.x += Math.cos(a) * b.speed * dt;
        b.z += Math.sin(a) * b.speed * dt;
        b.mesh.position.set(b.x, 0, b.z);
        b.mesh.rotation.y = -a + Math.PI / 2;

        const dp = Math.hypot(b.x - this.player.x, b.z - this.player.z);
        if (dp < 3) {
          this.energy -= dt * (b.isBoss ? 28 : 14);
          SFX.hit();
          if (this.energy <= 0) {
            this.triggerGameOver(false);
            return;
          }
        }
      }

      if (this.bots.length === 0 && !this.isGameOver) {
        if (this.wave >= this.maxWaves) {
          this.triggerGameOver(true);
        } else {
          this.wave++;
          this.energy = Math.min(100, this.energy + 35);
          this.spawnWaveRobots();
        }
      }
    }

    // 6. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
      p.vel.y -= 20 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 7. Camera Follow
    const target = new THREE.Vector3(this.player.x, this.player.y + 2.5, this.player.z);
    const offset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist,
      Math.sin(this.cameraPitch) * this.cameraDist,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist
    );
    this.camera.position.copy(target).add(offset);
    this.camera.lookAt(target);

    this.updateHUD();
  }

  updateHUD() {
    const scoreEl = document.getElementById('arcadeScore');
    const ammoEl = document.getElementById('arcadeAmmo');
    const comboEl = document.getElementById('arcadeCombo');

    if (this.mode === 'toyfire') {
      if (scoreEl) scoreEl.textContent = `Splashes: ${this.splashes}`;
      if (ammoEl) ammoEl.textContent = `👥 ${this.buddiesLeft} / 9 Buddies`;
      if (comboEl) comboEl.textContent = `❤️ Energy: ${Math.round(this.energy)}% | 🛡️ ${Math.round(this.shield)}%`;
    } else {
      if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
      if (ammoEl) ammoEl.textContent = `Wave: ${this.wave} / ${this.maxWaves}`;
      if (comboEl) comboEl.textContent = `❤️ Energy: ${Math.round(this.energy)}% | ⭐ Stars: ${this.stars}`;
    }
  }

  triggerGameOver(isVictory) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const modal = document.getElementById('arcadeGameOverModal');
    const title = document.getElementById('goTitle');
    const score = document.getElementById('goScore');

    if (modal && title && score) {
      if (isVictory) {
        SFX.booyah();
        title.innerHTML = '🏆 BOOYAH! #1 CHAMPION! 🏆';
        score.innerHTML = this.mode === 'toyfire'
          ? `Incredible Victory! Splashes: <strong>${this.splashes}</strong> | Score: <strong>${this.score} Points!</strong>`
          : `All 10 Waves Tagged! Stars: <strong>${this.stars}</strong> | Final Score: <strong>${this.score} Points!</strong>`;
      } else {
        SFX.crash();
        title.innerHTML = '🌊 Game Over!';
        score.innerHTML = `Great effort! Final Score: <strong>${this.score} Points</strong>. Keep having fun!`;
      }
      modal.style.display = 'flex';
    }

    const key = this.mode === 'toyfire' ? 'chunnu_toyfire_best' : 'chunnu_clash3d_best';
    const best = parseInt(localStorage.getItem(key) || '0', 10);
    if (this.score > best) {
      localStorage.setItem(key, this.score);
    }
    const highEl = document.getElementById('arcadeHighScore');
    if (highEl) highEl.textContent = Math.max(best, this.score);
  }

  stop() {
    this.active = false;
    this.canvas.style.display = 'none';

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'none';

    const hint = document.getElementById('arcade3DHint');
    if (hint) hint.style.display = 'none';

    const scope = document.getElementById('arcade3DScope');
    if (scope) scope.style.display = 'none';
  }

  startLoop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.lastTime = performance.now();
    const loop = (t) => {
      if (!this.active) return;
      const dt = Math.min((t - this.lastTime) / 1000, 0.1);
      this.lastTime = t;

      this.update(dt);
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }
}

// Attach globally
window.Chunnu3DManager = Chunnu3DManager;
