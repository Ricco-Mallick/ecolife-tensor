/**
 * EcoLife Sustainable Living Web App - Main Logic
 * Team .Tensor (Ricco & Tanmay)
 */

// Global App State
const EcoState = {
  user: {
    name: "Elena Rodriguez",
    handle: "@EcoWarrior",
    level: 12,
    points: 24500,
    co2SavedTons: 1.2,
    streakDays: 14,
    dailyScore: 82,
  },
  actionsLog: [
    { type: 'Recycling', detail: 'Scanned PET bottle with AI Waste Classifier', pts: 50, time: '10 mins ago' },
    { type: 'Transit', detail: 'Cycled 6km campus commute', pts: 120, time: '2 hours ago' },
    { type: 'Challenge', detail: 'Completed Zero Single-Use Plastic daily task', pts: 100, time: '1 day ago' },
  ],
  mapSpots: [
    { id: 1, name: "TCET Central Recycling Hub", type: "recycling", lat: 19.2062, lng: 72.8738, desc: "Accepts PET, E-waste, and cardboard. Open 24/7." },
    { id: 2, name: "Kandivali Solar EV Fast Charger", type: "ev", lat: 19.2105, lng: 72.8650, desc: "4 fast chargers available. 100% renewable power." },
    { id: 3, name: "Green Campus Compost Bin #4", type: "compost", lat: 19.2040, lng: 72.8780, desc: "Community organic waste compost point." },
    { id: 4, name: "Metro Station Bike Dock", type: "bike", lat: 19.2150, lng: 72.8620, desc: "18 e-bikes available for zero-emission transit." },
  ],
  challenges: [
    { id: 'c1', title: 'Walk 5km a Day', desc: 'Ditch the car and track your steps to reduce carbon emissions.', category: 'Transit', reward: 50, current: 3.2, total: 5, unit: 'km', bg: 'bg-secondary-fixed', icon: 'directions_walk' },
    { id: 'c2', title: 'Zero Single-Use Plastic', desc: 'Use a reusable bottle and decline plastic bags all week.', category: 'Waste', reward: 100, current: 4, total: 7, unit: 'Days', bg: 'bg-surface-container-lowest', icon: 'local_drink' },
    { id: 'c3', title: 'Plant-Based Weekend', desc: 'Commit to eating 100% plant-based meals this weekend.', category: 'Food', reward: 200, current: 0, total: 2, unit: 'Days', bg: 'bg-primary-fixed', icon: 'energy_savings_leaf' },
  ],
  leaderboard: [
    { rank: 1, name: "@EcoWarrior", handle: "Elena Rodriguez", pts: 24500, action: "Cycled 12km & AI Scanned 4 items", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYMdAutk7r072Wpz2leW0w1OsiROHPnyxnpXG-m0qlKgNUX21vSOIcs6bzZsizSwlIktZpdURvJofJZJ0dWOO8cXtQtHK584rqZHFFN8AikgUlHDVuR-grPMm_3gR5X6pipOScafL_8ziqIr13WLAqaYWEzIC6Vixopn2kLJ0uVp2XlwlOLtbiCoSfM69hADe6EVQjc1JLdDWGydRCGJwLzfHAI9YBkyeiLC5S6AWbncZKRWVfdbKecQ", isUser: true },
    { rank: 2, name: "@SarahG", handle: "Sarah Green", pts: 22400, action: "Composted 5kg organic waste", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwpKy2NhlFWmT35KNHiJAhDijyWdBHjBfwFDtEbtdqG3dwoo3Ds-fEEFo_V9YZJQZ9nP-geow1sovJE6a9Ixxsb43OXlFJTlW4iXs7fqTCtVp6ZafgGU8jaVC8EIHxP2kbU5y942h6klxaEZ8IMfT3lqLGKDY-uod46KTRevNcdHbbLYH-s3NrK-IsEADwnW_lues5CYVjeekKl4p-Uql3vE2eRUN1UJhBeHpBqR16PkMJZMdOM_iu7w", isUser: false },
    { rank: 3, name: "@GreenBean", handle: "Tanmay M.", pts: 21100, action: "Logged Solar EV charge", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwwNOMYwOPIG2lTYl4WevTNkrOrJBdqfa-jTS1hKq2ExdOGhZycM_TRk4f1fcoovjVT-oxAd69qegtRrpVyrAnIlWaGdye0qQMehZj7WlFPUvNwalFieVF7R7IegGGsHSEITFGsrr6pqlzAYcqX370hdBKrouBc1Vswox_iXbVU4aDRsn3KvAbFtP44_w_pfX3SoH6UHOSymA8H9A5KiFc5UhESwDYY5aF9NjZId58mzrEirz4gb3eGw", isUser: false },
    { rank: 4, name: "@AlexL", handle: "Alex Lin", pts: 18980, action: "Logged 5kg recycling", badge: "recycling", isUser: false },
    { rank: 5, name: "@MiaJ", handle: "Mia Johnson", pts: 17945, action: "Zero-waste lunch", isUser: false },
    { rank: 6, name: "@DanR", handle: "Dan Rivera", pts: 16890, action: "Biked 10km", badge: "directions_bike", isUser: false },
  ],
  mapInstance: null,
  markersLayer: null,
  webcamStream: null,
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  setupNavigation();
  setupLogActionModal();
  setupScanner();
  setupChallenges();
  setupLeaderboard();
  updateUIState();

  // Route based on URL hash or default to overview
  const initialHash = window.location.hash.replace('#', '') || 'overview';
  navigateTo(initialHash);
});

// Persistence
function loadStateFromStorage() {
  const saved = localStorage.getItem('ecolife_app_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      EcoState.user = { ...EcoState.user, ...parsed.user };
      if (parsed.actionsLog) EcoState.actionsLog = parsed.actionsLog;
      if (parsed.challenges) EcoState.challenges = parsed.challenges;
    } catch (e) {
      console.warn("Error reading state from localStorage:", e);
    }
  }
}

function saveStateToStorage() {
  localStorage.setItem('ecolife_app_state', JSON.stringify({
    user: EcoState.user,
    actionsLog: EcoState.actionsLog,
    challenges: EcoState.challenges,
  }));
}

// Navigation & Router
function setupNavigation() {
  const navLinks = document.querySelectorAll('[data-nav]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-nav');
      navigateTo(target);
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'overview';
    navigateTo(hash);
  });
}

