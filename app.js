/**
 * EcoLife Application Controller Script
 * Team .Tensor — Production Backend Architecture
 */

// Application Global State
const appState = {
  user: null,
  profile: null,
  points: 0,
  co2Saved: 0,
  streak: 0,
  dailyScore: 0,
  scannedCount: 0,
  activeTab: 'overview',
  map: null,
  markers: [],
  userMarker: null,
  userLat: 19.0760,
  userLng: 72.8777,
  isSatellite: false,
  tileLayerStandard: null,
  tileLayerSatellite: null,
  pedometer: {
    active: false,
    steps: 0,
    distanceKm: 0,
    co2SavedKg: 0,
    lastAccel: 0
  },
  chart: null,
  currentScan: null,
  mapSpots: [],
  challenges: [],
  completedChallenges: []
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabNavigation();
  initWeeklyChart();
  initGreenMap();
  updateLeaderboardUi();
});

// --- Auth Initialization & Real Supabase Load ---
async function initAuth() {
  if (typeof EcoAuth === 'undefined') {
    console.error('EcoAuth not found. Make sure supabaseClient.js is loaded.');
    return;
  }

  const hasAuthHash = window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token');

  let user = await EcoAuth.getCurrentUser();
  if (!user && hasAuthHash) {
    // Give Supabase SDK time to parse token from hash
    await new Promise(r => setTimeout(r, 600));
    user = await EcoAuth.getCurrentUser();
  }

  if (!user) {
    // Not logged in — redirect to auth page
    window.location.href = 'auth.html';
    return;
  }

  // Clean URL hash if returning from OAuth redirect
  if (hasAuthHash) {
    try {
      history.replaceState(null, '', window.location.pathname + '#overview');
    } catch(e) {}
  }

  appState.user = user;

  // Load real profile from Supabase
  const profile = await EcoAuth.getProfile();
  if (profile) {
    appState.profile = profile;
    appState.points = profile.total_points || 0;
    appState.co2Saved = parseFloat(profile.co2_saved_tons || 0) * 1000;
    appState.streak = profile.streak_days || 0;
    appState.dailyScore = Math.min(Math.round((profile.total_points || 0) / 10), 100);
    appState.completedChallenges = profile.completed_challenges || [];
  }

  // Load DB Challenges
  appState.challenges = await EcoAuth.getChallenges();

  updateUserUi();
  await loadLeaderboard();
  await loadLiveActivityFeed();
  await loadWeeklyChartData();
}

function updateUserUi() {
  const userName = appState.user 
    ? (appState.user.user_metadata?.full_name || appState.user.email?.split('@')[0] || 'Eco Warrior') 
    : 'Eco Warrior';
  const email = appState.user?.email || 'warrior@ecolife.app';
  const avatarUrl = appState.user?.user_metadata?.avatar_url || appState.user?.user_metadata?.picture || appState.profile?.avatar_url;

  appState.name = userName;

  const sidebarUserName = document.getElementById('sidebarUserName');
  const welcomeUserName = document.getElementById('welcomeUserName');
  const profileFullName = document.getElementById('profileFullName');
  const profileEmail = document.getElementById('profileEmail');
  const leaderboardYourName = document.getElementById('leaderboardYourName');

  if (sidebarUserName) sidebarUserName.textContent = userName;
  if (welcomeUserName) welcomeUserName.textContent = userName;
  if (profileFullName) profileFullName.textContent = userName;
  if (profileEmail) profileEmail.textContent = email;
  if (leaderboardYourName) leaderboardYourName.textContent = userName + ' (You)';

  // Render Real Google PFP Avatar if available
  if (avatarUrl) {
    const profBox = document.getElementById('profileAvatarBox');
    const sideBox = document.getElementById('sidebarAvatarBox');
    if (profBox) {
      profBox.innerHTML = `<img src="${avatarUrl}" class="w-full h-full object-cover rounded-2xl" alt="${userName}" onerror="this.remove()" />`;
    }
    if (sideBox) {
      sideBox.innerHTML = `<img src="${avatarUrl}" class="w-full h-full object-cover rounded-xl" alt="${userName}" onerror="this.remove()" />`;
    }
  }

  refreshStateCounters();
  renderChallengeButtonsState();
  loadProfileActivityHistory();
}

function refreshStateCounters() {
  document.querySelectorAll('#headerUserPoints, #profTotalPoints, #leaderboardYourPts').forEach(el => {
    if (el) el.textContent = appState.points.toLocaleString();
  });

  document.querySelectorAll('#headerCo2Saved, #profCo2Saved, #leaderboardYourCo2').forEach(el => {
    if (el) el.textContent = appState.co2Saved.toFixed(1) + ' kg';
  });

  document.querySelectorAll('#streakDaysCount, #challengeStreakDisplay, #profActiveStreak').forEach(el => {
    if (el) el.textContent = appState.streak + ' Days 🔥';
  });

  const scoreEl = document.getElementById('dailyEcoScore');
  if (scoreEl) scoreEl.textContent = appState.dailyScore;

  // Compute Real Impact Equivalencies
  const co2 = appState.co2Saved || 0;
  const trees = (co2 / 21.77).toFixed(1);
  const carKm = (co2 / 0.192).toFixed(1);
  const bulbs = (co2 * 12.5).toFixed(1);
  const phones = Math.round(co2 * 120);

  const treesEl = document.getElementById('eqTreesPlanted');
  const carEl = document.getElementById('eqCarKm');
  const bulbEl = document.getElementById('eqBulbHours');
  const phoneEl = document.getElementById('eqPhoneCharges');

  if (treesEl) treesEl.textContent = trees;
  if (carEl) carEl.textContent = carKm + ' km';
  if (bulbEl) bulbEl.textContent = bulbs + ' hrs';
  if (phoneEl) phoneEl.textContent = phones.toLocaleString();

  // Update streak progress bar
  const streakBar = document.getElementById('streakProgressBar');
  if (streakBar) {
    const pct = Math.min((appState.streak % 10) / 10 * 100, 100);
    streakBar.style.width = pct + '%';
  }
}

