import * as THREE from "three";

const WORLD = { left: -115, right: 115, top: 118 };
const CITY_X = [-62, -31, 31, 62];
const BATTERY_X = [-93, 0, 93];

const COLORS = {
  sky: 0x04040f,
  ground: 0x0a0a18,
  city: 0x00e5ff,
  cityDead: 0x333344,
  enemy: 0xff3355,
  player: 0x00ffcc,
  explosion: 0xffaa33,
  explosionEnemy: 0xff5533,
};

let scene, camera, renderer, raycaster, mousePlane;
let mouseWorld = new THREE.Vector3(WORLD.left, 40, 0);
let crosshair;

let state = "menu";
let wave = 1;
let score = 0;
let nextBonusCityAt = 10000;
let shakeT = 0;

let cities = [];
let batteries = [];
let enemies = [];
let shots = [];
let explosions = [];

let spawnQueue = 0;
let spawnTimer = 0;
let waveTimer = 0;

const clock = new THREE.Clock();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(COLORS.sky, 200, 420);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 600);
  camera.position.set(0, 52, 150);
  camera.lookAt(0, 44, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  buildGround();
  buildStars();
  buildCities();
  buildBatteries();
  buildCrosshair();

  window.addEventListener("resize", onResize);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);
  document.getElementById("overlay-btn").addEventListener("click", onOverlayBtn);

  animate();
}

function buildGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 120),
    new THREE.MeshBasicMaterial({ color: COLORS.ground })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -40);
  scene.add(ground);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 6),
    new THREE.MeshBasicMaterial({ color: 0x1a1a3a, transparent: true, opacity: 0.9 })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.2, -9.8);
  scene.add(glow);
}

function buildStars() {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) {
    verts[i * 3] = (Math.random() - 0.5) * 500;
    verts[i * 3 + 1] = Math.random() * 200 + 10;
    verts[i * 3 + 2] = -100 - Math.random() * 100;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8899cc, size: 0.8, sizeAttenuation: true })));
}

function makeBuildingTexture(cols, rows, lit) {
  const cell = 8;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = lit ? "#10182b" : "#0a0e1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const litColors = ["#ffd97a", "#ffe6ad", "#8fe3ff", "#ffca66", "#c8f0ff"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = lit && Math.random() < 0.45;
      ctx.fillStyle = on
        ? litColors[(Math.random() * litColors.length) | 0]
        : Math.random() < 0.5
          ? "#0d1526"
          : "#16203a";
      ctx.fillRect(c * cell + 2, r * cell + 2, cell - 4, cell - 3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const beacons = [];

function makeCityMesh(dead) {
  const group = new THREE.Group();
  const heights = [5, 9, 6, 11, 7];
  let x = -5.5;
  let tallest = null;
  for (const h of heights) {
    const w = 2.6 + Math.random() * 1.4;
    const cols = Math.max(2, Math.round(w / 0.85));
    const rows = Math.max(3, Math.round(h / 1.0));
    const tex = makeBuildingTexture(cols, rows, !dead);
    const sideMat = new THREE.MeshBasicMaterial({ map: tex });
    const capMat = new THREE.MeshBasicMaterial({ color: dead ? 0x161c2c : 0x232f4e });
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 3),
      [sideMat, sideMat, capMat, capMat, sideMat, sideMat]
    );
    box.position.set(x + w / 2, h / 2, 0);
    group.add(box);
    if (!tallest || h > tallest.h) tallest = { h, x: x + w / 2 };
    x += w + 0.7;
  }
  if (!dead) {
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4466 })
    );
    beacon.position.set(tallest.x, tallest.h + 0.8, 0);
    beacon.userData.phase = Math.random() * Math.PI * 2;
    group.add(beacon);
    beacons.push(beacon);
  }
  return group;
}

