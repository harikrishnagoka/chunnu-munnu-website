/**
 * Chunnu Munnu Kids Arcade Game Engine
 * 1. Chunnu's Target Archer 🎯🏹 (Physics trajectory bow & arrow shooting)
 * 2. Munnu's Toylandia Rush 🏃‍♂️💨 (Temple Run / Subway Surfers style 3-lane endless runner)
 * Zero external dependencies — pure HTML5 Canvas & Web Audio API sound synthesizer.
 */

// ==========================================
// 1. Web Audio API Sound Synthesizer
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, startVol = 0.2, endVol = 0.01) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(endVol, 0.0001), this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  shoot() {
    if (this.muted) return;
    this.init();
    try {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {}
  }

  pop() {
    this.playTone(620, 'sine', 0.12, 0.35);
  }

  bullseye() {
    if (this.muted) return;
    this.init();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.18, 0.3), i * 70);
    });
  }

  coin() {
    if (this.muted) return;
    this.init();
    this.playTone(987.77, 'sine', 0.08, 0.25);
    setTimeout(() => this.playTone(1318.51, 'sine', 0.14, 0.25), 80);
  }

  jump() {
    if (this.muted) return;
    this.init();
    try {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  slide() {
    this.playTone(180, 'triangle', 0.18, 0.2);
  }

  powerup() {
    if (this.muted) return;
    this.init();
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.28), i * 60);
    });
  }

  crash() {
    if (this.muted) return;
    this.init();
    try {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }
}

const SFX = new SoundEngine();