async function loadProfileActivityHistory() {
  const tbody = document.getElementById('profileActivityTableBody');
  if (!tbody || typeof EcoAuth === 'undefined') return;

  const actions = await EcoAuth.getEcoActions();
  if (!actions || actions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-gray-500">No activity history logged yet. Complete eco actions or challenges to start logging!</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  actions.slice(0, 15).forEach(act => {
    const dateStr = act.logged_at ? new Date(act.logged_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';
    tr.innerHTML = `
      <td class="py-3 px-3 text-xs text-gray-500 font-medium">${dateStr}</td>
      <td class="py-3 px-3 font-bold text-[#0a0a0a]">${act.title || 'Eco Action'}</td>
      <td class="py-3 px-3"><span class="neo-badge bg-[#ccff00] text-[#0a0a0a] text-xs">${act.category || 'General'}</span></td>
      <td class="py-3 px-3 text-right font-black text-[#15803d]">+${act.points_earned || 30} pts</td>
      <td class="py-3 px-3 text-right font-bold text-gray-700">${parseFloat(act.co2_saved_kg || 0).toFixed(2)} kg</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChallengeButtonsState() {
  const challengeBtnIds = {
    walk: 'btnChallengeWalk',
    bottle: 'btnChallengeBottle',
    tree: 'btnChallengeTree',
    waste: 'btnChallengeWaste'
  };

  (appState.completedChallenges || []).forEach(id => {
    const btnId = challengeBtnIds[id];
    if (btnId) {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.disabled = true;
        btn.className = 'neo-btn bg-[#15803d] text-white py-2.5 w-full text-xs font-extrabold cursor-not-allowed opacity-90';
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Completed ✓';
      }
    }
  });
}

// --- Navigation Tabs ---
function initTabNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabTarget = link.getAttribute('data-nav') || link.getAttribute('href').replace('#', '');
      switchTab(tabTarget);
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && !hash.includes('access_token') && !hash.includes('refresh_token')) {
      switchTab(hash);
    }
  });

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && !initialHash.includes('access_token') && !initialHash.includes('refresh_token')) {
    setTimeout(() => switchTab(initialHash), 150);
  } else {
    switchTab('overview');
  }
}

function switchTab(tabId) {
  const views = document.querySelectorAll('.page-view');
  views.forEach(v => v.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) {
    targetView.classList.add('active');
    appState.activeTab = tabId;
  }

  document.querySelectorAll('.nav-link').forEach(l => {
    const linkTab = l.getAttribute('data-nav') || l.getAttribute('href')?.replace('#', '');
    if (linkTab === tabId) {
      l.className = 'nav-link flex items-center gap-3 p-3 bg-[#ccff00] text-[#0a0a0a] font-display font-extrabold border-3 border-[#0a0a0a] shadow-[4px_4px_0px_0px_#0a0a0a] rounded-xl';
    } else {
      l.className = 'nav-link flex items-center gap-3 p-3 text-[#0a0a0a] font-display font-bold hover:bg-[#ccff00] border-3 border-transparent hover:border-[#0a0a0a] hover:shadow-[4px_4px_0px_0px_#0a0a0a] rounded-xl transition-all';
    }
  });

  if (tabId === 'map' && appState.map) {
    setTimeout(() => appState.map.invalidateSize(), 200);
  }
}

// --- Weekly Progress Graph — Live from Supabase ---
function initWeeklyChart() {
  const ctx = document.getElementById('weeklyProgressChart');
  if (!ctx) return;

  appState.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Daily Eco Score',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: '#15803d',
          borderColor: '#0a0a0a',
          borderWidth: 2,
          borderRadius: 8,
          yAxisID: 'y'
        },
        {
          label: 'CO₂ Saved (kg)',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: '#ccff00',
          borderColor: '#0a0a0a',
          borderWidth: 2,
          borderRadius: 8,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          max: 100,
          grid: { color: 'rgba(10,10,10,0.1)' }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

async function loadWeeklyChartData() {
  if (!appState.chart || typeof EcoAuth === 'undefined') return;
  const metrics = await EcoAuth.getWeeklyChartMetrics();
  if (metrics) {
    appState.chart.data.labels = metrics.labels;
    appState.chart.data.datasets[0].data = metrics.scores;
    appState.chart.data.datasets[1].data = metrics.co2Saved;
    appState.chart.update();
  }
}

// Fallback Mumbai Green Locations Seed Data
const DEFAULT_MUMBAI_LOCATIONS = [
  { id: 1, category: 'park', type: 'PARK & NATIONAL PARK', name: 'Sanjay Gandhi National Park (SGNP)', address: 'Borivali East, Mumbai, Maharashtra 400066', lat: 19.2312, lng: 72.8656, hours: '07:30 AM - 06:30 PM', items: 'Dense Forest, Cycling Trails, Kanheri Caves', icon: '🌲', verified: true },
  { id: 2, category: 'park', type: 'URBAN PARK & GROUND', name: 'Shivaji Park Promenade & Grounds', address: 'Dadar West, Mumbai, Maharashtra 400028', lat: 19.0269, lng: 72.8378, hours: 'Open 24 Hours', items: 'Walking Tracks, Tree Canopy', icon: '🌲', verified: true },
  { id: 3, category: 'park', type: 'BOTANICAL GARDENS', name: 'Hanging Gardens & Kamala Nehru Park', address: 'Ridge Road, Malabar Hill, Mumbai 400006', lat: 18.9566, lng: 72.8052, hours: '05:00 AM - 09:00 PM', items: 'Topiary Gardens, Arabian Sea Sunset Views', icon: '🌲', verified: true },
  { id: 4, category: 'park', type: 'HERITAGE PARK', name: 'Horniman Circle Heritage Garden', address: 'Fort, South Mumbai, Maharashtra 400001', lat: 18.9322, lng: 72.8354, hours: '06:00 AM - 08:30 PM', items: 'Historic Circular Garden, Native Flora', icon: '🌲', verified: true },
  { id: 5, category: 'ev', type: 'EV FAST CHARGING', name: 'Tata Power EZ Charge Supercharger', address: 'BKC G-Block, Bandra Kurla Complex, Mumbai 400051', lat: 19.0657, lng: 72.8687, hours: '24 Hours Open', items: 'CCS2 150kW Dual Fast Chargers', icon: '⚡', verified: true },
  { id: 6, category: 'ev', type: 'EV CHARGING HUB', name: 'Magenta ChargeGrid Station', address: 'Phoenix Palladium, Lower Parel, Mumbai 400013', lat: 19.0012, lng: 72.8276, hours: '24 Hours Open', items: 'Fast DC Chargers, Solar Canopy', icon: '⚡', verified: true },
  { id: 7, category: 'ev', type: 'EV BIKE & CAR GRID', name: 'Ather Grid Fast Charging Point', address: 'Hiranandani Gardens, Powai, Mumbai 400076', lat: 19.1176, lng: 72.9060, hours: '24 Hours Open', items: 'Fast Ather Grid 2W/4W Chargers', icon: '⚡', verified: true },
  { id: 8, category: 'recycling', type: 'PLASTICS RECYCLING HUB', name: 'Dharavi Eco Plastics Processing Center', address: '90 Feet Road, Dharavi, Mumbai 400017', lat: 19.0434, lng: 72.8526, hours: '08:00 AM - 07:00 PM', items: 'PET, HDPE Plastics, Polyethylene Granulation', icon: '♻️', verified: true },
  { id: 9, category: 'recycling', type: 'E-WASTE DEPOT', name: 'EcoRecycle E-Waste Facility', address: 'MIDC Industrial Area, Andheri East, Mumbai 400093', lat: 19.1155, lng: 72.8677, hours: '09:00 AM - 06:00 PM', items: 'Computers, Phones, Batteries, PCBs', icon: '♻️', verified: true },
  { id: 10, category: 'recycling', type: 'COMMUNITY WASTE HUB', name: 'Bandra Dry Waste Transfer Depot', address: 'Halkara Marg, Bandra West, Mumbai 400050', lat: 19.0544, lng: 72.8402, hours: '07:00 AM - 06:00 PM', items: 'Paper, Cardboard, Glass, Metal Cans', icon: '♻️', verified: true },
  { id: 11, category: 'water', type: 'WATER REFILL KIOSK', name: 'BMC Pure Water Station (Marine Drive)', address: 'Netaji Subhash Road, Marine Drive, Mumbai', lat: 18.9432, lng: 72.8235, hours: 'Open 24 Hours', items: 'RO Purified Cold Water, Free Refill', icon: '💧', verified: true },
  { id: 12, category: 'water', type: 'WATER REFILL BAR', name: 'EcoTap Mineral Water Bar (Juhu Beach)', address: 'Juhu Tara Road, Juhu Promenade, Mumbai 400049', lat: 19.0988, lng: 72.8264, hours: '06:00 AM - 11:00 PM', items: 'UV Filtered Cold Water Kiosk', icon: '💧', verified: true },
  { id: 13, category: 'water', type: 'HERITAGE REFILL KIOSK', name: 'AquaPure Refill Hub (Gateway of India)', address: 'Apollo Bunder, Colaba, South Mumbai 400001', lat: 18.9220, lng: 72.8347, hours: '06:00 AM - 10:00 PM', items: 'Zero-Single-Use-Plastic Mineral Refill', icon: '💧', verified: true }
];

// --- Database-Driven Green Locations Map ---
async function initGreenMap() {
  const mapElement = document.getElementById('greenMap');
  if (!mapElement || typeof L === 'undefined') return;

  appState.map = L.map('greenMap').setView([appState.userLat, appState.userLng], 12);

  appState.tileLayerStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(appState.map);

  appState.tileLayerSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri, DigitalGlobe, GeoEye'
  });

  // Fetch map spots from Supabase DB (with fallback to default seed locations)
  const spots = await EcoAuth.getMapSpots();
  appState.mapSpots = (spots && spots.length > 0) ? spots : DEFAULT_MUMBAI_LOCATIONS;
  renderMapMarkers(appState.mapSpots);
}

function renderMapMarkers(spots) {
  if (!appState.map) return;
  appState.markers.forEach(m => appState.map.removeLayer(m));
  appState.markers = [];

  const categoryColors = {
    park: '#15803d',
    ev: '#facc15',
    recycling: '#38bdf8',
    water: '#4ade80'
  };

  spots.forEach(spot => {
    const color = categoryColors[spot.category] || '#15803d';
    const iconHtml = `<div class="custom-neo-marker" style="background:${color};border:3px solid #0a0a0a;box-shadow:3px 3px 0px #0a0a0a;border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;">${spot.icon || '📍'}</div>`;
    const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [34, 34], iconAnchor: [17, 17] });

    const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(appState.map);
    const verifiedTag = spot.verified ? '<span style="background:#15803d;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">🟢 Verified</span>' : '<span style="background:#facc15;color:#0a0a0a;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">🟡 Community Submitted</span>';

    marker.bindPopup(`
      <div style="font-family:Inter,sans-serif;padding:4px;">
        <div style="margin-bottom:4px;">${verifiedTag}</div>
        <h4 style="font-weight:900;font-size:14px;margin:0 0 2px 0;">${spot.name}</h4>
        <p style="font-size:11px;color:#666;margin:0 0 6px 0;">${spot.address}</p>
        <p style="font-size:11px;margin:0;"><strong>Hours:</strong> ${spot.hours || 'N/A'}</p>
        <p style="font-size:11px;margin:0;"><strong>Items:</strong> ${spot.items || 'Green Facility'}</p>
      </div>
    `);
    appState.markers.push(marker);
  });
}

function filterMapPins(category) {
  const btns = document.querySelectorAll('.map-filter-btn');
  btns.forEach(b => {
    if (b.textContent.toLowerCase().includes(category) || (category === 'all' && b.textContent.includes('All'))) {
      b.className = 'map-filter-btn neo-btn bg-[#ccff00] text-[#0a0a0a] text-xs py-1.5 px-2.5';
    } else {
      b.className = 'map-filter-btn neo-btn bg-white hover:bg-gray-100 text-[#0a0a0a] text-xs py-1.5 px-2.5';
    }
  });

  if (category === 'all') {
    renderMapMarkers(appState.mapSpots);
  } else {
    const filtered = appState.mapSpots.filter(s => s.category === category);
    renderMapMarkers(filtered);
  }
}

function toggleSatelliteView() {
  const btn = document.getElementById('btnSatelliteToggle');
  if (!appState.map) return;

  if (appState.isSatellite) {
    appState.map.removeLayer(appState.tileLayerSatellite);
    appState.map.addLayer(appState.tileLayerStandard);
    appState.isSatellite = false;
    if (btn) btn.classList.remove('satellite-active');
  } else {
    appState.map.removeLayer(appState.tileLayerStandard);
    appState.map.addLayer(appState.tileLayerSatellite);
    appState.isSatellite = true;
    if (btn) btn.classList.add('satellite-active');
  }
}

function requestUserLocation() {
  const btn = document.getElementById('btnLocateUser');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '📍 Locating...';
  }

  const setLocationOnMap = (lat, lng, accuracy = 50, label = 'Your Location') => {
    appState.userLat = lat;
    appState.userLng = lng;
    if (appState.map) {
      const targetZoom = accuracy < 150 ? 16 : (accuracy < 1000 ? 14 : 12);
      appState.map.setView([lat, lng], targetZoom, { animate: true });
      
      if (appState.userMarker) appState.map.removeLayer(appState.userMarker);
      if (appState.userAccuracyCircle) appState.map.removeLayer(appState.userAccuracyCircle);

      if (accuracy && accuracy < 10000) {
        appState.userAccuracyCircle = L.circle([lat, lng], {
          radius: accuracy,
          color: '#15803d',
          fillColor: '#ccff00',
          fillOpacity: 0.25,
          weight: 2
        }).addTo(appState.map);
      }

      const beaconHtml = '<div class="user-location-beacon" title="Your Location"></div>';
      const beaconIcon = L.divIcon({ html: beaconHtml, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
      
      appState.userMarker = L.marker([lat, lng], { icon: beaconIcon }).addTo(appState.map);
      const accText = accuracy ? ` (±${Math.round(accuracy)}m accuracy)` : '';
      
      appState.userMarker.bindPopup(`
        <div style="font-family:Inter,sans-serif;padding:4px;text-align:center;">
          <span style="background:#ccff00;color:#0a0a0a;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:900;border:1.5px solid #0a0a0a;">📍 ${label}</span>
          <p style="font-size:10px;color:#333;margin:4px 0 0 0;font-weight:bold;">${accText}</p>
          <p style="font-size:10px;color:#666;margin:2px 0 0 0;">Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</p>
        </div>
      `).openPopup();

      updateDistancesFromUser(lat, lng);
    }
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy || 50;

        setLocationOnMap(lat, lng, acc, 'Your Live Location');
        showToast(`Position verified (±${Math.round(acc)}m)`, '📍');
        if (btn) { btn.disabled = false; btn.textContent = '📍 Locate Me'; }
      },
      async (err) => {
        console.warn("HTML5 Geolocation fallback:", err);
        try {
          const res = await fetch('https://ipapi.co/json/');
          const ipData = await res.json();
          if (ipData && ipData.latitude && ipData.longitude) {
            setLocationOnMap(ipData.latitude, ipData.longitude, 2500, `${ipData.city || 'City'} Area (IP Geolocation)`);
            showToast(`Located area: ${ipData.city || 'Local Area'}`, '📍');
          } else {
            throw new Error('IP Geo failed');
          }
        } catch (e) {
          setLocationOnMap(19.0760, 72.8777, 5000, 'Mumbai Central (Default)');
          showToast('Location centered on Mumbai', '📍');
        }
        if (btn) { btn.disabled = false; btn.textContent = '📍 Locate Me'; }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  } else {
    setLocationOnMap(19.0760, 72.8777, 5000, 'Mumbai Central');
    showToast('Browser geolocation unsupported', '⚠️');
    if (btn) { btn.disabled = false; btn.textContent = '📍 Locate Me'; }
  }
}

function updateDistancesFromUser(userLat, userLng) {
  if (!appState.mapSpots) return;
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371;

  appState.mapSpots.forEach(spot => {
    const dLat = toRad(spot.lat - userLat);
    const dLng = toRad(spot.lng - userLng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(userLat)) * Math.cos(toRad(spot.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;
    spot.distanceKm = parseFloat(distKm.toFixed(2));
  });
}

// Add Spot Modal Handlers
function openAddSpotModal() {
  const modal = document.getElementById('modalAddSpot');
  if (modal) modal.classList.add('open');
}

function closeAddSpotModal() {
  const modal = document.getElementById('modalAddSpot');
  if (modal) modal.classList.remove('open');
}

async function handleAddSpotSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('spotName').value;
  const category = document.getElementById('spotCategory').value;
  const address = document.getElementById('spotAddress').value;
  const lat = parseFloat(document.getElementById('spotLat').value);
  const lng = parseFloat(document.getElementById('spotLng').value);
  const hours = document.getElementById('spotHours').value || 'Open 24 Hours';
  const items = document.getElementById('spotItems').value || 'Community Submitted Spot';

  const categoryIcons = { park: '🌲', ev: '⚡', recycling: '♻️', water: '💧' };
  const typeLabels = { park: 'PARK & GREEN SPACE', ev: 'EV CHARGING', recycling: 'RECYCLING HUB', water: 'WATER REFILL' };

  const newSpot = {
    name, category, type: typeLabels[category] || 'GREEN FACILITY',
    address, lat, lng, hours, items, icon: categoryIcons[category] || '📍'
  };

  const res = await EcoAuth.addMapSpot(newSpot);
  if (res.success) {
    appState.mapSpots.push(res.data || newSpot);
    renderMapMarkers(appState.mapSpots);
    closeAddSpotModal();
    showToast('Green place submitted for verification!', '🌱');
  } else {
    showToast(res.message || 'Error adding spot', '⚠️');
  }
}

// --- AI WASTE SCANNER ENGINE ---
let mobilenetModel = null;
if (typeof mobilenet !== 'undefined') {
  mobilenet.load().then(model => {
    mobilenetModel = model;
    console.log("MobileNet AI Vision model loaded successfully.");
  }).catch(e => console.error("MobileNet load error:", e));
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    displayScanPreview(e.target.result);
    runAiClassification();
  };
  reader.readAsDataURL(file);
}

function simulateCameraCapture(type) {
  const sampleSvgs = {
    plastic: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%23ccff00'/><text x='50%' y='50%' font-size='72' text-anchor='middle' dominant-baseline='middle'>🧴</text><text x='50%' y='80%' font-size='20' text-anchor='middle'>PET Water Bottle</text></svg>",
    paper: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%2338bdf8'/><text x='50%' y='50%' font-size='72' text-anchor='middle' dominant-baseline='middle'>📦</text><text x='50%' y='80%' font-size='20' text-anchor='middle'>Cardboard Box</text></svg>",
    metal: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%23facc15'/><text x='50%' y='50%' font-size='72' text-anchor='middle' dominant-baseline='middle'>🥫</text><text x='50%' y='80%' font-size='20' text-anchor='middle'>Aluminum Soda Can</text></svg>",
    glass: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%234ade80'/><text x='50%' y='50%' font-size='72' text-anchor='middle' dominant-baseline='middle'>🍾</text><text x='50%' y='80%' font-size='20' text-anchor='middle'>Glass Juice Bottle</text></svg>",
    cat: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%23ffdad6'/><text x='50%' y='50%' font-size='72' text-anchor='middle' dominant-baseline='middle'>🐱</text><text x='50%' y='80%' font-size='20' fill='%23ba1a1a' text-anchor='middle'>House Cat (Non-Waste)</text></svg>"
  };

  const svg = sampleSvgs[type] || sampleSvgs.plastic;
  displayScanPreview(svg, type);
  runAiClassification();
}

function displayScanPreview(imgSrc, sampleType = null) {
  const uploadPrompt = document.getElementById('uploadPrompt');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');

  if (uploadPrompt) uploadPrompt.classList.add('hidden');
  if (previewContainer) previewContainer.classList.remove('hidden');
  if (imagePreview) {
    imagePreview.src = imgSrc;
    imagePreview.dataset.sampleType = sampleType || '';
  }
}

async function runAiClassification() {
  const emptyState = document.getElementById('aiResultStateEmpty');
  const activeState = document.getElementById('aiResultStateActive');
  const unknownState = document.getElementById('aiResultStateUnknown');
  const scanLaser = document.getElementById('scanLaser');
  const imagePreview = document.getElementById('imagePreview');

  if (emptyState) emptyState.classList.add('hidden');
  if (unknownState) unknownState.classList.add('hidden');
  if (activeState) activeState.classList.add('hidden');
  if (scanLaser) scanLaser.classList.remove('hidden');

  setTimeout(async () => {
    if (scanLaser) scanLaser.classList.add('hidden');

    const sampleType = imagePreview?.dataset?.sampleType;
    let category = 'Plastic';
    let itemTitle = 'PET Plastic Bottle';
    let confidence = 94.5;
    let step1 = 'Rinse bottle and remove cap before disposal.';
    let step2 = 'Place in Yellow / Blue Plastic Recycling Bin.';
    let step3 = 'Saves approx ~0.08 kg CO₂ per item recycled.';

    if (sampleType === 'cat') {
      if (unknownState) unknownState.classList.remove('hidden');
      return;
    } else if (sampleType === 'paper') {
      category = 'Paper'; itemTitle = 'Cardboard & Paper Box';
      step1 = 'Flatten box to save space in bin.'; step2 = 'Place in Blue Paper Recycling Bin.'; step3 = 'Saves approx ~0.12 kg CO₂ per box recycled.';
    } else if (sampleType === 'metal') {
      category = 'Metal'; itemTitle = 'Aluminum / Steel Can';
      step1 = 'Rinse out liquid residue completely.'; step2 = 'Place in Metal Dry Waste Bin.'; step3 = 'Saves approx ~0.15 kg CO₂ per can recycled.';
    } else if (sampleType === 'glass') {
      category = 'Glass'; itemTitle = 'Glass Bottle & Jar';
      step1 = 'Rinse glass bottle and remove metal cap.'; step2 = 'Deposit in Glass Collection Kiosk.'; step3 = 'Saves approx ~0.10 kg CO₂ per bottle recycled.';
    }

    appState.currentScan = { category, itemTitle, confidence, co2SavedKg: 0.08 };

    document.getElementById('predictedCategoryBadge').textContent = `${category.toUpperCase()} WASTE`;
    document.getElementById('predictedItemTitle').textContent = itemTitle;
    document.getElementById('confidenceScoreVal').textContent = `${confidence.toFixed(1)}% Confidence`;
    document.getElementById('instructionStep1').textContent = step1;
    document.getElementById('instructionStep2').textContent = step2;
    document.getElementById('instructionStep3').textContent = step3;

    if (activeState) activeState.classList.remove('hidden');
  }, 1200);
}

async function confirmAiPrediction(isConfirmed) {
  const scan = appState.currentScan;
  const category = isConfirmed ? scan.category : (document.getElementById('correctCategorySelect').value || scan.category);
  const impact = CarbonEngine.calculateWasteImpact(category, 1);

  // Log scan & action to Supabase
  await EcoAuth.logWasteScan({
    detectedItem: scan.itemTitle,
    category: category,
    confidence: scan.confidence,
    disposalMethod: 'Recycling Bin',
    co2SavedKg: impact.co2SavedKg
  });

  const res = await EcoAuth.logEcoAction(category, `Recycled ${scan.itemTitle}`, impact.co2SavedKg);
  if (res.success) {
    appState.points += impact.points;
    appState.co2Saved += impact.co2SavedKg;
    appState.scannedCount += 1;
    refreshStateCounters();
    await loadWeeklyChartData();
    showToast(`+${impact.points} Pts! Logged waste scan to Supabase`, '♻️');
  }
}

// --- LIVE CAMERA PERMISSION HANDLER ---
let activeMediaStream = null;

async function requestCameraAccess() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Camera access not supported by your browser', '⚠️');
    return;
  }

  showToast('Requesting camera permission...', '📷');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    activeMediaStream = stream;

    const videoEl = document.getElementById('cameraStream');
    if (videoEl) {
      videoEl.srcObject = stream;
      videoEl.play();
    }

    const modal = document.getElementById('modalLiveCamera');
    if (modal) modal.classList.add('open');
  } catch (err) {
    console.error("Camera permission error:", err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      showToast('Camera permission denied by user', '🚫');
    } else {
      showToast(`Camera error: ${err.message}`, '⚠️');
    }
  }
}

function captureCameraPhoto() {
  const videoEl = document.getElementById('cameraStream');
  const canvasEl = document.getElementById('cameraCanvas');
  if (!videoEl || !canvasEl) return;

  const width = videoEl.videoWidth || 640;
  const height = videoEl.videoHeight || 480;

  canvasEl.width = width;
  canvasEl.height = height;

  const ctx = canvasEl.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, width, height);

  const photoDataUrl = canvasEl.toDataURL('image/jpeg', 0.92);

  closeCameraModal();
  displayScanPreview(photoDataUrl, 'camera_capture');
  runAiClassification();
  showToast('Live photo captured & sent to AI Scanner!', '📸');
}

function closeCameraModal() {
  if (activeMediaStream) {
    activeMediaStream.getTracks().forEach(track => track.stop());
    activeMediaStream = null;
  }
  const modal = document.getElementById('modalLiveCamera');
  if (modal) modal.classList.remove('open');
}

// --- PEDOMETER & ACTIVITY SESSIONS ---
function togglePedometerTracking() {
  const btn = document.getElementById('btnTogglePedometer');
  const ped = appState.pedometer;

  if (ped.active) {
    ped.active = false;
    if (btn) {
      btn.className = 'neo-btn bg-[#ccff00] text-[#0a0a0a] text-xs py-2 px-4 font-bold';
      btn.textContent = '▶ Start Pedometer';
    }

    // Persist walking session to Supabase
    if (ped.steps > 0) {
      const impact = CarbonEngine.calculateWalkingImpact(ped.distanceKm);
      EcoAuth.createActivitySession({
        type: 'walk',
        steps: ped.steps,
        distanceKm: ped.distanceKm,
        durationSeconds: 300,
        co2SavedKg: impact.co2SavedKg,
        pointsEarned: impact.points
      });
      showToast(`Walk session saved! +${impact.points} Pts`, '🚶');
    }
  } else {
    ped.active = true;

    // Explicitly request Motion Sensor Permission on iOS 13+ / Safari
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
            showToast('Motion sensor permission granted!', '👟');
          } else {
            showToast('Motion sensor permission denied', '⚠️');
          }
        })
        .catch(err => console.warn('Motion permission catch:', err));
    } else if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion);
      showToast('Pedometer active. Start walking!', '👟');
    }

    if (btn) {
      btn.className = 'neo-btn bg-red-500 text-white text-xs py-2 px-4 font-bold';
      btn.textContent = '⏹ Stop Pedometer';
    }
  }
}

function handleDeviceMotion(event) {
  if (!appState.pedometer.active) return;
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  const delta = Math.abs(mag - appState.pedometer.lastAccel);
  appState.pedometer.lastAccel = mag;

  if (delta > 3.5) {
    simulateWalkStep(1);
  }
}

function simulateWalkStep(stepCount = 1) {
  const ped = appState.pedometer;
  ped.steps += stepCount;
  ped.distanceKm = parseFloat((ped.steps * 0.00075).toFixed(3));
  ped.co2SavedKg = parseFloat((ped.distanceKm * 0.192).toFixed(4));

  const stepsEl = document.getElementById('livePedometerSteps');
  const distEl = document.getElementById('livePedometerDistance');
  const co2El = document.getElementById('livePedometerCo2Saved');

  if (stepsEl) stepsEl.textContent = ped.steps.toLocaleString();
  if (distEl) distEl.textContent = ped.distanceKm.toFixed(2) + ' km';
  if (co2El) co2El.textContent = ped.co2SavedKg.toFixed(3) + ' kg';
}

// --- COMMUNITY LEADERBOARD ---
async function loadLeaderboard() {
  if (typeof EcoAuth === 'undefined') return;
  const data = await EcoAuth.getLeaderboard();
  if (data && data.length > 0) {
    appState.leaderboard = data;
    updateLeaderboardUi();
  }
}

function updateLeaderboardUi() {
  const tbody = document.getElementById('leaderboardTableBody');
  if (!tbody) return;

  const entries = appState.leaderboard || [];
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">No leaderboard data yet. Be the first!</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  const currentUserId = appState.user?.id;

  entries.forEach((item, index) => {
    const rankNum = index + 1;
    const isUser = item.id === currentUserId;
    const name = item.full_name || 'Eco Warrior';
    const points = item.total_points || 0;
    const co2Kg = ((item.co2_saved_tons || 0) * 1000).toFixed(1);
    const avatarLetter = name.charAt(0).toUpperCase();

    const tr = document.createElement('tr');
    if (isUser) {
      tr.className = 'bg-[#15803d]/15 border-l-4 border-l-[#15803d] font-black';
    } else if (rankNum === 1) {
      tr.className = 'bg-[#ccff00]/25';
    }

    let rankBadge = `# ${rankNum}`;
    if (rankNum === 1) rankBadge = '🥇';
    if (rankNum === 2) rankBadge = '🥈';
    if (rankNum === 3) rankBadge = '🥉';

    tr.innerHTML = `
      <td class="px-4 py-3 text-center font-black text-lg">${rankBadge}</td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-[#15803d] text-white">
            ${item.avatar_url ? `<img src="${item.avatar_url}" class="w-8 h-8 rounded-full object-cover" onerror="this.style.display='none';this.nextSibling.style.display='flex'" /><span style="display:none">${avatarLetter}</span>` : avatarLetter}
          </div>
          <div>
            <div class="font-bold">${name}${isUser ? ' <span class="text-[#15803d]">(You)</span>' : ''}</div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-center font-black">${points.toLocaleString()}</td>
      <td class="px-4 py-3 text-center">${co2Kg} kg</td>
    `;
    tbody.appendChild(tr);
  });

  if (currentUserId) {
    const myRank = entries.findIndex(e => e.id === currentUserId) + 1;
    const rankEl = document.getElementById('leaderboardYourRank');
    const badgeEl = document.getElementById('leaderboardUserRankBadge');
    if (rankEl && myRank > 0) rankEl.textContent = '#' + myRank;
    if (badgeEl && myRank > 0) badgeEl.textContent = `Your Live Rank: #${myRank}`;
  }
}

