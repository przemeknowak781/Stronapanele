import * as THREE from 'https://esm.sh/three@0.170.0';
import { OrbitControls } from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.170.0/examples/jsm/environments/RoomEnvironment.js';

const rootEl = document.getElementById('fz-3d-root');
if (!rootEl) throw new Error('Missing #fz-3d-root');

const CATALOG = JSON.parse(document.getElementById('fz-3d-catalog').textContent);
const BASE_PATH = rootEl.dataset.basePath || '';

const FINISH_TINTS = {
  'noce-canaletto': { name: 'Orzech Canaletto', color: 0xffffff, delta: 0, roughness: 0.56 },
  'rovere-fume':    { name: 'Dąb Wędzony',      color: 0xbcb0a4, delta: -240, roughness: 0.62 },
  'frassino-termo': { name: 'Jesion Termowany', color: 0xffe0bd, delta: -320, roughness: 0.58 },
  'rovere-nat':     { name: 'Dąb Naturalny',    color: 0xffecd2, delta: -180, roughness: 0.60 }
};

const LED_TEMPS = {
  '2700': { hex: 0xffc785, emissive: 0xffd29d },
  '3000': { hex: 0xffe0b5, emissive: 0xffe8c7 },
  '4000': { hex: 0xf4f6ff, emissive: 0xffffff }
};

const fmt = (n) => new Intl.NumberFormat('pl-PL').format(Math.round(n)) + ' zł';

// Initial state (supports ?sku=FZ-STA-01 deep-link)
const urlSku = new URLSearchParams(window.location.search).get('sku');
const initialProd = CATALOG.find((p) => p.sku === urlSku) || CATALOG[0];

const state = {
  product: initialProd,
  finish: 'noce-canaletto',
  room: 'salon',
  wallW: 4.2,
  wallH: 2.8,
  orientation: 'vertical',
  ledOn: true,
  ledIntensity: 2.4,
  ledTemp: '2700',
  sunTime: 0.55, // 0=morning, 0.5=noon, 0.8=golden hour, 1=night
  relief: 1.5
};

// ── Scene, Renderer, Camera, Environment ─────────────────────────────
const stageEl = document.getElementById('fz-3d-stage');
const canvas = document.getElementById('fz-3d-canvas');
const loadingEl = document.getElementById('fz-3d-loading');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1511);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTex;
scene.environmentIntensity = 0.52;

const camera = new THREE.PerspectiveCamera(40, 16 / 10, 0.1, 40);
camera.position.set(0.4, 1.55, 5.2);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.52;
controls.minPolarAngle = Math.PI * 0.18;
controls.minDistance = 1.15;
controls.maxDistance = 9.5;
controls.target.set(0, 1.35, 0);

// Smooth camera tween target
let camTween = null;
function moveCamera(pos, target) {
  camTween = {
    startPos: camera.position.clone(),
    endPos: new THREE.Vector3(...pos),
    startTarget: controls.target.clone(),
    endTarget: new THREE.Vector3(...target),
    t: 0
  };
}

