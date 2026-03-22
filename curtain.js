// ═══════════════════════════════════════
// THREE.JS CURTAIN ENTRANCE — v4
// With candelabra reveal scene
// ═══════════════════════════════════════

(function() {
  const overlay = document.getElementById('curtain');
  const enterBtn = document.getElementById('enter-btn');
  const canvas = document.getElementById('curtain-canvas');
  const site = document.getElementById('site');

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

  // ─── Base Lighting ───
  scene.add(new THREE.AmbientLight(0x1a0808, 0.3));

  const topSpot = new THREE.SpotLight(0xffaa80, 2.2, 20, Math.PI / 4, 0.4, 1);
  topSpot.position.set(0, 6, 5);
  topSpot.target.position.set(0, -2, 0);
  topSpot.castShadow = true;
  scene.add(topSpot);
  scene.add(topSpot.target);

  const sideL = new THREE.DirectionalLight(0xcc4422, 0.5);
  sideL.position.set(-5, 2, 3);
  scene.add(sideL);

  const sideR = new THREE.DirectionalLight(0xcc4422, 0.5);
  sideR.position.set(5, 2, 3);
  scene.add(sideR);

  const front = new THREE.PointLight(0x440a0a, 0.4, 10);
  front.position.set(0, 0, 4);
  scene.add(front);

  // ─── Texture ───
  const texLoader = new THREE.TextureLoader();
  const curtainTex = texLoader.load('img/curtain-texture.jpg');
  curtainTex.wrapS = THREE.RepeatWrapping;
  curtainTex.wrapT = THREE.RepeatWrapping;

  // ─── Calculate viewport size at z=0 ───
  function getViewSize(z) {
    z = z || camera.position.z;
    const vFov = camera.fov * Math.PI / 180;
    const h = 2 * Math.tan(vFov / 2) * z;
    const w = h * camera.aspect;
    return { w, h };
  }

  // ═══════════════════════════════════════
  // CANDELABRA SCENE (behind curtains)
  // ═══════════════════════════════════════

  const candelabraGroup = new THREE.Group();
  candelabraGroup.position.z = -1.5; // Behind the curtain planes
  scene.add(candelabraGroup);

  const candelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.9,
    roughness: 0.3,
  });

  const candleMat = new THREE.MeshStandardMaterial({
    color: 0xddd8c8,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Flame material (emissive, starts dark)
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
  });

  const flameLights = [];
  const flameOrbs = [];

  function buildCandelabra(xPos) {
    const group = new THREE.Group();
    group.position.x = xPos;
    group.position.y = -0.3;

    // Base plate
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 0.08, 16),
      candelMat
    );
    base.position.y = -1.2;
    group.add(base);

    // Base ring
    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.03, 8, 16),
      candelMat
    );
    baseRing.position.y = -1.16;
    baseRing.rotation.x = Math.PI / 2;
    group.add(baseRing);

    // Central pillar
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 1.8, 8),
      candelMat
    );
    pillar.position.y = -0.2;
    group.add(pillar);

    // Decorative knob mid-pillar
    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      candelMat
    );
    knob.position.y = -0.5;
    group.add(knob);

    // Arms and candles
    const armAngles = [-0.6, -0.3, 0, 0.3, 0.6]; // 5 candles
    const armHeights = [0.4, 0.6, 0.8, 0.6, 0.4];
    const armLengths = [0.45, 0.3, 0, 0.3, 0.45];

    armAngles.forEach((angle, i) => {
      const h = armHeights[i];
      const len = armLengths[i];
      const dir = Math.sign(angle) || 0;

      if (len > 0) {
        // Curved arm (approximated with angled cylinder)
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.025, len + 0.1, 6),
          candelMat
        );
        arm.position.set(dir * len * 0.5, h - 0.15, 0);
        arm.rotation.z = -angle * 0.8;
        group.add(arm);

        // Small curl at end
        const curl = new THREE.Mesh(
          new THREE.TorusGeometry(0.04, 0.012, 6, 8, Math.PI),
          candelMat
        );
        curl.position.set(dir * len, h - 0.05, 0);
        curl.rotation.y = dir > 0 ? 0 : Math.PI;
        group.add(curl);
      }

      // Candle holder (small dish)
      const holder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.04, 0.04, 8),
        candelMat
      );
      const cx = dir * len;
      const cy = h;
      holder.position.set(cx, cy, 0);
      group.add(holder);

      // Candle
      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.028, 0.15, 6),
        candleMat
      );
      candle.position.set(cx, cy + 0.095, 0);
      group.add(candle);

      // Flame orb (starts invisible)
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        flameMat.clone()
      );
      flame.position.set(cx, cy + 0.19, 0);
      flame.scale.set(0.3, 0.6, 0.3);
      group.add(flame);
      flameOrbs.push(flame);

      // Point light at flame (starts at 0 intensity)
      const light = new THREE.PointLight(0xff6622, 0, 3, 2);
      light.position.set(cx + xPos, cy - 0.1, -1.5); // world position
      scene.add(light);
      flameLights.push(light);
    });

    candelabraGroup.add(group);
    return group;
  }

  buildCandelabra(-1.8);
  buildCandelabra(1.8);

  // ─── Title text (canvas texture on plane, behind curtains) ───
  const titleGroup = new THREE.Group();
  titleGroup.position.z = -1.5;
  scene.add(titleGroup);

  function createTitlePlane() {
    const texCanvas = document.createElement('canvas');
    const w = 1024;
    const h = 256;
    texCanvas.width = w;
    texCanvas.height = h;
    const ctx = texCanvas.getContext('2d');

    ctx.clearRect(0, 0, w, h);

    // Title text
    ctx.fillStyle = '#d4c4b0';
    ctx.font = '700 52px "Cinzel Decorative", "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE DARK', w / 2, h * 0.35);
    ctx.fillText('MASQUERADE', w / 2, h * 0.65);

    const tex = new THREE.CanvasTexture(texCanvas);
    tex.needsUpdate = true;

    const aspect = w / h;
    const planeH = 1.2;
    const planeW = planeH * aspect;

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.1,
      emissive: 0xd4c4b0,
      emissiveMap: tex,
      emissiveIntensity: 0, // starts dark
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.1,
    });

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeW, planeH),
      mat
    );
    plane.position.y = 0.1;
    titleGroup.add(plane);
    return { mat, plane };
  }

  // Delay title creation slightly to let fonts load
  let titleMat = null;
  setTimeout(() => {
    const result = createTitlePlane();
    titleMat = result.mat;
  }, 500);

  // ═══════════════════════════════════════
  // CURTAIN PANELS
  // ═══════════════════════════════════════

  let curtains = [];
  let valance, rod;

  function buildCurtainPanels() {
    curtains.forEach(m => scene.remove(m));
    if (valance) scene.remove(valance);
    if (rod) scene.remove(rod);
    curtains = [];

    const view = getViewSize();
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

        const nx = (x / panelW) + 0.5;
        const ny = (y / panelH) + 0.5;
        const centerNx = side === 'left' ? nx : (1 - nx);

        const foldCount = Math.floor(panelW * 3.5);
        const foldAmp = 0.35;
        let z = Math.sin(nx * foldCount * Math.PI) * foldAmp;
        z += Math.sin(nx * foldCount * 2.3 * Math.PI) * 0.08;
        z *= (0.7 + centerNx * 0.6);

        const topGather = Math.pow(Math.max(0, 1 - ny), 4) * 0.3;
        z += topGather;
        z += Math.sin(ny * Math.PI) * 0.12;
        z += Math.pow(ny, 3) * 0.08;

        pos.setXYZ(i, x, y, z);
        originals[i * 3] = x;
        originals[i * 3 + 1] = y;
        originals[i * 3 + 2] = z;

        uv.setXY(i, nx * 3, ny * 1);
      }

      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        map: curtainTex,
        roughness: 0.65,
        metalness: 0.08,
        side: THREE.FrontSide,
        color: 0x6b1515,
        bumpMap: curtainTex,
        bumpScale: 0.02,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const xPos = side === 'left' ? -(panelW * 0.48) : (panelW * 0.48);
      mesh.position.set(xPos, 0, 0);

      mesh.userData = { side, originals, origX: xPos, panelW };
      scene.add(mesh);
      curtains.push(mesh);
      return mesh;
    }

    buildPanel('left');
    buildPanel('right');

    // Valance
    const vGeo = new THREE.BoxGeometry(view.w * 1.2, 0.5, 1);
    const vMat = new THREE.MeshStandardMaterial({ color: 0x2a0505, roughness: 0.9 });
    valance = new THREE.Mesh(vGeo, vMat);
    valance.position.set(0, view.h * 0.575 + 0.1, 0.3);
    scene.add(valance);

    // Rod
    const rGeo = new THREE.CylinderGeometry(0.03, 0.03, view.w * 1.1, 16);
    const rMat = new THREE.MeshStandardMaterial({ color: 0x8a6b2a, metalness: 0.85, roughness: 0.2 });
    rod = new THREE.Mesh(rGeo, rMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, view.h * 0.555, 0.35);
    scene.add(rod);
  }

  buildCurtainPanels();

  // ═══════════════════════════════════════
  // ANIMATION SEQUENCE
  // ═══════════════════════════════════════

  let time = 0;
  let isOpening = false;
  let openTime = 0; // time since enter was clicked

  // Phase timing (seconds):
  // 0.0 - 2.0: Flames ignite, text illuminates (curtains still closed)
  // 2.0 - 5.0: Curtains part
  // 4.0 - 6.0: Candelabra scene fades, main site fades in
  // 6.0+: Done

  const FLAME_START = 0;
  const FLAME_FULL = 2.0;
  const CURTAIN_START = 1.5;
  const CURTAIN_DURATION = 3.0;
  const SITE_FADE_START = 3.5;
  const SITE_FADE_DURATION = 2.0;
  const CANDELABRA_FADE_START = 4.0;
  const CANDELABRA_FADE_DURATION = 1.5;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;

    // Gentle sway on curtain folds
    curtains.forEach(mesh => {
      const pos = mesh.geometry.attributes.position;
      const orig = mesh.userData.originals;
      for (let i = 0; i < pos.count; i++) {
        const oz = orig[i * 3 + 2];
        const oy = orig[i * 3 + 1];
        const ox = orig[i * 3];
        const wave = Math.sin(time * 0.5 + oy * 1.2 + ox * 0.5) * 0.02;
        pos.setZ(i, oz + wave);
      }
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    });

    // Light flicker
    topSpot.intensity = 2.2 + Math.sin(time * 1.5) * 0.3 + Math.sin(time * 5.1) * 0.1;

    // Flame flicker (even after fully lit)
    flameOrbs.forEach((orb, i) => {
      const flicker = 0.9 + Math.sin(time * 8 + i * 2.1) * 0.1 + Math.sin(time * 13.7 + i * 3.3) * 0.05;
      orb.scale.y = 0.6 * flicker;
    });

    if (isOpening) {
      openTime += 0.016;

      // ── Phase 1: Flames ignite ──
      const flameProgress = Math.min(Math.max((openTime - FLAME_START) / (FLAME_FULL - FLAME_START), 0), 1);
      const flameEase = 1 - Math.pow(1 - flameProgress, 3); // ease out

      flameLights.forEach((light, i) => {
        const delay = i * 0.05; // stagger each flame slightly
        const p = Math.min(Math.max((openTime - delay) / (FLAME_FULL - FLAME_START), 0), 1);
        const e = 1 - Math.pow(1 - p, 3);
        light.intensity = e * 1.2;
        // Flicker
        light.intensity *= (0.85 + Math.sin(time * 7 + i * 1.7) * 0.15);
      });

      flameOrbs.forEach((orb, i) => {
        const delay = i * 0.05;
        const p = Math.min(Math.max((openTime - delay) / (FLAME_FULL - FLAME_START), 0), 1);
        const e = 1 - Math.pow(1 - p, 3);
        orb.material.opacity = e;
        orb.material.color.setHex(0xff6622);
      });

      // Title text illumination
      if (titleMat) {
        titleMat.emissiveIntensity = flameEase * 0.6;
      }

      // ── Phase 2: Curtains part ──
      const curtainProgress = Math.min(Math.max((openTime - CURTAIN_START) / CURTAIN_DURATION, 0), 1);
      const curtainEase = 1 - Math.pow(1 - curtainProgress, 3);

      curtains.forEach(mesh => {
        const dir = mesh.userData.side === 'left' ? -1 : 1;
        mesh.position.x = mesh.userData.origX + dir * curtainEase * mesh.userData.panelW * 1.2;
        mesh.scale.x = 1 - curtainEase * 0.35;
      });

      // Curtain content (text overlay) fades out quickly
      const contentFade = Math.min(openTime * 3, 1);
      document.querySelector('.curtain-content').style.opacity = String(1 - contentFade);

      // ── Phase 3: Main site fades in ──
      const siteFadeProgress = Math.min(Math.max((openTime - SITE_FADE_START) / SITE_FADE_DURATION, 0), 1);
      site.style.opacity = String(siteFadeProgress);

      // ── Phase 4: Candelabra scene fades ──
      const candelFadeProgress = Math.min(Math.max((openTime - CANDELABRA_FADE_START) / CANDELABRA_FADE_DURATION, 0), 1);
      candelabraGroup.children.forEach(child => {
        child.traverse(obj => {
          if (obj.material) {
            obj.material.transparent = true;
            obj.material.opacity = 1 - candelFadeProgress;
          }
        });
      });
      titleGroup.traverse(obj => {
        if (obj.material) {
          obj.material.opacity = 1 - candelFadeProgress;
        }
      });
      flameLights.forEach(light => {
        light.intensity *= (1 - candelFadeProgress);
      });

      // ── Done ──
      if (openTime >= CANDELABRA_FADE_START + CANDELABRA_FADE_DURATION + 0.5) {
        overlay.classList.add('gone');
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  // ─── Trigger open ───
  function triggerOpen() {
    if (isOpening) return;
    isOpening = true;
    document.body.classList.remove('locked');
  }
  enterBtn.addEventListener('click', triggerOpen);
  enterBtn.addEventListener('touchend', (e) => { e.preventDefault(); triggerOpen(); });

  // Skip intro — instant jump
  const skipBtn = document.getElementById('skip-btn');
  function skipIntro() {
    overlay.classList.add('gone');
    document.body.classList.remove('locked');
    site.style.opacity = '1';
  }
  skipBtn.addEventListener('click', skipIntro);
  skipBtn.addEventListener('touchend', (e) => { e.preventDefault(); skipIntro(); });

  // ─── Resize ───
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    buildCurtainPanels();
  });
})();