function buildCities() {
  cities = CITY_X.map((x) => {
    const mesh = makeCityMesh(false);
    mesh.position.set(x, 0, 0);
    scene.add(mesh);
    return { x, alive: true, mesh };
  });
}

const BATTERY_COLORS = {
  track: 0x15181c,
  base: 0x41552f,
  baseHighlight: 0x7fb069,
  housing: 0x33482b,
  housingHighlight: 0x6a9c4f,
  barrel: 0x2c3a26,
  barrelHighlight: 0x8fc46a,
  cap: 0xc9c0a0,
};

function buildBatteryMesh(b) {
  const group = new THREE.Group();

  const trackMat = new THREE.MeshBasicMaterial({ color: BATTERY_COLORS.track });
  const track = new THREE.Mesh(new THREE.BoxGeometry(14.5, 1.4, 3), trackMat);
  track.position.y = 0.7;
  group.add(track);

  const baseMat = new THREE.MeshBasicMaterial({ color: BATTERY_COLORS.base, side: THREE.DoubleSide });
  const shape = new THREE.Shape();
  shape.moveTo(-7, 0);
  shape.lineTo(-3, 5);
  shape.lineTo(3, 5);
  shape.lineTo(7, 0);
  const base = new THREE.Mesh(new THREE.ShapeGeometry(shape), baseMat);
  base.position.y = 1.3;
  group.add(base);

  const housingMat = new THREE.MeshBasicMaterial({ color: BATTERY_COLORS.housing });
  const housing = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 3.2), housingMat);
  housing.position.set(0, 6.2, 1);
  group.add(housing);

  const pivot = new THREE.Group();
  pivot.position.set(0, 6.5, -2.5);

  const barrelMat = new THREE.MeshBasicMaterial({ color: BATTERY_COLORS.barrel });
  const canisterGeo = new THREE.BoxGeometry(1.5, 8.5, 1.5);
  canisterGeo.translate(0, 4.25, 0);
  const capGeo = new THREE.BoxGeometry(1.7, 0.7, 1.7);
  const barrels = [];
  for (const off of [-1.05, 1.05]) {
    const canister = new THREE.Mesh(canisterGeo, barrelMat);
    canister.position.x = off;
    const cap = new THREE.Mesh(capGeo, new THREE.MeshBasicMaterial({ color: BATTERY_COLORS.cap }));
    cap.position.y = 8.5;
    canister.add(cap);
    pivot.add(canister);
    barrels.push(canister);
  }
  group.add(pivot);
  group.position.set(b.x, 0, 0);

  return { group, pivot, barrels, baseMat, housingMat, barrelMat };
}

function buildBatteries() {
  batteries = BATTERY_X.map((x, i) => {
    const b = { x, ammo: 10, index: i, alive: true, aim: 0, recoil: 0 };
    Object.assign(b, buildBatteryMesh(b));
    scene.add(b.group);
    return b;
  });
}

function buildBatteryWreck(b) {
  const group = new THREE.Group();
  group.position.set(b.x, 0, 0);
  const charMat = (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });

  const track = new THREE.Mesh(new THREE.BoxGeometry(14.5, 1.4, 3), charMat(0x0d0d0d));
  track.position.y = 0.7;
  group.add(track);

  const shape = new THREE.Shape();
  shape.moveTo(-7, 0);
  shape.lineTo(-3, 5);
  shape.lineTo(3, 5);
  shape.lineTo(7, 0);
  const base = new THREE.Mesh(new THREE.ShapeGeometry(shape), charMat(0x20241c));
  base.position.y = 1.3;
  group.add(base);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 3.2), charMat(0x181c14));
  housing.position.set(0, 6.2, 1);
  housing.rotation.z = (Math.random() - 0.5) * 0.25;
  group.add(housing);

  const pivot = new THREE.Group();
  pivot.position.set(0, 6.5, -2.5);
  const canisterGeo = new THREE.BoxGeometry(1.5, 8.5, 1.5);
  canisterGeo.translate(0, 4.25, 0);
  const deadBarrelMat = charMat(0x11140f);
  const sags = [0.9 + Math.random() * 0.5, -(0.7 + Math.random() * 0.5)];
  for (const [off, tilt] of [[-1.05, sags[0]], [1.05, sags[1]]]) {
    const canister = new THREE.Mesh(canisterGeo, deadBarrelMat);
    canister.position.x = off;
    canister.rotation.z = tilt;
    pivot.add(canister);
  }
  group.add(pivot);
  return group;
}