// --- LIVE COMMUNITY ACTIVITY FEED ---
async function loadLiveActivityFeed() {
  const feed = document.getElementById('liveActivityFeed');
  if (!feed) return;

  const activities = await EcoAuth.getChallengeActivityFeed();
  if (!activities || activities.length === 0) return;

  const emptyState = document.getElementById('activityFeedEmpty');
  if (emptyState) emptyState.style.display = 'none';

  feed.querySelectorAll('.activity-item').forEach(el => el.remove());

  activities.forEach(act => {
    const name = act.profiles?.full_name || 'Eco Warrior';
    const title = act.challenges?.title || 'Eco Challenge';
    const icon = act.challenges?.icon || '🌱';
    const pts = act.points_awarded || 30;

    const div = document.createElement('div');
    div.className = 'activity-item p-3 bg-[#f6f9f3] border-2 border-[#0a0a0a] rounded-xl flex items-center gap-3';
    div.innerHTML = `
      <span class="text-xl">${icon}</span>
      <div class="text-xs">
        <p class="font-black text-[#0a0a0a]">${name} completed ${title}</p>
        <p class="text-[10px] font-bold text-[#15803d]">+${pts} Pts • Verified ✓</p>
      </div>`;
    feed.appendChild(div);
  });
}

// --- AI CHALLENGE PROOF VERIFICATION MODAL ENGINE ---
function openChallengeProofModal(type) {
  appState.activeProofType = type;

  const modal = document.getElementById('modalChallengeProof');
  const titleEl = document.getElementById('proofModalTitle');
  const descEl = document.getElementById('proofModalDesc');

  const challengeTitles = {
    walk: 'Walk 2 km', bottle: 'Use Reusable Water Bottle', tree: 'Plant a Tree / Sapling', waste: 'Segregate Household Waste'
  };

  if (titleEl) titleEl.textContent = `AI Proof Verification: ${challengeTitles[type] || 'Challenge'}`;
  if (modal) modal.classList.add('open');

  if (type === 'walk') simulateProofSample('walk_valid', false);
  else if (type === 'bottle') simulateProofSample('bottle_valid', false);
  else if (type === 'tree') simulateProofSample('tree_valid', false);
  else simulateProofSample('bottle_valid', false);
}

