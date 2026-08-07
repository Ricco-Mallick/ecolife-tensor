/**
 * EcoLife Sustainable Living Web App - Main Logic
 * Team .Tensor (Ricco & Tanmay)
 */

// Global App State
const EcoState = {
  user: null, // Will be loaded dynamically
  actions: [],
  mapSpots: [], // Will be loaded dynamically
  challenges: [
    { id: 'c1', title: 'Walk 5km a Day', desc: 'Ditch the car and track your steps to reduce carbon emissions.', category: 'Transit', reward: 50, bg: 'bg-secondary-fixed', icon: 'directions_walk' },
    { id: 'c2', title: 'Zero Single-Use Plastic', desc: 'Use a reusable bottle and decline plastic bags all week.', category: 'Waste', reward: 100, bg: 'bg-surface-container-lowest', icon: 'local_drink' },
    { id: 'c3', title: 'Plant-Based Weekend', desc: 'Commit to eating 100% plant-based meals this weekend.', category: 'Food', reward: 200, bg: 'bg-primary-fixed', icon: 'energy_savings_leaf' },
  ],
  leaderboard: [], 
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
      streakDays: profile.streak_days || 0,
      completedChallenges: profile.completed_challenges || []
    };
  }

  const actions = await window.EcoAuth.getEcoActions();
  EcoState.actions = actions || [];

  // Update dynamic lists
  EcoState.mapSpots = await window.EcoAuth.getMapSpots();
  EcoState.leaderboard = await window.EcoAuth.getLeaderboard();

  updateUIState();
  renderTimeline();
  renderLeaderboard();
  renderChallenges();
  
  if (EcoState.mapInstance) {
    renderMapMarkers();
  }
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

  const btnCaptureAi = document.getElementById('btn-capture-ai');
  const aiLoading = document.getElementById('ai-loading');

  if (btnStartCam) {
    btnStartCam.addEventListener('click', async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          EcoState.webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          videoEl.srcObject = EcoState.webcamStream;
          videoEl.style.display = "block";
          btnStartCam.style.display = "none";
          if (btnCaptureAi) btnCaptureAi.style.display = "flex";
          showToast("Live webcam feed connected!");
        } else {
          showToast("Webcam access not supported in this browser.");
        }
      } catch (err) {
        console.error("Camera error:", err);
        showToast("Camera permission denied or unavailable.");
      }
    });
  }

  if (btnCaptureAi) {
    btnCaptureAi.addEventListener('click', async () => {
      if (!EcoState.webcamStream) return;
      
      btnCaptureAi.style.display = 'none';
      aiLoading.style.display = 'flex';
      
      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL('image/jpeg').split(',')[1];

      try {
        let API_KEY = localStorage.getItem('gemini_api_key');
        if (!API_KEY) {
          API_KEY = prompt("Please enter your Gemini API Key for the AI Scanner:");
          if (!API_KEY) throw new Error("No API Key provided.");
          localStorage.setItem('gemini_api_key', API_KEY);
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'Analyze this waste item. Return ONLY a valid JSON object (no markdown, no backticks) with the keys: {"title": "Short name", "category": "Category", "steps": ["step 1", "step 2", "step 3"]}. Keep steps brief.' },
                { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
              ]
            }]
          })
        });

        const data = await res.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const itemData = JSON.parse(cleanedJson);

        scannerItemTitle.textContent = itemData.title || 'Unknown Item';
        scannerMatchTag.textContent = "AI DETECTED";
        scannerCategory.textContent = itemData.category || 'Uncategorized';
        
        scannerDisposalSteps.innerHTML = (itemData.steps || []).map((step, idx) => `
          <div class="flex items-center p-stack-sm border-b-2 border-on-surface group hover:bg-surface-container-high transition-colors">
            <div class="w-8 h-8 shrink-0 bg-primary text-on-primary font-label-bold flex items-center justify-center border-2 border-on-surface mr-stack-md">${idx + 1}</div>
            <span class="font-body-md text-body-md">${step}</span>
          </div>
        `).join('');

        showToast(`Gemini Analysis Complete!`);
      } catch (err) {
        console.error('Gemini error:', err);
        showToast("AI analysis failed. Please try again.");
      } finally {
        aiLoading.style.display = 'none';
        btnCaptureAi.style.display = 'flex';
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

      // Update the background image to match the preset
      const bgImages = {
        bottle: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        can: "https://images.unsplash.com/photo-1550508608-8e65fa1a0735?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        e_waste: "https://images.unsplash.com/photo-1580142525796-039c362095ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        apple: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      };
      
      const bgEl = document.getElementById('scanner-bg');
      if (bgEl) {
        bgEl.style.backgroundImage = `url('${bgImages[selected] || bgImages.bottle}')`;
      }

      showToast(`AI Classifier scanned: ${itemData.title}!`);
    });
  }

  if (btnConfirmScan) {
    btnConfirmScan.addEventListener('click', async () => {
      const category = scannerCategory.textContent;
      const title = `AI Scanned: ${scannerItemTitle.textContent}`;
      const co2SavedKg = Math.random() * 2 + 0.5; // Simulate AI estimation

      const res = await window.EcoAuth.logEcoAction(category, title, co2SavedKg);
      if (res.success) {
        showToast(`Proper disposal confirmed! Points awarded! ♻️`);
        await loadUserData();
      } else {
        showToast(`Failed to log scan: ${res.message}`);
      }
    });
  }
}