// ── Lights ───────────────────────────────────────────────────────────
const hemiLight = new THREE.HemisphereLight(0xfff5e8, 0x3b2d22, 0.65);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff1dc, 1.8);
sunLight.position.set(-4.5, 4.2, 4.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 18;
sunLight.shadow.camera.left = -6;
sunLight.shadow.camera.right = 6;
sunLight.shadow.camera.top = 5;
sunLight.shadow.camera.bottom = -1;
sunLight.shadow.bias = -0.0004;
scene.add(sunLight);

const ledGroup = new THREE.Group();
scene.add(ledGroup);

// ── Texture & Sobel Normal Map Generator ─────────────────────────────
const texCache = new Map();
const loader = new THREE.TextureLoader();

function generateNormalMap(img, strength = 2.6) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  const src = ctx.getImageData(0, 0, size, size).data;

  const out = ctx.createImageData(size, size);
  const dst = out.data;

  const lum = (x, y) => {
    const cx = (x + size) % size;
    const cy = (y + size) % size;
    const i = (cy * size + cx) * 4;
    return (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = lum(x - 1, y - 1), t = lum(x, y - 1), tr = lum(x + 1, y - 1);
      const l = lum(x - 1, y), r = lum(x + 1, y);
      const bl = lum(x - 1, y + 1), b = lum(x, y + 1), br = lum(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const idx = (y * size + x) * 4;
      dst[idx] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  const nTex = new THREE.CanvasTexture(c);
  nTex.wrapS = THREE.RepeatWrapping;
  nTex.wrapT = THREE.RepeatWrapping;
  return nTex;
}

function loadPanelTextures(imgPath) {
  const fullPath = `${BASE_PATH}${imgPath}`;
  if (texCache.has(fullPath)) return Promise.resolve(texCache.get(fullPath));

  return new Promise((resolve) => {
    loader.load(fullPath, (map) => {
      map.colorSpace = THREE.SRGBColorSpace;
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const normalMap = generateNormalMap(map.image, 2.8);
      const bundle = { map, normalMap };
      texCache.set(fullPath, bundle);
      resolve(bundle);
    });
  });
}

// ── Architectural Room & Panel Wall Groups ───────────────────────────
const wallGroup = new THREE.Group();
const roomGroup = new THREE.Group();
scene.add(wallGroup);
scene.add(roomGroup);

let panelMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.56,
  metalness: 0.04,
  normalScale: new THREE.Vector2(1.5, 1.5)
});

const brassMat = new THREE.MeshStandardMaterial({
  color: 0xc29b4d,
  metalness: 0.86,
  roughness: 0.24
});

const plasterMat = new THREE.MeshStandardMaterial({
  color: 0xebe3d3,
  roughness: 0.88,
  metalness: 0.0
});

const darkStudioMat = new THREE.MeshStandardMaterial({
  color: 0x1c1714,
  roughness: 0.78,
  metalness: 0.05
});

const floorMat = new THREE.MeshStandardMaterial({
  color: 0x8f7963,
  roughness: 0.42,
  metalness: 0.05
});

const linenMat = new THREE.MeshStandardMaterial({
  color: 0xe6dfd3,
  roughness: 0.92,
  metalness: 0.0
});

const travertineMat = new THREE.MeshStandardMaterial({
  color: 0xd9cbb5,
  roughness: 0.55,
  metalness: 0.04
});

const ledStripMat = new THREE.MeshStandardMaterial({
  color: 0xfff0d4,
  emissive: 0xffd29d,
  emissiveIntensity: 3.2
});

function clearGroup(g) {
  while (g.children.length) {
    const obj = g.children.pop();
    if (obj.geometry) obj.geometry.dispose();
  }
}

function buildPanelWall() {
  clearGroup(wallGroup);
  clearGroup(ledGroup);

  const W = state.wallW;
  const H = state.wallH;
  const p = state.product;
  const plateW = (state.orientation === 'vertical' ? p.widthMm : p.heightMm) / 1000;
  const plateH = (state.orientation === 'vertical' ? p.heightMm : p.widthMm) / 1000;
  const depth = Math.max(0.022, p.thicknessMm / 1000);
  const gap = 0.003;

  // Dark backing behind shadow joints
  const backGeo = new THREE.BoxGeometry(W + 0.02, H + 0.02, 0.02);
  const backMesh = new THREE.Mesh(backGeo, darkStudioMat);
  backMesh.position.set(0, H / 2, -0.015);
  wallGroup.add(backMesh);

  // Tile real-scale plates across the wall
  const cols = Math.ceil(W / plateW);
  const rows = Math.ceil(H / plateH);

  for (let c = 0; c < cols; c++) {
    const x0 = -W / 2 + c * plateW;
    const actualW = Math.min(plateW, W / 2 - x0) - gap;
    if (actualW <= 0.02) continue;

    for (let r = 0; r < rows; r++) {
      const y0 = r * plateH;
      const actualH = Math.min(plateH, H - y0) - gap;
      if (actualH <= 0.02) continue;

      const geo = new THREE.BoxGeometry(actualW, actualH, depth);
      // Scale UVs proportionally so cropped edge plates never stretch the CNC pattern
      const uv = geo.attributes.uv;
      const uScale = actualW / plateW;
      const vScale = actualH / plateH;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) * uScale, uv.getY(i) * vScale);
      }

      const mesh = new THREE.Mesh(geo, panelMaterial);
      mesh.position.set(x0 + actualW / 2 + gap / 2, y0 + actualH / 2 + gap / 2, depth / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      wallGroup.add(mesh);
    }
  }

  // Brushed brass perimeter trim (top, bottom, left, right)
  const t = 0.014;
  const trimTop = new THREE.Mesh(new THREE.BoxGeometry(W + t * 2, t, depth + 0.006), brassMat);
  trimTop.position.set(0, H + t / 2, depth / 2);
  const trimBot = new THREE.Mesh(new THREE.BoxGeometry(W + t * 2, t, depth + 0.006), brassMat);
  trimBot.position.set(0, t / 2, depth / 2);
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(t, H, depth + 0.006), brassMat);
  trimL.position.set(-W / 2 - t / 2, H / 2, depth / 2);
  const trimR = new THREE.Mesh(new THREE.BoxGeometry(t, H, depth + 0.006), brassMat);
  trimR.position.set(W / 2 + t / 2, H / 2, depth / 2);
  wallGroup.add(trimTop, trimBot, trimL, trimR);

  // Recessed LED Wall-Washer strip & grazing lights along top of panel wall
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W, 0.016, 0.025), ledStripMat);
  strip.position.set(0, H + 0.04, 0.14);
  ledGroup.add(strip);

  const count = Math.max(2, Math.min(5, Math.round(W / 1.25)));
  const tempCfg = LED_TEMPS[state.ledTemp] || LED_TEMPS['2700'];
  for (let i = 0; i < count; i++) {
    const px = count === 1 ? 0 : -W * 0.38 + (i / (count - 1)) * W * 0.76;
    const pt = new THREE.SpotLight(tempCfg.hex, state.ledOn ? state.ledIntensity * 2.8 : 0, H + 2.5, Math.PI * 0.42, 0.75, 1.4);
    pt.position.set(px, H + 0.02, 0.28);
    pt.target.position.set(px, H * 0.35, 0.02);
    ledGroup.add(pt, pt.target);
  }
}

