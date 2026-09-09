'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Skins ──────────────────────────────────────────────────────────────────────
const SKINS = {
  classic: {
    label: 'Clásica',
    color: '#ffffff',
    fill: 'rgba(255, 255, 255, 0.08)',
    flame: '#ff8200',
  },
  neon: {
    label: 'Neón',
    color: '#d866ff',
    fill: 'rgba(216, 102, 255, 0.18)',
    flame: '#5cf2ff',
  },
  solar: {
    label: 'Solar',
    color: '#ffd166',
    fill: 'rgba(255, 209, 102, 0.2)',
    flame: '#ff5c5c',
  },
};
const SKIN_STORAGE_KEY = 'asteroids-skin';
let selectedSkin = 'classic';

function loadSkin() {
  try {
    const savedSkin = localStorage.getItem(SKIN_STORAGE_KEY);
    if (savedSkin && SKINS[savedSkin]) selectedSkin = savedSkin;
  } catch (_) {
    // El juego sigue funcionando si el navegador bloquea el almacenamiento.
  }
}

function selectSkin(skinId) {
  if (!SKINS[skinId]) return;
  selectedSkin = skinId;
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, skinId);
  } catch (_) {
    // La selección permanece activa durante esta sesión.
  }

  document.querySelectorAll('.skin-button').forEach(button => {
    const isActive = button.dataset.skin === selectedSkin;
    button.style.setProperty('--skin-color', SKINS[button.dataset.skin].color);
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

loadSkin();
document.querySelectorAll('.skin-button').forEach(button => {
  button.addEventListener('click', () => selectSkin(button.dataset.skin));
});
selectSkin(selectedSkin);

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ─────────────────────────────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y) {
    super(x, y, 1);
    this.isShootingStar = true;
    this.ttl = 8;

    const angle = rand(0, Math.PI * 2);
    const speed = 230 + rand(-20, 20);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() {
    return [];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#f33';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? 15 : 6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Estela orientada en sentido contrario al movimiento.
    ctx.strokeStyle = 'rgba(255, 70, 70, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-this.vx * 0.08, -this.vy * 0.08);
    ctx.lineTo(-this.vx * 0.22, -this.vy * 0.22);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-up de velocidad ─────────────────────────────────────────────────────
class SpeedPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 11;
    this.ttl = 12;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const pulse = 1 + Math.sin(this.age * 6) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#5cf2ff';
    ctx.fillStyle = 'rgba(92, 242, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(1, 0);
    ctx.lineTo(-3, 8);
    ctx.lineTo(6, -2);
    ctx.lineTo(1, -2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-up de escudo ────────────────────────────────────────────────────────
class ShieldPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 11;
    this.ttl = 12;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const pulse = 1 + Math.sin(this.age * 6) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#b56cff';
    ctx.fillStyle = 'rgba(181, 108, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 6, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoostTimer = 0;
    this.shieldTimer = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoostTimer > 0) this.speedBoostTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const speedMultiplier = this.speedBoostTimer > 0 ? 2 : 1;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * speedMultiplier * dt;
      this.vy += Math.sin(this.angle) * THRUST * speedMultiplier * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * speedMultiplier * dt, W);
    this.y = wrap(this.y + this.vy * speedMultiplier * dt, H);
  }

  activateSpeedBoost() {
    this.speedBoostTimer = 5;
  }

  activateShield() {
    this.shieldTimer = 6;
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const skin = SKINS[selectedSkin];
    const shipColor = this.speedBoostTimer > 0 ? '#5cf2ff' : skin.color;
    ctx.strokeStyle = shipColor;
    ctx.fillStyle   = skin.fill;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();

    if (this.shieldTimer > 0) {
      const pulse = 1 + Math.sin(this.shieldTimer * 8) * 0.06;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = 'rgba(181, 108, 255, 0.9)';
      ctx.fillStyle = 'rgba(181, 108, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let scoreMultiplierTimer;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }

  if (Math.random() < 0.5) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new ShootingStar(x, y));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  scoreMultiplierTimer = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  if (scoreMultiplierTimer > 0) scoreMultiplierTimer -= dt;
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        const scoreMultiplier = scoreMultiplierTimer > 0 ? 2 : 1;
        score += POINTS[a.size] * scoreMultiplier;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (a.isShootingStar) scoreMultiplierTimer = 5;
        if (Math.random() < 0.18) powerUps.push(new SpeedPowerUp(a.x, a.y));
        if (Math.random() < 0.12) powerUps.push(new ShieldPowerUp(a.x, a.y));
      }
    }
  }

  // El escudo destruye el asteroide al proteger la nave.
  if (ship.shieldTimer > 0) {
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82) {
        a.dead = true;
        const scoreMultiplier = scoreMultiplierTimer > 0 ? 2 : 1;
        score += POINTS[a.size] * scoreMultiplier;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (a.isShootingStar) scoreMultiplierTimer = 5;
      }
    }
  }

  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs power-up
  for (const powerUp of powerUps) {
    if (dist(ship, powerUp) < ship.radius + powerUp.radius) {
      if (powerUp instanceof ShieldPowerUp) ship.activateShield();
      else ship.activateSpeedBoost();
      powerUp.dead = true;
    }
  }
  powerUps = powerUps.filter(powerUp => !powerUp.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0 && ship.shieldTimer <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  if (ship.speedBoostTimer > 0) {
    ctx.fillStyle = '#5cf2ff';
    ctx.fillText(`VELOCIDAD ${ship.speedBoostTimer.toFixed(1)}s`, W / 2, 48);
  }

  if (scoreMultiplierTimer > 0) {
    ctx.fillStyle = '#f33';
    ctx.fillText(`PUNTOS 2X ${scoreMultiplierTimer.toFixed(1)}s`, W / 2, 68);
  }

  if (ship.shieldTimer > 0) {
    ctx.fillStyle = '#b56cff';
    ctx.fillText(`ESCUDO ${ship.shieldTimer.toFixed(1)}s`, W / 2, 88);
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  powerUps.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
