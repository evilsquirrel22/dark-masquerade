// ═══════════════════════════════════════
// THREE.JS CURTAIN ENTRANCE
// ═══════════════════════════════════════

(function() {
  const overlay = document.getElementById('curtain');
  const enterBtn = document.getElementById('enter-btn');
  const canvas = document.getElementById('curtain-canvas');

  // ─── Scene setup ───
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // ─── Lighting ───
  const ambient = new THREE.AmbientLight(0x220808, 0.6);
  scene.add(ambient);

  const spot = new THREE.SpotLight(0xff3030, 1.5, 20, Math.PI / 4, 0.5);
  spot.position.set(0, 5, 4);
  spot.castShadow = true;
  scene.add(spot);

  const rim = new THREE.PointLight(0x8b1a1a, 0.8, 10);
  rim.position.set(0, 0, 3);
  scene.add(rim);

  // ─── Curtain geometry ───
  const segW = 60;
  const segH = 80;
  const curtainWidth = 3.5;
  const curtainHeight = 6;

  function createCurtain(xOffset, side) {
    const geo = new THREE.PlaneGeometry(curtainWidth, curtainHeight, segW, segH);
    const pos = geo.attributes.position;

    // Add wave/fold deformation
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const foldDepth = 0.15;
      const foldFreq = 8;
      const z = Math.sin(x * foldFreq) * foldDepth;
      // Add slight draping curve
      const drape = Math.pow((y / curtainHeight + 0.5), 2) * 0.1;
      pos.setZ(i, z + drape);
    }
    geo.computeVertexNormals();

    const tex = new THREE.TextureLoader().load('img/curtain-texture.jpg', (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1.5, 2);
    });

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
      color: 0xcc2020,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = xOffset;
    mesh.position.y = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { 
      side, 
      originalX: xOffset,
      originalPositions: pos.array.slice() 
    };

    scene.add(mesh);
    return mesh;
  }

  const leftCurtain = createCurtain(-1.7, 'left');
  const rightCurtain = createCurtain(1.7, 'right');

  // ─── Subtle sway animation ───
  let time = 0;
  let isOpening = false;
  let openProgress = 0;

  function swayFolds(mesh, t) {
    const pos = mesh.geometry.attributes.position;
    const orig = mesh.userData.originalPositions;
    for (let i = 0; i < pos.count; i++) {
      const ox = orig[i * 3];
      const oy = orig[i * 3 + 1];
      const oz = orig[i * 3 + 2];
      // Gentle wave
      const wave = Math.sin(t * 0.8 + oy * 2 + ox * 3) * 0.02;
      pos.setZ(i, oz + wave);
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  function openCurtains(progress) {
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const spread = ease * 5;
    leftCurtain.position.x = leftCurtain.userData.originalX - spread;
    rightCurtain.position.x = rightCurtain.userData.originalX + spread;

    // Bunch up the curtains as they open
    leftCurtain.scale.x = 1 - ease * 0.3;
    rightCurtain.scale.x = 1 - ease * 0.3;

    // Fade out overlay
    overlay.style.opacity = 1 - ease;
  }

  // ─── Render loop ───
  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;

    if (!isOpening) {
      swayFolds(leftCurtain, time);
      swayFolds(rightCurtain, time);
      // Subtle light flicker
      spot.intensity = 1.5 + Math.sin(time * 2) * 0.2;
    } else {
      openProgress += 0.008;
      if (openProgress >= 1) {
        openProgress = 1;
        overlay.classList.add('gone');
        return;
      }
      openCurtains(openProgress);
    }

    renderer.render(scene, camera);
  }
  animate();

  // ─── Open handler ───
  function triggerOpen() {
    if (isOpening) return;
    isOpening = true;
    document.body.classList.remove('locked');
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