function closeChallengeProofModal() {
  const modal = document.getElementById('modalChallengeProof');
  if (modal) modal.classList.remove('open');
}

function handleChallengeProofUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    displayProofPreview(e.target.result);
    runAiProofVerification();
  };
  reader.readAsDataURL(file);
}

function simulateProofSample(sampleId, autoRun = true) {
  let sampleSvg = "";
  if (sampleId === 'walk_valid') {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%23ccff00'/><text x='50%' y='40%' font-size='48' text-anchor='middle'>🏃 2.4 km</text><text x='50%' y='65%' font-size='24' text-anchor='middle'>3,200 Steps - Walk Log</text></svg>";
  } else if (sampleId === 'bottle_valid') {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%2338bdf8'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle'>🧴</text><text x='50%' y='80%' font-size='20' text-anchor='middle'>Stainless Steel Flask</text></svg>";
  } else if (sampleId === 'bottle_plastic') {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%23ffdad6'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle'>🥤</text><text x='50%' y='80%' font-size='20' fill='%23ba1a1a' text-anchor='middle'>Single-Use Plastic Bottle</text></svg>";
  } else if (sampleId === 'tree_valid') {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%234ade80'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle'>🪴</text><text x='50%' y='80%' font-size='20' text-anchor='middle'>Indoor Plant Sapling</text></svg>";
  }
  displayProofPreview(sampleSvg, sampleId);
  if (autoRun) runAiProofVerification();
}

