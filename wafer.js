// The hero's nearly-met goal as a silicon wafer: 100 dies, one per percent of Intel's
// electricity use, lit in prober order up to 99, the renewable share reported for 2025.
// Progressive enhancement: without WebGL or JavaScript the caption still carries the number.
const LIT = 99;
const DIES = 100;

const stage = document.querySelector(".wafer-stage");
const canvas = document.querySelector(".wafer-canvas");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Load three.js after first paint so the page's text and charts never wait on it.
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
if (stage && canvas) idle(() => start().catch(() => stage.classList.add("is-unavailable")));

async function start() {
  const THREE = await import("./assets/vendor/three.module.min.js");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 3.1, 3.3);
  camera.lookAt(0, -0.12, 0);

  // Reflections come from a small "cleanroom": white ceiling panels and one amber lithography bay light.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new THREE.Scene();
  const panel = (color, w, h, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.rotation.set(...rot);
    room.add(m);
  };
  room.background = new THREE.Color(0x77736c);
  panel(0xffffff, 8, 2, [0, 4, 0], [Math.PI / 2, 0, 0]);
  panel(0xfff3dc, 8, 3, [0, 2, -4], [0, 0, 0]);
  panel(0xffffff, 1.2, 6, [3, 4, 0], [Math.PI / 2, 0, 0]);
  panel(0xffb02e, 5, 2.4, [-4, 1.5, -2], [0, Math.PI / 3, 0]);
  panel(0x9fb4ff, 3, 2, [4, 1, 3], [0, -Math.PI / 2.5, 0]);
  scene.environment = pmrem.fromScene(room, 0.03).texture;

  const wafer = new THREE.Group();
  wafer.rotation.x = 0.08;
  scene.add(wafer);

  // Bare silicon: mirror-like, with the thin-film interference that gives wafers their rainbow sheen.
  const discShape = new THREE.Shape();
  discShape.absarc(0, 0, 1, Math.PI * 0.53, Math.PI * 2.47, false); // the gap is the orientation notch
  discShape.lineTo(0, 0.95);
  const disc = new THREE.Mesh(
    new THREE.ExtrudeGeometry(discShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, curveSegments: 96 }),
    new THREE.MeshPhysicalMaterial({
      color: 0x8d93a3,
      metalness: 0.9,
      roughness: 0.22,
      iridescence: 1,
      iridescenceIOR: 1.7,
      iridescenceThicknessRange: [180, 520],
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -0.035;
  wafer.add(disc);

  // 100 dies: the grid cells closest to the center, then ordered the way a wafer prober walks them (serpentine rows).
  const pitch = 0.15; // 104 cells fit inside the edge exclusion; the 100 nearest the center are used
  const cells = [];
  for (let r = -7; r <= 7; r++) for (let c = -7; c <= 7; c++) {
    const x = (c + 0.5) * pitch;
    const z = (r + 0.5) * pitch;
    const far = Math.hypot(Math.abs(x) + pitch / 2, Math.abs(z) + pitch / 2);
    if (far < 0.95) cells.push({ r, c, x, z, d: Math.hypot(x, z) });
  }
  const ordered = cells.sort((a, b) => a.d - b.d).slice(0, DIES)
    .sort((a, b) => a.r - b.r || (a.r % 2 === 0 ? a.c - b.c : b.c - a.c));
  // The one die short of the goal sits inside the wafer, where it reads as missing rather than as an edge.
  const gap = ordered.reduce((best, d) => (Math.hypot(d.x - 0.25, d.z - 0.25) < Math.hypot(best.x - 0.25, best.z - 0.25) ? d : best));
  const dies = [...ordered.filter((d) => d !== gap), gap];
  // The picture must hold exactly the number the caption states, or it does not render at all.
  if (dies.length !== DIES) throw new Error(`wafer has ${dies.length} dies, expected ${DIES}`);

  const dieGeo = new THREE.BoxGeometry(pitch * 0.84, 0.014, pitch * 0.84);
  const base = new THREE.InstancedMesh(dieGeo, new THREE.MeshStandardMaterial({ color: 0x2a2c33, metalness: 0.6, roughness: 0.35 }), DIES);
  const lit = new THREE.InstancedMesh(
    dieGeo,
    new THREE.MeshStandardMaterial({ color: 0xff9f1c, emissive: 0xff7a00, emissiveIntensity: 0.9, metalness: 0.1, roughness: 0.5 }),
    LIT,
  );
  const m = new THREE.Matrix4();
  dies.forEach((d, i) => {
    m.makeTranslation(d.x, 0.008, d.z);
    base.setMatrixAt(i, m);
    if (i < LIT) {
      m.makeTranslation(d.x, 0.01, d.z);
      lit.setMatrixAt(i, m);
    }
  });
  wafer.add(base, lit);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3020, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2, 4, 3);
  scene.add(key);

  function resize() {
    const size = Math.round(stage.clientWidth);
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    render();
  }

  const render = () => renderer.render(scene, camera);
  new ResizeObserver(resize).observe(stage);
  resize();

  if (still) {
    lit.count = LIT;
    wafer.rotation.y = -0.5;
    render();
    stage.classList.add("is-ready");
    return;
  }

  // Probe sequence: dies light one by one up to 99, then the wafer turns slowly.
  lit.count = 0;
  let visible = true;
  let probeStart = null;
  let last = performance.now();
  let tiltX = 0;
  let tiltTarget = 0;

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) requestAnimationFrame(frame);
  }).observe(stage);
  document.addEventListener("visibilitychange", () => !document.hidden && visible && requestAnimationFrame(frame));

  if (matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", (e) => {
      tiltTarget = (e.clientY / innerHeight - 0.5) * 0.25;
    }, { passive: true });
  }

  stage.classList.add("is-ready");

  let running = false;
  function frame(now) {
    if (running && now === undefined) return;
    if (!visible || document.hidden) {
      running = false;
      return;
    }
    running = true;
    now ??= performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    probeStart ??= now + 350;
    const t = Math.min(1, Math.max(0, (now - probeStart) / 2000));
    lit.count = Math.round((1 - (1 - t) ** 3) * LIT);

    wafer.rotation.y += dt * 0.16;
    tiltX += (tiltTarget - tiltX) * 0.06;
    wafer.rotation.x = 0.08 + tiltX;
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