// ==========================================
// 2. GAME 1: Chunnu's Target Archer 🎯🏹
// ==========================================
class ArcherGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.active = false;
    this.character = 'chunnu';

    this.width = 800;
    this.height = 500;

    this.bowPos = { x: 95, y: 310 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragCurrent = { x: 0, y: 0 };
    this.pullAngle = 0;
    this.pullPower = 0;

    this.arrows = [];
    this.balloons = [];
    this.particles = [];
    this.clouds = [
      { x: 100, y: 80, s: 1.2, spd: 0.2 },
      { x: 450, y: 60, s: 0.9, spd: 0.15 },
      { x: 680, y: 110, s: 1.1, spd: 0.25 }
    ];

    this.target = {
      x: 720,
      y: 220,
      w: 24,
      h: 90,
      vy: 2.2,
      minY: 100,
      maxY: 390
    };

    this.score = 0;
    this.arrowsLeft = 18;
    this.combo = 0;
    this.gameOver = false;
    this.lastTime = 0;
    this.spawnTimer = 0;

    this.bindEvents();
  }

  start(character = 'chunnu') {
    this.character = character;
    this.active = true;
    this.score = 0;
    this.arrowsLeft = 18;
    this.combo = 0;
    this.gameOver = false;
    this.arrows = [];
    this.balloons = [];
    this.particles = [];
    this.spawnBalloons(4);
    this.updateHUD();
    this.lastTime = performance.now();
    SFX.init();
    this.loop(this.lastTime);
  }

  stop() {
    this.active = false;
  }

  spawnBalloons(count = 1) {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < count; i++) {
      this.balloons.push({
        x: 350 + Math.random() * 320,
        y: this.height + 40 + Math.random() * 80,
        r: 18 + Math.random() * 10,
        vy: 1.4 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        isStar: Math.random() < 0.25,
        popped: false
      });
    }
  }

  bindEvents() {
    const getPos = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const scaleX = this.width / r.width;
      const scaleY = this.height / r.height;
      if (e.touches && e.touches[0]) {
        return {
          x: (e.touches[0].clientX - r.left) * scaleX,
          y: (e.touches[0].clientY - r.top) * scaleY
        };
      }
      return {
        x: (e.clientX - r.left) * scaleX,
        y: (e.clientY - r.top) * scaleY
      };
    };

    const onDown = (e) => {
      if (!this.active || this.gameOver || this.arrowsLeft <= 0) return;
      const pos = getPos(e);
      const d = Math.hypot(pos.x - this.bowPos.x, pos.y - this.bowPos.y);
      if (d < 120 || pos.x < 240) {
        this.isDragging = true;
        this.dragStart = { x: this.bowPos.x, y: this.bowPos.y };
        this.dragCurrent = pos;
        SFX.init();
      }
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      this.dragCurrent = getPos(e);
      const dx = this.bowPos.x - this.dragCurrent.x;
      const dy = this.bowPos.y - this.dragCurrent.y;
      this.pullAngle = Math.atan2(-dy, -dx);
      this.pullPower = Math.min(Math.hypot(dx, dy) * 0.28, 26);
    };

    const onUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this.pullPower > 4) {
        this.fireArrow();
      }
    };

    this.canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    this.canvas.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
  }

  fireArrow() {
    const speed = this.pullPower * 1.35;
    this.arrows.push({
      x: this.bowPos.x,
      y: this.bowPos.y,
      vx: Math.cos(this.pullAngle) * speed,
      vy: Math.sin(this.pullAngle) * speed,
      angle: this.pullAngle,
      active: true,
      trail: []
    });
    this.arrowsLeft--;
    SFX.shoot();
    this.updateHUD();
  }

  createConfetti(x, y, color) {
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.7) * 9,
        r: 3 + Math.random() * 4,
        color: color || '#facc15',
        alpha: 1
      });
    }
  }

  update(dt) {
    if (this.gameOver) return;

    this.clouds.forEach(c => {
      c.x += c.spd;
      if (c.x > this.width + 100) c.x = -120;
    });

    this.target.y += this.target.vy;
    if (this.target.y < this.target.minY || this.target.y > this.target.maxY) {
      this.target.vy *= -1;
    }

    this.spawnTimer += dt;
    if (this.spawnTimer > 1.7 && this.balloons.length < 9) {
      this.spawnBalloons(1);
      this.spawnTimer = 0;
    }

    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      b.y -= b.vy;
      b.x += Math.sin(b.y * 0.04) * 0.6;
      if (b.y < -50 || b.popped) {
        this.balloons.splice(i, 1);
      }
    }

    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      if (!a.active) continue;

      a.trail.push({ x: a.x, y: a.y });
      if (a.trail.length > 8) a.trail.shift();

      a.x += a.vx;
      a.y += a.vy;
      a.vy += 0.38;
      a.angle = Math.atan2(a.vy, a.vx);

      if (
        a.x >= this.target.x - 10 &&
        a.x <= this.target.x + this.target.w &&
        a.y >= this.target.y &&
        a.y <= this.target.y + this.target.h
      ) {
        a.active = false;
        const distFromCenter = Math.abs(a.y - (this.target.y + this.target.h / 2));
        let pts = 30;
        if (distFromCenter < 14) {
          pts = 100;
          SFX.bullseye();
          this.createConfetti(a.x, a.y, '#f59e0b');
        } else {
          pts = 50;
          SFX.pop();
          this.createConfetti(a.x, a.y, '#3b82f6');
        }
        this.combo++;
        this.score += pts * Math.min(this.combo, 4);
        this.updateHUD();
        continue;
      }

      for (let j = 0; j < this.balloons.length; j++) {
        const b = this.balloons[j];
        if (b.popped) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < b.r + 8) {
          b.popped = true;
          a.active = false;
          const pts = b.isStar ? 60 : 25;
          this.combo++;
          this.score += pts * Math.min(this.combo, 4);
          this.createConfetti(b.x, b.y, b.color);
          if (b.isStar) SFX.bullseye();
          else SFX.pop();
          this.updateHUD();
          break;
        }
      }

      if (a.x > this.width + 40 || a.y > this.height + 40) {
        a.active = false;
        this.combo = 0;
        this.updateHUD();
      }
    }

    this.arrows = this.arrows.filter(a => a.active || a.trail.length > 0);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.alpha -= 0.022;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.arrowsLeft <= 0 && this.arrows.length === 0 && !this.gameOver) {
      this.gameOver = true;
      this.saveHighScore();
      this.showGameOverModal();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, '#7dd3fc');
    sky.addColorStop(0.65, '#bae6fd');
    sky.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#a7f3d0';
    ctx.beginPath();
    ctx.arc(200, 580, 320, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.arc(600, 600, 360, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#34d399';
    ctx.fillRect(0, 420, this.width, 80);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 420, this.width, 10);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 24 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 20 * c.s, c.y - 8 * c.s, 28 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 45 * c.s, c.y, 22 * c.s, 0, Math.PI * 2);
      ctx.fill();
    });

    this.balloons.forEach(b => {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r, b.r * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.3, b.r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.r * 1.25);
      ctx.quadraticCurveTo(b.x + 6, b.y + b.r * 1.25 + 15, b.x, b.y + b.r * 1.25 + 30);
      ctx.stroke();

      if (b.isStar) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', b.x, b.y + 6);
      }
      ctx.restore();
    });

    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(this.target.x + 8, this.target.y + this.target.h, 8, this.height - (this.target.y + this.target.h));

    const tx = this.target.x;
    const ty = this.target.y;
    const th = this.target.h;
    const tw = this.target.w;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(tx, ty + 12, tw, th - 24);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(tx, ty + 24, tw, th - 48);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(tx, ty + 36, tw, th - 72);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, ty, tw, th);
    ctx.restore();

    this.drawCharacter(this.bowPos.x - 35, this.bowPos.y + 20);

    ctx.save();
    ctx.translate(this.bowPos.x, this.bowPos.y);

    if (this.isDragging) {
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      let simX = 0;
      let simY = 0;
      let simVx = Math.cos(this.pullAngle) * this.pullPower * 1.35;
      let simVy = Math.sin(this.pullAngle) * this.pullPower * 1.35;
      ctx.moveTo(simX, simY);
      for (let s = 0; s < 25; s++) {
        simX += simVx;
        simY += simVy;
        simVy += 0.38;
        ctx.lineTo(simX, simY);
      }
      ctx.stroke();
      ctx.restore();

      ctx.rotate(this.pullAngle);
    } else {
      ctx.rotate(-0.2);
    }

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 36, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.isDragging) {
      ctx.moveTo(18, -31);
      ctx.lineTo(-this.pullPower * 0.9, 0);
      ctx.lineTo(18, 31);
    } else {
      ctx.moveTo(18, -31);
      ctx.lineTo(18, 31);
    }
    ctx.stroke();

    if (this.arrowsLeft > 0) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const nockX = this.isDragging ? -this.pullPower * 0.9 : 18;
      ctx.moveTo(nockX, 0);
      ctx.lineTo(nockX + 50, 0);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(nockX + 50, -4);
      ctx.lineTo(nockX + 60, 0);
      ctx.lineTo(nockX + 50, 4);
      ctx.fill();
    }
    ctx.restore();

    this.arrows.forEach(a => {
      ctx.save();
      if (a.trail.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.trail[0].x, a.trail[0].y);
        for (let t = 1; t < a.trail.length; t++) {
          ctx.lineTo(a.trail[t].x, a.trail[t].y);
        }
        ctx.stroke();
      }

      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-25, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(15, -4);
      ctx.lineTo(26, 0);
      ctx.lineTo(15, 4);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-26, -3, 6, 6);
      ctx.restore();
    });

    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (this.arrowsLeft > 0 && !this.isDragging && this.arrows.length === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.font = 'bold 15px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏹 Drag back the bow and aim at the balloons & target board!', 400, 35);
      ctx.restore();
    }
  }

  drawCharacter(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    const isChunnu = this.character === 'chunnu';
    const shirtColor = isChunnu ? '#eab308' : '#3b82f6';

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-12, 55, 14, 8);
    ctx.fillRect(6, 55, 14, 8);

    ctx.fillStyle = isChunnu ? '#fde047' : '#1e3a8a';
    ctx.fillRect(-10, 36, 10, 20);
    ctx.fillRect(8, 36, 10, 20);

    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.roundRect(-16, 6, 40, 34, [6]);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(4, -8, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(4, -14, 18, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(9, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(7, -4, 5, 0.2, Math.PI * 0.8);
    ctx.stroke();

    ctx.restore();
  }

  updateHUD() {
    const scoreEl = document.getElementById('arcadeScore');
    const ammoEl = document.getElementById('arcadeAmmo');
    const comboEl = document.getElementById('arcadeCombo');
    if (scoreEl) scoreEl.textContent = this.score;
    if (ammoEl) ammoEl.textContent = this.arrowsLeft;
    if (comboEl) {
      comboEl.textContent = this.combo > 1 ? `${this.combo}x Streak! 🔥` : '';
    }
  }

  saveHighScore() {
    const best = parseInt(localStorage.getItem('chunnu_archer_best') || '0', 10);
    if (this.score > best) {
      localStorage.setItem('chunnu_archer_best', this.score);
    }
    const highEl = document.getElementById('arcadeHighScore');
    if (highEl) highEl.textContent = Math.max(best, this.score);
  }

  showGameOverModal() {
    const modal = document.getElementById('arcadeGameOverModal');
    const title = document.getElementById('goTitle');
    const score = document.getElementById('goScore');
    if (modal && title && score) {
      title.textContent = '🎯 Fantastic Shooting!';
      score.textContent = `Your Final Score: ${this.score} Points!`;
      modal.style.display = 'flex';
      SFX.bullseye();
    }
  }

  loop(timestamp) {
    if (!this.active) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// ==========================================
// 3. GAME 2: Munnu's Toylandia Rush 🏃‍♂️💨
// ==========================================
class RunnerGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.active = false;
    this.character = 'munnu';

    this.width = 800;
    this.height = 500;

    this.lanes = [-160, 0, 160];
    this.currentLane = 1;
    this.playerX = 0;
    this.targetX = 0;

    this.playerY = 0;
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;

    this.speed = 1.0;
    this.distance = 0;
    this.coinsCollected = 0;
    this.score = 0;
    this.gameOver = false;
    this.lastTime = 0;

    this.hasMagnet = false;
    this.magnetTimer = 0;
    this.hasShield = false;
    this.hasRocket = false;
    this.rocketTimer = 0;

    this.items = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.trackOffset = 0;

    this.bindEvents();
  }

  start(character = 'munnu') {
    this.character = character;
    this.active = true;
    this.currentLane = 1;
    this.playerX = 0;
    this.targetX = 0;
    this.playerY = 0;
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.speed = 1.0;
    this.distance = 0;
    this.coinsCollected = 0;
    this.score = 0;
    this.gameOver = false;
    this.hasMagnet = false;
    this.hasShield = false;
    this.hasRocket = false;
    this.items = [];
    this.particles = [];
    this.updateHUD();
    this.lastTime = performance.now();
    SFX.init();
    this.loop(this.lastTime);
  }

  stop() {
    this.active = false;
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.active || this.gameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.moveLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.moveLane(1);
      } else if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        this.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.slide();
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (!e.touches[0]) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      SFX.init();
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.active || this.gameOver || !e.changedTouches[0]) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) < 20) {
        this.jump();
        return;
      }

      if (absX > absY) {
        if (dx > 0) this.moveLane(1);
        else this.moveLane(-1);
      } else {
        if (dy > 0) this.slide();
        else this.jump();
      }
    });
  }

  moveLane(dir) {
    const next = this.currentLane + dir;
    if (next >= 0 && next <= 2) {
      this.currentLane = next;
      this.targetX = this.lanes[this.currentLane];
      SFX.playTone(320 + dir * 60, 'sine', 0.08, 0.15);
    }
  }

  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.vy = -14;
      this.isSliding = false;
      SFX.jump();
    }
  }

  slide() {
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = 0.55;
      SFX.slide();
    }
  }

  spawnItems() {
    const lane = Math.floor(Math.random() * 3);
    const rand = Math.random();

    if (rand < 0.45) {
      for (let c = 0; c < 3; c++) {
        this.items.push({
          type: 'coin',
          lane: lane,
          z: 1000 + c * 80,
          collected: false
        });
      }
    } else if (rand < 0.75) {
      this.items.push({
        type: 'hurdle',
        lane: lane,
        z: 1050
      });
    } else if (rand < 0.90) {
      this.items.push({
        type: 'barrier',
        lane: lane,
        z: 1050
      });
    } else {
      const pTypes = ['magnet', 'shield', 'rocket'];
      this.items.push({
        type: pTypes[Math.floor(Math.random() * pTypes.length)],
        lane: lane,
        z: 1050
      });
    }
  }

  update(dt) {
    if (this.gameOver) return;

    this.speed += dt * 0.025;
    const runSpeed = 480 * this.speed;
    this.distance += runSpeed * dt * 0.05;
    this.score = Math.floor(this.distance) + this.coinsCollected * 15;
    this.trackOffset = (this.trackOffset + runSpeed * dt) % 120;

    this.playerX += (this.targetX - this.playerX) * 0.22;

    if (this.isJumping) {
      this.playerY += this.vy;
      this.vy += 32 * dt * 30;
      if (this.playerY >= 0) {
        this.playerY = 0;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    if (this.hasMagnet) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) this.hasMagnet = false;
    }
    if (this.hasRocket) {
      this.rocketTimer -= dt;
      if (this.rocketTimer <= 0) this.hasRocket = false;
    }

    this.spawnTimer += dt * this.speed;
    if (this.spawnTimer > 1.1) {
      this.spawnItems();
      this.spawnTimer = 0;
    }

    const playerZ = 120;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.z -= runSpeed * dt;

      if (this.hasMagnet && it.type === 'coin' && it.z < 600 && it.z > playerZ) {
        const targetX = this.lanes[this.currentLane];
        it.laneX = (it.laneX || this.lanes[it.lane]);
        it.laneX += (targetX - it.laneX) * 0.2;
      }

      if (it.z >= playerZ - 35 && it.z <= playerZ + 35) {
        const itemLaneX = it.laneX !== undefined ? it.laneX : this.lanes[it.lane];
        const laneDiff = Math.abs(this.playerX - itemLaneX);

        if (laneDiff < 55) {
          if (it.type === 'coin' && !it.collected) {
            it.collected = true;
            this.coinsCollected++;
            SFX.coin();
            this.createSparks(this.width / 2 + this.playerX, 360, '#facc15');
            this.items.splice(i, 1);
            continue;
          } else if (it.type === 'magnet') {
            this.hasMagnet = true;
            this.magnetTimer = 8.0;
            SFX.powerup();
            this.items.splice(i, 1);
            continue;
          } else if (it.type === 'shield') {
            this.hasShield = true;
            SFX.powerup();
            this.items.splice(i, 1);
            continue;
          } else if (it.type === 'rocket') {
            this.hasRocket = true;
            this.rocketTimer = 5.0;
            SFX.powerup();
            this.items.splice(i, 1);
            continue;
          } else if (it.type === 'hurdle') {
            if (!this.hasRocket && this.playerY > -35) {
              if (this.hasShield) {
                this.hasShield = false;
                SFX.crash();
                this.createSparks(this.width / 2 + this.playerX, 360, '#38bdf8');
                this.items.splice(i, 1);
                continue;
              } else {
                this.triggerGameOver();
                return;
              }
            }
          } else if (it.type === 'barrier') {
            if (!this.hasRocket && !this.isSliding) {
              if (this.hasShield) {
                this.hasShield = false;
                SFX.crash();
                this.createSparks(this.width / 2 + this.playerX, 360, '#38bdf8');
                this.items.splice(i, 1);
                continue;
              } else {
                this.triggerGameOver();
                return;
              }
            }
          }
        }
      }

      if (it.z < 20) {
        this.items.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    this.updateHUD();
  }

  createSparks(x, y, color) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        r: 3 + Math.random() * 3,
        color: color || '#facc15',
        alpha: 1
      });
    }
  }

  triggerGameOver() {
    this.gameOver = true;
    SFX.crash();
    this.saveHighScore();
    this.showGameOverModal();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#38bdf8');
    sky.addColorStop(1, '#fed7aa');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, 260);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(120, 90, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.fillRect(280, 180, 50, 80);
    ctx.fillStyle = '#a78bfa';
    ctx.fillRect(440, 160, 60, 100);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(360, 190, 40, 70);

    const vX = this.width / 2;
    const vY = 240;

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, vY, this.width, this.height - vY);

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(vX - 100, vY);
    ctx.lineTo(vX + 100, vY);
    ctx.lineTo(vX + 380, this.height);
    ctx.lineTo(vX - 380, this.height);
    ctx.fill();

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(vX - 33, vY);
    ctx.lineTo(vX - 125, this.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vX + 33, vY);
    ctx.lineTo(vX + 125, this.height);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let d = 0; d < 7; d++) {
      const tieZ = (d * 80 + this.trackOffset) % 560;
      const progress = tieZ / 560;
      const tieY = vY + progress * (this.height - vY);
      const tieW = 200 + progress * 560;
      ctx.fillStyle = progress % 2 < 1 ? 'rgba(234, 88, 12, 0.15)' : 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(vX - tieW / 2, tieY, tieW, 5 + progress * 4);
    }

    const sortedItems = [...this.items].sort((a, b) => b.z - a.z);

    sortedItems.forEach(it => {
      const t = 1 - (it.z - 20) / 1000;
      if (t < 0 || t > 1) return;

      const screenY = vY + t * (this.height - vY);
      const laneSpread = 60 + t * 240;
      const laneIndex = it.lane - 1;
      const screenX = vX + (it.laneX !== undefined ? (it.laneX / 160) * laneSpread : laneIndex * laneSpread);
      const scale = 0.3 + t * 0.85;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.scale(scale, scale);

      if (it.type === 'coin') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, -25, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -25, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', 0, -21);
      } else if (it.type === 'hurdle') {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-35, -28, 70, 24);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-32, -25, 64, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('JUMP! ⬆', 0, -12);
      } else if (it.type === 'barrier') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-45, -70, 90, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-42, -67, 84, 16);
        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SLIDE! ⬇', 0, -55);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-44, -70, 6, 68);
        ctx.fillRect(38, -70, 6, 68);
      } else if (it.type === 'magnet') {
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧲', 0, -20);
      } else if (it.type === 'shield') {
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️', 0, -20);
      } else if (it.type === 'rocket') {
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚀', 0, -20);
      }
      ctx.restore();
    });

    const pScreenX = vX + this.playerX * 1.5;
    const pScreenY = 415 + this.playerY;
    this.drawRunnerCharacter(pScreenX, pScreenY);

    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawRunnerCharacter(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    if (this.hasShield) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -25, 42, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.hasRocket) {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-15, 25);
      ctx.lineTo(0, 48 + Math.random() * 12);
      ctx.lineTo(15, 25);
      ctx.fill();
    }

    const isChunnu = this.character === 'chunnu';
    const shirtColor = isChunnu ? '#eab308' : '#3b82f6';
    const isSliding = this.isSliding;

    if (isSliding) {
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.roundRect(-24, -12, 48, 22, [8]);
      ctx.fill();

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(22, -6, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(-28, 6, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const step = Math.sin(this.distance * 0.4) * 8;

      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-14, 18 + step, 12, 8);
      ctx.fillRect(4, 18 - step, 12, 8);

      ctx.fillStyle = isChunnu ? '#fde047' : '#1e3a8a';
      ctx.fillRect(-12, 4, 10, 16 + step);
      ctx.fillRect(4, 4, 10, 16 - step);

      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.roundRect(-18, -32, 38, 38, [8]);
      ctx.fill();

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(1, -48, 17, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(1, -54, 17, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6, -48, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(4, -44, 4, 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  updateHUD() {
    const scoreEl = document.getElementById('arcadeScore');
    const ammoEl = document.getElementById('arcadeAmmo');
    const comboEl = document.getElementById('arcadeCombo');
    if (scoreEl) scoreEl.textContent = this.score;
    if (ammoEl) ammoEl.textContent = `${this.coinsCollected} 🪙`;
    if (comboEl) {
      let status = '';
      if (this.hasRocket) status += '🚀 ROCKET! ';
      if (this.hasShield) status += '🛡️ SHIELD ';
      if (this.hasMagnet) status += '🧲 MAGNET';
      comboEl.textContent = status;
    }
  }

  saveHighScore() {
    const best = parseInt(localStorage.getItem('munnu_rush_best') || '0', 10);
    if (this.score > best) {
      localStorage.setItem('munnu_rush_best', this.score);
    }
    const highEl = document.getElementById('arcadeHighScore');
    if (highEl) highEl.textContent = Math.max(best, this.score);
  }

  showGameOverModal() {
    const modal = document.getElementById('arcadeGameOverModal');
    const title = document.getElementById('goTitle');
    const score = document.getElementById('goScore');
    if (modal && title && score) {
      title.textContent = '🏃‍♂️ Great Run!';
      score.textContent = `Distance & Coins: ${this.score} Points!`;
      modal.style.display = 'flex';
    }
  }

  loop(timestamp) {
    if (!this.active) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// ==========================================
// 4. Unified Kids Arcade Hub Controller
// ==========================================
class ArcadeHub {
  constructor() {
    this.canvas = document.getElementById('arcadeCanvas');
    if (!this.canvas) return;

    this.archer = new ArcherGame(this.canvas);
    this.runner = new RunnerGame(this.canvas);
    this.currentGame = 'archer';
    this.currentCharacter = 'chunnu';

    this.initUI();
  }

  initUI() {
    const archerTab = document.getElementById('tabArcher');
    const runnerTab = document.getElementById('tabRunner');

    if (archerTab) {
      archerTab.addEventListener('click', () => this.switchGame('archer'));
    }
    if (runnerTab) {
      runnerTab.addEventListener('click', () => this.switchGame('runner'));
    }

    const charChunnu = document.getElementById('btnCharChunnu');
    const charMunnu = document.getElementById('btnCharMunnu');

    if (charChunnu) {
      charChunnu.addEventListener('click', () => this.selectCharacter('chunnu'));
    }
    if (charMunnu) {
      charMunnu.addEventListener('click', () => this.selectCharacter('munnu'));
    }

    const restartBtn = document.getElementById('arcadeRestartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }

    const goRetryBtn = document.getElementById('goRetryBtn');
    if (goRetryBtn) {
      goRetryBtn.addEventListener('click', () => {
        const modal = document.getElementById('arcadeGameOverModal');
        if (modal) modal.style.display = 'none';
        this.restart();
      });
    }

    const soundBtn = document.getElementById('arcadeSoundToggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        SFX.muted = !SFX.muted;
        soundBtn.textContent = SFX.muted ? '🔇 Sound OFF' : '🔊 Sound ON';
      });
    }

    const fsBtn = document.getElementById('arcadeFullscreenBtn');
    const arcadeBox = document.querySelector('.arcade-cabinet');
    if (fsBtn && arcadeBox) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          arcadeBox.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    const btnLeft = document.getElementById('mBtnLeft');
    const btnRight = document.getElementById('mBtnRight');
    const btnJump = document.getElementById('mBtnJump');
    const btnSlide = document.getElementById('mBtnSlide');

    if (btnLeft) btnLeft.addEventListener('click', () => this.runner.moveLane(-1));
    if (btnRight) btnRight.addEventListener('click', () => this.runner.moveLane(1));
    if (btnJump) btnJump.addEventListener('click', () => this.runner.jump());
    if (btnSlide) btnSlide.addEventListener('click', () => this.runner.slide());

    this.switchGame('archer');
  }

  selectCharacter(char) {
    this.currentCharacter = char;
    const btnC = document.getElementById('btnCharChunnu');
    const btnM = document.getElementById('btnCharMunnu');
    if (btnC) btnC.classList.toggle('active', char === 'chunnu');
    if (btnM) btnM.classList.toggle('active', char === 'munnu');
    this.restart();
  }

  switchGame(gameKey) {
    this.currentGame = gameKey;
    const tabA = document.getElementById('tabArcher');
    const tabR = document.getElementById('tabRunner');
    const mobileControls = document.getElementById('arcadeMobileControls');
    const labelAmmo = document.getElementById('labelAmmo');
    const modal = document.getElementById('arcadeGameOverModal');
    if (modal) modal.style.display = 'none';

    if (tabA) tabA.classList.toggle('active', gameKey === 'archer');
    if (tabR) tabR.classList.toggle('active', gameKey === 'runner');

    if (gameKey === 'archer') {
      this.runner.stop();
      if (mobileControls) mobileControls.style.display = 'none';
      if (labelAmmo) labelAmmo.textContent = 'Arrows Left:';
      const best = localStorage.getItem('chunnu_archer_best') || '0';
      const highEl = document.getElementById('arcadeHighScore');
      if (highEl) highEl.textContent = best;
      this.archer.start(this.currentCharacter);
    } else {
      this.archer.stop();
      if (mobileControls) mobileControls.style.display = 'flex';
      if (labelAmmo) labelAmmo.textContent = 'Coins:';
      const best = localStorage.getItem('munnu_rush_best') || '0';
      const highEl = document.getElementById('arcadeHighScore');
      if (highEl) highEl.textContent = best;
      this.runner.start(this.currentCharacter);
    }
  }

  restart() {
    const modal = document.getElementById('arcadeGameOverModal');
    if (modal) modal.style.display = 'none';
    if (this.currentGame === 'archer') {
      this.archer.start(this.currentCharacter);
    } else {
      this.runner.start(this.currentCharacter);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.CHUNNU_ARCADE = new ArcadeHub();
});