function destroyBattery(b) {
  if (!b.alive) return;
  b.alive = false;
  b.ammo = 0;
  updateAmmoHUD();
  scene.remove(b.group);
  b.group = buildBatteryWreck(b);
  scene.add(b.group);
  b.pivot = null;
  b.barrels = [];
  b.recoil = 0;
  shakeT = 0.4;
  sfx("cityBoom");
}

let selectedBattery = null;

function updateBatteries(dt) {
  const available = batteries.filter((b) => b.alive && b.ammo > 0);
  let next = null;
  if (state === "playing" && available.length) {
    next = available.reduce((a, b) =>
      Math.abs(a.x - mouseWorld.x) < Math.abs(b.x - mouseWorld.x) ? a : b
    );
  }
  if (next !== selectedBattery) {
    batteries.forEach((b) => {
      const sel = b === next;
      b.baseMat.color.setHex(sel ? BATTERY_COLORS.baseHighlight : BATTERY_COLORS.base);
      b.housingMat.color.setHex(sel ? BATTERY_COLORS.housingHighlight : BATTERY_COLORS.housing);
      b.barrelMat.color.setHex(sel ? BATTERY_COLORS.barrelHighlight : BATTERY_COLORS.barrel);
    });
    selectedBattery = next;
  }
  for (const b of batteries) {
    if (!b.alive) continue;
    let target;
    if (b.ammo === 0) {
      target = (b.x <= 0 ? 1 : -1) * 1.15;
    } else {
      const dx = mouseWorld.x - b.x;
      const dy = Math.max(2, mouseWorld.y - 6.5);
      target = THREE.MathUtils.clamp(Math.atan2(-dx, dy), -1.25, 1.25);
    }
    b.aim += (target - b.aim) * Math.min(1, dt * 12);
    b.pivot.rotation.z = b.aim;

    b.recoil = Math.max(0, b.recoil - dt * 1.6);
    for (const c of b.barrels) c.position.y = -b.recoil * 2.2;
  }
}

function buildCrosshair() {
  crosshair = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 3, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  crosshair.position.z = 0.5;
  scene.add(crosshair);
}

function updateCrosshair(dt) {
  crosshair.position.x = mouseWorld.x;
  crosshair.position.y = mouseWorld.y;
  const pulse = 1 + Math.sin(performance.now() / 180) * 0.12;
  crosshair.scale.set(pulse, pulse, 1);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
  const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(mousePlane, hit)) {
    mouseWorld.set(
      THREE.MathUtils.clamp(hit.x, WORLD.left, WORLD.right),
      THREE.MathUtils.clamp(hit.y, 2, WORLD.top),
      0
    );
  }
}

function onMouseDown(e) {
  if (state !== "playing") return;
  fire(mouseWorld.clone());
}

const TRAIL_SEGMENTS = 28;
const TRAIL_LENGTH = 46;

function makeTrail(color) {
  const n = TRAIL_SEGMENTS + 1;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));

  // Static gradient along the trail: hot near the warhead, fading to nothing
  // behind it. Fading toward black works as a fade against the dark sky.
  const colors = new Float32Array(n * 3);
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const f = t * t * t;
    colors[i * 3] = c.r * f;
    colors[i * 3 + 1] = c.g * f;
    colors[i * 3 + 2] = c.b * f;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  line.frustumCulled = false;
  return line;
}

