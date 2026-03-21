// ═══════════════════════════════════════
// THREE.JS CURTAIN ENTRANCE — v2
// ═══════════════════════════════════════

(function() {
  const overlay = document.getElementById('curtain');
  const enterBtn = document.getElementById('enter-btn');
  const canvas = document.getElementById('curtain-canvas');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050202);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  // ─── Lighting ───
  scene.add(new THREE.AmbientLight(0x1a0505, 0.4));

  // Top spotlight - warm theatrical
  const topLight = new THREE.SpotLight(0xff6040, 2, 15, Math.PI / 5, 0.6, 1);
  topLight.position.set(0, 6, 4);
  topLight.target.position.set(0, -1, 0);
  scene.add(topLight);
  scene.add(topLight.target);

  // Side rim lights
  const rimL = new THREE.PointLight(0x8b1a1a, 0.6, 8);
  rimL.position.set(-4, 1, 3);
  scene.add(rimL);

  const rimR = new THREE.PointLight(0x8b1a1a, 0.6, 8);
  rimR.position.set(4, 1, 3);
  scene.add(rimR);

  // ─── Texture ───
  const texLoader = new THREE.TextureLoader();
  const curtainTex = texLoader.load('img/curtain-texture.jpg');
  curtainTex.wrapS = THREE.RepeatWrapping;
  curtainTex.wrapT = THREE.ClampToEdgeWrapping;

  // ─── Build a curtain panel with proper draping ───
  function buildCurtain(side) {
    const w = 4.0;
    const h = 7.0;
    const segX = 80;
    const segY = 60;
    const geo = new THREE.PlaneGeometry(w, h, segX, segY);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;

    // Store original positions
    const originals = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);

      // Normalized coords
      const nx = (x / w) + 0.5; // 0 to 1 across width
      const ny = (y / h) + 0.5; // 0 to 1 top to bottom

      // Main vertical folds - sinusoidal
      const foldFreq = 12;
      const foldAmp = 0.12;
      let z = Math.sin(nx * foldFreq * Math.PI) * foldAmp;

      // Deeper folds near the center edge (where curtains meet)
      const centerEdge = side === 'left' ? nx : (1 - nx);
      z += Math.sin(centerEdge * 20) * 0.06 * centerEdge;

      // Gather/bunch at the top (like tied to a rod)
      const gatherTop = Math.pow(1 - ny, 3) * 0.15;
      z += gatherTop;

      // Slight billow outward in the middle
      const billow = Math.sin(ny * Math.PI) * 0.15 * Math.sin(nx * Math.PI);
      z += billow;

      // Curve the curtain slightly inward at the center edge
      const inwardCurve = centerEdge * centerEdge * -0.3;
      z += inwardCurve;

      pos.setXYZ(i, x, y, z);
      originals[i * 3] = x;
      originals[i * 3 + 1] = y;
      originals[i * 3 + 2] = z;

      // Adjust UVs to tile the texture nicely
      uv.setXY(i, nx * 2, ny * 2.5);
    }

    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: curtainTex,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide,
      color: 0xaa1818,
    });

    const mesh = new THREE.Mesh(geo, mat);

    // Position: left curtain on left, right on right, with a small gap
    const xPos = side === 'left' ? -2.05 : 2.05;
    mesh.position.set(xPos, 0, 0);

    mesh.userData = { side, originals, origX: xPos };

    scene.add(mesh);
    return mesh;
  }

  const leftCurtain = buildCurtain('left');
  const rightCurtain = buildCurtain('right');

  // ─── Valance (top header) ───
  const valGeo = new THREE.BoxGeometry(10, 0.6, 0.8);
  const valMat = new THREE.MeshStandardMaterial({ color: 0x3a0808, roughness: 0.9 });
  const valance = new THREE.Mesh(valGeo, valMat);
  valance.position.set(0, 3.7, 0.2);
  scene.add(valance);

  // ─── Gold rod ───
  const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 10, 12);
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x8a6b2a, metalness: 0.8, roughness: 0.3 });
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, 3.35, 0.3);
  scene.add(rod);

  // ─── Animation ───
  let time = 0;
  let isOpening = false;
  let openProgress = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;

    // Gentle sway
    if (!isOpening) {
      [leftCurtain, rightCurtain].forEach(mesh => {
        const pos = mesh.geometry.attributes.position;
        const orig = mesh.userData.originals;
        for (let i = 0; i < pos.count; i++) {
          const oz = orig[i * 3 + 2];
          const oy = orig[i * 3 + 1];
          const wave = Math.sin(time * 0.6 + oy * 1.5) * 0.015;
          pos.setZ(i, oz + wave);
        }
        pos.needsUpdate = true;
      });

      // Light flicker
      topLight.intensity = 2 + Math.sin(time * 1.8) * 0.3 + Math.sin(time * 4.7) * 0.1;
    } else {
      // Opening animation
      openProgress = Math.min(openProgress + 0.006, 1);
      const ease = 1 - Math.pow(1 - openProgress, 4); // ease out quart

      leftCurtain.position.x = leftCurtain.userData.origX - ease * 4.5;
      rightCurtain.position.x = rightCurtain.userData.origX + ease * 4.5;

      // Compress horizontally as they bunch
      leftCurtain.scale.x = 1 - ease * 0.4;
      rightCurtain.scale.x = 1 - ease * 0.4;

      // Move valance and rod up and out
      valance.position.y = 3.7 + ease * 2;
      rod.position.y = 3.35 + ease * 2;

      // Fade overlay
      overlay.style.opacity = String(1 - ease);

      if (openProgress >= 1) {
        overlay.classList.add('gone');
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  // ─── Open handler ───
  function triggerOpen() {
    if (isOpening) return;
    isOpening = true;
    document.body.classList.remove('locked');
    document.querySelector('.curtain-content').style.transition = 'opacity 0.5s';
    document.querySelector('.curtain-content').style.opacity = '0';
  }

  enterBtn.addEventListener('click', triggerOpen);
  enterBtn.addEventListener('touchend', (e) => { e.preventDefault(); triggerOpen(); });

  // ─── Resize ───
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