function buildRoomEnvironment() {
  clearGroup(roomGroup);
  const W = state.wallW;
  const H = state.wallH;
  const isStudio = state.room === 'studio';

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), isStudio ? darkStudioMat : floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 3.5);
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // Back surround wall & ceiling (for Salon & Sypialnia)
  if (!isStudio) {
    const surround = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.5), plasterMat);
    surround.position.set(0, 3.25, -0.04);
    surround.receiveShadow = true;
    roomGroup.add(surround);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), plasterMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, H + 0.08, 4.5);
    roomGroup.add(ceil);

    // Side wall (right) for architectural framing
    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(12, H + 0.2), plasterMat);
    sideWall.rotation.y = -Math.PI / 2;
    sideWall.position.set(Math.max(W / 2 + 1.4, 3.6), (H + 0.2) / 2, 4.5);
    sideWall.receiveShadow = true;
    roomGroup.add(sideWall);
  }

  if (state.room === 'salon') {
    // Minimalist architectural low sofa
    const sofaGroup = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.36, 0.96), linenMat);
    base.position.set(0, 0.22, 1.55);
    base.castShadow = true; base.receiveShadow = true;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.42, 0.22), linenMat);
    back.position.set(0, 0.56, 1.18);
    back.castShadow = true;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.36, 0.96), linenMat);
    armL.position.set(-1.15, 0.44, 1.55);
    const armR = armL.clone();
    armR.position.x = 1.15;
    sofaGroup.add(base, back, armL, armR);

    // Sculptural travertine coffee table
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.07, 40), travertineMat);
    tableTop.position.set(0.25, 0.32, 2.65);
    tableTop.castShadow = true; tableTop.receiveShadow = true;
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.29, 28), travertineMat);
    tableLeg.position.set(0.25, 0.145, 2.65);
    sofaGroup.add(tableTop, tableLeg);

    // Brass architectural floor lamp
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.65, 16), brassMat);
    pole.position.set(-1.75, 0.825, 1.15);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.26, 24), linenMat);
    shade.position.set(-1.75, 1.62, 1.15);
    sofaGroup.add(pole, shade);

    roomGroup.add(sofaGroup);
  } else if (state.room === 'sypialnia') {
    // Architectural low bed + bedside brass pendants
    const bed = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.32, 2.15), travertineMat);
    frame.position.set(0, 0.16, 1.15);
    frame.castShadow = true; frame.receiveShadow = true;
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.24, 2.0), linenMat);
    mattress.position.set(0, 0.42, 1.15);
    mattress.castShadow = true;
    const pillowL = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.18, 0.44), linenMat);
    pillowL.position.set(-0.44, 0.60, 0.42);
    const pillowR = pillowL.clone();
    pillowR.position.x = 0.44;
    bed.add(frame, mattress, pillowL, pillowR);

    // Twin brass pendant drops
    [-1.28, 1.28].forEach((x) => {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, H - 1.35, 8), brassMat);
      cord.position.set(x, 1.35 + (H - 1.35) / 2, 0.38);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 20), ledStripMat);
      bulb.position.set(x, 1.32, 0.38);
      bed.add(cord, bulb);
    });
    roomGroup.add(bed);
  }
}