function makeMissileObj(from, target, speed, color, isEnemy) {
  let line;
  if (isEnemy) {
    line = makeTrail(color);
  } else {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
  }
  scene.add(line);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(isEnemy ? 0.9 : 0.7, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  scene.add(head);

  return {
    from: from.clone(),
    pos: from.clone(),
    target: target.clone(),
    speed,
    isEnemy,
    line,
    head,
    dead: false,
    trail: 1,
  };
}

function fire(target) {
  const available = batteries.filter((b) => b.alive && b.ammo > 0);
  if (!available.length) return;
  available.sort((a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x));
  const batt = available[0];
  batt.ammo--;
  updateAmmoHUD();

  const muzzle = new THREE.Vector3(0, 9, 0)
    .applyAxisAngle(new THREE.Vector3(0, 0, 1), batt.aim)
    .add(new THREE.Vector3(batt.x, 6.5, -2.5));
  shots.push(makeMissileObj(muzzle, target, 95, COLORS.player, false));
  batt.recoil = 0.35;
  sfx("launch");
}

function enemyTarget() {
  const aliveCities = cities.filter((c) => c.alive);
  if (aliveCities.length && Math.random() < 0.8) {
    const c = aliveCities[Math.floor(Math.random() * aliveCities.length)];
    return new THREE.Vector3(c.x, 0, 0);
  }
  const b = batteries[Math.floor(Math.random() * batteries.length)];
  return new THREE.Vector3(b.x + (Math.random() - 0.5) * 8, 0, 0);
}

function spawnEnemy() {
  const from = new THREE.Vector3(
    THREE.MathUtils.lerp(WORLD.left + 10, WORLD.right - 10, Math.random()),
    WORLD.top,
    0
  );
  const smart = wave >= 3 && Math.random() < 0.12;
  const mirv = !smart && wave >= 2 && Math.random() < 0.18;
  const speed = (smart ? 8 : 11) + wave * 1.6;
  const m = makeMissileObj(from, enemyTarget(), speed, smart ? 0xffdd00 : COLORS.enemy, true);
  m.mirv = mirv ? THREE.MathUtils.lerp(70, 45, Math.random()) : 0;
  m.smart = smart;
  enemies.push(m);
}

function mirvSplit(m) {
  const n = 2 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const t = enemyTarget();
    const child = makeMissileObj(m.pos.clone(), t, m.speed * 0.9, COLORS.enemy, true);
    enemies.push(child);
  }
}

function flashScreen(intensity) {
  const flash = document.getElementById("flash");
  flash.style.transition = "none";
  flash.style.opacity = Math.min(0.85, intensity);
  requestAnimationFrame(() => {
    flash.style.transition = "opacity 0.45s ease-out";
    flash.style.opacity = 0;
  });
}

function makeExplosion(pos, maxRadius, isEnemy) {
  const group = new THREE.Group();
  group.position.copy(pos);

  const mkLayer = (color, opacity) =>
    new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

  const glow = mkLayer(isEnemy ? 0xff5522 : 0xffaa11, 0.55);
  const body = mkLayer(isEnemy ? 0xffaa55 : 0xffee55, 1);
  const core = mkLayer(0xffffff, 1);
  group.add(glow, body, core);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 48), ringMat);
  group.add(ring);

  scene.add(group);
  explosions.push({
    group,
    core,
    body,
    glow,
    ring,
    ringMat,
    pos: pos.clone(),
    maxRadius,
    isEnemy,
    r: 0,
    phase: 0,
    t: 0,
  });
  sfx(isEnemy ? "boomBig" : "boom");
  flashScreen(isEnemy ? 0.22 : 0.55 * (maxRadius / 22));
}