function navigateTo(pageId) {
  // Update hash
  window.location.hash = pageId;

  // Toggle page visibility
  const pages = document.querySelectorAll('.page-view');
  let found = false;

  pages.forEach(page => {
    if (page.id === `page-${pageId}`) {
      page.classList.add('active');
      found = true;
    } else {
      page.classList.remove('active');
    }
  });

  if (!found) {
    document.getElementById('page-overview').classList.add('active');
    pageId = 'overview';
  }

  // Update navbar active styling
  document.querySelectorAll('[data-nav]').forEach(link => {
    const navTarget = link.getAttribute('data-nav');
    if (navTarget === pageId) {
      link.classList.add('bg-secondary-container', 'text-on-secondary-container', 'neo-border-thin', 'neo-shadow-sm');
      link.classList.remove('text-on-surface', 'hover:bg-surface-container-high');
    } else {
      link.classList.remove('bg-secondary-container', 'text-on-secondary-container', 'neo-border-thin', 'neo-shadow-sm');
      link.classList.add('text-on-surface', 'hover:bg-surface-container-high');
    }
  });

  // Lazy init map if navigated to map
  if (pageId === 'map' && !EcoState.mapInstance) {
    setTimeout(initMap, 200);
  }

  window.scrollTo(0, 0);
}

// UI State Updates
function updateUIState() {
  // User Profile fields
  document.querySelectorAll('.user-pts-val').forEach(el => el.textContent = EcoState.user.points.toLocaleString());
  document.querySelectorAll('.user-score-val').forEach(el => el.textContent = EcoState.user.dailyScore);
  document.querySelectorAll('.user-co2-val').forEach(el => el.textContent = EcoState.user.co2SavedTons.toFixed(1));
  document.querySelectorAll('.user-streak-val').forEach(el => el.textContent = EcoState.user.streakDays);

  // Update gauge circle offset (max score 100 -> strokeDashoffset: 440 * (1 - 82/100) = ~79)
  const gaugeEl = document.getElementById('score-gauge');
  if (gaugeEl) {
    const offset = 440 * (1 - Math.min(EcoState.user.dailyScore, 100) / 100);
    gaugeEl.style.strokeDashoffset = offset;
  }

  saveStateToStorage();
}