function updateLighting() {
  const t = state.sunTime; // 0..1
  // Sun sweeps from left morning -> high midday -> warm golden -> night
  const angle = -Math.PI * 0.42 + t * Math.PI * 0.72;
  sunLight.position.set(Math.sin(angle) * 6, 1.6 + Math.sin((1 - Math.abs(t - 0.45) * 1.5) * 1.4) * 3.8, 4.2);

  if (t > 0.82) {
    // Night mode with dramatic LED wall-washing
    sunLight.intensity = 0.18;
    sunLight.color.setHex(0x8aa8d6);
    hemiLight.intensity = 0.24;
    scene.background.setHex(0x0f0b09);
  } else if (t > 0.62) {
    // Golden hour
    sunLight.intensity = 1.65;
    sunLight.color.setHex(0xffc98b);
    hemiLight.intensity = 0.52;
    scene.background.setHex(0x211913);
  } else {
    // Bright daylight
    sunLight.intensity = 1.95;
    sunLight.color.setHex(0xfff4e6);
    hemiLight.intensity = 0.76;
    scene.background.setHex(state.room === 'studio' ? 0x161210 : 0x2a231e);
  }

  const tempCfg = LED_TEMPS[state.ledTemp] || LED_TEMPS['2700'];
  ledStripMat.emissive.setHex(tempCfg.emissive);
  ledStripMat.emissiveIntensity = state.ledOn ? state.ledIntensity * 1.6 : 0;
  ledGroup.children.forEach((child) => {
    if (child.isSpotLight) {
      child.color.setHex(tempCfg.hex);
      child.intensity = state.ledOn ? state.ledIntensity * 2.8 : 0;
    }
  });
}

async function applyPanelAppearance() {
  loadingEl.classList.remove('is-hidden');
  const { map, normalMap } = await loadPanelTextures(state.product.image);
  const f = FINISH_TINTS[state.finish] || FINISH_TINTS['noce-canaletto'];

  panelMaterial.map = map;
  panelMaterial.normalMap = normalMap;
  panelMaterial.color.setHex(f.color);
  panelMaterial.roughness = f.roughness;
  panelMaterial.normalScale.set(state.relief, state.relief);
  panelMaterial.needsUpdate = true;

  buildPanelWall();
  buildRoomEnvironment();
  updateLighting();
  updateSummaryUI();
  loadingEl.classList.add('is-hidden');
}

// ── Summary & Cart Sync ──────────────────────────────────────────────
function getQuote() {
  const p = state.product;
  const f = FINISH_TINTS[state.finish];
  const unitPrice = p.price + f.delta;
  const wallArea = state.wallW * state.wallH;
  const panelArea = (p.widthMm / 1000) * (p.heightMm / 1000);
  const panels = Math.max(1, Math.ceil((wallArea * 1.1) / panelArea));
  return { unitPrice, wallArea, panelArea, panels, total: panels * unitPrice, finishName: f.name };
}

function updateSummaryUI() {
  const q = getQuote();
  const hud = document.getElementById('fz-3d-hud-label');
  if (hud) hud.textContent = `${state.product.name} (${state.product.sku}) · ${q.finishName} · ${state.wallW.toFixed(1)}×${state.wallH.toFixed(1)} m`;

  const sum = document.getElementById('fz-3d-summary');
  if (sum) {
    sum.innerHTML = `
      <div class="fz-studio__row"><span>Powierzchnia ściany:</span><strong>${q.wallArea.toFixed(1)} m² (+10% zapas)</strong></div>
      <div class="fz-studio__row"><span>Liczba płyt (${state.product.widthMm}×${state.product.heightMm} mm):</span><strong>${q.panels} szt.</strong></div>
      <div class="fz-studio__row"><span>Cena łączna brutto:</span><strong style="font-size:20px;color:var(--fz-noce-deep);">${fmt(q.total)}</strong></div>
    `;
  }
}

// ── Export HD PNG Visualization ──────────────────────────────────────
document.getElementById('fz-3d-export')?.addEventListener('click', () => {
  renderer.render(scene, camera);
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, 0, 0);

  // Subtle architectural spec footer on exported visualization
  const barH = Math.max(46, Math.round(out.height * 0.065));
  ctx.fillStyle = 'rgba(22, 13, 9, 0.84)';
  ctx.fillRect(0, out.height - barH, out.width, barH);
  ctx.fillStyle = '#e8c074';
  ctx.font = `500 ${Math.round(barH * 0.36)}px Georgia, serif`;
  ctx.fillText('FREZZE', 24, out.height - barH * 0.34);

  const q = getQuote();
  ctx.fillStyle = '#f2ece0';
  ctx.font = `${Math.round(barH * 0.3)}px system-ui, sans-serif`;
  ctx.fillText(
    `${state.product.name} (${state.product.sku}) · ${q.finishName} · Ściana ${state.wallW.toFixed(1)}×${state.wallH.toFixed(1)} m (${q.panels} płyt · ${fmt(q.total)})`,
    130,
    out.height - barH * 0.34
  );

  const a = document.createElement('a');
  a.download = `frezze-wizualizacja-${state.product.sku}.png`;
  a.href = out.toDataURL('image/png');
  a.click();
});