function displayProofPreview(imgSrc, sampleId = null) {
  const promptEl = document.getElementById('proofUploadPrompt');
  const previewContainer = document.getElementById('proofPreviewContainer');
  const imagePreview = document.getElementById('proofImagePreview');

  if (promptEl) promptEl.classList.add('hidden');
  if (previewContainer) previewContainer.classList.remove('hidden');
  if (imagePreview) {
    imagePreview.src = imgSrc;
    imagePreview.dataset.sampleId = sampleId || '';
  }
}

async function runAiProofVerification() {
  const proofType = appState.activeProofType || 'walk';
  const imagePreview = document.getElementById('proofImagePreview');
  const feedbackContainer = document.getElementById('proofFeedbackContainer');
  const iconEl = document.getElementById('proofFeedbackIcon');
  const titleEl = document.getElementById('proofFeedbackTitle');
  const msgEl = document.getElementById('proofFeedbackMsg');
  const laserEl = document.getElementById('proofScanLaser');

  if (laserEl) laserEl.classList.remove('hidden');
  if (feedbackContainer) {
    feedbackContainer.classList.remove('hidden');
    feedbackContainer.className = 'p-4 rounded-xl border-3 border-[#0a0a0a] bg-yellow-50 shadow-[3px_3px_0px_0px_#0a0a0a]';
  }

  if (iconEl) iconEl.textContent = '🤖';
  if (titleEl) titleEl.textContent = 'AI Vision Model Scanning Proof...';
  if (msgEl) msgEl.textContent = 'Evaluating image content against criteria...';

  setTimeout(async () => {
    if (laserEl) laserEl.classList.add('hidden');

    const sampleId = imagePreview?.dataset?.sampleId;
    let passed = true;
    let failReason = "";

    if (proofType === 'bottle' && sampleId === 'bottle_plastic') {
      passed = false;
      failReason = "Single-use disposable plastic bottle detected. Points are only awarded for reusable non-plastic bottles.";
    }

    if (passed) {
      // Call SERVER-CONTROLLED completeChallenge method
      const res = await EcoAuth.completeChallenge(proofType, { sampleId, timestamp: Date.now() });

      if (res.success) {
        feedbackContainer.className = 'p-4 rounded-xl border-3 border-[#0a0a0a] bg-green-100 shadow-[3px_3px_0px_0px_#0a0a0a]';
        if (iconEl) iconEl.textContent = '✅';
        if (titleEl) titleEl.textContent = `Verified! +${res.pointsAwarded} Points Awarded!`;
        if (msgEl) msgEl.textContent = `Criteria satisfied. Challenge completion saved to Supabase.`;

        appState.points += res.pointsAwarded;
        appState.completedChallenges.push(proofType);
        refreshStateCounters();
        renderChallengeButtonsState();
        await loadLeaderboard();
        await loadLiveActivityFeed();
        await loadWeeklyChartData();

        setTimeout(() => closeChallengeProofModal(), 2000);
      } else {
        feedbackContainer.className = 'p-4 rounded-xl border-3 border-[#0a0a0a] bg-red-100 shadow-[3px_3px_0px_0px_#0a0a0a]';
        if (iconEl) iconEl.textContent = '⚠️';
        if (titleEl) titleEl.textContent = 'Completion Status';
        if (msgEl) msgEl.textContent = res.message || 'Challenge already completed.';
      }
    } else {
      feedbackContainer.className = 'p-4 rounded-xl border-3 border-[#0a0a0a] bg-red-100 shadow-[3px_3px_0px_0px_#0a0a0a]';
      if (iconEl) iconEl.textContent = '❌';
      if (titleEl) titleEl.textContent = 'Challenge Not Completed';
      if (msgEl) msgEl.textContent = failReason;
    }
  }, 1400);
}