function updateExplosions(dt) {
  for (const ex of explosions) {
    ex.t += dt;
    if (ex.phase === 0) {
      ex.r = ex.maxRadius * Math.min(1, ex.t / 0.35);
      if (ex.t >= 0.35) ex.phase = 1;
    } else if (ex.phase === 1) {
      ex.r = ex.maxRadius;
      if (ex.t >= 0.6) ex.phase = 2;
    } else {
      ex.r = ex.maxRadius * Math.max(0, 1 - (ex.t - 0.6) / 0.45);
      if (ex.t >= 1.05) {
        ex.dead = true;
        scene.remove(ex.group);
      }
    }
    if (!ex.dead) {
      const r = Math.max(0.01, ex.r);
      const flicker = 1 + Math.sin(ex.t * 60) * 0.18;
      ex.core.scale.setScalar(r * 0.5 * flicker);
      ex.core.material.opacity = Math.min(1, r / ex.maxRadius + 0.3);
      ex.body.scale.setScalar(r);
      ex.glow.scale.setScalar(r * 1.8 * flicker);
      ex.glow.material.opacity = 0.55 * (r / ex.maxRadius);
      const rr = r * 1.95;
      ex.ring.scale.setScalar(rr);
      ex.ring.material.opacity = Math.max(0, 0.9 * (1 - rr / (ex.maxRadius * 2.2)));
      if (ex.phase === 2) {
        const fade = Math.max(0, 1 - (ex.t - 0.6) / 0.45);
        ex.body.material.opacity = fade;
      }
      if (!ex.isEnemy) {
        for (const m of enemies) {
          if (!m.dead && m.pos.distanceTo(ex.pos) < ex.r + 1.5) killEnemy(m);
        }
      } else {
        for (const c of cities) {
          if (c.alive && Math.abs(c.x - ex.pos.x) < ex.r && ex.pos.y < 14) destroyCity(c);
        }
        for (const b of batteries) {
          if (b.alive && Math.abs(b.x - ex.pos.x) < ex.r && ex.pos.y < 13) destroyBattery(b);
        }
      }
    }
  }
  explosions = explosions.filter((e) => !e.dead);
}

function killEnemy(m) {
  m.dead = true;
  const alt = m.pos.y;
  const mult = Math.min(3, 1 + Math.floor((wave - 1) / 2));
  const base = alt > 80 ? 100 : alt > 40 ? 50 : 25;
  score += base * mult;
  updateScoreHUD();
  removeMissile(m);
  makeExplosion(m.pos.clone(), 16, false);
}

function removeMissile(m) {
  scene.remove(m.line);
  scene.remove(m.head);
  m.line.geometry.dispose();
}

function destroyCity(c) {
  c.alive = false;
  scene.remove(c.mesh);
  c.mesh = makeCityMesh(true);
  c.mesh.position.set(c.x, 0, 0);
  scene.add(c.mesh);
  shakeT = 0.4;
  sfx("cityBoom");
}

function updateTrail(m) {
  const posAttr = m.line.geometry.attributes.position;
  if (!m.isEnemy) {
    posAttr.setXYZ(0, m.from.x, m.from.y, m.from.z);
    posAttr.setXYZ(1, m.pos.x, m.pos.y, m.pos.z);
    posAttr.needsUpdate = true;
    return;
  }
  // Tail is clamped so the visible streak stays a trail rather than growing
  // into a full-length line back to the spawn point.
  const tail = m.pos.clone().sub(m.from);
  const flown = tail.length();
  if (flown > TRAIL_LENGTH) tail.multiplyScalar(TRAIL_LENGTH / flown);
  const start = m.pos.clone().sub(tail);
  for (let i = 0; i <= TRAIL_SEGMENTS; i++) {
    const t = i / TRAIL_SEGMENTS;
    posAttr.setXYZ(
      i,
      start.x + (m.pos.x - start.x) * t,
      start.y + (m.pos.y - start.y) * t,
      start.z + (m.pos.z - start.z) * t
    );
  }
  posAttr.needsUpdate = true;
}

