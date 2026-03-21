// ═══════════════════════════════════════════
// The Dark Masquerade — Halloween 2027
// ═══════════════════════════════════════════

// Curtain Entrance
(function() {
  const overlay = document.getElementById('curtain-overlay');
  document.body.classList.add('curtain-locked');

  overlay.addEventListener('click', function() {
    overlay.classList.add('opening');
    document.body.classList.remove('curtain-locked');

    // Remove from DOM after animation
    setTimeout(() => {
      overlay.classList.add('gone');
    }, 2200);
  });
})();

// Countdown Timer
const TARGET = new Date('2027-10-31T19:00:00-05:00'); // 7 PM CDT

function updateCountdown() {
  const now = new Date();
  const diff = TARGET - now;

  if (diff <= 0) {
    document.getElementById('days').textContent = '🎭';
    document.getElementById('hours').textContent = 'The';
    document.getElementById('minutes').textContent = 'Night';
    document.getElementById('seconds').textContent = 'Is Here';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById('days').textContent = days;
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// House data
const HOUSES = {
  strigoi: { name: 'House Strigoi', icon: '🦇', title: 'The Old Blood', desc: 'You are tradition. You are authority. The ancient ways run in your veins, and you will not let them fade. Welcome to the oldest bloodline.' },
  obayifo: { name: 'House Obayifo', icon: '🌑', title: 'The Hidden Hand', desc: 'You see what others miss. You move in silence and strike with information, not force. The shadows are yours — and so are everyone\'s secrets.' },
  camazotz: { name: 'House Camazotz', icon: '🦅', title: 'The Sacred Fang', desc: 'You are fire and devotion. The blood rites are sacred, and you guard them with your life. When you fight, it is for something greater than yourself.' },
  jiang: { name: 'House Jiang', icon: '🌙', title: 'The Unbound', desc: 'You refuse to be caged by the old rules. Art, knowledge, connection — these are your weapons. The future belongs to those who imagine it.' },
  vetala: { name: 'House Vetala', icon: '❄️', title: 'The Unravelers', desc: 'You seek what lies beyond the known. Every boundary is a challenge, every limit a cage to be broken. The truth is out there — and you will find it.' }
};

// Step navigation
document.getElementById('btn-to-quiz').addEventListener('click', function() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  if (!name || !email) {
    alert('Please enter your name and email before continuing.');
    return;
  }
  document.getElementById('step-info').hidden = true;
  document.getElementById('step-quiz').hidden = false;
  document.getElementById('step-quiz').scrollIntoView({ behavior: 'smooth' });
});

// RSVP + Quiz Submit
document.getElementById('rsvp-form').addEventListener('submit', function(e) {
  e.preventDefault();

  // Validate quiz
  const answers = {};
  for (let i = 1; i <= 6; i++) {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (!selected) {
      alert('Please answer all questions before submitting.');
      return;
    }
    answers[`q${i}`] = selected.value;
  }

  // Tally scores
  const scores = { strigoi: 0, obayifo: 0, camazotz: 0, jiang: 0, vetala: 0 };
  Object.values(answers).forEach(v => scores[v]++);

  // Rank houses
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topHouse = ranked[0][0];
  const secondHouse = ranked[1][0];

  const data = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    guests: parseInt(document.getElementById('guests').value),
    plusone: document.getElementById('plusone').value.trim(),
    dietary: document.getElementById('dietary').value.trim(),
    quizAnswers: answers,
    quizScores: scores,
    topHouse: topHouse,
    secondHouse: secondHouse,
    timestamp: new Date().toISOString()
  };

  console.log('RSVP + Quiz Submitted:', data);

  // TODO: Wire up to API
  // fetch('/api/rsvp', { method: 'POST', body: JSON.stringify(data) })

  // Show result
  const house = HOUSES[topHouse];
  document.getElementById('result-icon').textContent = house.icon;
  document.getElementById('result-house').innerHTML = `The blood speaks: <span style="color:var(--gold)">${house.name}</span>`;
  document.getElementById('result-desc').textContent = house.desc;

  // Show ranking
  const resultsDiv = document.getElementById('house-results');
  resultsDiv.innerHTML = '<p class="house-rank-title">Your affinity:</p>' +
    ranked.map(([ key, score ], i) => {
      const h = HOUSES[key];
      const pct = Math.round((score / 6) * 100);
      return `<div class="house-rank">
        <span class="house-rank-icon">${h.icon}</span>
        <span class="house-rank-name">${h.name}</span>
        <div class="house-rank-bar"><div class="house-rank-fill" style="width:${pct}%"></div></div>
        <span class="house-rank-pct">${pct}%</span>
      </div>`;
    }).join('');

  this.hidden = true;
  document.getElementById('rsvp-success').hidden = false;
  document.getElementById('rsvp-success').scrollIntoView({ behavior: 'smooth' });
});

// Show/hide plus-one field based on guest count
document.getElementById('guests').addEventListener('change', function() {
  const plusoneGroup = document.getElementById('plusone').closest('.form-group');
  plusoneGroup.style.opacity = this.value === '1' ? '0.4' : '1';
  if (this.value === '1') {
    document.getElementById('plusone').value = '';
  }
});

// Smooth reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section').forEach(section => {
  section.style.animationPlayState = 'paused';
  observer.observe(section);
});
