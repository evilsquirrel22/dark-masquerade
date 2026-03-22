// ═══════════════════════════════════════
// THE DARK MASQUERADE — v2
// ═══════════════════════════════════════

// Curtain is handled by curtain.js (Three.js)
document.body.classList.add('locked');

// ─── Particles ───
(function() {
  const c = document.getElementById('particles');
  const ctx = c.getContext('2d');
  let w, h, pts = [];

  function resize() {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 40; i++) {
    pts.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -Math.random() * 0.4 - 0.1,
      o: Math.random() * 0.4 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(181, 37, 37, ${p.o})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10 || p.x > w + 10) p.dx *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── Countdown ───
const TARGET = new Date('2027-10-31T19:00:00-05:00');
function tick() {
  const d = TARGET - new Date();
  if (d <= 0) { document.getElementById('countdown').innerHTML = '<p style="color:var(--red);font-family:Cinzel,serif">The Night Has Arrived</p>'; return; }
  const s = n => String(n).padStart(2, '0');
  document.getElementById('cd-d').textContent = Math.floor(d / 864e5);
  document.getElementById('cd-h').textContent = s(Math.floor(d / 36e5) % 24);
  document.getElementById('cd-m').textContent = s(Math.floor(d / 6e4) % 60);
  document.getElementById('cd-s').textContent = s(Math.floor(d / 1e3) % 60);
}
tick(); setInterval(tick, 1000);

// ─── Scroll reveal ───
const obs = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.section').forEach(s => obs.observe(s));

// ─── Houses ───
const HOUSES = {
  strigoi: { icon: '🦇', name: 'House Strigoi', desc: 'You are tradition. Authority. The ancient ways run in your veins. Welcome to the oldest bloodline.' },
  obayifo: { icon: '🌑', name: 'House Obayifo', desc: 'You see what others miss. The shadows are yours — and so are everyone\'s secrets.' },
  camazotz: { icon: '🦅', name: 'House Camazotz', desc: 'You are fire and devotion. The blood rites are sacred, and you guard them with your life.' },
  jiang: { icon: '🌙', name: 'House Jiang', desc: 'You refuse cages. Art, knowledge, connection — the future belongs to those who imagine it.' }
};

// ─── RSVP ───
document.getElementById('btn-quiz').addEventListener('click', () => {
  const n = document.getElementById('f-name').value.trim();
  const e = document.getElementById('f-email').value.trim();
  if (!n || !e) return alert('Please enter your name and email.');
  document.getElementById('step-info').hidden = true;
  document.getElementById('step-quiz').hidden = false;
  document.getElementById('step-quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('rsvp-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const ans = {};
  for (let i = 1; i <= 6; i++) {
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    if (!sel) return alert('Answer all questions.');
    ans[`q${i}`] = sel.value;
  }

  const sc = { strigoi:0, obayifo:0, camazotz:0, jiang:0 };
  Object.values(ans).forEach(v => sc[v]++);
  const ranked = Object.entries(sc).sort((a,b) => b[1] - a[1]);
  const top = ranked[0][0];

  const data = {
    name: document.getElementById('f-name').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    guests: +document.getElementById('f-guests').value,
    plusone: document.getElementById('f-plusone').value.trim(),
    dietary: document.getElementById('f-dietary').value.trim(),
    quizScores: sc, topHouse: top, secondHouse: ranked[1][0],
    ts: new Date().toISOString()
  };
  console.log('RSVP:', data);

  const h = HOUSES[top];
  document.getElementById('r-icon').textContent = h.icon;
  document.getElementById('r-house').textContent = h.name;
  document.getElementById('r-desc').textContent = h.desc;

  document.getElementById('r-bars').innerHTML = ranked.map(([k, s]) => {
    const hh = HOUSES[k]; const pct = Math.round(s / 6 * 100);
    return `<div class="bar-row">
      <span class="bar-icon">${hh.icon}</span>
      <span class="bar-name">${hh.name.replace('House ','')}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <span class="bar-pct">${pct}%</span>
    </div>`;
  }).join('');

  this.hidden = true;
  document.getElementById('result').hidden = false;
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('f-guests').addEventListener('change', function() {
  const pg = document.getElementById('f-plusone').closest('.field');
  pg.style.opacity = this.value === '1' ? '0.4' : '1';
  if (this.value === '1') document.getElementById('f-plusone').value = '';
});