function updateMissile(m, dt) {
  const dir = m.target.clone().sub(m.pos);
  const dist = dir.length();
  const step = m.speed * dt;
  if (dist <= step) {
    m.pos.copy(m.target);
    m.trail = 0;
    if (m.isEnemy) {
      m.dead = true;
      removeMissile(m);
      makeExplosion(m.pos.clone(), 13, true);
    } else {
      m.dead = true;
      removeMissile(m);
      makeExplosion(m.pos.clone(), 22, false);
    }
    return;
  }
  if (m.smart) {
    for (const ex of explosions) {
      if (ex.isEnemy) continue;
      const away = m.pos.clone().sub(ex.pos);
      const d = away.length();
      if (d < 38 && d > 0.001) {
        away.normalize().multiplyScalar(m.speed * 0.55 * dt);
        m.pos.add(away);
      }
    }
  }
  dir.normalize().multiplyScalar(step);
  m.pos.add(dir);
  if (m.mirv && m.pos.y <= m.mirv) {
    m.mirv = 0;
    mirvSplit(m);
  }

  updateTrail(m);
  m.head.position.copy(m.pos);
}

function updateEnemies(dt) {
  for (const m of enemies) if (!m.dead) updateMissile(m, dt);
  enemies = enemies.filter((m) => {
    if (m.dead) return false;
    return true;
  });
}

function updateShots(dt) {
  for (const m of shots) if (!m.dead) updateMissile(m, dt);
  shots = shots.filter((m) => !m.dead);
}

function updateAmmoHUD() {
  batteries.forEach((b) => {
    const el = document.getElementById(`batt-${b.index}`);
    el.querySelectorAll("span").forEach((pip, i) => {
      pip.classList.toggle("empty", i >= b.ammo);
    });
  });
}

function updateScoreHUD() {
  document.getElementById("score").textContent = score.toLocaleString();
}

function buildAmmoHUD() {
  batteries.forEach((b) => {
    const el = document.getElementById(`batt-${b.index}`);
    el.innerHTML = "";
    for (let i = 0; i < 10; i++) el.appendChild(document.createElement("span"));
  });
  updateAmmoHUD();
}

function showOverlay(title, text, btn) {
  document.getElementById("overlay-title").textContent = title;
  document.getElementById("overlay-text").innerHTML = text;
  document.getElementById("overlay-btn").textContent = btn;
  document.getElementById("overlay").classList.add("visible");
}

function hideOverlay() {
  document.getElementById("overlay").classList.remove("visible");
}

function showBanner(text, ms) {
  const el = document.getElementById("wave-banner");
  el.textContent = text;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), ms);
}

function onOverlayBtn() {
  ensureAudio();
  if (state === "menu") {
    startGame();
  } else if (state === "waveend") {
    startWave(wave + 1);
  } else if (state === "gameover") {
    resetGame();
    startGame();
  }
}

function startGame() {
  wave = 1;
  score = 0;
  nextBonusCityAt = 10000;
  cities.forEach((c) => {
    if (!c.alive) {
      scene.remove(c.mesh);
      c.mesh = makeCityMesh(false);
      c.mesh.position.set(c.x, 0, 0);
      scene.add(c.mesh);
    }
    c.alive = true;
  });
  for (let i = beacons.length - 1; i >= 0; i--) if (!beacons[i].parent.parent) beacons.splice(i, 1);
  updateScoreHUD();
  hideOverlay();
  startWave(wave);
}

function resetGame() {}

function startWave(n) {
  wave = n;
  document.getElementById("wave").textContent = n;
  batteries.forEach((b) => {
    if (!b.alive) {
      scene.remove(b.group);
      Object.assign(b, buildBatteryMesh(b));
      scene.add(b.group);
    }
    b.alive = true;
    b.aim = 0;
    b.ammo = 10;
  });
  buildAmmoHUD();
  enemies.forEach(removeMissile);
  shots.forEach(removeMissile);
  enemies = [];
  shots = [];
  spawnQueue = Math.min(10 + n * 3, 32);
  spawnTimer = 0.5;
  state = "playing";
  hideOverlay();
  showBanner(`WAVE ${n}`, 2000);
}