// Modal Action Logger
function setupLogActionModal() {
  const modal = document.getElementById('action-modal');
  const openBtns = document.querySelectorAll('.btn-open-log-action');
  const closeBtns = document.querySelectorAll('.btn-close-modal');
  const form = document.getElementById('log-action-form');

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => modal.classList.add('open'));
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => modal.classList.remove('open'));
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const actionType = document.getElementById('action-type').value;
      const detail = document.getElementById('action-detail').value || actionType;
      const pointsToAdd = parseInt(document.getElementById('action-pts').value) || 50;

      EcoState.user.points += pointsToAdd;
      EcoState.user.dailyScore = Math.min(100, EcoState.user.dailyScore + Math.round(pointsToAdd / 10));
      EcoState.user.co2SavedTons += 0.05;

      EcoState.actionsLog.unshift({
        type: actionType,
        detail: detail,
        pts: pointsToAdd,
        time: 'Just now'
      });

      // Update user in leaderboard
      const userRank = EcoState.leaderboard.find(item => item.isUser);
      if (userRank) {
        userRank.pts = EcoState.user.points;
        userRank.action = detail;
      }

      updateUIState();
      renderRecentActions();
      renderLeaderboard();
      modal.classList.remove('open');
      form.reset();

      showToast(`Logged action! +${pointsToAdd} Eco Points earned! 🌿`);
    });
  }

  renderRecentActions();
}

function renderRecentActions() {
  const container = document.getElementById('recent-actions-list');
  if (!container) return;

  container.innerHTML = EcoState.actionsLog.slice(0, 5).map(act => `
    <div class="flex items-center justify-between p-stack-sm border-b-2 border-on-surface hover:bg-surface-container-high transition-colors">
      <div class="flex items-center gap-stack-sm">
        <span class="material-symbols-outlined text-primary bg-primary-fixed border-2 border-on-surface p-1 text-[18px]">eco</span>
        <div>
          <div class="font-label-bold text-label-bold">${escapeHtml(act.detail)}</div>
          <div class="font-body-md text-xs text-on-surface-variant">${act.type} • ${act.time}</div>
        </div>
      </div>
      <span class="font-label-bold text-label-bold bg-secondary-container px-2 py-1 border-2 border-on-surface">+${act.pts} pts</span>
    </div>
  `).join('');
}