// ── Add Configured Wall to Cart ──────────────────────────────────────
document.getElementById('fz-3d-add-cart')?.addEventListener('click', () => {
  const q = getQuote();
  const CART_KEY = 'frezze_cart_v1';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch {}
  const key = `${state.product.sku}::${q.finishName}`;
  const existing = cart.find((x) => x.key === key);
  if (existing) existing.qty += q.panels;
  else {
    cart.push({
      key,
      sku: state.product.sku,
      name: state.product.fullName,
      price: q.unitPrice,
      image: `${BASE_PATH}${state.product.image}`,
      finish: q.finishName,
      qty: q.panels
    });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.location.href = `${BASE_PATH}/koszyk/`;
});

// ── UI Bindings ──────────────────────────────────────────────────────
const modelSelect = document.getElementById('fz-3d-model');
if (modelSelect) {
  modelSelect.value = state.product.sku;
  modelSelect.addEventListener('change', () => {
    state.product = CATALOG.find((p) => p.sku === modelSelect.value) || CATALOG[0];
    applyPanelAppearance();
  });
}

document.querySelectorAll('[data-3d-finish]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-3d-finish]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.finish = btn.dataset['3dFinish'];
    applyPanelAppearance();
  });
});

document.querySelectorAll('[data-3d-room]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-3d-room]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.room = btn.dataset['3dRoom'];
    buildRoomEnvironment();
    updateLighting();
  });
});

document.querySelectorAll('[data-3d-orient]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-3d-orient]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.orientation = btn.dataset['3dOrient'];
    buildPanelWall();
  });
});

document.querySelectorAll('[data-3d-cam]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-3d-cam]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const c = btn.dataset['3dCam'];
    if (c === 'room') moveCamera([0.4, 1.55, 5.2], [0, 1.35, 0]);
    if (c === 'macro') moveCamera([0.15, 1.45, 1.65], [0, 1.4, 0]);
    if (c === 'raking') moveCamera([-2.8, 1.5, 2.3], [0.2, 1.35, 0]);
  });
});

document.getElementById('fz-3d-w')?.addEventListener('input', (e) => {
  state.wallW = parseFloat(e.target.value);
  document.getElementById('fz-3d-w-val').textContent = state.wallW.toFixed(1) + ' m';
  buildPanelWall();
  buildRoomEnvironment();
  updateSummaryUI();
});

document.getElementById('fz-3d-h')?.addEventListener('input', (e) => {
  state.wallH = parseFloat(e.target.value);
  document.getElementById('fz-3d-h-val').textContent = state.wallH.toFixed(1) + ' m';
  buildPanelWall();
  buildRoomEnvironment();
  updateSummaryUI();
});

document.getElementById('fz-3d-sun')?.addEventListener('input', (e) => {
  state.sunTime = parseFloat(e.target.value);
  updateLighting();
});

document.getElementById('fz-3d-led')?.addEventListener('change', (e) => {
  state.ledOn = e.target.checked;
  updateLighting();
});

document.getElementById('fz-3d-led-temp')?.addEventListener('change', (e) => {
  state.ledTemp = e.target.value;
  updateLighting();
});

document.getElementById('fz-3d-relief')?.addEventListener('input', (e) => {
  state.relief = parseFloat(e.target.value);
  panelMaterial.normalScale.set(state.relief, state.relief);
});

// ── Resize & Animation Loop ──────────────────────────────────────────
function resize() {
  const rect = stageEl.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height, false);
}
window.addEventListener('resize', resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  if (camTween) {
    camTween.t = Math.min(1, camTween.t + 0.05);
    const ease = 1 - Math.pow(1 - camTween.t, 3);
    camera.position.lerpVectors(camTween.startPos, camTween.endPos, ease);
    controls.target.lerpVectors(camTween.startTarget, camTween.endTarget, ease);
    if (camTween.t >= 1) camTween = null;
  }
  controls.update();
  renderer.render(scene, camera);
}

applyPanelAppearance();
animate();
