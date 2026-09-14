/**
 * Chunnu Munnu Channel Website — Interactive Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initVideoPlayer();
  initModal();
  initQuiz();
  initMobileNav();
});

/* ==========================================================================
   Video Player Controller
   ========================================================================== */
const videoPlayer = document.getElementById('mainVideoPlayer');
const videoSource = document.getElementById('videoSource');
const nowPlayingBadge = document.getElementById('nowPlayingBadge');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingDesc = document.getElementById('nowPlayingDesc');
const moralText = document.getElementById('moralText');
const playlistItems = document.querySelectorAll('.playlist-item');
const theaterToggle = document.getElementById('theaterModeToggle');

function initVideoPlayer() {
  if (!videoPlayer) return;

  playlistItems.forEach(item => {
    item.addEventListener('click', () => {
      const videoSrc = item.getAttribute('data-video');
      const posterSrc = item.getAttribute('data-poster');
      const badge = item.getAttribute('data-badge');
      const title = item.getAttribute('data-title');
      const moral = item.getAttribute('data-moral');
      const desc = item.getAttribute('data-desc');

      switchVideo(videoSrc, posterSrc, badge, title, moral, desc, item);
    });
  });

  if (theaterToggle) {
    theaterToggle.addEventListener('click', () => {
      const container = document.querySelector('.player-container');
      container.classList.toggle('theater-mode');
      if (container.classList.contains('theater-mode')) {
        theaterToggle.innerHTML = '<span>📺 Normal View</span>';
      } else {
        theaterToggle.innerHTML = '<span>🖥️ Theater Mode</span>';
      }
    });
  }
}

function switchVideo(src, poster, badge, title, moral, desc, activeItem) {
  playlistItems.forEach(i => {
    i.classList.remove('active');
    const badgeEl = i.querySelector('.now-badge');
    if (badgeEl) badgeEl.textContent = 'Play';
  });

  if (activeItem) {
    activeItem.classList.add('active');
    const badgeEl = activeItem.querySelector('.now-badge');
    if (badgeEl) badgeEl.textContent = 'Playing';
  }

  videoPlayer.pause();
  videoSource.src = src;
  videoPlayer.poster = poster;
  videoPlayer.load();

  if (nowPlayingBadge) nowPlayingBadge.textContent = badge;
  if (nowPlayingTitle) nowPlayingTitle.textContent = title;
  if (moralText) moralText.textContent = moral;
  if (nowPlayingDesc) nowPlayingDesc.textContent = desc;

  // Auto-play video on user interaction
  videoPlayer.play().catch(() => {
    // Autoplay policy fallback if needed
  });
}

// Global helper for episode cards
window.playEpisode = function(src, poster, badge, title, moral, desc) {
  const theaterSection = document.getElementById('theater');
  if (theaterSection) {
    theaterSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Find matching playlist item
  let targetItem = null;
  playlistItems.forEach(item => {
    if (item.getAttribute('data-video') === src) {
      targetItem = item;
    }
  });

  setTimeout(() => {
    switchVideo(src, poster, badge, title, moral, desc, targetItem);
  }, 400);
};

/* ==========================================================================
   Character Reference Sheet Modal
   ========================================================================== */
function initModal() {
  const modal = document.getElementById('charModal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');

  if (!modal || !openBtn || !closeBtn) return;

  const openModal = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playSfx('ding');
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   Interactive Kids Quiz Engine
   ========================================================================== */
let currentQuestion = 1;
let scores = { Chunnu: 0, Munnu: 0 };

function initQuiz() {
  // Quiz is initialized with default state
}

window.selectAnswer = function(qNum, choice) {
  playSfx('ding');
  
  if (choice === 'A') {
    scores.Chunnu++;
  } else {
    scores.Munnu++;
  }

  const currentStep = document.getElementById(`q${qNum}`);
  if (currentStep) currentStep.classList.remove('active');

  if (qNum < 3) {
    currentQuestion = qNum + 1;
    const nextStep = document.getElementById(`q${currentQuestion}`);
    if (nextStep) nextStep.classList.add('active');
    
    const progress = document.getElementById('quizProgress');
    if (progress) progress.style.width = `${(currentQuestion / 3) * 100}%`;
  } else {
    // Show results
    showQuizResult();
  }
};

function showQuizResult() {
  const progress = document.getElementById('quizProgress');
  if (progress) progress.style.width = '100%';

  const resultBox = document.getElementById('quizResult');
  const resultIcon = document.getElementById('resultIcon');
  const resultTitle = document.getElementById('resultTitle');
  const resultDesc = document.getElementById('resultDesc');

  if (scores.Chunnu >= scores.Munnu) {
    resultIcon.textContent = '👦🏽⚡';
    resultTitle.textContent = 'You are Chunnu! (The Bold Brother)';
    resultDesc.textContent = 'You are courageous, full of energy, and always ready to lead the team into adventure! You love sports, cracking jokes, and you always protect your little brother.';
  } else {
    resultIcon.textContent = '🧒🏽🌟';
    resultTitle.textContent = 'You are Munnu! (The Curious Brother)';
    resultDesc.textContent = 'You are smart, observant, and have a big kind heart! You notice things that others miss, love helping baby animals and alien friends, and you come up with ingenious ideas!';
  }

  resultBox.style.display = 'block';
  playSfx('tada');
}

window.resetQuiz = function() {
  scores = { Chunnu: 0, Munnu: 0 };
  currentQuestion = 1;

  for (let i = 1; i <= 3; i++) {
    const qEl = document.getElementById(`q${i}`);
    if (qEl) qEl.classList.remove('active');
  }

  const q1 = document.getElementById('q1');
  if (q1) q1.classList.add('active');

  const resultBox = document.getElementById('quizResult');
  if (resultBox) resultBox.style.display = 'none';

  const progress = document.getElementById('quizProgress');
  if (progress) progress.style.width = '33.33%';

  playSfx('boing');
};

/* ==========================================================================
   Web Audio API Sound Synthesizer (Zero External Files Needed!)
   ========================================================================== */
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

window.playSfx = function(type) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (type) {
    case 'ding': {
      // Gentle Bell Ding
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      break;
    }

    case 'boing': {
      // Comedic Spring Boing
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(460, now + 0.15);
      osc.frequency.linearRampToValueAtTime(180, now + 0.3);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }

    case 'rocket': {
      // Space Rocket Whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.45);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
      break;
    }

    case 'roar': {
      // Friendly Dino Low Chirp/Growl
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.15);
      osc.frequency.linearRampToValueAtTime(65, now + 0.4);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }

    case 'tada': {
      // Festive Victory Fanfare (C - E - G - High C)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + (idx * 0.1);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
      break;
    }
  }
};

window.playChunnuChime = function() {
  playSfx('rocket');
};

window.playMunnuChime = function() {
  playSfx('tada');
};

/* ==========================================================================
   Mobile Nav Toggle
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.style.display === 'flex';
    navMenu.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen) {
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = '100%';
      navMenu.style.left = '0';
      navMenu.style.right = '0';
      navMenu.style.background = '#FFFFFF';
      navMenu.style.padding = '20px';
      navMenu.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    }
  });

  // Close mobile nav when clicking a link
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navMenu.style.display = 'none';
      }
    });
  });
}