// AI Waste Scanner Logic
function setupScanner() {
  const videoEl = document.getElementById('scanner-video');
  const canvasEl = document.getElementById('scanner-canvas');
  const btnStartCam = document.getElementById('btn-start-cam');
  const btnScanPreset = document.getElementById('btn-scan-preset');
  const presetSelect = document.getElementById('preset-select');

  const scannerItemTitle = document.getElementById('scan-item-title');
  const scannerMatchTag = document.getElementById('scan-match-tag');
  const scannerCategory = document.getElementById('scan-category');
  const scannerDisposalSteps = document.getElementById('scan-disposal-steps');
  const btnConfirmScan = document.getElementById('btn-confirm-scan');

  // Waste Categories Database
  const wasteDb = {
    bottle: {
      title: "PET Plastic Water Bottle",
      match: "98% MATCH",
      category: "Recyclable Plastic (Type 1 - Polyethylene Terephthalate)",
      steps: ["Empty all remaining liquids thoroughly.", "Crush bottle flat to conserve recycling volume.", "Keep cap attached or separate according to local municipality."]
    },
    can: {
      title: "Aluminum Beverage Can",
      match: "95% MATCH",
      category: "Recyclable Metals (Infinitely Recyclable Aluminum)",
      steps: ["Rinse out any residual soda/juice.", "Do not crush if using automated deposit machines.", "Place directly into yellow metals bin."]
    },
    e_waste: {
      title: "Lithium-Ion Phone Battery / E-Waste",
      match: "92% MATCH",
      category: "Hazardous Electronic Waste (E-Waste)",
      steps: ["NEVER place in standard municipal trash bins.", "Cover terminals with non-conductive electrical tape.", "Drop off at TCET Central E-Waste Bin or authorized retailer."]
    },
    compost: {
      title: "Organic Apple Core & Food Scraps",
      match: "99% MATCH",
      category: "Compostable Organic Matter",
      steps: ["Remove any non-compostable stickers/labels.", "Place directly into organic green compost bin.", "Helps reduce landfill methane emissions."]
    }
  };

  if (btnStartCam) {
    btnStartCam.addEventListener('click', async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          EcoState.webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          videoEl.srcObject = EcoState.webcamStream;
          videoEl.style.display = "block";
          showToast("Live webcam feed connected!");
        } else {
          showToast("Webcam access not supported in this browser.");
        }
      } catch (err) {
        console.error("Camera error:", err);
        showToast("Camera permission denied or unavailable. Using simulated AI classifier.");
      }
    });
  }

  if (btnScanPreset) {
    btnScanPreset.addEventListener('click', () => {
      const selected = presetSelect ? presetSelect.value : 'bottle';
      const itemData = wasteDb[selected] || wasteDb.bottle;

      // Update UI results
      scannerItemTitle.textContent = itemData.title;
      scannerMatchTag.textContent = itemData.match;
      scannerCategory.textContent = itemData.category;

      scannerDisposalSteps.innerHTML = itemData.steps.map((step, idx) => `
        <div class="flex items-center p-stack-sm border-b-2 border-on-surface group hover:bg-surface-container-high transition-colors">
          <div class="w-8 h-8 shrink-0 bg-primary text-on-primary font-label-bold flex items-center justify-center border-2 border-on-surface mr-stack-md">${idx + 1}</div>
          <span class="font-body-md text-body-md">${step}</span>
        </div>
      `).join('');

      showToast(`AI Classifier scanned: ${itemData.title}!`);
    });
  }

  if (btnConfirmScan) {
    btnConfirmScan.addEventListener('click', () => {
      const pts = 60;
      EcoState.user.points += pts;
      EcoState.user.dailyScore = Math.min(100, EcoState.user.dailyScore + 6);
      EcoState.actionsLog.unshift({
        type: 'Waste Scanner',
        detail: `Properly recycled ${scannerItemTitle.textContent}`,
        pts: pts,
        time: 'Just now'
      });
      updateUIState();
      renderRecentActions();
      showToast(`Proper disposal confirmed! +${pts} Eco Points awarded! ♻️`);
    });
  }
}

