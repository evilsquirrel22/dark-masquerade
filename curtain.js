// ═══════════════════════════════════════
// THREE.JS CURTAIN ENTRANCE — v3
// ═══════════════════════════════════════

(function() {
  const overlay = document.getElementById('curtain');
  const enterBtn = document.getElementById('enter-btn');
  const canvas = document.getElementById('curtain-canvas');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030101);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5.5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  // ─── Lighting for fold visibility ───
  scene.add(new THREE.AmbientLight(0x1a0808, 0.3));

  // Strong top-down spot to rake across folds
  const topSpot = new THREE.SpotLight(0xffaa80, 3, 20, Math.PI / 4, 0.4, 1);
  topSpot.position.set(0, 6, 5);
  topSpot.target.position.set(0, -2, 0);
  topSpot.castShadow = true;
  scene.add(topSpot);
  scene.add(topSpot.target);

  // Side lights to rake across folds horizontally — this is what makes folds visible
  const sideL = new THREE.DirectionalLight(0xcc4422, 0.8);
  sideL.position.set(-5, 2, 3);
  scene.add(sideL);

  const sideR = new THREE.DirectionalLight(0xcc4422, 0.8);
  sideR.position.set(5, 2, 3);
  scene.add(sideR);

  // Subtle front fill
  const front = new THREE.PointLight(0x440a0a, 0.4, 10);
  front.position.set(0, 0, 4);
  scene.add(front);

  // ─── Texture ───
  const texLoader = new THREE.TextureLoader();
  const curtainTex = texLoader.load('img/curtain-texture.jpg');
  curtainTex.wrapS = THREE.RepeatWrapping;
  curtainTex.wrapT = THREE.RepeatWrapping;

  // ─── Calculate size to fill viewport ───
  function getViewSize() {
    const vFov = camera.fov * Math.PI / 180;
    const h = 2 * Math.tan(vFov / 2) * camera.position.z;
    const w = h * camera.aspect;
    return { w, h };
  }

  let curtains = [];
  let valance, rod;

  function buildScene() {
    // Clear old
    curtains.forEach(m => scene.remove(m));
    if (valance) scene.remove(valance);
    if (rod) scene.remove(rod);
    curtains = [];

    const view = getViewSize();
    // Each panel needs to be slightly wider than half the screen
    const panelW = view.w * 0.55;
    const panelH = view.h * 1.15;
    const segX = 100;
    const segY = 80;

    function buildPanel(side) {
      const geo = new THREE.PlaneGeometry(panelW, panelH, segX, segY);
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      const originals = new Float32Array(pos.count * 3);

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);

        const nx = (x / panelW) + 0.5; // 0-1
        const ny = (y / panelH) + 0.5; // 0-1

        // Which edge faces center
        const centerNx = side === 'left' ? nx : (1 - nx);

        // ── Primary folds: deep sinusoidal ridges ──
        const foldCount = Math.floor(panelW * 3.5);
        const foldAmp = 0.35;
        let z = Math.sin(nx * foldCount * Math.PI) * foldAmp;

        // ── Secondary fold variation ──
        z += Math.sin(nx * foldCount * 2.3 * Math.PI) * 0.08;

        // ── Folds get deeper near center (gathered) ──
        z *= (0.7 + centerNx * 0.6);

        // ── Top gathering — folds compress at rod ──
        const topGather = Math.pow(Math.max(0, 1 - ny), 4) * 0.3;
        z += topGather;

        // ── Gentle billow outward in middle ──
        z += Math.sin(ny * Math.PI) * 0.12;

        // ── Bottom weight — slight forward lean at hem ──
        z += Math.pow(ny, 3) * 0.08;

        pos.setXYZ(i, x, y, z);
        originals[i * 3] = x;
        originals[i * 3 + 1] = y;
        originals[i * 3 + 2] = z;

        // UV tiling
        uv.setXY(i, nx * 2.5, ny * 3);
      }

      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        map: curtainTex,
        roughness: 0.65,
        metalness: 0.08,
        side: THREE.FrontSide,
        color: 0xbb2020,
        bumpMap: curtainTex,
        bumpScale: 0.03,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Position so panels overlap at center with slight gap
      const xPos = side === 'left' ? -(panelW * 0.48) : (panelW * 0.48);
      mesh.position.set(xPos, 0, 0);

      mesh.userData = { side, originals, origX: xPos, panelW };
      scene.add(mesh);
      curtains.push(mesh);
      return mesh;
    }

    const left = buildPanel('left');
    const right = buildPanel('right');

    // Valance
    const vGeo = new THREE.BoxGeometry(view.w * 1.2, 0.5, 1);
    const vMat = new THREE.MeshStandardMaterial({ color: 0x2a0505, roughness: 0.9 });
    valance = new THREE.Mesh(vGeo, vMat);
    valance.position.set(0, panelH * 0.5 + 0.1, 0.3);
    scene.add(valance);

    // Gold rod
    const rGeo = new THREE.CylinderGeometry(0.03, 0.03, view.w * 1.1, 16);
    const rMat = new THREE.MeshStandardMaterial({ color: 0x8a6b2a, metalness: 0.85, roughness: 0.2 });
    rod = new THREE.Mesh(rGeo, rMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, panelH * 0.48, 0.35);
    scene.add(rod);

    return { left, right };
  }

  let panels = buildScene();

  // ─── Animation ───
  let time = 0;
  let isOpening = false;
  let openProgress = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;

    // Gentle sway on folds
    curtains.forEach(mesh => {
      const pos = mesh.geometry.attributes.position;
      const orig = mesh.userData.originals;
      for (let i = 0; i < pos.count; i++) {
        const oz = orig[i * 3 + 2];
        const oy = orig[i * 3 + 1];
        const ox = orig[i * 3];
        // Subtle breathing wave
        const wave = Math.sin(time * 0.5 + oy * 1.2 + ox * 0.5) * 0.02;
        pos.setZ(i, oz + wave);
      }
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    });

    // Light flicker
    topSpot.intensity = 3 + Math.sin(time * 1.5) * 0.4 + Math.sin(time * 5.1) * 0.15;

    // Opening
    if (isOpening) {
      openProgress = Math.min(openProgress + 0.005, 1);
      const ease = 1 - Math.pow(1 - openProgress, 3);

      curtains.forEach(mesh => {
        const dir = mesh.userData.side === 'left' ? -1 : 1;
        // Slide fully off screen
        mesh.position.x = mesh.userData.origX + dir * ease * mesh.userData.panelW * 1.2;
        // Bunch up
        mesh.scale.x = 1 - ease * 0.35;
      });

      // Content fades out before curtains finish
      const contentFade = Math.min(openProgress * 4, 1);
      document.querySelector('.curtain-content').style.opacity = String(1 - contentFade);

      if (openProgress >= 1) {
        overlay.classList.add('gone');
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  // ─── Open ───
  function triggerOpen() {
    if (isOpening) return;
    isOpening = true;
    document.body.classList.remove('locked');
  }
  enterBtn.addEventListener('click', triggerOpen);
  enterBtn.addEventListener('touchend', (e) => { e.preventDefault(); triggerOpen(); });

  // ─── Resize ───
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    panels = buildScene();
  });
})();