// Google Maps Setup
function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve();
    if (document.getElementById('gmaps-script')) return resolve();

    let apiKey = localStorage.getItem('gmaps_api_key');
    if (!apiKey) {
      apiKey = prompt("Please enter your Google Maps API Key:");
      if (!apiKey) return reject("No Maps API Key provided.");
      localStorage.setItem('gmaps_api_key', apiKey);
    }

    window.__gmapsLoaded = () => resolve();
    const script = document.createElement('script');
    script.id = 'gmaps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__gmapsLoaded&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function initMap() {
  const mapContainer = document.getElementById('eco-map');
  if (!mapContainer || EcoState.mapInstance) return;

  try {
    await loadGoogleMapsScript();
  } catch (err) {
    console.error(err);
    showToast("Google Maps failed to load.");
    return;
  }

  const customMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#1a1c1c" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1c1c" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#a3f69c" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#40493d" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0d631b" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#2e7d32" }] }
  ];

  EcoState.mapInstance = new google.maps.Map(mapContainer, {
    center: { lat: 19.2062, lng: 72.8738 },
    zoom: 14,
    styles: customMapStyle,
    disableDefaultUI: true,
    zoomControl: true,
  });

  EcoState.markersLayer = [];
  EcoState.infoWindow = new google.maps.InfoWindow();

  renderMapMarkers();

  document.querySelectorAll('.map-filter-checkbox').forEach(chk => {
    chk.addEventListener('change', renderMapMarkers);
  });

  const btnAddSpot = document.getElementById('btn-add-map-spot');
  if (btnAddSpot) {
    const newBtn = btnAddSpot.cloneNode(true);
    btnAddSpot.parentNode.replaceChild(newBtn, btnAddSpot);
    newBtn.addEventListener('click', async () => {
      const name = prompt("Enter location name:", "Green Campus Bin");
      if (!name) return;
      const type = prompt("Type (recycling, ev, compost, bike):", "recycling");

      const center = EcoState.mapInstance.getCenter();
      const newSpot = {
        name: name,
        type: type || 'recycling',
        lat: center.lat(),
        lng: center.lng(),
        description: "User added community spot"
      };

      const res = await window.EcoAuth.addMapSpot(newSpot);
      if (res.success) {
        showToast("Map spot added to global database!");
        EcoState.mapSpots.push(res.data);
        renderMapMarkers();
      } else {
        showToast("Error adding map spot: " + res.message);
      }
    });
  }
}