// Leaflet Map Setup
function initMap() {
  const mapContainer = document.getElementById('eco-map');
  if (!mapContainer || EcoState.mapInstance) return;

  // Initialize Leaflet Map centered at Mumbai / College Campus area
  EcoState.mapInstance = L.map('eco-map').setView([19.2062, 72.8738], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(EcoState.mapInstance);

  EcoState.markersLayer = L.layerGroup().addTo(EcoState.mapInstance);

  renderMapMarkers();

  // Handle Filter checkboxes
  document.querySelectorAll('.map-filter-checkbox').forEach(chk => {
    chk.addEventListener('change', renderMapMarkers);
  });

  // Handle Add Custom Spot Button
  const btnAddSpot = document.getElementById('btn-add-map-spot');
  if (btnAddSpot) {
    btnAddSpot.addEventListener('click', () => {
      const name = prompt("Enter location name:", "Green Campus Bin");
      if (!name) return;
      const type = prompt("Type (recycling, ev, compost, bike):", "recycling");

      const center = EcoState.mapInstance.getCenter();
      const newSpot = {
        id: Date.now(),
        name: name,
        type: type || 'recycling',
        lat: center.lat,
        lng: center.lng,
        desc: 'User crowdsourced eco spot.'
      };
      EcoState.mapSpots.push(newSpot);
      renderMapMarkers();
      showToast("Added new eco spot to map! 📍");
    });
  }
}

function renderMapMarkers() {
  if (!EcoState.markersLayer) return;
  EcoState.markersLayer.clearLayers();

  const activeTypes = Array.from(document.querySelectorAll('.map-filter-checkbox:checked')).map(cb => cb.value);

  EcoState.mapSpots.forEach(spot => {
    if (activeTypes.length > 0 && !activeTypes.includes(spot.type)) return;

    let iconSymbol = 'recycling';
    let iconClass = '';
    if (spot.type === 'ev') { iconSymbol = 'ev_station'; iconClass = 'ev'; }
    else if (spot.type === 'compost') { iconSymbol = 'compost'; iconClass = 'compost'; }
    else if (spot.type === 'bike') { iconSymbol = 'directions_bike'; iconClass = 'bike'; }

    const customIcon = L.divIcon({
      className: 'custom-leaflet-icon',
      html: `
        <div class="custom-neo-marker ${iconClass}">
          <span class="material-symbols-outlined text-on-surface" style="font-variation-settings: 'FILL' 1;">${iconSymbol}</span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44]
    });

    const popupContent = `
      <div class="p-stack-md bg-white">
        <div class="bg-primary-fixed neo-border-thin px-2 py-1 font-label-bold text-xs uppercase mb-1">${spot.type.toUpperCase()}</div>
        <h4 class="font-headline-md text-headline-md font-bold text-on-surface m-0 mb-1">${escapeHtml(spot.name)}</h4>
        <p class="font-body-md text-sm text-on-surface-variant m-0 mb-3">${escapeHtml(spot.desc)}</p>
        <button class="w-full bg-primary text-on-primary font-label-bold text-xs py-2 neo-btn" onclick="alert('Directions calculated! Distance: 0.8 km')">Get Directions</button>
      </div>
    `;

    L.marker([spot.lat, spot.lng], { icon: customIcon })
      .bindPopup(popupContent)
      .addTo(EcoState.markersLayer);
  });
}

// Challenges Handler
function setupChallenges() {
  const container = document.getElementById('challenges-grid');
  if (!container) return;

  renderChallenges();
}

function renderChallenges() {
  const container = document.getElementById('challenges-grid');
  if (!container) return;

  container.innerHTML = EcoState.challenges.map(c => {
    const percent = Math.min(100, Math.round((c.current / c.total) * 100));
    return `
      <div class="${c.bg} neo-border neo-shadow p-stack-md flex flex-col justify-between h-full relative overflow-hidden group">
        <div class="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
          <span class="material-symbols-outlined text-[100px]">${c.icon}</span>
        </div>
        <div>
          <div class="flex justify-between items-start mb-4">
            <div class="bg-surface px-3 py-1 neo-border-thin font-label-bold text-xs inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">schedule</span> Ongoing
            </div>
            <span class="font-label-bold text-label-bold bg-primary text-on-primary px-2 py-1 border-2 border-on-surface">+${c.reward} Pts</span>
          </div>
          <h3 class="font-headline-md text-headline-md font-bold mb-2 z-10 relative">${escapeHtml(c.title)}</h3>
          <p class="font-body-md text-body-md mb-6 z-10 relative">${escapeHtml(c.desc)}</p>
        </div>
        <div>
          <div class="mb-2 flex justify-between font-label-bold text-label-bold text-sm">
            <span>Progress</span>
            <span>${c.current} / ${c.total} ${c.unit}</span>
          </div>
          <div class="w-full h-6 neo-border bg-surface mb-6 relative">
            <div class="absolute top-0 left-0 h-full bg-primary border-r-4 border-on-surface" style="width: ${percent}%;"></div>
          </div>
          <button class="w-full bg-surface text-on-surface font-label-bold text-label-bold py-3 neo-btn" onclick="logChallengeProgress('${c.id}')">
            ${percent >= 100 ? 'Completed 🎉' : 'Log Progress'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.logChallengeProgress = function(id) {
  const challenge = EcoState.challenges.find(c => c.id === id);
  if (!challenge) return;

  if (challenge.current < challenge.total) {
    challenge.current = Math.min(challenge.total, challenge.current + 1);
    if (challenge.current >= challenge.total) {
      EcoState.user.points += challenge.reward;
      showToast(`Challenge Completed! Earned +${challenge.reward} points! 🏆`);
    } else {
      showToast(`Logged progress for ${challenge.title}!`);
    }
    updateUIState();
    renderChallenges();
  } else {
    showToast(`You have already completed this challenge!`);
  }
};

// Leaderboard Setup
function setupLeaderboard() {
  renderLeaderboard();
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;

  const sorted = [...EcoState.leaderboard].sort((a, b) => b.pts - a.pts);
  sorted.forEach((item, idx) => item.rank = idx + 1);

  // Render rest of pack (rank >= 4)
  const rest = sorted.slice(3);

  container.innerHTML = rest.map(item => `
    <div class="grid grid-cols-12 gap-unit p-stack-md border-b-2 border-on-surface ${item.isUser ? 'bg-secondary-container' : 'bg-surface'} hover:bg-surface-container-low transition-colors items-center font-body-md">
      <div class="col-span-2 md:col-span-1 text-center font-bold text-headline-md">${item.rank}</div>
      <div class="col-span-7 md:col-span-5 flex items-center gap-stack-sm">
        <div class="w-10 h-10 bg-primary border-2 border-on-surface flex items-center justify-center text-on-primary font-bold">
          ${item.name.substring(1, 3).toUpperCase()}
        </div>
        <div>
          <span class="font-bold block">${escapeHtml(item.name)} ${item.isUser ? '(You)' : ''}</span>
          <span class="text-xs text-on-surface-variant">${escapeHtml(item.handle)}</span>
        </div>
      </div>
      <div class="hidden md:block md:col-span-4 text-on-surface-variant text-sm">${escapeHtml(item.action || 'Active Eco Warrior')}</div>
      <div class="col-span-3 md:col-span-2 text-right font-bold text-headline-md">${item.pts.toLocaleString()}</div>
    </div>
  `).join('');
}

// Hero 23 Canvas 3D Globe & Stardust Background Effects
document.addEventListener('DOMContentLoaded', () => {
  initHeroEffects();
});

function initHeroEffects() {
  initStardust();
  initCanvasGlobe();
}

function initStardust() {
  const canvas = document.getElementById('hero-stardust-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
    canvas.height = canvas.parentElement ? canvas.parentElement.offsetHeight : 600;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const numParticles = 60;
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.7 + 0.3
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a3f69c';

    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    requestAnimationFrame(draw);
  }
  draw();
}

function initCanvasGlobe() {
  const canvas = document.getElementById('hero-globe-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const width = canvas.width = 320;
  const height = canvas.height = 320;
  const radius = 120;
  let angle = 0;

  // Globe latitude/longitude dots
  const dots = [];
  for (let lat = -80; lat <= 80; lat += 18) {
    const radLat = (lat * Math.PI) / 180;
    const r = radius * Math.cos(radLat);
    const y = radius * Math.sin(radLat);
    const count = Math.max(4, Math.floor(Math.cos(radLat) * 24));

    for (let i = 0; i < count; i++) {
      const lon = (i * 360) / count;
      dots.push({ lat, lon, r, y });
    }
  }

  function renderGlobe() {
    ctx.clearRect(0, 0, width, height);

    // Draw Globe Background Circle
    const grad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, radius);
    grad.addColorStop(0, '#1a4722');
    grad.addColorStop(0.8, '#0b1c0e');
    grad.addColorStop(1, '#dee950');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dee950';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Render Rotating Dots
    ctx.fillStyle = '#a3f69c';

    dots.forEach(dot => {
      const radLon = ((dot.lon + angle) * Math.PI) / 180;
      const x = dot.r * Math.sin(radLon);
      const z = dot.r * Math.cos(radLon);

      if (z > 0) { // Only front hemisphere
        const px = width / 2 + x;
        const py = height / 2 - dot.y;
        const dotSize = Math.max(1, (z / radius) * 3);

        ctx.globalAlpha = Math.min(1, Math.max(0.2, z / radius));
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw active glowing green eco nodes (Mumbai, Toronto, Stockholm, Tokyo, Sao Paulo)
    const nodes = [
      { lon: 72, lat: 19, label: 'Mumbai' },
      { lon: -79, lat: 43, label: 'Toronto' },
      { lon: 18, lat: 59, label: 'Stockholm' },
      { lon: 139, lat: 35, label: 'Tokyo' },
    ];

    nodes.forEach(node => {
      const radLat = (node.lat * Math.PI) / 180;
      const r = radius * Math.cos(radLat);
      const y = radius * Math.sin(radLat);
      const radLon = ((node.lon + angle) * Math.PI) / 180;
      const x = r * Math.sin(radLon);
      const z = r * Math.cos(radLon);

      if (z > 10) {
        const px = width / 2 + x;
        const py = height / 2 - y;

        ctx.globalAlpha = 1;
        ctx.fillStyle = '#dee950';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    angle += 0.4;
    requestAnimationFrame(renderGlobe);
  }

  renderGlobe();
}

// Utility Toast Notifications
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<span class="material-symbols-outlined">check_circle</span> ${escapeHtml(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

