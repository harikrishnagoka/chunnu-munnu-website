/**
 * Chunnu Munnu 3D Kids Arcade Engine (High-Octane Free Fire 3D Style)
 * 100% Kid-Safe, Spectacular Visuals, Dynamic Lighting & AAA Mobile Feel!
 *
 * Game 3: 💦 Water Splash Battle 3D (Island Battle Royale)
 * Game 4: 🤖 Robot Tag 3D (Clash Squad Arena)
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
    this.cameraPitch = 0.26;
    this.cameraDist = 12;
    this.targetCameraDist = 12;
    this.screenShake = 0;
    this.isDragging = false;
    this.prevPointerX = 0;
    this.prevPointerY = 0;

    // Entities
    this.player = null;
    this.parachute = null;
    this.isParachuting = false;
    this.bots = [];
    this.projectiles = [];
    this.crates = [];
    this.particles = [];
    this.damageNumbers = [];
    this.airdrop = null;
    this.airdropBeacon = null;

    // Safe Zone (Soap Bubble Foam Ring)
    this.stormRadius = 240;
    this.targetStormRadius = 35;
    this.stormMesh = null;
    this.stormRingMesh = null;

    // Stats
    this.score = 0;
    this.splashes = 0;
    this.buddiesLeft = 9;
    this.energy = 100;
    this.shield = 50;
    this.blasterType = 'rapid'; // rapid, triple, rocket
    this.wave = 1;
    this.maxWaves = 10;
    this.stars = 0;
    this.lastShotTime = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.victoryTime = 0;

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
      this.camera = new THREE.PerspectiveCamera(60, 800 / 500, 0.3, 850);

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

    // Mouse / Touch Look & Aim
    const onPointerDown = (clientX, clientY, isTouch = false, isRightSide = false) => {
      if (!this.active) return;
      this.isDragging = true;
      this.prevPointerX = clientX;
      this.prevPointerY = clientY;

      if (this.isParachuting) {
        this.landInstantly();
        return;
      }

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

      this.cameraYaw -= dx * 0.0065;
      this.cameraPitch = Math.max(0.06, Math.min(0.65, this.cameraPitch + dy * 0.005));
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this.toggleScope();
        return;
      }
      onPointerDown(e.clientX, e.clientY, false, false);
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

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
  // Sleek Hero Character Model (Chunnu & Munnu)
  // ==========================================
  createHeroModel(isChunnu) {
    const group = new THREE.Group();

    const mainColor = isChunnu ? 0xfacc15 : 0x0284c7; // Sunshine Yellow vs Sky Blue
    const stripeColor = isChunnu ? 0xffffff : 0x38bdf8;
    const pantsColor = isChunnu ? 0x1e3a8a : 0x0f172a;

    // Head with Skin Tone
    const headGeo = new THREE.SphereGeometry(1.3, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 4.5;
    head.castShadow = true;
    group.add(head);

    // Cool Hero Visor / Goggles on Forehead
    const visorGeo = new THREE.BoxGeometry(1.8, 0.45, 0.9);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 5.2, 0.9);
    group.add(visor);

    // Backward Sporty Cap
    const capGeo = new THREE.SphereGeometry(1.36, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const capMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.6 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 4.75;
    group.add(cap);

    // Cap Backwards Brim
    const brimGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.15, 8, 1, false, Math.PI, Math.PI);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 4.65, -0.6);
    group.add(brim);

    // Big Anime / Cartoon Expressive Eyes
    const eyeGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.45, 4.65, 1.15);
    const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
    lPupil.position.set(-0.45, 4.65, 1.35);
    group.add(lEye, lPupil);

    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.45, 4.65, 1.15);
    const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rPupil.position.set(0.45, 4.65, 1.35);
    group.add(rEye, rPupil);

    // Confident Smile
    const smileGeo = new THREE.TorusGeometry(0.32, 0.07, 6, 8, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.rotation.x = Math.PI;
    smile.position.set(0, 4.15, 1.25);
    group.add(smile);

    // Varsity Jacket Torso with Racing Stripes
    const torsoGeo = new THREE.BoxGeometry(2.5, 2.7, 1.6);
    const jacketMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.5 });
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.y = 2.65;
    torso.castShadow = true;
    group.add(torso);

    const stripeGeo = new THREE.BoxGeometry(0.4, 2.72, 1.62);
    const strMat = new THREE.MeshStandardMaterial({ color: stripeColor });
    const strL = new THREE.Mesh(stripeGeo, strMat);
    strL.position.set(-0.9, 2.65, 0);
    const strR = new THREE.Mesh(stripeGeo, strMat);
    strR.position.set(0.9, 2.65, 0);
    group.add(strL, strR);

    // Shorts
    const shortsGeo = new THREE.BoxGeometry(2.4, 1.2, 1.5);
    const shortsMat = new THREE.MeshStandardMaterial({ color: pantsColor });
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 1.45;
    shorts.castShadow = true;
    group.add(shorts);

    // Left & Right Legs with High-Top Sneakers
    const legGeo = new THREE.CylinderGeometry(0.42, 0.38, 1.6, 8);
    const sneakerGeo = new THREE.BoxGeometry(0.85, 0.55, 1.3);
    const sneakerMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });

    const leftLeg = new THREE.Group();
    const lLegMesh = new THREE.Mesh(legGeo, skinMat);
    lLegMesh.position.y = -0.6;
    lLegMesh.castShadow = true;
    const lShoe = new THREE.Mesh(sneakerGeo, sneakerMat);
    lShoe.position.set(0, -1.3, 0.2);
    lShoe.castShadow = true;
    leftLeg.add(lLegMesh, lShoe);
    leftLeg.position.set(-0.7, 1.3, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Group();
    const rLegMesh = new THREE.Mesh(legGeo, skinMat);
    rLegMesh.position.y = -0.6;
    rLegMesh.castShadow = true;
    const rShoe = new THREE.Mesh(sneakerGeo, sneakerMat);
    rShoe.position.set(0, -1.3, 0.2);
    rShoe.castShadow = true;
    rightLeg.add(rLegMesh, rShoe);
    rightLeg.position.set(0.7, 1.3, 0);
    group.add(rightLeg);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.36, 0.32, 2.1, 8);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-1.5, 2.5, 0.2);
    leftArm.rotation.x = -Math.PI / 4;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(1.5, 2.5, 0.2);
    rightArm.rotation.x = -Math.PI / 4;
    group.add(rightArm);

    // High-Tech Futuristic Energy Water Cannon
    const blaster = new THREE.Group();
    const barrelGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.2, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    blaster.add(barrel);

    // Glowing Neon Energy Rings on Barrel
    const ringGeo = new THREE.TorusGeometry(0.42, 0.08, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const r1 = new THREE.Mesh(ringGeo, ringMat);
    r1.position.z = 0.5;
    const r2 = new THREE.Mesh(ringGeo, ringMat);
    r2.position.z = -0.3;
    blaster.add(r1, r2);

    // Holographic Sight
    const sightGeo = new THREE.RingGeometry(0.2, 0.25, 8);
    const sightMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(0, 0.55, 0.8);
    blaster.add(sight);

    blaster.position.set(1.15, 2.2, 1.3);
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
  // Sleek Futuristic Cyber-Bot Rangers (Enemies)
  // ==========================================
  createCyberBotModel(colorHex, isBoss = false) {
    const group = new THREE.Group();

    // Sleek Metallic Chassis
    const chassisGeo = new THREE.BoxGeometry(2.4, 2.8, 2.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.75,
      roughness: 0.25
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 2.4;
    chassis.castShadow = true;
    group.add(chassis);

    // Glowing Neon LED Visor (Eye Bar)
    const visorGeo = new THREE.BoxGeometry(2.0, 0.45, 0.4);
    const visorMat = new THREE.MeshBasicMaterial({ color: isBoss ? 0xf59e0b : 0xf43f5e });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 3.0, 1.15);
    group.add(visor);

    // Chrome Shoulder Armor Pads
    const padGeo = new THREE.SphereGeometry(0.7, 8, 8);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    const lPad = new THREE.Mesh(padGeo, padMat);
    lPad.position.set(-1.5, 3.2, 0);
    const rPad = new THREE.Mesh(padGeo, padMat);
    rPad.position.set(1.5, 3.2, 0);
    group.add(lPad, rPad);

    // Dual Arm Blasters
    const gunGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.6, 8);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const lGun = new THREE.Mesh(gunGeo, gunMat);
    lGun.rotation.x = Math.PI / 2;
    lGun.position.set(-1.5, 2.2, 0.8);
    const rGun = new THREE.Mesh(gunGeo, gunMat);
    rGun.rotation.x = Math.PI / 2;
    rGun.position.set(1.5, 2.2, 0.8);
    group.add(lGun, rGun);

    // Hover Thruster Rings with Jet Flame
    const thrusterGeo = new THREE.CylinderGeometry(0.6, 0.4, 0.8, 8);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    thruster.position.y = 0.6;
    group.add(thruster);

    const flameGeo = new THREE.ConeGeometry(0.4, 1.2, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.rotation.x = Math.PI;
    flame.position.y = -0.2;
    group.add(flame);

    if (isBoss) group.scale.set(1.9, 1.9, 1.9);

    return { group, flame };
  }

  // ==========================================
  // GAME 3: 💦 Water Splash Battle 3D (Island Royale)
  // ==========================================
  startToyFire(character = 'chunnu') {
    this.mode = 'toyfire';
    this.character = character;
    this.active = true;
    this.isGameOver = false;
    this.isVictory = false;
    this.score = 0;
    this.splashes = 0;
    this.buddiesLeft = 9;
    this.energy = 100;
    this.shield = 50;
    this.blasterType = 'rapid';
    this.stormRadius = 240;
    this.projectiles = [];
    this.particles = [];
    this.crates = [];
    this.bots = [];
    this.damageNumbers = [];

    this.canvas.style.display = 'block';

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'block';

    const compass = document.getElementById('arcadeCompass');
    if (compass) compass.style.display = 'flex';

    const hint = document.getElementById('arcade3DHint');
    if (hint) {
      hint.innerHTML = '🪂 PARACHUTE DROP! <br><span style="font-size:0.8rem;color:#fef08a;">(Tap anywhere to Land Instantly!)</span>';
      hint.style.display = 'block';
    }

    this.buildEpicTropicalIsland();

    // Spawn Player
    const isChunnu = character === 'chunnu';
    const pParts = this.createHeroModel(isChunnu);

    this.player = {
      ...pParts,
      x: 0,
      y: 55, // Parachute altitude
      z: 75,
      speed: 18,
      walkCycle: 0
    };
    this.player.group.position.set(0, 55, 75);
    this.scene.add(this.player.group);

    // Parachute
    this.isParachuting = true;
    this.createParachuteCanopy();

    // Spawn 8 Sleek Cyber-Bot Rangers
    this.spawnCyberBots();

    // Spawn Airdrop Beacon
    this.spawnAirdropBeacon(60, -50);

    this.updateHUD();
    this.startLoop();
  }

  createParachuteCanopy() {
    this.parachute = new THREE.Group();
    const domeGeo = new THREE.SphereGeometry(6.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 8;
    this.parachute.add(dome);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    [[-4.5, 4.5, -4.5], [4.5, 4.5, -4.5], [-4.5, 4.5, 4.5], [4.5, 4.5, 4.5]].forEach(coord => {
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
    this.screenShake = 0.25;

    // Dust shockwave
    this.spawnDustPuff(new THREE.Vector3(this.player.x, 0, this.player.z), 18);

    const hint = document.getElementById('arcade3DHint');
    if (hint) hint.style.display = 'none';
    this.showKillFeed('⚡ Superhero Touchdown! Battle Royale Active!');
  }

  buildEpicTropicalIsland() {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    // Sky & Atmospheric Twilight Lighting
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.0035);

    const hemi = new THREE.HemisphereLight(0xfffae6, 0x1e3a8a, 0.85);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff7d6, 1.1);
    sun.position.set(120, 200, 90);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 450;
    const d = 160;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    this.scene.add(sun);

    // Ocean Water Plane
    const oceanGeo = new THREE.PlaneGeometry(1200, 1200);
    const oceanMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -2;
    this.scene.add(ocean);

    // Lush Island Terrain Cylinder
    const islandGeo = new THREE.CylinderGeometry(255, 268, 6, 48);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.8,
      metalness: 0.1
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -3;
    island.receiveShadow = true;
    this.scene.add(island);

    // Golden Beach Sand
    const sandGeo = new THREE.RingGeometry(250, 272, 48);
    const sandMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.05;
    this.scene.add(sand);

    // Cobblestone Pathways & Temple Plaza
    const plazaGeo = new THREE.CylinderGeometry(30, 30, 0.3, 16);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(0, 0.15, 0);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // 4 High-Ground Stone Watchtowers with Ramps
    const towerGeo = new THREE.CylinderGeometry(6, 7, 10, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    [
      { x: 50, z: 50 },
      { x: -50, z: 50 },
      { x: 50, z: -50 },
      { x: -50, z: -50 }
    ].forEach(t => {
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(t.x, 5, t.z);
      tower.castShadow = true;
      tower.receiveShadow = true;

      // Platform Roof
      const roofGeo = new THREE.CylinderGeometry(8, 8, 0.8, 8);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 5.2;
      tower.add(roof);

      this.scene.add(tower);
    });

    // 35 Palm Trees
    const trunkGeo = new THREE.CylinderGeometry(0.75, 1.15, 7, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const leavesGeo = new THREE.ConeGeometry(4.8, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });

    for (let i = 0; i < 35; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = 32 + Math.random() * 190;
      const tx = Math.cos(a) * dist;
      const tz = Math.sin(a) * dist;

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3.5;
      trunk.castShadow = true;
      const leaves = new THREE.Mesh(leavesGeo, leavesMat);
      leaves.position.y = 8.5;
      leaves.castShadow = true;
      tree.add(trunk, leaves);
      tree.position.set(tx, 0, tz);
      this.scene.add(tree);
    }

    // 16 Neon Glowing Toy Chests (Loot Crates)
    const crateGeo = new THREE.BoxGeometry(3.6, 3.6, 3.6);
    const cColors = [0xf59e0b, 0x06b6d4, 0xec4899, 0x10b981];

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.15;
      const dist = 28 + Math.random() * 165;
      const cx = Math.cos(a) * dist;
      const cz = Math.sin(a) * dist;

      const cMat = new THREE.MeshStandardMaterial({
        color: cColors[i % cColors.length],
        metalness: 0.5,
        roughness: 0.3
      });
      const crate = new THREE.Mesh(crateGeo, cMat);
      crate.position.set(cx, 1.8, cz);
      crate.castShadow = true;
      this.scene.add(crate);

      // Rotating Star Halo on top of crate
      const haloGeo = new THREE.TorusGeometry(1.6, 0.15, 8, 16);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 2.4;
      crate.add(halo);

      const types = ['triple', 'rocket', 'juice', 'shield'];
      this.crates.push({
        mesh: crate,
        x: cx,
        z: cz,
        active: true,
        type: types[i % types.length]
      });
    }

    // Shrinking Safe Zone (Soap Bubble Foam Ring)
    const stormGeo = new THREE.CylinderGeometry(this.stormRadius, this.stormRadius, 90, 48, 1, true);
    const stormMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide
    });
    this.stormMesh = new THREE.Mesh(stormGeo, stormMat);
    this.stormMesh.position.set(0, 45, 0);
    this.scene.add(this.stormMesh);
  }

  // ==========================================
  // Glowing Airdrop Beacon (Like Free Fire Airdrops!)
  // ==========================================
  spawnAirdropBeacon(x, z) {
    const airdropGroup = new THREE.Group();

    // Golden Airdrop Crate
    const dropGeo = new THREE.BoxGeometry(4.5, 4.5, 4.5);
    const dropMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.2
    });
    const box = new THREE.Mesh(dropGeo, dropMat);
    box.position.y = 2.25;
    box.castShadow = true;
    airdropGroup.add(box);

    // Radiant Light Beacon Beam shooting into the clouds
    const beamGeo = new THREE.CylinderGeometry(1.5, 1.5, 300, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 150;
    airdropGroup.add(beam);

    airdropGroup.position.set(x, 0, z);
    this.scene.add(airdropGroup);

    this.airdrop = { mesh: airdropGroup, x, z, active: true };
  }

  spawnCyberBots() {
    this.bots = [];
    const botNames = [
      'Cyber Rex 🦖', 'Turbo Spark ⚡', 'Blaze Bot 🔥', 'Neon Star ⭐',
      'Quantum Teddy 🧸', 'Solar Dash ☀️', 'Pixel Bunny 🐰', 'Vortex Echo 🌀'
    ];
    const bColors = [
      0xec4899, 0x8b5cf6, 0x06b6d4, 0x10b981,
      0xf97316, 0x6366f1, 0x14b8a6, 0xd946ef
    ];

    botNames.forEach((name, i) => {
      const a = (i / botNames.length) * Math.PI * 2 + 0.35;
      const dist = 55 + Math.random() * 130;
      const bx = Math.cos(a) * dist;
      const bz = Math.sin(a) * dist;

      const botParts = this.createCyberBotModel(bColors[i % bColors.length], false);
      botParts.group.position.set(bx, 0, bz);
      this.scene.add(botParts.group);

      this.bots.push({
        name,
        mesh: botParts.group,
        flame: botParts.flame,
        x: bx,
        z: bz,
        energy: 100,
        alive: true,
        rotY: Math.random() * Math.PI * 2,
        shootCooldown: 1.8 + Math.random() * 2,
        hoverAnim: Math.random() * Math.PI * 2
      });
    });
  }

  // ==========================================
  // GAME 4: 🤖 Robot Tag 3D (Clash Squad Arena)
  // ==========================================
  startClashSquad(character = 'chunnu') {
    this.mode = 'clash';
    this.character = character;
    this.active = true;
    this.isGameOver = false;
    this.isVictory = false;
    this.score = 0;
    this.wave = 1;
    this.stars = 0;
    this.energy = 100;
    this.shield = 50;
    this.projectiles = [];
    this.particles = [];
    this.turrets = [];
    this.bots = [];
    this.damageNumbers = [];
    this.isParachuting = false;

    this.canvas.style.display = 'block';

    const crosshair = document.getElementById('arcade3DCrosshair');
    if (crosshair) crosshair.style.display = 'block';

    const compass = document.getElementById('arcadeCompass');
    if (compass) compass.style.display = 'none';

    const hint = document.getElementById('arcade3DHint');
    if (hint) hint.style.display = 'none';

    this.buildNeonCyberArena();

    // Spawn Player
    const isChunnu = character === 'chunnu';
    const pParts = this.createHeroModel(isChunnu);

    this.player = {
      ...pParts,
      x: 0,
      y: 0,
      z: 16,
      speed: 18,
      walkCycle: 0
    };
    this.player.group.position.set(0, 0, 16);
    this.scene.add(this.player.group);

    this.spawnClashWave();
    this.updateHUD();
    this.startLoop();
  }

  buildNeonCyberArena() {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0055);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.7);
    this.scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(50, 90, 50);
    this.scene.add(dirLight);

    // Octagonal Neon Arena Floor
    const floorGeo = new THREE.CylinderGeometry(90, 93, 3, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.6,
      roughness: 0.3
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Glowing Cyan Rings
    const ringGeo = new THREE.RingGeometry(84, 88, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    this.scene.add(ring);

    // Defensive Bunkers
    const barGeo = new THREE.BoxGeometry(11, 4.5, 3.2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    [
      { x: 25, z: 25, r: Math.PI / 4 },
      { x: -25, z: 25, r: -Math.PI / 4 },
      { x: 25, z: -25, r: -Math.PI / 4 },
      { x: -25, z: -25, r: Math.PI / 4 }
    ].forEach(b => {
      const mesh = new THREE.Mesh(barGeo, barMat);
      mesh.position.set(b.x, 2.25, b.z);
      mesh.rotation.y = b.r;
      mesh.castShadow = true;
      this.scene.add(mesh);
    });

    // Central Energy Crystal Beacon
    const crystalGeo = new THREE.OctahedronGeometry(2.8, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      metalness: 0.9,
      roughness: 0.1
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 6.5;
    this.scene.add(crystal);
  }

  spawnClashWave() {
    const count = 4 + this.wave * 2;
    const isBoss = this.wave === 5 || this.wave === 10;

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const dist = 68 + Math.random() * 12;
      const rx = Math.cos(a) * dist;
      const rz = Math.sin(a) * dist;

      const botParts = this.createCyberBotModel(isBoss && i === 0 ? 0xf59e0b : 0xf43f5e, isBoss && i === 0);
      botParts.group.position.set(rx, 0, rz);
      this.scene.add(botParts.group);

      this.bots.push({
        name: isBoss && i === 0 ? '👑 MEGA TITAN BOT' : `Scout Bot #${i + 1}`,
        mesh: botParts.group,
        flame: botParts.flame,
        x: rx,
        z: rz,
        energy: (isBoss && i === 0 ? 280 : 40) + this.wave * 12,
        isBoss: isBoss && i === 0,
        speed: 7 + Math.random() * 3.5,
        alive: true,
        hoverAnim: Math.random() * Math.PI * 2
      });
    }

    SFX.drop();
    this.showKillFeed(`⚡ Wave ${this.wave} Deployed! Tag all Cyber Bots!`);
  }

  // ==========================================
  // High-Energy Blaster & Projectile Shooting
  // ==========================================
  shoot() {
    if (!this.active || this.isGameOver || this.isParachuting) return;

    const now = performance.now();
    const cooldown = this.blasterType === 'triple' ? 300 : 150;
    if (now - this.lastShotTime < cooldown) return;
    this.lastShotTime = now;

    SFX.laser();
    this.screenShake = 0.08;

    const dir = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
    const spawnPos = new THREE.Vector3(this.player.x, 2.3, this.player.z).add(dir.clone().multiplyScalar(2.2));

    // Muzzle flash particle
    this.spawnMuzzleFlash(spawnPos);

    if (this.blasterType === 'triple') {
      for (let i = -1; i <= 1; i++) {
        const sDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.15);
        this.createPlasmaShot(spawnPos, sDir, 75, 0x38bdf8, 25, true);
      }
    } else {
      this.createPlasmaShot(spawnPos, dir, 85, 0x06b6d4, 30, true);
    }
  }

  createPlasmaShot(pos, dir, speed, colorHex, damage, isPlayer) {
    const geo = new THREE.SphereGeometry(0.48, 8, 8);
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
      const isVis = scopeEl.style.display === 'block';
      scopeEl.style.display = isVis ? 'none' : 'block';
      this.targetCameraDist = isVis ? 12 : 4.5;
      this.camera.fov = isVis ? 60 : 28;
      this.camera.updateProjectionMatrix();
      SFX.laser();
    }
  }

  triggerHitMarker() {
    const hm = document.getElementById('arcadeHitMarker');
    if (hm) {
      hm.classList.remove('hit');
      void hm.offsetWidth; // Reflow
      hm.classList.add('hit');
    }
  }

  showFloatingDamage(amount, pos) {
    const layer = document.getElementById('arcadeDamageLayer');
    if (!layer || !this.camera) return;

    // Convert 3D position to screen coordinates
    const p = pos.clone().project(this.camera);
    const x = (p.x * 0.5 + 0.5) * 800;
    const y = (-p.y * 0.5 + 0.5) * 500;

    const el = document.createElement('div');
    el.className = 'damage-pop';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = `-${Math.round(amount)}`;
    layer.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 700);
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
    }, 3200);
  }

  spawnMuzzleFlash(pos) {
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.SphereGeometry(0.25, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6),
        life: 0.15
      });
    }
  }

  spawnDustPuff(pos, count = 8) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.35, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.7 });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(pos.x, 0.3, pos.z);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vel: new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 4 + 1, (Math.random() - 0.5) * 12),
        life: 0.4
      });
    }
  }

  spawnImpactSparkles(pos, colorHex = 0x38bdf8) {
    for (let i = 0; i < 9; i++) {
      const geo = new THREE.SphereGeometry(0.3, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vel: new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 10 + 2, (Math.random() - 0.5) * 12),
        life: 0.45
      });
    }
  }

  // ==========================================
  // Update Loop
  // ==========================================
  update(dt) {
    if (this.isGameOver) {
      if (this.isVictory) {
        // Glorious orbiting camera celebration around Chunnu/Munnu
        this.cameraYaw += dt * 0.8;
        this.victoryTime += dt;
        if (Math.random() < 0.1) {
          this.spawnImpactSparkles(new THREE.Vector3(
            this.player.x + (Math.random() - 0.5) * 20,
            12 + Math.random() * 10,
            this.player.z + (Math.random() - 0.5) * 20
          ), 0xfacc15);
        }
      }
      return;
    }

    // 1. Parachute descent
    if (this.isParachuting) {
      this.player.y -= 14 * dt;
      if (this.player.y <= 0) this.landInstantly();
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

      // Restrict
      const maxDist = this.mode === 'toyfire' ? 250 : 82;
      const d = Math.hypot(this.player.x, this.player.z);
      if (d > maxDist) {
        this.player.x = (this.player.x / d) * maxDist;
        this.player.z = (this.player.z / d) * maxDist;
      }

      // Footstep dust
      this.player.walkCycle += dt * 14;
      this.player.leftLeg.rotation.x = Math.sin(this.player.walkCycle) * 0.65;
      this.player.rightLeg.rotation.x = -Math.sin(this.player.walkCycle) * 0.65;

      if (Math.sin(this.player.walkCycle) > 0.8 && !this.isParachuting) {
        this.spawnDustPuff(new THREE.Vector3(this.player.x, 0, this.player.z), 2);
      }
    } else {
      this.player.leftLeg.rotation.x = 0;
      this.player.rightLeg.rotation.x = 0;
    }

    this.player.group.position.set(this.player.x, this.player.y, this.player.z);
    this.player.group.rotation.y = this.cameraYaw + Math.PI;

    // 3. Storm in ToyFire
    if (this.mode === 'toyfire') {
      if (this.stormRadius > this.targetStormRadius) {
        this.stormRadius = Math.max(this.targetStormRadius, this.stormRadius - dt * 3.4);
        this.stormMesh.scale.set(this.stormRadius / 240, 1, this.stormRadius / 240);
      }
      const dStorm = Math.hypot(this.player.x, this.player.z);
      if (dStorm > this.stormRadius && !this.isParachuting) {
        this.energy -= dt * 5.5;
        this.screenShake = 0.12;
        SFX.hit();
        if (this.energy <= 0) this.triggerGameOver(false);
      }

      // Loot Crate pickups
      this.crates.forEach(c => {
        if (!c.active) return;
        const dc = Math.hypot(this.player.x - c.x, this.player.z - c.z);
        if (dc < 4.2) {
          c.active = false;
          c.mesh.visible = false;
          SFX.powerup();

          if (c.type === 'triple') {
            this.blasterType = 'triple';
            this.showKillFeed('⚡ UNLOCKED TRIPLE ENERGY CANNON!');
          } else if (c.type === 'juice') {
            this.energy = Math.min(100, this.energy + 45);
            this.showKillFeed('🧃 DRANK MANGO JUICE (+45 HP)!');
          } else {
            this.shield = Math.min(100, this.shield + 45);
            this.showKillFeed('🛡️ ARMOR SHIELD ACTIVATED (+45)!');
          }
        }
      });

      // Airdrop Crate pickup
      if (this.airdrop && this.airdrop.active) {
        const da = Math.hypot(this.player.x - this.airdrop.x, this.player.z - this.airdrop.z);
        if (da < 5) {
          this.airdrop.active = false;
          this.airdrop.mesh.visible = false;
          this.blasterType = 'triple';
          this.energy = 100;
          this.shield = 100;
          SFX.bullseye();
          this.showKillFeed('🔥 AIRDROP CLAIMED! MAX ARMOR & TRIPLE BLASTER!');
        }
      }
    }

    // 4. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.pos.add(p.vel.clone().multiplyScalar(dt));
      p.life -= dt;

      if (p.life <= 0 || p.pos.y <= 0.4) {
        this.spawnImpactSparkles(p.pos);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit Bots
      if (p.isPlayer) {
        let hit = false;
        for (let b of this.bots) {
          if (!b.alive) continue;
          const db = Math.hypot(p.pos.x - b.x, p.pos.z - b.z);
          if (db < (b.isBoss ? 4.5 : 2.6)) {
            hit = true;
            b.energy -= p.damage;
            SFX.pop();
            this.triggerHitMarker();
            this.showFloatingDamage(p.damage, p.pos);
            this.spawnImpactSparkles(p.pos, 0xfacc15);

            if (b.energy <= 0) {
              b.alive = false;
              b.mesh.visible = false;
              if (this.mode === 'toyfire') {
                this.splashes++;
                this.score += 150;
                this.buddiesLeft--;
                this.showKillFeed(`💥 ${this.character === 'chunnu' ? 'Chunnu' : 'Munnu'} splashed ${b.name}!`);
                if (this.buddiesLeft <= 1) this.triggerGameOver(true);
              } else {
                this.stars += b.isBoss ? 60 : 15;
                this.score += b.isBoss ? 350 : 85;
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
        b.hoverAnim += dt * 8;
        if (b.flame) b.flame.scale.y = 0.8 + Math.sin(b.hoverAnim) * 0.4;

        const dCenter = Math.hypot(b.x, b.z);
        if (dCenter > this.stormRadius) {
          b.energy -= dt * 6.5;
          if (b.energy <= 0) {
            b.alive = false;
            b.mesh.visible = false;
            this.buddiesLeft--;
            this.showKillFeed(`🌊 Bubble Tide tagged ${b.name}!`);
            if (this.buddiesLeft <= 1) this.triggerGameOver(true);
            return;
          }
        }

        if (dCenter > this.stormRadius * 0.8) {
          const a = Math.atan2(-b.z, -b.x);
          b.x += Math.cos(a) * 11 * dt;
          b.z += Math.sin(a) * 11 * dt;
        } else {
          b.x += Math.sin(b.rotY) * 6.5 * dt;
          b.z += Math.cos(b.rotY) * 6.5 * dt;
          if (Math.random() < 0.02) b.rotY += (Math.random() - 0.5) * 2;
        }

        b.mesh.position.set(b.x, 0.3 + Math.sin(b.hoverAnim) * 0.2, b.z);
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

        b.hoverAnim += dt * 8;
        if (b.flame) b.flame.scale.y = 0.8 + Math.sin(b.hoverAnim) * 0.4;

        const a = Math.atan2(this.player.z - b.z, this.player.x - b.x);
        b.x += Math.cos(a) * b.speed * dt;
        b.z += Math.sin(a) * b.speed * dt;
        b.mesh.position.set(b.x, 0.4 + Math.sin(b.hoverAnim) * 0.2, b.z);
        b.mesh.rotation.y = -a + Math.PI / 2;

        const dp = Math.hypot(b.x - this.player.x, b.z - this.player.z);
        if (dp < 3) {
          this.energy -= dt * (b.isBoss ? 30 : 15);
          this.screenShake = 0.15;
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
          this.spawnClashWave();
        }
      }
    }

    // 6. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
      p.vel.y -= 18 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 7. Smooth Dynamic Camera with Screen Shake
    this.cameraDist += (this.targetCameraDist - this.cameraDist) * 0.1;
    const target = new THREE.Vector3(this.player.x, this.player.y + 2.4, this.player.z);
    const offset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist,
      Math.sin(this.cameraPitch) * this.cameraDist,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDist
    );

    if (this.screenShake > 0) {
      offset.x += (Math.random() - 0.5) * this.screenShake;
      offset.y += (Math.random() - 0.5) * this.screenShake;
      this.screenShake = Math.max(0, this.screenShake - dt * 1.5);
    }

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
      if (ammoEl) ammoEl.textContent = `🏆 ${this.buddiesLeft} / 9 Alive`;
      if (comboEl) comboEl.textContent = `❤️ ${Math.round(this.energy)}% | 🛡️ ${Math.round(this.shield)}% | 🔫 ${this.blasterType.toUpperCase()}`;
    } else {
      if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
      if (ammoEl) ammoEl.textContent = `Wave: ${this.wave} / ${this.maxWaves}`;
      if (comboEl) comboEl.textContent = `❤️ ${Math.round(this.energy)}% | ⭐ Stars: ${this.stars}`;
    }
  }

  triggerGameOver(isVictory) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isVictory = isVictory;

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
        title.innerHTML = '🌊 Good Try, Champion!';
        score.innerHTML = `Great effort! Final Score: <strong>${this.score} Points</strong>. Tap below to jump right back in!`;
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

    const compass = document.getElementById('arcadeCompass');
    if (compass) compass.style.display = 'none';

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

window.Chunnu3DManager = Chunnu3DManager;