function renderMapMarkers() {
  if (!window.google || !EcoState.mapInstance) return;

  EcoState.markersLayer.forEach(m => m.setMap(null));
  EcoState.markersLayer = [];

  const activeTypes = Array.from(document.querySelectorAll('.map-filter-checkbox:checked')).map(cb => cb.value);

  EcoState.mapSpots.forEach(spot => {
    if (activeTypes.length > 0 && !activeTypes.includes(spot.type)) return;

    let iconSymbol = '♻️';
    if (spot.type === 'ev') iconSymbol = '⚡';
    else if (spot.type === 'compost') iconSymbol = '🌱';
    else if (spot.type === 'bike') iconSymbol = '🚲';

    const marker = new google.maps.Marker({
      position: { lat: spot.lat, lng: spot.lng },
      map: EcoState.mapInstance,
      title: spot.name,
      label: { text: iconSymbol, fontSize: "16px" }
    });

    const popupContent = `
      <div style="color: black; max-width: 200px; padding: 4px;">
        <div style="font-weight: bold; font-size: 10px; color: #0d631b; margin-bottom: 4px;">${spot.type.toUpperCase()}</div>
        <h4 style="margin: 0 0 4px 0; font-size: 14px;">${escapeHtml(spot.name)}</h4>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #444;">${escapeHtml(spot.desc || spot.description || '')}</p>
        <button style="background: #0d631b; color: white; border: none; padding: 4px 8px; width: 100%; font-weight: bold; cursor: pointer;" onclick="alert('Directions calculated!')">Get Directions</button>
      </div>
    `;

    marker.addListener("click", () => {
      EcoState.infoWindow.setContent(popupContent);
      EcoState.infoWindow.open(EcoState.mapInstance, marker);
    });

    EcoState.markersLayer.push(marker);
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
  if (!container || !EcoState.user) return;

  container.innerHTML = EcoState.challenges.map(c => {
    const isCompleted = EcoState.user.completedChallenges.includes(c.id);
    
    return `
    <div class="${c.bg} p-gutter neo-border neo-shadow-sm flex flex-col justify-between group hover:-translate-y-2 transition-transform h-full min-h-[280px]">
      <div>
        <div class="flex justify-between items-start mb-stack-md">
          <span class="material-symbols-outlined text-4xl bg-surface border-2 border-on-surface p-2 rounded-full">${c.icon}</span>
          <span class="font-label-bold text-xs uppercase bg-surface text-on-surface px-2 py-1 neo-border-thin">${c.category}</span>
        </div>
        <h4 class="font-headline-md text-xl font-bold uppercase mb-2">${c.title}</h4>
        <p class="font-body-md text-sm text-on-surface-variant line-clamp-3">${c.desc}</p>
      </div>
      
      <div class="mt-stack-lg">
        ${isCompleted ? 
          `<div class="w-full text-center py-2 bg-primary text-on-primary font-bold neo-border">COMPLETED</div>` :
          `<button onclick="window.completeEcoChallenge('${c.id}', ${c.reward})" class="w-full text-center py-2 bg-surface text-on-surface hover:bg-secondary-container transition-colors font-bold neo-border">COMPLETE FOR +${c.reward} PTS</button>`
        }
      </div>
    </div>
  `}).join('');
}

window.completeEcoChallenge = async function(id, reward) {
  if (!EcoState.user) return;
  const res = await window.EcoAuth.completeChallenge(id, reward);
  if (res.success) {
    showToast(`Challenge Completed! Earned +${reward} points! 🏆`);
    await loadUserData();
  } else {
    showToast(res.message);
  }
};

function setupLeaderboard() {
  // Initial render happens in loadUserData
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  const podiumContainer = document.getElementById('leaderboard-podium');
  if (!container || !EcoState.leaderboard) return;

  const sorted = [...EcoState.leaderboard];

  // Render Podium (Top 3)
  if (podiumContainer) {
    if (sorted.length === 0) {
      podiumContainer.innerHTML = `
        <span class="material-symbols-outlined text-6xl text-on-surface-variant mb-4">emoji_events</span>
        <h3 class="font-headline-md text-2xl font-bold">No data yet.</h3>
        <p class="font-body-md text-on-surface-variant mt-2">Log an action to become number one!</p>
      `;
    } else {
      let podiumHtml = `<div class="grid grid-cols-3 gap-gutter items-end mt-stack-lg min-h-[350px] w-full text-center">`;
      
      const p2 = sorted[1];
      if (p2) {
        podiumHtml += `<div class="flex flex-col items-center">
            <div class="mb-stack-md flex flex-col items-center">
              <img class="w-20 h-20 rounded-full border-4 border-on-surface neo-shadow-sm object-cover mb-2" src="${p2.avatar_url || 'https://via.placeholder.com/100'}" />
              <span class="font-bold text-lg">${escapeHtml(p2.full_name)}</span>
              <span class="font-bold bg-primary-fixed text-on-surface px-2 py-0.5 border-2 border-on-surface text-xs mt-1">${p2.total_points} pts</span>
            </div>
            <div class="w-full bg-surface-container-highest border-4 border-on-surface border-b-0 h-40 flex justify-center items-start pt-4 font-bold text-4xl">2</div>
          </div>`;
      } else {
        podiumHtml += `<div></div>`;
      }

      const p1 = sorted[0];
      if (p1) {
        podiumHtml += `<div class="flex flex-col items-center">
            <span class="material-symbols-outlined text-secondary-fixed text-4xl mb-1">kid_star</span>
            <div class="mb-stack-md flex flex-col items-center">
              <img class="w-28 h-28 rounded-full border-4 border-on-surface neo-shadow object-cover mb-2" src="${p1.avatar_url || 'https://via.placeholder.com/100'}" />
              <span class="font-bold text-xl">${escapeHtml(p1.full_name)}</span>
              <span class="font-bold bg-secondary-container px-3 py-1 border-2 border-on-surface text-xs mt-1 neo-shadow-sm">${p1.total_points} pts</span>
            </div>
            <div class="w-full bg-primary-container text-on-primary-container border-4 border-on-surface border-b-0 h-56 flex justify-center items-start pt-4 font-bold text-5xl">1</div>
          </div>`;
      } else {
        podiumHtml += `<div></div>`;
      }

      const p3 = sorted[2];
      if (p3) {
        podiumHtml += `<div class="flex flex-col items-center">
            <div class="mb-stack-md flex flex-col items-center">
              <img class="w-20 h-20 rounded-full border-4 border-on-surface neo-shadow-sm object-cover mb-2" src="${p3.avatar_url || 'https://via.placeholder.com/100'}" />
              <span class="font-bold text-lg">${escapeHtml(p3.full_name)}</span>
              <span class="font-bold bg-surface-container-highest text-on-surface px-2 py-0.5 border-2 border-on-surface text-xs mt-1">${p3.total_points} pts</span>
            </div>
            <div class="w-full bg-surface-container-highest border-4 border-on-surface border-b-0 h-32 flex justify-center items-start pt-4 font-bold text-4xl">3</div>
          </div>`;
      } else {
        podiumHtml += `<div></div>`;
      }
      
      podiumHtml += `</div>`;
      podiumContainer.innerHTML = podiumHtml;
      podiumContainer.className = "flex flex-col justify-center items-center w-full"; // Clear empty placeholder styles
    }
  }

  // Render rest of pack (rank >= 4)
  const rest = sorted.slice(3);
  if (rest.length === 0) {
    container.innerHTML = `<div class="p-4 text-center font-bold text-on-surface-variant">No other players yet.</div>`;
    return;
  }

  container.innerHTML = rest.map((item, idx) => {
    const isUser = EcoState.user && item.id === EcoState.user.id;
    return `
    <div class="grid grid-cols-12 gap-unit p-stack-md border-b-2 border-on-surface ${isUser ? 'bg-secondary-container' : 'bg-surface'} hover:bg-surface-container-low transition-colors items-center font-body-md">
      <div class="col-span-2 md:col-span-1 text-center font-bold text-headline-md">${idx + 4}</div>
      <div class="col-span-7 md:col-span-5 flex items-center gap-stack-sm">
        <div class="w-10 h-10 bg-primary border-2 border-on-surface flex items-center justify-center text-on-primary font-bold overflow-hidden rounded-full">
          <img src="${item.avatar_url || 'https://via.placeholder.com/50'}" class="w-full h-full object-cover"/>
        </div>
        <div>
          <span class="font-bold block">${escapeHtml(item.full_name || 'Anonymous')} ${isUser ? '(You)' : ''}</span>
        </div>
      </div>
      <div class="hidden md:block md:col-span-4 text-on-surface-variant text-sm">Saved ${item.co2_saved_tons || 0} Tons CO2</div>
      <div class="col-span-3 md:col-span-2 text-right font-bold text-headline-md">${item.total_points.toLocaleString()}</div>
    </div>
  `}).join('');
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

