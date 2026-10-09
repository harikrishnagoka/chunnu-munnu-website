/**
 * Chunnu Munnu 3D Kids Game Zone Engine (Three.js WebGL)
 * 1. Toy Fire 3D: Backyard Battle Royale 🏆🪂 (Free Fire Style 3D Mini Battle Royale)
 * 2. Clash Squad 3D: Wave Survival 💥🤖 (Free Fire Style 3D Tactical Wave Combat)
 * 100% Free, Zero External Model Dependencies, Fast Procedural 3D WebGL Rendering.
 */

// ==========================================
// 1. GAME 3: Toy Fire 3D (Backyard Battle Royale) 🏆🪂
// ==========================================
class ToyFire3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.character = 'chunnu';
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // Game state
    this.player = null;
    this.parachute = null;
    this.isParachuting = true;
    this.bots = [];
    this.projectiles = [];
    this.crates = [];
    this.particles = [];
    this.airdrop = null;
    this.trees = [];
    this.bushes = [];
    this.structures = [];

    // Safe Zone / Storm
    this.stormCenter = { x: 0, z: 0 };
    this.stormRadius = 260;
    this.targetStormRadius = 35;
    this.stormMesh = null;
    this.stormTime = 0;

    // Stats
    this.kills = 0;
    this.aliveCount = 9;
    this.health = 100;
    this.armor = 50;
    this.weapon = 'rapid'; // rapid, shotgun, rocket
    this.score = 0;
    this.lastShotTime = 0;
    this.isGameOver = false;
    this.isVictory = false;

    // Controls state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shoot: false
    };
    this.cameraYaw = 0;
    this.cameraPitch = 0.2;
    this.cameraDist = 14;

    this.touchStart = null;
    this.touchAimStart = null;

    this.lastTime = performance.now();
    this.init();
  }

  init() {
    if (!window.THREE) return;

    // Setup WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(800, 500);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7ac9f5);
    this.scene.fog = new THREE.FogExp2(0x7ac9f5, 0.0035);

    this.camera = new THREE.PerspectiveCamera(60, 800 / 500, 0.2, 800);

    // Setup Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x446633, 0.75);
    this.scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfff7e6, 0.95);
    sun.position.set(120, 200, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 450;
    const d = 160;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);

    this.setupInputs();
  }

  setupInputs() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'Space') {
        this.keys.shoot = true;
        this.shoot();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.active) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'Space') this.keys.shoot = false;
    });

    // Mouse Drag for Camera Orbit & Aiming
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.active) return;
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      this.shoot();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.active || !isMouseDown) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      this.cameraYaw -= dx * 0.006;
      this.cameraPitch = Math.max(0.05, Math.min(0.75, this.cameraPitch + dy * 0.005));
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    // Touch controls for mobile screens
    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const rect = this.canvas.getBoundingClientRect();
        const x = t.clientX - rect.left;
        if (x < rect.width * 0.5) {
          this.touchStart = { id: t.identifier, x: t.clientX, y: t.clientY };
        } else {
          this.touchAimStart = { id: t.identifier, x: t.clientX, y: t.clientY };
          this.shoot();
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (this.touchStart && t.identifier === this.touchStart.id) {
          const dx = t.clientX - this.touchStart.x;
          const dy = t.clientY - this.touchStart.y;
          this.keys.forward = dy < -18;
          this.keys.backward = dy > 18;
          this.keys.left = dx < -18;
          this.keys.right = dx > 18;
        } else if (this.touchAimStart && t.identifier === this.touchAimStart.id) {
          const dx = t.clientX - this.touchAimStart.x;
          const dy = t.clientY - this.touchAimStart.y;
          this.touchAimStart.x = t.clientX;
          this.touchAimStart.y = t.clientY;
          this.cameraYaw -= dx * 0.009;
          this.cameraPitch = Math.max(0.05, Math.min(0.75, this.cameraPitch + dy * 0.007));
        }
      }
    }, { passive: true });

    const clearTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (this.touchStart && t.identifier === this.touchStart.id) {
          this.touchStart = null;
          this.keys.forward = false;
          this.keys.backward = false;
          this.keys.left = false;
          this.keys.right = false;
        }
        if (this.touchAimStart && t.identifier === this.touchAimStart.id) {
          this.touchAimStart = null;
        }
      }
    };
    this.canvas.addEventListener('touchend', clearTouch);
    this.canvas.addEventListener('touchcancel', clearTouch);
  }

  buildMap() {
    // Clear old map meshes
    while (this.scene.children.length > 2) {
      this.scene.remove(this.scene.children[2]);
    }

    // 1. Ocean Water Plane
    const oceanGeo = new THREE.PlaneGeometry(1200, 1200);
    const oceanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -2;
    this.scene.add(ocean);

    // 2. Main Battle Royale Island (Soft Green Grass Cylinder)
    const islandGeo = new THREE.CylinderGeometry(280, 290, 8, 48);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x48bb78,
      roughness: 0.85,
      metalness: 0.1
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -4;
    island.receiveShadow = true;
    this.scene.add(island);

    // Sandy Shore Ring
    const sandGeo = new THREE.RingGeometry(275, 298, 48);
    const sandMat = new THREE.MeshBasicMaterial({ color: 0xf6e05e, side: THREE.DoubleSide });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.05;
    this.scene.add(sand);

    // 3. Central Play Area Dirt Ring / Paths
    const pathGeo = new THREE.RingGeometry(60, 75, 32);
    const pathMat = new THREE.MeshBasicMaterial({ color: 0xd69e2e, side: THREE.DoubleSide });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.08;
    this.scene.add(path);

    // 4. Procedural Cartoon Trees
    this.trees = [];
    const treeTrunkGeo = new THREE.CylinderGeometry(0.8, 1.2, 5, 8);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c });
    const treeLeavesGeo = new THREE.ConeGeometry(4.5, 9, 8);
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x276749, roughness: 0.8 });

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 210;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.y = 2.5;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      const leaves = new THREE.Mesh(treeLeavesGeo, treeLeavesMat);
      leaves.position.y = 8;
      leaves.castShadow = true;
      treeGroup.add(leaves);

      treeGroup.position.set(x, 0, z);
      this.scene.add(treeGroup);
      this.trees.push({ x, z, radius: 2.5 });
    }

    // 5. 3D Bunkers & Stone Walls
    this.structures = [];
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xe53e3e, roughness: 0.6 });

    const bunkerPositions = [
      { x: 0, z: 0 },
      { x: 90, z: 70 },
      { x: -80, z: 80 },
      { x: -90, z: -70 },
      { x: 80, z: -90 }
    ];

    bunkerPositions.forEach(pos => {
      const bGroup = new THREE.Group();

      const baseGeo = new THREE.BoxGeometry(16, 7, 16);
      const base = new THREE.Mesh(baseGeo, wallMat);
      base.position.y = 3.5;
      base.castShadow = true;
      base.receiveShadow = true;
      bGroup.add(base);

      const roofGeo = new THREE.ConeGeometry(13, 5, 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 9.5;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      bGroup.add(roof);

      bGroup.position.set(pos.x, 0, pos.z);
      this.scene.add(bGroup);
      this.structures.push({ x: pos.x, z: pos.z, radius: 9 });
    });

    // 6. 3D Wooden Loot Crates
    this.crates = [];
    const crateGeo = new THREE.BoxGeometry(3.5, 3.5, 3.5);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });

    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + (Math.random() * 0.2);
      const dist = 25 + Math.random() * 190;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;

      const crateMesh = new THREE.Mesh(crateGeo, crateMat);
      crateMesh.position.set(cx, 1.75, cz);
      crateMesh.castShadow = true;
      crateMesh.receiveShadow = true;
      this.scene.add(crateMesh);

      // Weapon type in crate
      const types = ['shotgun', 'rapid', 'medkit', 'armor', 'rocket'];
      const lootType = types[i % types.length];

      this.crates.push({
        mesh: crateMesh,
        x: cx,
        z: cz,
        active: true,
        type: lootType
      });
    }

    // 7. 3D Bushes (Stealth hiding spots)
    this.bushes = [];
    const bushGeo = new THREE.SphereGeometry(3, 8, 8);
    const bushMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.9,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 190;
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;

      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.scale.set(1.4, 0.7, 1.4);
      bush.position.set(bx, 1.5, bz);
      bush.castShadow = true;
      this.scene.add(bush);
      this.bushes.push({ x: bx, z: bz, radius: 4 });
    }

    // 8. 3D Shrinking Storm Cylinder (Blue Electric Zone)
    const stormGeo = new THREE.CylinderGeometry(this.stormRadius, this.stormRadius, 90, 48, 1, true);
    const stormMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide
    });
    this.stormMesh = new THREE.Mesh(stormGeo, stormMat);
    this.stormMesh.position.set(this.stormCenter.x, 45, this.stormCenter.z);
    this.scene.add(this.stormMesh);
  }

  createHumanoid(shirtColor, isChunnu) {
    const group = new THREE.Group();

    // Head
    const headGeo = new THREE.SphereGeometry(1.3, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 4.8;
    head.castShadow = true;
    group.add(head);

    // Cap / Hair
    const capGeo = new THREE.SphereGeometry(1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({ color: shirtColor });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 5.2;
    group.add(cap);

    // Torso / Shirt
    const torsoGeo = new THREE.BoxGeometry(2.4, 3, 1.6);
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 });
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 2.8;
    torso.castShadow = true;
    group.add(torso);

    // Shorts / Pants
    const shortsGeo = new THREE.BoxGeometry(2.3, 1.4, 1.5);
    const shortsMat = new THREE.MeshStandardMaterial({ color: isChunnu ? 0x1e3a8a : 0x1e293b });
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 1.6;
    shorts.castShadow = true;
    group.add(shorts);

    // Left & Right Legs
    const legGeo = new THREE.CylinderGeometry(0.5, 0.45, 1.8, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.7, 0.8, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.7, 0.8, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Left & Right Arms
    const armGeo = new THREE.CylinderGeometry(0.4, 0.35, 2.2, 8);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-1.6, 2.8, 0.2);
    leftArm.rotation.x = -Math.PI / 4;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(1.6, 2.8, 0.2);
    rightArm.rotation.x = -Math.PI / 4;
    group.add(rightArm);

    // 3D Toy Blaster in hand
    const gunGroup = new THREE.Group();
    const barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4 });
    const barrel = new THREE.Mesh(barrelGeo, gunMat);
    barrel.rotation.x = Math.PI / 2;
    gunGroup.add(barrel);

    const handleGeo = new THREE.BoxGeometry(0.3, 0.8, 0.4);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -0.4, -0.4);
    gunGroup.add(handle);

    gunGroup.position.set(1.2, 2.4, 1.4);
    group.add(gunGroup);

    return {
      group,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      gunGroup
    };
  }

  createParachute() {
    const pGroup = new THREE.Group();

    // Canopy (dome)
    const canopyGeo = new THREE.SphereGeometry(7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      roughness: 0.7
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 8;
    pGroup.add(canopy);

    // Ropes
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const ropeCoords = [
      [-5, 5, -5], [5, 5, -5], [-5, 5, 5], [5, 5, 5]
    ];
    ropeCoords.forEach(c => {
      const points = [new THREE.Vector3(c[0], c[1], c[2]), new THREE.Vector3(0, 0, 0)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, lineMat);
      pGroup.add(line);
    });

    return pGroup;
  }

  start(character = 'chunnu') {
    this.character = character;
    this.active = true;
    this.isGameOver = false;
    this.isVictory = false;
    this.kills = 0;
    this.aliveCount = 9;
    this.health = 100;
    this.armor = 50;
    this.weapon = 'rapid';
    this.score = 0;
    this.stormRadius = 260;
    this.stormTime = 0;
    this.projectiles = [];
    this.particles = [];
    this.isParachuting = true;

    // Canvas display
    this.canvas.style.display = 'block';

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'block';

    const hint = document.getElementById('arcade3DHint');
    if (hint) {
      hint.textContent = '🪂 PARACHUTE DROP! GLIDE & TAP TO LAND!';
      hint.style.display = 'block';
    }

    this.buildMap();

    // Spawn Player High Up with Parachute
    const isChunnu = character === 'chunnu';
    const shirtColor = isChunnu ? 0xeab308 : 0x3b82f6;
    const pParts = this.createHumanoid(shirtColor, isChunnu);

    this.player = {
      ...pParts,
      x: 0,
      y: 95, // Falling from sky!
      z: 110,
      vy: -15,
      rotY: Math.PI,
      speed: 16,
      walkCycle: 0
    };
    this.player.group.position.set(this.player.x, this.player.y, this.player.z);
    this.scene.add(this.player.group);

    // Attach parachute
    this.parachute = this.createParachute();
    this.parachute.position.set(0, 4.5, 0);
    this.player.group.add(this.parachute);

    // Spawn 8 Bot Opponents
    this.spawnBots();

    this.updateHUD();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  spawnBots() {
    this.bots = [];
    const botNames = [
      'Bot Sparky', 'Bot Turbo', 'Bot Blaze', 'Bot Rex',
      'Bot Neon', 'Bot Dash', 'Bot Ziggy', 'Bot Echo'
    ];
    const colors = [
      0xec4899, 0x8b5cf6, 0x06b6d4, 0x10b981,
      0xf97316, 0x6366f1, 0x14b8a6, 0xd946ef
    ];

    botNames.forEach((name, i) => {
      const angle = (i / botNames.length) * Math.PI * 2 + 0.3;
      const dist = 60 + Math.random() * 140;
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;

      const botParts = this.createHumanoid(colors[i % colors.length], false);
      botParts.group.position.set(bx, 0, bz);
      this.scene.add(botParts);

      this.bots.push({
        name,
        mesh: botParts.group,
        parts: botParts,
        x: bx,
        y: 0,
        z: bz,
        health: 100,
        alive: true,
        rotY: Math.random() * Math.PI * 2,
        state: 'roam',
        shootCooldown: 1.5 + Math.random() * 2,
        walkCycle: 0
      });
    });
  }

  stop() {
    this.active = false;
    this.canvas.style.display = 'none';

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'none';

    const hint = document.getElementById('arcade3DHint');
    if (hint) hint.style.display = 'none';
  }

  shoot() {
    if (!this.active || this.isGameOver || this.isParachuting) return;

    const now = performance.now();
    const cooldown = this.weapon === 'rapid' ? 140 : (this.weapon === 'shotgun' ? 450 : 800);
    if (now - this.lastShotTime < cooldown) return;
    this.lastShotTime = now;

    // Forward direction from camera yaw
    const dir = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
    const spawnPos = new THREE.Vector3(this.player.x, this.player.y + 2.5, this.player.z).add(dir.clone().multiplyScalar(2));

    if (this.weapon === 'shotgun') {
      SFX.shotgun();
      for (let i = -1; i <= 1; i++) {
        const spreadAngle = i * 0.15;
        const sDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
        this.createProjectile(spawnPos, sDir, 65, 0xf97316, 20, true);
      }
    } else if (this.weapon === 'rocket') {
      SFX.bomb();
      this.createProjectile(spawnPos, dir, 45, 0x38bdf8, 65, true, true);
    } else {
      SFX.laser();
      this.createProjectile(spawnPos, dir, 80, 0x4ade80, 24, true);
    }
  }

  createProjectile(pos, dir, speed, colorHex, damage, isPlayer = false, isRocket = false) {
    const geo = new THREE.SphereGeometry(isRocket ? 0.9 : 0.4, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      pos: mesh.position,
      vel: dir.clone().multiplyScalar(speed),
      life: 2.2,
      damage,
      isPlayer,
      isRocket
    });
  }

  showKillFeed(msg) {
    const kf = document.getElementById('arcadeKillFeed');
    if (!kf) return;
    const item = document.createElement('div');
    item.className = 'kf-item';
    item.textContent = msg;
    kf.appendChild(item);
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 3500);
  }

  spawnHitParticles(pos, colorHex = 0xffe600) {
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(0.25, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      this.scene.add(p);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 12
      );
      this.particles.push({ mesh: p, vel, life: 0.5 });
    }
  }

  update(dt) {
    if (this.isGameOver) return;

    // 1. Storm Circle Shrinking
    this.stormTime += dt;
    if (this.stormRadius > this.targetStormRadius) {
      this.stormRadius = Math.max(this.targetStormRadius, this.stormRadius - dt * 3.2);
      this.stormMesh.scale.set(this.stormRadius / 260, 1, this.stormRadius / 260);
    }

    // 2. Parachute Landing
    if (this.isParachuting) {
      this.player.y += this.player.vy * dt;
      if (this.player.y <= 0) {
        this.player.y = 0;
        this.isParachuting = false;
        if (this.parachute) {
          this.player.group.remove(this.parachute);
          this.parachute = null;
        }
        SFX.jump();
        const hint = document.getElementById('arcade3DHint');
        if (hint) hint.style.display = 'none';
      }
    }

    // 3. Player Movement & Rotation
    let moveX = 0;
    let moveZ = 0;
    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      // Transform relative to camera yaw
      const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

      const moveDir = forward.clone().multiplyScalar(-moveZ).add(right.clone().multiplyScalar(moveX));
      const spd = this.isParachuting ? 22 : this.player.speed;
      this.player.x += moveDir.x * spd * dt;
      this.player.z += moveDir.z * spd * dt;

      // Restrict to island boundaries
      const pDist = Math.hypot(this.player.x, this.player.z);
      if (pDist > 275) {
        this.player.x = (this.player.x / pDist) * 275;
        this.player.z = (this.player.z / pDist) * 275;
      }

      // Animate walk swing
      this.player.walkCycle += dt * 14;
      this.player.leftLeg.rotation.x = Math.sin(this.player.walkCycle) * 0.6;
      this.player.rightLeg.rotation.x = -Math.sin(this.player.walkCycle) * 0.6;
    } else {
      this.player.leftLeg.rotation.x = 0;
      this.player.rightLeg.rotation.x = 0;
    }

    this.player.rotY = this.cameraYaw + Math.PI;
    this.player.group.rotation.y = this.player.rotY;
    this.player.group.position.set(this.player.x, this.player.y, this.player.z);

    // 4. Storm Damage to Player
    const distToCenter = Math.hypot(this.player.x - this.stormCenter.x, this.player.z - this.stormCenter.z);
    if (distToCenter > this.stormRadius && !this.isParachuting) {
      this.health -= dt * 6;
      SFX.hit();
      if (this.health <= 0) {
        this.health = 0;
        this.gameOver(false);
      }
    }

    // 5. Crate Looting Check
    this.crates.forEach(crate => {
      if (!crate.active) return;
      const d = Math.hypot(this.player.x - crate.x, this.player.z - crate.z);
      if (d < 4.2) {
        crate.active = false;
        crate.mesh.visible = false;
        SFX.powerup();

        if (crate.type === 'shotgun') {
          this.weapon = 'shotgun';
          this.showKillFeed('🎉 Equipped TRIPLE SHOTGUN!');
        } else if (crate.type === 'rocket') {
          this.weapon = 'rocket';
          this.showKillFeed('🚀 Equipped WATER ROCKET LAUNCHER!');
        } else if (crate.type === 'armor') {
          this.armor = Math.min(100, this.armor + 50);
          this.showKillFeed('🛡️ Picked up ARMOR VEST (+50)!');
        } else if (crate.type === 'medkit') {
          this.health = Math.min(100, this.health + 45);
          this.showKillFeed('🧃 Drank MANGO JUICE MEDKIT (+45 HP)!');
        } else {
          this.weapon = 'rapid';
          this.showKillFeed('⚡ Equipped RAPID DART BLASTER!');
        }
      }
    });

    // 6. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.pos.add(p.vel.clone().multiplyScalar(dt));
      p.life -= dt;

      // Hit Ground
      if (p.pos.y <= 0.4 || p.life <= 0) {
        this.spawnHitParticles(p.pos, p.isRocket ? 0x38bdf8 : 0x4ade80);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check hit Player (if bot projectile)
      if (!p.isPlayer) {
        const dPlayer = Math.hypot(p.pos.x - this.player.x, p.pos.z - this.player.z);
        if (dPlayer < 2.2 && Math.abs(p.pos.y - 2.5) < 3.2) {
          SFX.hit();
          this.spawnHitParticles(p.pos, 0xef4444);
          if (this.armor > 0) {
            this.armor -= p.damage * 0.6;
            this.health -= p.damage * 0.4;
          } else {
            this.health -= p.damage;
          }
          if (this.health <= 0) {
            this.health = 0;
            this.gameOver(false);
          }
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check hit Bots (if player projectile)
      if (p.isPlayer) {
        let hitBot = false;
        for (let b of this.bots) {
          if (!b.alive) continue;
          const dBot = Math.hypot(p.pos.x - b.x, p.pos.z - b.z);
          if (dBot < 2.5 && Math.abs(p.pos.y - 2.5) < 3.5) {
            hitBot = true;
            b.health -= p.damage;
            SFX.pop();
            this.spawnHitParticles(p.pos, 0xf59e0b);

            if (b.health <= 0) {
              b.alive = false;
              b.mesh.visible = false;
              this.kills++;
              this.score += 150;
              this.aliveCount--;
              this.showKillFeed(`💥 ${this.character === 'chunnu' ? 'Chunnu' : 'Munnu'} eliminated ${b.name}!`);

              if (this.aliveCount <= 1) {
                this.gameOver(true); // BOOYAH!
              }
            }
            break;
          }
        }
        if (hitBot) {
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }

    // 7. Update Bots AI
    this.bots.forEach(bot => {
      if (!bot.alive) return;

      // Check storm
      const distToCenter = Math.hypot(bot.x - this.stormCenter.x, bot.z - this.stormCenter.z);
      if (distToCenter > this.stormRadius) {
        bot.health -= dt * 7;
        if (bot.health <= 0) {
          bot.alive = false;
          bot.mesh.visible = false;
          this.aliveCount--;
          this.showKillFeed(`⚡ Storm eliminated ${bot.name}!`);
          if (this.aliveCount <= 1) this.gameOver(true);
          return;
        }
      }

      // AI Decision: Run to safe zone or seek player
      const dPlayer = Math.hypot(bot.x - this.player.x, bot.z - this.player.z);

      if (distToCenter > this.stormRadius * 0.8) {
        // Run towards center of storm
        const angle = Math.atan2(this.stormCenter.z - bot.z, this.stormCenter.x - bot.x);
        bot.x += Math.cos(angle) * 12 * dt;
        bot.z += Math.sin(angle) * 12 * dt;
        bot.rotY = -angle + Math.PI / 2;
      } else if (dPlayer < 45 && !this.isParachuting) {
        // Engage player!
        const angle = Math.atan2(this.player.z - bot.z, this.player.x - bot.x);
        bot.rotY = -angle + Math.PI / 2;

        // Strafe or approach
        if (dPlayer > 18) {
          bot.x += Math.cos(angle) * 10 * dt;
          bot.z += Math.sin(angle) * 10 * dt;
        }

        // Shoot at player
        bot.shootCooldown -= dt;
        if (bot.shootCooldown <= 0) {
          bot.shootCooldown = 1.6 + Math.random() * 1.5;
          const bDir = new THREE.Vector3(this.player.x - bot.x, 0, this.player.z - bot.z).normalize();
          const bSpawn = new THREE.Vector3(bot.x, 2.5, bot.z).add(bDir.clone().multiplyScalar(1.5));
          this.createProjectile(bSpawn, bDir, 55, 0xef4444, 14, false);
          SFX.laser();
        }
      } else {
        // Roam peacefully
        bot.x += Math.sin(bot.rotY) * 6 * dt;
        bot.z += Math.cos(bot.rotY) * 6 * dt;
        if (Math.random() < 0.02) {
          bot.rotY += (Math.random() - 0.5) * 1.5;
        }
      }

      bot.mesh.position.set(bot.x, 0, bot.z);
      bot.mesh.rotation.y = bot.rotY;

      // Leg swing
      bot.walkCycle += dt * 10;
      bot.parts.leftLeg.rotation.x = Math.sin(bot.walkCycle) * 0.5;
      bot.parts.rightLeg.rotation.x = -Math.sin(bot.walkCycle) * 0.5;
    });

    // 8. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos = p.mesh.position;
      p.pos.add(p.vel.clone().multiplyScalar(dt));
      p.vel.y -= 25 * dt; // gravity
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 9. Camera Orbit Follow
    const camTarget = new THREE.Vector3(this.player.x, this.player.y + 2.5, this.player.z);
    const camOffset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist,
      Math.sin(this.cameraPitch) * this.cameraDist,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist
    );
    this.camera.position.copy(camTarget).add(camOffset);
    this.camera.lookAt(camTarget.clone().add(new THREE.Vector3(0, 1.2, 0)));

    this.updateHUD();
  }

  updateHUD() {
    const scoreEl = document.getElementById('arcadeScore');
    const ammoEl = document.getElementById('arcadeAmmo');
    const comboEl = document.getElementById('arcadeCombo');

    if (scoreEl) scoreEl.textContent = `Kills: ${this.kills}`;
    if (ammoEl) ammoEl.textContent = `👥 ${this.aliveCount} / 9 Alive`;
    if (comboEl) {
      const wpnNames = { rapid: '⚡ Rapid Dart', shotgun: '💥 Shotgun', rocket: '🚀 Rocket' };
      comboEl.textContent = `❤️ ${Math.round(this.health)}% | 🛡️ ${Math.round(this.armor)}% | ${wpnNames[this.weapon]}`;
    }
  }

  gameOver(isVictory) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isVictory = isVictory;

    const modal = document.getElementById('arcadeGameOverModal');
    const title = document.getElementById('goTitle');
    const score = document.getElementById('goScore');

    if (modal && title && score) {
      if (isVictory) {
        SFX.booyah();
        title.innerHTML = '🏆 BOOYAH! #1 SURVIVOR! 🏆';
        score.innerHTML = `Incredible Victory! Kills: <strong>${this.kills}</strong> | Score: <strong>${this.score} Points!</strong>`;
      } else {
        SFX.crash();
        title.innerHTML = '💥 Eliminated!';
        score.innerHTML = `Placed #${this.aliveCount} | Kills: <strong>${this.kills}</strong> | Keep practicing!`;
      }
      modal.style.display = 'flex';
    }

    // Save high score
    const best = parseInt(localStorage.getItem('chunnu_toyfire_best') || '0', 10);
    if (this.score > best) {
      localStorage.setItem('chunnu_toyfire_best', this.score);
    }
    const highEl = document.getElementById('arcadeHighScore');
    if (highEl) highEl.textContent = Math.max(best, this.score);
  }

  loop(timestamp) {
    if (!this.active) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

// ==========================================
// 2. GAME 4: Clash Squad 3D (Wave Survival) 💥🤖
// ==========================================
class ClashSquad3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.character = 'chunnu';
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // Game state
    this.player = null;
    this.wave = 1;
    this.maxWaves = 10;
    this.coins = 0;
    this.score = 0;
    this.health = 100;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.turrets = [];
    this.isScoped = false;
    this.isGameOver = false;

    // Upgrades
    this.fireRateMultiplier = 1;
    this.damageMultiplier = 1;

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };
    this.cameraYaw = 0;
    this.cameraPitch = 0.25;
    this.cameraDist = 13;

    this.lastShotTime = 0;
    this.lastTime = performance.now();
    this.init();
  }

  init() {
    if (!window.THREE) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(800, 500);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.005);

    this.camera = new THREE.PerspectiveCamera(60, 800 / 500, 0.2, 500);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.6);
    this.scene.add(hemiLight);

    const arenaLight = new THREE.DirectionalLight(0x38bdf8, 1);
    arenaLight.position.set(50, 100, 50);
    arenaLight.castShadow = true;
    this.scene.add(arenaLight);

    this.setupInputs();
  }

  setupInputs() {
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

    let isMouseDown = false;
    let prevX = 0;
    let prevY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.active) return;
      if (e.button === 2) {
        this.toggleScope();
        return;
      }
      isMouseDown = true;
      prevX = e.clientX;
      prevY = e.clientY;
      this.shoot();
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      if (!this.active || !isMouseDown) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      this.cameraYaw -= dx * 0.006;
      this.cameraPitch = Math.max(0.05, Math.min(0.7, this.cameraPitch + dy * 0.005));
    });

    window.addEventListener('mouseup', () => { isMouseDown = false; });
  }

  toggleScope() {
    this.isScoped = !this.isScoped;
    const scopeEl = document.getElementById('arcade3DScope');
    if (scopeEl) scopeEl.style.display = this.isScoped ? 'block' : 'none';

    this.cameraDist = this.isScoped ? 4 : 13;
    this.camera.fov = this.isScoped ? 30 : 60;
    this.camera.updateProjectionMatrix();
    SFX.laser();
  }

  buildArena() {
    while (this.scene.children.length > 2) {
      this.scene.remove(this.scene.children[2]);
    }

    // Octagonal Metallic Floor
    const floorGeo = new THREE.CylinderGeometry(90, 92, 4, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.4
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Glowing Cyber Trim
    const ringGeo = new THREE.RingGeometry(85, 89, 8);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    this.scene.add(ring);

    // Defense Barricades
    const barGeo = new THREE.BoxGeometry(10, 4, 3);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });

    [
      { x: 25, z: 25, rot: Math.PI / 4 },
      { x: -25, z: 25, rot: -Math.PI / 4 },
      { x: 25, z: -25, rot: -Math.PI / 4 },
      { x: -25, z: -25, rot: Math.PI / 4 }
    ].forEach(b => {
      const mesh = new THREE.Mesh(barGeo, barMat);
      mesh.position.set(b.x, 2, b.z);
      mesh.rotation.y = b.rot;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });

    // Central Core Beacon
    const coreGeo = new THREE.CylinderGeometry(3, 3, 8, 16);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.7 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 4;
    this.scene.add(core);

    const orbGeo = new THREE.SphereGeometry(2, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 9;
    this.scene.add(orb);
  }

  start(character = 'chunnu') {
    this.character = character;
    this.active = true;
    this.isGameOver = false;
    this.wave = 1;
    this.coins = 0;
    this.score = 0;
    this.health = 100;
    this.fireRateMultiplier = 1;
    this.damageMultiplier = 1;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.turrets = [];
    this.isScoped = false;

    this.canvas.style.display = 'block';

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'block';

    this.buildArena();

    // Spawn Player
    const isChunnu = character === 'chunnu';
    const shirtColor = isChunnu ? 0xeab308 : 0x3b82f6;

    // Use ToyFire3D's humanoid builder logic
    const dummyTF = new ToyFire3D(this.canvas);
    const pParts = dummyTF.createHumanoid(shirtColor, isChunnu);

    this.player = {
      ...pParts,
      x: 0,
      y: 0,
      z: 18,
      speed: 18,
      rotY: 0,
      walkCycle: 0
    };
    this.player.group.position.set(0, 0, 18);
    this.scene.add(this.player.group);

    this.spawnWave();
    this.updateHUD();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.active = false;
    this.canvas.style.display = 'none';

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'none';

    const scopeEl = document.getElementById('arcade3DScope');
    if (scopeEl) scopeEl.style.display = 'none';
  }

  spawnWave() {
    const count = 5 + this.wave * 3;
    const isBossWave = this.wave === 5 || this.wave === 10;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 70 + Math.random() * 15;
      const ex = Math.cos(angle) * dist;
      const ez = Math.sin(angle) * dist;

      // Enemy Bot Mesh
      const botGeo = new THREE.BoxGeometry(2.5, 3.5, 2.5);
      const botMat = new THREE.MeshStandardMaterial({
        color: isBossWave && i === 0 ? 0xd97706 : 0xef4444,
        metalness: 0.5
      });
      const mesh = new THREE.Mesh(botGeo, botMat);
      if (isBossWave && i === 0) mesh.scale.set(2.2, 2.2, 2.2);

      mesh.position.set(ex, 2, ez);
      mesh.castShadow = true;
      this.scene.add(mesh);

      this.enemies.push({
        mesh,
        x: ex,
        z: ez,
        health: (isBossWave && i === 0 ? 300 : 40) + this.wave * 12,
        isBoss: isBossWave && i === 0,
        speed: 7 + Math.random() * 4,
        alive: true
      });
    }

    SFX.drop();
  }

  shoot() {
    if (!this.active || this.isGameOver) return;
    const now = performance.now();
    if (now - this.lastShotTime < 180 / this.fireRateMultiplier) return;
    this.lastShotTime = now;

    SFX.laser();
    const dir = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
    const spawnPos = new THREE.Vector3(this.player.x, 2.5, this.player.z).add(dir.clone().multiplyScalar(2));

    const geo = new THREE.SphereGeometry(0.45, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      pos: mesh.position,
      vel: dir.multiplyScalar(85),
      damage: 30 * this.damageMultiplier,
      life: 1.8
    });
  }

  buyTurret() {
    if (this.coins < 80) return;
    this.coins -= 80;
    SFX.powerup();

    const tGeo = new THREE.CylinderGeometry(1, 1.4, 3, 8);
    const tMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    const turret = new THREE.Mesh(tGeo, tMat);
    turret.position.set(this.player.x, 1.5, this.player.z);
    this.scene.add(turret);

    this.turrets.push({
      mesh: turret,
      x: this.player.x,
      z: this.player.z,
      cooldown: 0
    });
  }

  buyNuke() {
    if (this.coins < 100) return;
    this.coins -= 100;
    SFX.bomb();

    this.enemies.forEach(e => {
      e.health = 0;
      e.alive = false;
      e.mesh.visible = false;
      this.score += 50;
    });
    this.enemies = [];
    this.checkWaveClear();
  }

  update(dt) {
    if (this.isGameOver) return;

    // Movement
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
      const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
      const move = fwd.multiplyScalar(-mz).add(right.multiplyScalar(mx));

      this.player.x += move.x * this.player.speed * dt;
      this.player.z += move.z * this.player.speed * dt;

      const dCenter = Math.hypot(this.player.x, this.player.z);
      if (dCenter > 80) {
        this.player.x = (this.player.x / dCenter) * 80;
        this.player.z = (this.player.z / dCenter) * 80;
      }
    }

    this.player.rotY = this.cameraYaw + Math.PI;
    this.player.group.rotation.y = this.player.rotY;
    this.player.group.position.set(this.player.x, 0, this.player.z);

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.pos.add(p.vel.clone().multiplyScalar(dt));
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      for (let e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(p.pos.x - e.x, p.pos.z - e.z);
        if (d < (e.isBoss ? 4.5 : 2.5)) {
          e.health -= p.damage;
          SFX.pop();

          if (e.health <= 0) {
            e.alive = false;
            e.mesh.visible = false;
            this.coins += e.isBoss ? 50 : 15;
            this.score += e.isBoss ? 300 : 70;
            SFX.coin();
          }

          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) {
        this.enemies.splice(i, 1);
        continue;
      }

      const angle = Math.atan2(this.player.z - e.z, this.player.x - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.z += Math.sin(angle) * e.speed * dt;
      e.mesh.position.set(e.x, e.isBoss ? 4 : 2, e.z);
      e.mesh.rotation.y = -angle + Math.PI / 2;

      // Hit Player
      const dPlayer = Math.hypot(e.x - this.player.x, e.z - this.player.z);
      if (dPlayer < 3.2) {
        this.health -= dt * (e.isBoss ? 35 : 18);
        SFX.hit();
        if (this.health <= 0) {
          this.health = 0;
          this.gameOver(false);
          return;
        }
      }
    }

    // Update Turrets
    this.turrets.forEach(turret => {
      turret.cooldown -= dt;
      if (turret.cooldown <= 0 && this.enemies.length > 0) {
        turret.cooldown = 0.5;
        const target = this.enemies[0];
        const dir = new THREE.Vector3(target.x - turret.x, 0, target.z - turret.z).normalize();
        const spawnPos = new THREE.Vector3(turret.x, 2, turret.z);

        const geo = new THREE.SphereGeometry(0.35, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(spawnPos);
        this.scene.add(mesh);

        this.projectiles.push({
          mesh,
          pos: mesh.position,
          vel: dir.multiplyScalar(70),
          damage: 22,
          life: 1.5
        });
        SFX.laser();
      }
    });

    this.checkWaveClear();

    // Camera
    const camTarget = new THREE.Vector3(this.player.x, 2.5, this.player.z);
    const camOffset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist,
      Math.sin(this.cameraPitch) * this.cameraDist,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist
    );
    this.camera.position.copy(camTarget).add(camOffset);
    this.camera.lookAt(camTarget);

    this.updateHUD();
  }

  checkWaveClear() {
    if (this.enemies.length === 0 && !this.isGameOver) {
      if (this.wave >= this.maxWaves) {
        this.gameOver(true); // Victory!
      } else {
        this.wave++;
        this.health = Math.min(100, this.health + 30);
        this.spawnWave();
      }
    }
  }

  updateHUD() {
    const scoreEl = document.getElementById('arcadeScore');
    const ammoEl = document.getElementById('arcadeAmmo');
    const comboEl = document.getElementById('arcadeCombo');

    if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
    if (ammoEl) ammoEl.textContent = `Wave: ${this.wave} / ${this.maxWaves}`;
    if (comboEl) comboEl.textContent = `❤️ ${Math.round(this.health)}% | 🪙 Coins: ${this.coins}`;
  }

  gameOver(isVictory) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const modal = document.getElementById('arcadeGameOverModal');
    const title = document.getElementById('goTitle');
    const score = document.getElementById('goScore');

    if (modal && title && score) {
      if (isVictory) {
        SFX.booyah();
        title.innerHTML = '🏆 CLASH SQUAD CHAMPIONS! 🏆';
        score.innerHTML = `All 10 Waves Defeated! Final Score: <strong>${this.score} Points!</strong>`;
      } else {
        SFX.crash();
        title.innerHTML = '💥 Wave Defense Failed!';
        score.innerHTML = `Reached Wave ${this.wave} | Final Score: <strong>${this.score} Points!</strong>`;
      }
      modal.style.display = 'flex';
    }

    const best = parseInt(localStorage.getItem('chunnu_clash3d_best') || '0', 10);
    if (this.score > best) {
      localStorage.setItem('chunnu_clash3d_best', this.score);
    }
    const highEl = document.getElementById('arcadeHighScore');
    if (highEl) highEl.textContent = Math.max(best, this.score);
  }

  loop(timestamp) {
    if (!this.active) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}