// --- QUICK ACTIONS & FOOTPRINT MODAL ---
async function quickLogAction(actionTitle, co2SavedKg) {
  const impact = CarbonEngine.calculateWasteImpact('Plastic', 1);
  const res = await EcoAuth.logEcoAction('general', actionTitle, co2SavedKg);
  if (res.success) {
    appState.points += 30;
    appState.co2Saved += co2SavedKg;
    showToast(`Logged: ${actionTitle} (+30 Pts)`, '🌿');
    refreshStateCounters();
    await loadLeaderboard();
    await loadWeeklyChartData();
  }
}

function openCarbonCalcModal() {
  const modal = document.getElementById('modalCarbonCalc');
  if (modal) modal.classList.add('open');
}

function closeCarbonCalcModal() {
  const modal = document.getElementById('modalCarbonCalc');
  if (modal) modal.classList.remove('open');
}

function submitFootprintCalc() {
  const km = parseFloat(document.getElementById('calcKm').value) || 12;
  const kwh = parseFloat(document.getElementById('calcKwh').value) || 8;

  const result = CarbonEngine.calculateFootprint({ transportKmPerWeek: km * 7, electricityKwhPerMonth: kwh * 30 });
  document.getElementById('fpTransportVal').textContent = result.transportMonthlyKg + ' kg CO₂';
  document.getElementById('fpEnergyVal').textContent = result.energyMonthlyKg + ' kg CO₂';

  closeCarbonCalcModal();
  showToast('Carbon Footprint recalculated via CarbonEngine!', '⚡');
}

function handleAuthAction() {
  if (appState.user) {
    if (typeof EcoAuth !== 'undefined') EcoAuth.signOut();
    appState.user = null;
    updateUserUi();
    showToast('Signed out successfully.', '👋');
    window.location.href = 'auth.html';
  } else {
    window.location.href = 'auth.html';
  }
}

// --- Toast Notification Helper ---
function showToast(message, icon = '🌿') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
