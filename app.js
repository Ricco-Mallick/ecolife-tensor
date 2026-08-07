/**
 * EcoLife Sustainable Living Web App - Main Logic
 * Team .Tensor (Ricco & Tanmay)
 */

// Global App State
const EcoState = {
  user: null, // Will be loaded dynamically
  actionsLog: [], // Will be loaded dynamically
  actions: [],
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
  leaderboard: [], // Empty initially until a backend is implemented for it
  mapInstance: null,
  markersLayer: null,
  webcamStream: null,
};

// Ensure User is Authenticated on Dashboard Load
async function checkAuth() {
  if (typeof window.EcoAuth === 'undefined') {
    console.error("EcoAuth not found, make sure supabaseClient.js is loaded first.");
    return;
  }
  const user = await window.EcoAuth.getCurrentUser();
  if (!user) {
    console.log("No user found, redirecting to auth...");
    window.location.href = "auth.html";
    return;
  }
  await loadUserData();
}

async function loadUserData() {
  const profile = await window.EcoAuth.getProfile();
  if (profile) {
    EcoState.user = {
      id: profile.id,
      name: profile.full_name || "Eco Warrior",
      avatar: profile.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBxNcP4jmGLxlDNuWCtPln-cBePNWavmRWJWmdXAU4d8FQVwMmZ8kfvUFAxgKQeuV2qfIfBw20C1L43EZ1TMDBiiEtCWUwTu_V5CSEyO96Mbn4CgKlyqT8RvJg6vjxWQWH3DNnl9yebbUAHT49M2ige3sDObHlC-O2e6dLUjneCXmyA8lmvGupFl5AgbcEdw49T-AWArPGFL6hpwMnikONLO_DyvpUWQETsIHu6nWIHvLGQdTVPqGPNew",
      points: profile.total_points || 0,
      dailyScore: Math.min((profile.total_points || 0) / 10, 100),
      co2SavedTons: parseFloat(profile.co2_saved_tons || 0),
      streakDays: profile.streak_days || 0
    };
  }

  const actions = await window.EcoAuth.getEcoActions();
  EcoState.actions = actions || [];
  updateUIState();
  renderTimeline();
}

// -----------------------------------------------------------
// CORE INITIALIZATION
// -----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupNavigation();
  setupLogActionModal();
  setupScanner();
  setupChallenges();
  setupLeaderboard();
  setupProfileSettings();
  
  // Route based on URL hash or default to overview
  const initialHash = window.location.hash.replace('#', '') || 'overview';
  navigateTo(initialHash);
});

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
  window.location.hash = pageId;

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

  if (pageId === 'map' && !EcoState.mapInstance) {
    setTimeout(initMap, 200);
  }

  window.scrollTo(0, 0);
}

// UI State Updates
function updateUIState() {
  if (!EcoState.user) return;
  
  document.querySelectorAll('.user-pts-val').forEach(el => el.textContent = EcoState.user.points.toLocaleString());
  document.querySelectorAll('.user-score-val').forEach(el => el.textContent = EcoState.user.dailyScore.toFixed(0));
  document.querySelectorAll('.user-co2-val').forEach(el => el.textContent = EcoState.user.co2SavedTons.toFixed(2));
  document.querySelectorAll('.user-streak-val').forEach(el => el.textContent = EcoState.user.streakDays);

  document.querySelectorAll('.profile-name-val').forEach(el => el.textContent = EcoState.user.name);
  document.querySelectorAll('.profile-avatar-val').forEach(el => el.src = EcoState.user.avatar);

  const gaugeEl = document.getElementById('score-gauge');
  if (gaugeEl) {
    const offset = 440 * (1 - Math.min(EcoState.user.dailyScore, 100) / 100);
    gaugeEl.style.strokeDashoffset = offset;
  }
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
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const category = document.getElementById('action-type').value;
      const title = document.getElementById('action-detail').value || category;
      
      const co2SavedKg = Math.random() * 5 + 1; // Mock kg calculation
      const res = await window.EcoAuth.logEcoAction(category, title, co2SavedKg);
      if (res.success) {
        await loadUserData();
      }
      
      document.getElementById('action-modal').classList.remove('open');
      form.reset();

      showToast(`Logged action! Stats updated! 🌿`);
    });
  }

  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('activity-timeline');
  if (!container) return;

  container.innerHTML = '';
  if (!EcoState.actions || EcoState.actions.length === 0) {
    container.innerHTML = '<p class="text-on-surface-variant p-4 font-bold text-center">No recent activities. Log an action to get started!</p>';
    return;
  }

  EcoState.actions.slice(0, 5).forEach((action, index) => {
    const el = document.createElement('div');
    el.className = 'flex gap-4 relative pl-8 before:absolute before:left-3 before:top-8 before:bottom-[-24px] before:w-0.5 before:bg-surface-container-highest last:before:hidden';
    
    const dateStr = new Date(action.logged_at).toLocaleDateString();

    el.innerHTML = `
      <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center neo-border z-10 shadow-sm">
        <span class="material-symbols-outlined text-[14px]">eco</span>
      </div>
      <div class="bg-surface-container border-2 border-on-surface p-3 w-full group hover:-translate-y-1 transition-transform shadow-[4px_4px_0_0_#000]">
        <div class="flex justify-between items-start mb-1">
          <h4 class="font-bold text-on-surface leading-tight">${action.title}</h4>
          <span class="text-xs font-bold text-on-surface-variant bg-surface px-2 py-0.5 border border-on-surface/20">${dateStr}</span>
        </div>
        <div class="flex items-center gap-1 text-primary">
          <span class="material-symbols-outlined text-[16px]">co2</span>
          <span class="font-bold text-sm">-${action.co2_saved_kg} kg</span>
        </div>
      </div>
    `;
    el.style.opacity = '0';
    el.style.animation = `fadeUpIn 0.4s ease forwards ${index * 0.1}s`;
    
    container.appendChild(el);
  });
}

function setupProfileSettings() {
  const form = document.getElementById('profile-edit-form');
  const btnSignOut = document.getElementById('btn-sign-out');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-profile-name').value;
      const avatar = document.getElementById('edit-profile-avatar').value;

      const updates = {};
      if (name) updates.full_name = name;
      if (avatar) updates.avatar_url = avatar;

      const res = await window.EcoAuth.updateProfile(updates);
      if (res.success) {
        showToast("Profile updated successfully!");
        await loadUserData();
      } else {
        showToast("Error updating profile: " + res.message);
      }
    });
  }

  if (btnSignOut) {
    btnSignOut.addEventListener('click', async () => {
      await window.EcoAuth.signOut();
      window.location.href = 'auth.html';
    });
  }
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