function endWave() {
  state = "waveend";
  const ammoLeft = batteries.reduce((s, b) => s + b.ammo, 0);
  const ammoBonus = ammoLeft * 5 * Math.min(3, 1 + Math.floor((wave - 1) / 2));
  const aliveCities = cities.filter((c) => c.alive).length;
  const cityBonus = aliveCities * 100 * Math.min(3, 1 + Math.floor((wave - 1) / 2));
  score += ammoBonus + cityBonus;
  updateScoreHUD();

  let bonusCityText = "";
  while (score >= nextBonusCityAt) {
    const dead = cities.filter((c) => !c.alive);
    if (dead.length) {
      const c = dead[0];
      scene.remove(c.mesh);
      c.mesh = makeCityMesh(false);
      c.mesh.position.set(c.x, 0, 0);
      scene.add(c.mesh);
      c.alive = true;
      bonusCityText = `<br><span style="color:#ffdd55">BONUS CITY AWARDED</span>`;
      for (let i = beacons.length - 1; i >= 0; i--) if (!beacons[i].parent.parent) beacons.splice(i, 1);
    }
    nextBonusCityAt += 10000;
  }

  if (aliveCities === 0) {
    state = "gameover";
    showOverlay("THE END", `Final score: ${score.toLocaleString()}\nAll cities destroyed.`, "PLAY AGAIN");
    return;
  }

  showOverlay(
    `WAVE ${wave} CLEAR`,
    `Cities saved: ${aliveCities} × bonus = ${cityBonus.toLocaleString()}<br>` +
      `Missiles unused: ${ammoLeft} × bonus = ${ammoBonus.toLocaleString()}<br>` +
      `Total score: ${score.toLocaleString()}${bonusCityText}`,
    "NEXT WAVE"
  );
}

function updateSpawning(dt) {
  if (spawnQueue > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnQueue--;
      spawnTimer = Math.max(0.35, 1.5 - wave * 0.09) * (0.6 + Math.random() * 0.8);
    }
  } else if (enemies.length === 0 && shots.length === 0 && explosions.length === 0) {
    waveTimer += dt;
    if (waveTimer > 0.8) {
      waveTimer = 0;
      endWave();
    }
  }
}

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function sfx(type) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const gain = audioCtx.createGain();
  gain.connect(audioCtx.destination);
  if (type === "launch") {
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.25);
  } else {
    const dur = type === "cityBoom" ? 0.7 : 0.4;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = type === "cityBoom" ? 400 : 900;
    gain.gain.value = type === "cityBoom" ? 0.22 : 0.14;
    src.connect(filter);
    filter.connect(gain);
    src.start(t);
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  updateCrosshair(dt);
  updateBatteries(dt);
  const t = clock.elapsedTime;
  for (const beacon of beacons) {
    if (beacon.parent) beacon.visible = Math.sin(t * 3 + beacon.userData.phase) > -0.3;
  }
  if (state === "playing") {
    updateSpawning(dt);
    updateEnemies(dt);
    updateShots(dt);
    updateExplosions(dt);
  }

  if (shakeT > 0) {
    shakeT -= dt;
    const s = shakeT * 18;
    camera.position.set((Math.random() - 0.5) * s, 52 + (Math.random() - 0.5) * s, 150);
  } else {
    camera.position.set(0, 52, 150);
  }

  renderer.render(scene, camera);
}

init();
showOverlay(
  "MISSILE COMMAND",
  "Defend your six cities.<br>Click to launch interceptors from the nearest battery.<br><br>" +
    "25–100 pts per missile hit · chain the sky",
  "START"
);
