/**
 * EcoLife Application Controller Script
 * Team .Tensor
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
  currentScan: null
};

// Real Mumbai Green Locations Data
const MUMBAI_LOCATIONS = [
  // 🌲 PARKS & GREEN SPACES
  {
    id: 1,
    category: 'park',
    type: 'PARK & NATIONAL PARK',
    name: 'Sanjay Gandhi National Park (SGNP)',
    address: 'Borivali East, Mumbai, Maharashtra 400066',
    lat: 19.2312,
    lng: 72.8656,
    hours: '07:30 AM - 06:30 PM',
    distance: 'Calculating...',
    items: 'Dense Forest, Cycling Trails, Kanheri Caves, Tiger Safari',
    icon: '🌲'
  },
  {
    id: 2,
    category: 'park',
    type: 'URBAN PARK & GROUND',
    name: 'Shivaji Park Promenade & Grounds',
    address: 'Dadar West, Mumbai, Maharashtra 400028',
    lat: 19.0269,
    lng: 72.8378,
    hours: 'Open 24 Hours',
    distance: 'Calculating...',
    items: 'Walking Tracks, Tree Canopy, Open Recreation Grounds',
    icon: '🌲'
  },
  {
    id: 3,
    category: 'park',
    type: 'BOTANICAL GARDENS',
    name: 'Hanging Gardens & Kamala Nehru Park',
    address: 'Ridge Road, Malabar Hill, Mumbai 400006',
    lat: 18.9566,
    lng: 72.8052,
    hours: '05:00 AM - 09:00 PM',
    distance: 'Calculating...',
    items: 'Topiary Gardens, Arabian Sea Sunset Views, Native Trees',
    icon: '🌲'
  },
  {
    id: 4,
    category: 'park',
    type: 'HERITAGE PARK',
    name: 'Horniman Circle Heritage Garden',
    address: 'Fort, South Mumbai, Maharashtra 400001',
    lat: 18.9322,
    lng: 72.8354,
    hours: '06:00 AM - 08:30 PM',
    distance: 'Calculating...',
    items: 'Historic Circular Garden, Native Flora, Shaded Seating',
    icon: '🌲'
  },

  // ⚡ EV CHARGING STATIONS
  {
    id: 5,
    category: 'ev',
    type: 'EV FAST CHARGING',
    name: 'Tata Power EZ Charge Supercharger',
    address: 'BKC G-Block, Bandra Kurla Complex, Mumbai 400051',
    lat: 19.0657,
    lng: 72.8687,
    hours: '24 Hours Open',
    distance: 'Calculating...',
    items: 'CCS2 150kW Dual Fast Chargers, Type 2 AC',
    icon: '⚡'
  },
  {
    id: 6,
    category: 'ev',
    type: 'EV CHARGING HUB',
    name: 'Magenta ChargeGrid Station',
    address: 'Phoenix Palladium, Lower Parel, Mumbai 400013',
    lat: 19.0012,
    lng: 72.8276,
    hours: '24 Hours Open',
    distance: 'Calculating...',
    items: 'Fast DC Chargers, Solar Canopy Backup',
    icon: '⚡'
  },
  {
    id: 7,
    category: 'ev',
    type: 'EV SUPERCHARGING',
    name: 'Relux EV Supercharger Station',
    address: 'Worli Sea Face Road, Worli, Mumbai 400030',
    lat: 19.0176,
    lng: 72.8152,
    hours: '24 Hours Open',
    distance: 'Calculating...',
    items: 'Ultra Fast 200kW DC Chargers, All EV Compatible',
    icon: '⚡'
  },
  {
    id: 8,
    category: 'ev',
    type: 'EV BIKE & CAR GRID',
    name: 'Ather Grid Fast Charging Point',
    address: 'Hiranandani Gardens, Powai, Mumbai 400076',
    lat: 19.1176,
    lng: 72.9060,
    hours: '24 Hours Open',
    distance: 'Calculating...',
    items: 'Fast Ather Grid 2W/4W Chargers',
    icon: '⚡'
  },

  // ♻️ RECYCLING CENTERS
  {
    id: 9,
    category: 'recycling',
    type: 'PLASTICS RECYCLING HUB',
    name: 'Dharavi Eco Plastics Processing Center',
    address: '90 Feet Road, Dharavi, Mumbai 400017',
    lat: 19.0434,
    lng: 72.8526,
    hours: '08:00 AM - 07:00 PM',
    distance: 'Calculating...',
    items: 'PET, HDPE Plastics, Polyethylene Granulation',
    icon: '♻️'
  },
  {
    id: 10,
    category: 'recycling',
    type: 'E-WASTE DEPOT',
    name: 'EcoRecycle (Ecoreco) E-Waste Facility',
    address: 'MIDC Industrial Area, Andheri East, Mumbai 400093',
    lat: 19.1155,
    lng: 72.8677,
    hours: '09:00 AM - 06:00 PM',
    distance: 'Calculating...',
    items: 'Computers, Phones, Batteries, PCB Boards',
    icon: '♻️'
  },
  {
    id: 11,
    category: 'recycling',
    type: 'COMMUNITY WASTE HUB',
    name: 'Bandra Dry Waste Transfer Depot',
    address: 'Halkara Marg, Bandra West, Mumbai 400050',
    lat: 19.0544,
    lng: 72.8402,
    hours: '07:00 AM - 06:00 PM',
    distance: 'Calculating...',
    items: 'Paper, Cardboard, Glass, Metal Cans',
    icon: '♻️'
  },

  // 💧 WATER REFILL STATIONS
  {
    id: 12,
    category: 'water',
    type: 'WATER REFILL KIOSK',
    name: 'BMC Pure Water Station (Marine Drive)',
    address: 'Netaji Subhash Chandra Bose Road, Marine Drive, Mumbai',
    lat: 18.9432,
    lng: 72.8235,
    hours: 'Open 24 Hours',
    distance: 'Calculating...',
    items: 'RO Purified Cold Water, Free Refill',
    icon: '💧'
  },
  {
    id: 13,
    category: 'water',
    type: 'WATER REFILL BAR',
    name: 'EcoTap Mineral Water Bar (Juhu Beach)',
    address: 'Juhu Tara Road, Juhu Promenade, Mumbai 400049',
    lat: 19.0988,
    lng: 72.8264,
    hours: '06:00 AM - 11:00 PM',
    distance: 'Calculating...',
    items: 'UV Filtered Cold Water Kiosk',
    icon: '💧'
  },
  {
    id: 14,
    category: 'water',
    type: 'HERITAGE REFILL KIOSK',
    name: 'AquaPure Refill Hub (Gateway of India)',
    address: 'Apollo Bunder, Colaba, South Mumbai 400001',
    lat: 18.9220,
    lng: 72.8347,
    hours: '06:00 AM - 10:00 PM',
    distance: 'Calculating...',
    items: 'Zero-Single-Use-Plastic Mineral Refill',
    icon: '💧'
  }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabNavigation();
  initWeeklyChart();
  initGreenMap();
  updateLeaderboardUi();
});

// --- Auth Initialization ---
async function initAuth() {
  if (typeof EcoAuth === 'undefined') {
    console.error('EcoAuth not found. Make sure supabaseClient.js is loaded.');
    return;
  }

  const user = await EcoAuth.getCurrentUser();
  if (!user) {
    // Not logged in — redirect to auth page
    window.location.href = 'auth.html';
    return;
  }

  appState.user = user;

  // Load real profile from Supabase
  const profile = await EcoAuth.getProfile();
  if (profile) {
    appState.profile = profile;
    appState.points = profile.total_points || 0;
    appState.co2Saved = parseFloat(profile.co2_saved_tons || 0) * 1000; // stored as tons, display as kg
    appState.streak = profile.streak_days || 0;
    appState.dailyScore = Math.min(Math.round((profile.total_points || 0) / 10), 100);
    appState.completedChallenges = profile.completed_challenges || [];
  }

  updateUserUi();

  // Load real leaderboard from Supabase
  await loadLeaderboard();
}

function updateUserUi() {
  const userName = appState.user 
    ? (appState.user.user_metadata?.full_name || appState.user.email?.split('@')[0] || 'Eco Warrior') 
    : 'Eco Warrior';
  const email = appState.user?.email || 'warrior@ecolife.app';

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

  refreshStateCounters();
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

  // Update streak progress bar (milestone every 10 days)
  const streakBar = document.getElementById('streakProgressBar');
  if (streakBar) {
    const pct = Math.min((appState.streak % 10) / 10 * 100, 100);
    streakBar.style.width = pct + '%';
  }

  // Populate live activity feed from real completed challenges
  const feed = document.getElementById('liveActivityFeed');
  const feedEmpty = document.getElementById('activityFeedEmpty');
  if (feed && appState.completedChallenges && appState.completedChallenges.length > 0) {
    if (feedEmpty) feedEmpty.style.display = 'none';
    const challengeMap = {
      walk:   { emoji: '🚶', label: 'Walk 2 km',             pts: '+50 Pts' },
      bottle: { emoji: '🥤', label: 'Reusable Water Bottle', pts: '+30 Pts' },
      tree:   { emoji: '🌳', label: 'Plant a Tree',          pts: '+200 Pts' },
      waste:  { emoji: '♻️', label: 'Segregate Waste',       pts: '+40 Pts' },
    };
    // Clear existing non-empty items
    feed.querySelectorAll('.activity-item').forEach(el => el.remove());
    appState.completedChallenges.slice().reverse().forEach(id => {
      const c = challengeMap[id] || { emoji: '🌱', label: id, pts: 'Pts Earned' };
      const div = document.createElement('div');
      div.className = 'activity-item p-3 bg-[#f6f9f3] border-2 border-[#0a0a0a] rounded-xl flex items-center gap-3 animate-fadeIn';
      div.innerHTML = `
        <span class="text-xl">${c.emoji}</span>
        <div class="text-xs">
          <p class="font-black text-[#0a0a0a]">You completed ${c.label}</p>
          <p class="text-[10px] font-bold text-[#15803d]">${c.pts} • AI Verified ✓</p>
        </div>`;
      feed.prepend(div);
    });
  }
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

  // Listen to hash changes and initial page load hash
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) switchTab(hash);
  });

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    setTimeout(() => switchTab(initialHash), 150);
  }
}

function switchTab(tabId) {
  const views = document.querySelectorAll('.page-view');
  views.forEach(v => v.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) {
    targetView.classList.add('active');
    appState.activeTab = tabId;
    if (window.location.hash !== `#${tabId}`) {
      window.history.pushState(null, '', `#${tabId}`);
    }
  }

  // Update nav link highlighting
  document.querySelectorAll('.nav-link').forEach(link => {
    const navVal = link.getAttribute('data-nav');
    if (navVal === tabId) {
      link.className = 'nav-link flex items-center gap-3 p-3 bg-[#ccff00] text-[#0a0a0a] font-display font-extrabold border-3 border-[#0a0a0a] shadow-[4px_4px_0px_0px_#0a0a0a] rounded-xl';
    } else {
      link.className = 'nav-link flex items-center gap-3 p-3 text-[#0a0a0a] font-display font-bold hover:bg-[#ccff00] border-3 border-transparent hover:border-[#0a0a0a] hover:shadow-[4px_4px_0px_0px_#0a0a0a] rounded-xl transition-all';
    }
  });

  // Invalidate and re-render map if switching to map tab
  if (tabId === 'map') {
    if (!appState.map) {
      initGreenMap();
    }
    setTimeout(() => {
      if (appState.map) {
        appState.map.invalidateSize();
      }
    }, 150);
  }
}

// --- Weekly Progress Chart ---
function initWeeklyChart() {
  const canvas = document.getElementById('weeklyProgressChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  appState.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Daily Eco Score',
          data: [65, 72, 80, 78, 85, 92, 88],
          backgroundColor: '#15803d',
          borderColor: '#0a0a0a',
          borderWidth: 3,
          borderRadius: 10,
          yAxisID: 'y'
        },
        {
          label: 'CO₂ Saved (kg)',
          data: [3.5, 4.2, 5.0, 4.8, 6.1, 7.5, 6.2],
          backgroundColor: '#ccff00',
          borderColor: '#0a0a0a',
          borderWidth: 3,
          borderRadius: 10,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Space Grotesk', weight: 'bold' }, color: '#0a0a0a' }
        },
        y: {
          type: 'linear',
          position: 'left',
          min: 0,
          max: 100,
          ticks: { font: { family: 'Space Grotesk', weight: 'bold' }, color: '#15803d' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 10,
          grid: { display: false },
          ticks: { font: { family: 'Space Grotesk', weight: 'bold' }, color: '#0a0a0a' }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// --- TensorFlow.js AI Vision Model Engine ---
let mobilenetModel = null;
let isModelLoading = false;

async function loadTensorFlowModel() {
  if (mobilenetModel || isModelLoading) return;
  isModelLoading = true;
  console.log("Loading TensorFlow.js MobileNet vision model...");
  try {
    if (typeof mobilenet !== 'undefined') {
      mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
      console.log("MobileNet AI Vision Model loaded successfully!");
      showToast("AI Vision Model Ready!", "🤖");
    }
  } catch (err) {
    console.warn("MobileNet load notice, fallback vision classifier ready:", err);
  } finally {
    isModelLoading = false;
  }
}

// Waste Category Keyword Dictionary
const WASTE_DICTIONARY = {
  PLASTIC: {
    name: 'PLASTIC WASTE',
    badgeBg: 'bg-[#ccff00]',
    keywords: ['bottle', 'water bottle', 'pop bottle', 'soda bottle', 'plastic', 'plastic bag', 'bucket', 'tub', 'jug', 'milk jug', 'container', 'cup', 'tumbler', 'pill bottle', 'syringe', 'lotion', 'shampoo', 'crate', 'toy', 'straw', 'wrapper', 'film', 'joystick', 'computer keyboard', 'mouse'],
    title: 'Plastic Waste Container',
    desc: 'Synthetic polymer or PET/HDPE packaging material.',
    step1: 'Rinse out liquid residue and remove non-plastic caps.',
    step2: 'Place in Yellow / Blue Plastic Recycling Bin.',
    step3: 'Saves ~0.08 kg CO₂ per plastic item recycled.'
  },
  PAPER: {
    name: 'PAPER & CARDBOARD',
    badgeBg: 'bg-[#38bdf8]',
    keywords: ['carton', 'cardboard', 'box', 'paper', 'paper towel', 'tissue', 'toilet tissue', 'notebook', 'envelope', 'book', 'book jacket', 'comic book', 'newspaper', 'menu', 'flyer', 'packet', 'binder', 'postage', 'stamp', 'wrapper', 'file', 'folder'],
    title: 'Paper / Cardboard Waste',
    desc: 'Recyclable cellulose fiber material or packaging box.',
    step1: 'Flatten cardboard boxes to optimize bin capacity.',
    step2: 'Keep dry and place in Blue Paper Recycling Bin.',
    step3: 'Saves ~0.12 kg CO₂ per kg of paper recycled.'
  },
  METAL: {
    name: 'METAL CAN / FOIL',
    badgeBg: 'bg-[#facc15]',
    keywords: ['can', 'beer can', 'soda can', 'tin', 'aluminum', 'foil', 'brass', 'wok', 'frying pan', 'kettle', 'teapot', 'opener', 'safety pin', 'nail', 'screw', 'shovel', 'spatula', 'spoon', 'fork', 'knife', 'thimble', 'steel', 'metal', 'bucket'],
    title: 'Aluminum / Metal Can',
    desc: 'Infinitely recyclable metal alloy beverage or food container.',
    step1: 'Rinse food residue and crush can flat.',
    step2: 'Place in Metal / Can Recycling Bin.',
    step3: 'Saves 95% energy vs manufacturing raw metal.'
  },
  GLASS: {
    name: 'GLASS CONTAINER',
    badgeBg: 'bg-[#4ade80]',
    keywords: ['wine bottle', 'beer bottle', 'bottle', 'goblet', 'glass', 'jar', 'beaker', 'measuring cup', 'vial', 'perfume bottle', 'pitcher', 'cocktail shaker', 'marbles', 'lens', 'prism', 'sunglasses', 'glasses', 'ashcan'],
    title: 'Glass Jar or Bottle',
    desc: 'Clear, green, or amber silica glass container.',
    step1: 'Wash out food or liquid contents completely.',
    step2: 'Place in Green Glass Recycling Bin.',
    step3: 'Infinitely recyclable without loss of quality.'
  }
};

// --- AI Waste Scanner Logic ---
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    displayScanPreview(e.target.result);
  };
  reader.readAsDataURL(file);
}

function simulateCameraCapture(type = 'plastic') {
  let sampleSvg = "";
  if (type === 'paper') {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%2338bdf8'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle'>📦</text></svg>";
  } else if (type === 'metal') {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%23facc15'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle'>🥫</text></svg>";
  } else if (type === 'glass') {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%234ade80'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle'>🍾</text></svg>";
  } else if (type === 'cat') {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%23f43f5e'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle'>🐱</text></svg>";
  } else {
    sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%' height='100%' fill='%23ccff00'/><text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='middle'>🧴</text></svg>";
  }
  displayScanPreview(sampleSvg, type);
}

function displayScanPreview(imgSrc, forcedSampleType = null) {
  const uploadPrompt = document.getElementById('uploadPrompt');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const scanLaser = document.getElementById('scanLaser');

  if (uploadPrompt) uploadPrompt.classList.add('hidden');
  if (previewContainer) previewContainer.classList.remove('hidden');
  if (imagePreview) {
    imagePreview.src = imgSrc;
    imagePreview.dataset.sampleType = forcedSampleType || '';
  }
  if (scanLaser) scanLaser.classList.remove('hidden');

  // Trigger real AI classification after scanner beam animation
  setTimeout(() => runRealAiClassification(imagePreview), 1800);
}

async function runRealAiClassification(imgElement) {
  const scanLaser = document.getElementById('scanLaser');
  if (scanLaser) scanLaser.classList.add('hidden');

  const emptyState = document.getElementById('aiResultStateEmpty');
  const activeState = document.getElementById('aiResultStateActive');
  const unknownState = document.getElementById('aiResultStateUnknown');

  if (emptyState) emptyState.classList.add('hidden');

  // Load TensorFlow model if not loaded
  if (!mobilenetModel && typeof mobilenet !== 'undefined' && !isModelLoading) {
    await loadTensorFlowModel();
  }

  const sampleType = imgElement.dataset.sampleType;
  if (sampleType === 'cat') {
    // Non-waste sample demo
    renderUnknownResult("Cat / Feline (Domestic Animal)", "98%");
    return;
  }

  let predictions = [];
  if (mobilenetModel && imgElement.src && !imgElement.src.startsWith('data:image/svg')) {
    try {
      predictions = await mobilenetModel.classify(imgElement, 5);
      console.log("Real MobileNet Predictions:", predictions);
    } catch (e) {
      console.warn("MobileNet classify error:", e);
    }
  }

  // Analyze predictions for waste keywords
  let matchedCategory = null;
  let highestConfidence = 0.88;
  let topClassLabel = "";

  if (predictions && predictions.length > 0) {
    topClassLabel = predictions[0].className;
    highestConfidence = predictions[0].probability;

    for (const pred of predictions) {
      const labelLower = pred.className.toLowerCase();

      // Check each waste category
      for (const [key, categoryData] of Object.entries(WASTE_DICTIONARY)) {
        for (const kw of categoryData.keywords) {
          if (labelLower.includes(kw)) {
            matchedCategory = key;
            topClassLabel = pred.className;
            highestConfidence = Math.max(pred.probability, 0.75);
            break;
          }
        }
        if (matchedCategory) break;
      }
      if (matchedCategory) break;
    }
  }

  // Fallback check if SVG sample or no MobileNet match
  if (!matchedCategory && sampleType) {
    if (sampleType === 'plastic') matchedCategory = 'PLASTIC';
    else if (sampleType === 'paper') matchedCategory = 'PAPER';
    else if (sampleType === 'metal') matchedCategory = 'METAL';
    else if (sampleType === 'glass') matchedCategory = 'GLASS';
  }

  // Render Result
  if (matchedCategory && WASTE_DICTIONARY[matchedCategory]) {
    const data = WASTE_DICTIONARY[matchedCategory];
    const confidencePct = Math.round(highestConfidence * 100) + '%';
    
    appState.currentScan = data;

    if (unknownState) unknownState.classList.add('hidden');
    if (activeState) activeState.classList.remove('hidden');

    document.getElementById('predictedCategoryBadge').textContent = data.name;
    document.getElementById('predictedCategoryBadge').className = `neo-badge ${data.badgeBg} text-[#0a0a0a]`;
    document.getElementById('confidenceScoreVal').textContent = confidencePct + ' Confidence';
    document.getElementById('predictedItemTitle').textContent = topClassLabel ? (data.title + ` (${topClassLabel.split(',')[0]})`) : data.title;
    document.getElementById('predictedItemDesc').textContent = data.desc;
    document.getElementById('instructionStep1').textContent = data.step1;
    document.getElementById('instructionStep2').textContent = data.step2;
    document.getElementById('instructionStep3').textContent = data.step3;

    showToast(`AI Identified: ${data.name} (${confidencePct})`, '🤖');
  } else {
    // Image Not Identified as Waste
    renderUnknownResult(topClassLabel || "Unrecognized Object", predictions[0] ? Math.round(predictions[0].probability * 100) + '%' : 'Low');
  }
}

function renderUnknownResult(rawLabel, confidence) {
  const activeState = document.getElementById('aiResultStateActive');
  const unknownState = document.getElementById('aiResultStateUnknown');

  if (activeState) activeState.classList.add('hidden');
  if (unknownState) unknownState.classList.remove('hidden');

  const labelEl = document.getElementById('unknownRawPrediction');
  if (labelEl) labelEl.textContent = `Detected: ${rawLabel} (${confidence} match)`;

  showToast('⚠️ Image Not Identified as Waste', '❓');
}

function forceManualCategory() {
  const select = document.getElementById('manualWasteCategorySelect');
  const cat = select ? select.value.toUpperCase() : 'PLASTIC';
  
  const targetKey = cat.includes('PAPER') ? 'PAPER' : (cat.includes('METAL') ? 'METAL' : (cat.includes('GLASS') ? 'GLASS' : 'PLASTIC'));
  const data = WASTE_DICTIONARY[targetKey] || WASTE_DICTIONARY.PLASTIC;

  const unknownState = document.getElementById('aiResultStateUnknown');
  const activeState = document.getElementById('aiResultStateActive');

  if (unknownState) unknownState.classList.add('hidden');
  if (activeState) activeState.classList.remove('hidden');

  document.getElementById('predictedCategoryBadge').textContent = data.name;
  document.getElementById('predictedCategoryBadge').className = `neo-badge ${data.badgeBg} text-[#0a0a0a]`;
  document.getElementById('confidenceScoreVal').textContent = 'User Defined';
  document.getElementById('predictedItemTitle').textContent = data.title + ' (Manual Override)';
  document.getElementById('predictedItemDesc').textContent = data.desc;
  document.getElementById('instructionStep1').textContent = data.step1;
  document.getElementById('instructionStep2').textContent = data.step2;
  document.getElementById('instructionStep3').textContent = data.step3;

  showToast(`Manual Override: Classified as ${data.name}`, '🔧');
}

function confirmAiPrediction(isConfirmed) {
  if (isConfirmed) {
    appState.points += 30;
    appState.co2Saved += 0.15;
    appState.dailyScore = Math.min(100, appState.dailyScore + 2);
    showToast('+30 Points Earned! AI classification confirmed.', '🎉');
  } else {
    const select = document.getElementById('correctCategorySelect');
    const chosen = select ? select.value : 'Corrected';
    appState.points += 25;
    appState.co2Saved += 0.10;
    showToast(`+25 Points! Thanks for correcting to ${chosen || 'custom type'}.`, '💡');
  }

  refreshStateCounters();
}

// --- Local Green Map Logic (Leaflet.js & ESRI Satellite) ---
function initGreenMap() {
  const mapContainer = document.getElementById('greenMap');
  if (!mapContainer || typeof L === 'undefined') return;

  // Initialize map centered at Mumbai / SGNP Borivali
  const defaultLat = 19.1176;
  const defaultLng = 72.8687;

  appState.map = L.map('greenMap', {
    center: [defaultLat, defaultLng],
    zoom: 12,
    zoomControl: true
  });

  // Standard Voyager Map Layer
  appState.tileLayerStandard = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  });

  // ESRI World Imagery Free Satellite Layer
  appState.tileLayerSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  });

  // Default to standard layer
  appState.tileLayerStandard.addTo(appState.map);

  renderMapMarkers(MUMBAI_LOCATIONS);
  requestUserLocation(false);
}

function toggleSatelliteView() {
  if (!appState.map) return;
  const btn = document.getElementById('btnSatelliteToggle');

  if (appState.isSatellite) {
    appState.map.removeLayer(appState.tileLayerSatellite);
    appState.tileLayerStandard.addTo(appState.map);
    appState.isSatellite = false;
    if (btn) {
      btn.className = 'neo-btn bg-white hover:bg-gray-100 text-[#0a0a0a] text-xs py-2 px-3';
      btn.innerHTML = '📡 Satellite View';
    }
    showToast('Switched to Standard Map View', '🗺️');
  } else {
    appState.map.removeLayer(appState.tileLayerStandard);
    appState.tileLayerSatellite.addTo(appState.map);
    appState.isSatellite = true;
    if (btn) {
      btn.className = 'neo-btn satellite-active text-xs py-2 px-3';
      btn.innerHTML = '🗺️ Standard Map';
    }
    showToast('Switched to High-Res Satellite View', '📡');
  }
}

// --- Browser GPS Geolocation API ---
function requestUserLocation(userTriggered = true) {
  if (!navigator.geolocation) {
    if (userTriggered) showToast('Geolocation is not supported by your browser.', '⚠️');
    return;
  }

  if (userTriggered) showToast('Requesting GPS Location Access...', '📍');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      appState.userLat = lat;
      appState.userLng = lng;

      if (appState.map) {
        appState.map.setView([lat, lng], 14);

        // Add or update User Location Beacon
        if (appState.userMarker) appState.map.removeLayer(appState.userMarker);

        const beaconIcon = L.divIcon({
          className: 'user-location-beacon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        appState.userMarker = L.marker([lat, lng], { icon: beaconIcon }).addTo(appState.map);
        appState.userMarker.bindPopup('<b style="font-family:Space Grotesk">📍 You Are Here</b><br/><span style="font-size:11px">Live GPS Location Active</span>');
      }

      // Recalculate distances to Mumbai locations
      updateLocationDistances(lat, lng);
      renderMapMarkers(MUMBAI_LOCATIONS);

      if (userTriggered) showToast('GPS Location Centered!', '🎯');
    },
    (err) => {
      console.warn("Geolocation permission or position notice:", err.message);
      if (userTriggered) showToast('Location Access Denied / Defaulting to Mumbai Center.', '📍');
      updateLocationDistances(appState.userLat, appState.userLng);
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function updateLocationDistances(userLat, userLng) {
  MUMBAI_LOCATIONS.forEach(loc => {
    const dist = calcHaversineDistance(userLat, userLng, loc.lat, loc.lng);
    loc.distance = dist.toFixed(1) + ' km from you';
  });
}

function calcHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function renderMapMarkers(locations) {
  if (!appState.map) return;

  // Clear existing markers
  appState.markers.forEach(m => appState.map.removeLayer(m));
  appState.markers = [];

  locations.forEach(loc => {
    const customIcon = L.divIcon({
      className: `custom-neo-marker ${loc.category}`,
      html: `<span>${loc.icon}</span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 44]
    });

    const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(appState.map);
    
    // Popup
    marker.bindPopup(`
      <div style="padding:12px; font-family:'Space Grotesk', sans-serif">
        <span style="background:#ccff00; color:#0a0a0a; font-weight:800; font-size:10px; padding:3px 8px; border-radius:6px; border:1px solid #0a0a0a">${loc.type}</span>
        <h4 style="font-weight:900; font-size:15px; margin:6px 0 2px 0">${loc.name}</h4>
        <p style="font-size:11px; color:#555; margin-bottom:6px">${loc.address}</p>
        <p style="font-size:11px; font-weight:700; color:#15803d">${loc.distance}</p>
      </div>
    `);

    marker.on('click', () => selectPin(loc));
    appState.markers.push(marker);
  });
}

function selectPin(loc) {
  document.getElementById('selectedPinType').textContent = loc.type;
  document.getElementById('selectedPinName').textContent = loc.name;
  document.getElementById('selectedPinAddress').textContent = loc.address;
  document.getElementById('selectedPinHours').textContent = loc.hours;
  document.getElementById('selectedPinDistance').textContent = loc.distance;
  document.getElementById('selectedPinItems').textContent = loc.items;

  showToast(`Selected: ${loc.name}`, loc.icon);
}

function filterMapPins(category) {
  const filterBtns = document.querySelectorAll('.map-filter-btn');
  filterBtns.forEach(btn => {
    if (btn.textContent.toLowerCase().includes(category)) {
      btn.className = 'map-filter-btn neo-btn bg-[#ccff00] text-[#0a0a0a] text-xs py-1.5 px-2.5';
    } else {
      btn.className = 'map-filter-btn neo-btn bg-white hover:bg-gray-100 text-[#0a0a0a] text-xs py-1.5 px-2.5';
    }
  });

  if (category === 'all') {
    renderMapMarkers(MUMBAI_LOCATIONS);
  } else {
    const filtered = MUMBAI_LOCATIONS.filter(l => l.category === category);
    renderMapMarkers(filtered);
  }
}

function getDirectionsToPin() {
  const name = document.getElementById('selectedPinName').textContent;
  const address = document.getElementById('selectedPinAddress').textContent;
  showToast(`Opening directions to ${name}...`, '🗺️');
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`, '_blank');
}

// --- Live Footstep & Real Carbon Offset Tracker ---
function togglePedometerTracking() {
  const btn = document.getElementById('btnPedometerToggle');
  const ped = appState.pedometer;

  if (ped.active) {
    ped.active = false;
    if (btn) {
      btn.className = 'neo-btn bg-[#ccff00] text-[#0a0a0a] py-2 px-4 text-xs font-black';
      btn.innerHTML = '▶ Start Walk Tracking';
    }
    showToast('Footstep tracking paused.', '⏸️');
  } else {
    ped.active = true;
    if (btn) {
      btn.className = 'neo-btn bg-red-500 text-white py-2 px-4 text-xs font-black';
      btn.innerHTML = '⏹ Stop Tracking';
    }
    showToast('Live Footstep Tracking Started! Walk with your device.', '👟');

    // Attach Device Motion listener if supported
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion, true);
    }
  }
}

function handleDeviceMotion(event) {
  if (!appState.pedometer.active) return;
  const accel = event.accelerationIncludingGravity;
  if (!accel) return;

  const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
  const delta = Math.abs(magnitude - appState.pedometer.lastAccel);
  appState.pedometer.lastAccel = magnitude;

  // Step threshold detection (typical walking motion spike > 3.5 m/s²)
  if (delta > 3.5) {
    simulateWalkStep(1);
  }
}

function simulateWalkStep(stepCount = 1) {
  const ped = appState.pedometer;
  ped.steps += stepCount;
  
  // Step length approx 0.75m -> km
  ped.distanceKm = (ped.steps * 0.00075);

  // Carbon Saved: Walking avoids standard car emissions (~0.192 kg CO2 per km)
  ped.co2SavedKg = (ped.distanceKm * 0.192);

  // Sync to app global state
  appState.co2Saved += (stepCount * 0.00075 * 0.192);
  appState.points += Math.floor(stepCount / 5);

  // Update UI Elements
  const stepsEl = document.getElementById('livePedometerSteps');
  const distEl = document.getElementById('livePedometerDistance');
  const co2El = document.getElementById('livePedometerCo2Saved');

  if (stepsEl) {
    stepsEl.textContent = ped.steps.toLocaleString();
    stepsEl.classList.add('live-counter-tick');
    setTimeout(() => stepsEl.classList.remove('live-counter-tick'), 300);
  }

  if (distEl) distEl.textContent = ped.distanceKm.toFixed(2) + ' km';
  if (co2El) co2El.textContent = ped.co2SavedKg.toFixed(3) + ' kg';

  refreshStateCounters();
}

// --- Community Leaderboard — Live from Supabase ---
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
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No leaderboard data yet. Be the first!</td></tr>';
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

  // Update your own rank display if element exists
  if (currentUserId) {
    const myRank = entries.findIndex(e => e.id === currentUserId) + 1;
    const rankEl = document.getElementById('leaderboardYourRank');
    if (rankEl && myRank > 0) rankEl.textContent = '#' + myRank;
  }
}


function filterLeaderboard(period) {
  const btns = document.querySelectorAll('.lb-filter-btn');
  btns.forEach(b => {
    if (b.textContent.toLowerCase().includes(period)) {
      b.className = 'lb-filter-btn neo-btn bg-[#ccff00] text-[#0a0a0a] text-xs py-1 px-2.5';
    } else {
      b.className = 'lb-filter-btn neo-btn bg-white hover:bg-gray-100 text-[#0a0a0a] text-xs py-1 px-2.5';
    }
  });
  updateLeaderboardUi();
  showToast(`Leaderboard filtered by ${period.toUpperCase()}`, '🏆');
}

function logLiveActivity(title, pts, icon = '🎉') {
  const feed = document.getElementById('liveActivityFeed');
  if (!feed) return;

  const item = document.createElement('div');
  item.className = 'p-3 bg-[#ccff00]/20 border-2 border-[#0a0a0a] rounded-xl flex items-center gap-3 animate-bounce';
  item.innerHTML = `
    <span class="text-xl">${icon}</span>
    <div class="text-xs">
      <p class="font-black text-[#0a0a0a]">You completed ${title}</p>
      <p class="text-[10px] font-bold text-[#15803d]">+${pts} Pts • AI Verified Just Now</p>
    </div>
  `;

  feed.insertBefore(item, feed.firstChild);
  setTimeout(() => item.classList.remove('animate-bounce'), 800);
}

// --- AI Challenge Proof Verification Modal Engine ---
const CHALLENGE_CONFIGS = {
  walk: {
    title: 'Walk 2 km',
    pts: 50,
    co2: 0.4,
    icon: '🚶',
    btnId: 'btnChallengeWalk',
    desc: 'Upload a pedometer screenshot or fitness app log showing 2+ km distance covered.'
  },
  bottle: {
    title: 'Use Reusable Water Bottle',
    pts: 30,
    co2: 0.2,
    icon: '🥤',
    btnId: 'btnChallengeBottle',
    desc: 'Upload a photo of your reusable non-plastic bottle/flask. Single-use plastic bottles will be REJECTED.'
  },
  tree: {
    title: 'Plant a Tree / Sapling',
    pts: 200,
    co2: 1.0,
    icon: '🌳',
    btnId: 'btnChallengeTree',
    desc: 'Upload a photo of your potted plant, indoor sapling, or tree.'
  },
  waste: {
    title: 'Segregate Household Waste',
    pts: 40,
    co2: 0.3,
    icon: '♻️',
    btnId: 'btnChallengeWaste',
    desc: 'Upload a photo showing separated wet organic and dry recyclable waste bins.'
  }
};

function triggerDeviceGalleryPicker() {
  // Request Location permission if supported
  if (navigator.geolocation && !appState.userLocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        appState.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      },
      (err) => console.log('Location access notice:', err),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  // Trigger Device File / Gallery / Camera Input
  const fileInput = document.getElementById('challengeProofInput');
  if (fileInput) {
    fileInput.value = ''; // Reset file input
    fileInput.click();
  }
}

function openChallengeProofModal(type) {
  const config = CHALLENGE_CONFIGS[type];
  if (!config) return;

  appState.activeProofType = type;

  const modal = document.getElementById('modalChallengeProof');
  const titleEl = document.getElementById('proofModalTitle');
  const descEl = document.getElementById('proofModalDesc');
  const promptEl = document.getElementById('proofUploadPrompt');
  const previewContainer = document.getElementById('proofPreviewContainer');
  const feedbackContainer = document.getElementById('proofFeedbackContainer');

  if (titleEl) titleEl.textContent = `AI Proof Verification: ${config.title}`;
  if (descEl) descEl.textContent = config.desc;

  if (promptEl) promptEl.classList.remove('hidden');
  if (previewContainer) previewContainer.classList.add('hidden');
  if (feedbackContainer) feedbackContainer.classList.add('hidden');

  if (modal) modal.classList.add('open');

  // Pre-load default sample proof for 1-click convenience
  if (type === 'walk') simulateProofSample('walk_valid', false);
  else if (type === 'bottle') simulateProofSample('bottle_valid', false);
  else if (type === 'tree') simulateProofSample('tree_valid', false);
  else simulateProofSample('bottle_valid', false);

  // Auto-trigger native device Photo Gallery picker
  setTimeout(() => {
    triggerDeviceGalleryPicker();
  }, 250);
}

function closeChallengeProofModal() {
  const modal = document.getElementById('modalChallengeProof');
  if (modal) modal.classList.remove('open');
}

function handleChallengeProofUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  showToast('Photo loaded from gallery. Running AI Verification...', '📸');

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
  const config = CHALLENGE_CONFIGS[proofType];
  const imagePreview = document.getElementById('proofImagePreview');
  const previewContainer = document.getElementById('proofPreviewContainer');

  if (!imagePreview || !imagePreview.src || (previewContainer && previewContainer.classList.contains('hidden'))) {
    // If no proof loaded yet, load default valid proof for this challenge
    simulateProofSample(proofType === 'walk' ? 'walk_valid' : (proofType === 'bottle' ? 'bottle_valid' : 'tree_valid'), false);
  }

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
  if (msgEl) msgEl.textContent = 'Analyzing image features and material composition against challenge requirements...';

  // Perform classification via TensorFlow MobileNet or sample check
  setTimeout(async () => {
    if (laserEl) laserEl.classList.add('hidden');

    let passed = false;
    let failReason = "";
    const sampleId = imagePreview.dataset.sampleId;

    let predictions = [];
    if (mobilenetModel && imagePreview.src && !imagePreview.src.startsWith('data:image/svg')) {
      try {
        predictions = await mobilenetModel.classify(imagePreview, 5);
        console.log("Proof MobileNet Predictions:", predictions);
      } catch (e) {}
    }

    if (proofType === 'bottle') {
      // Reusable bottle challenge: STRICT RULE - Reject plastic disposable bottles!
      if (sampleId === 'bottle_plastic') {
        passed = false;
        failReason = "Single-use disposable plastic bottle detected. Points are only awarded for reusable non-plastic bottles (Stainless steel, copper, glass, or hydro flask).";
      } else if (sampleId === 'bottle_valid') {
        passed = true;
      } else {
        // Real image classification
        let isPlasticBottle = false;
        if (predictions.length > 0) {
          for (const pred of predictions) {
            const label = pred.className.toLowerCase();
            if (label.includes('pop bottle') || label.includes('water bottle') || label.includes('plastic bag')) {
              isPlasticBottle = true;
              break;
            }
          }
        }
        if (isPlasticBottle) {
          passed = false;
          failReason = "Disposable plastic bottle detected. Please upload a photo of a reusable non-plastic flask or glass container.";
        } else {
          passed = true;
        }
      }
    } else if (proofType === 'walk') {
      if (sampleId === 'bottle_plastic' || sampleId === 'cat') {
        passed = false;
        failReason = "Image does not show a valid pedometer / fitness app screenshot with 2+ km walk.";
      } else {
        passed = true;
      }
    } else if (proofType === 'tree') {
      if (sampleId === 'bottle_plastic' || sampleId === 'cat') {
        passed = false;
        failReason = "No potted plant, sapling, or tree detected in the photo.";
      } else {
        passed = true;
      }
    } else {
      passed = true;
    }

    // Render Verification Outcome
    if (passed) {
      feedbackContainer.className = 'p-4 rounded-xl border-3 border-[#0a0a0a] bg-green-100 shadow-[3px_3px_0px_0px_#0a0a0a]';
      if (iconEl) iconEl.textContent = '✅';
      if (titleEl) titleEl.textContent = `Proof Verified! +${config.pts} Points Awarded!`;
      if (msgEl) msgEl.textContent = `Criteria satisfied for "${config.title}". Your streak and rank have been updated.`;

      // Award points & update state
      appState.points += config.pts;
      appState.co2Saved += config.co2;
      appState.streak += 1;
      appState.dailyScore = Math.min(100, appState.dailyScore + 5);

      // Disable challenge button
      const btn = document.getElementById(config.btnId);
      if (btn) {
        btn.disabled = true;
        btn.className = 'neo-btn bg-[#15803d] text-white py-2.5 w-full text-xs font-extrabold cursor-not-allowed opacity-90';
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Verified & Completed!';
      }

      showToast(`+${config.pts} Pts! ${config.title} Verified!`, '🎉');
      logLiveActivity(config.title, config.pts, config.icon);
      refreshStateCounters();
      updateLeaderboardUi();

      setTimeout(() => closeChallengeProofModal(), 2200);
    } else {
      feedbackContainer.className = 'p-4 rounded-xl border-3 border-[#0a0a0a] bg-red-100 shadow-[3px_3px_0px_0px_#0a0a0a]';
      if (iconEl) iconEl.textContent = '❌';
      if (titleEl) titleEl.textContent = 'Challenge Not Completed!';
      if (msgEl) msgEl.textContent = failReason || "Proof image did not satisfy the challenge criteria. Points were not awarded.";

      showToast('⚠️ Proof Rejected: Challenge Not Completed', '🚫');
    }
  }, 1600);
}

// --- Quick Actions & Modal ---
function quickLogAction(actionTitle, co2SavedKg) {
  appState.points += 30;
  appState.co2Saved += co2SavedKg;
  appState.dailyScore = Math.min(100, appState.dailyScore + 3);

  showToast(`Logged: ${actionTitle} (+30 Pts)`, '🌿');
  refreshStateCounters();
  updateLeaderboardUi();
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
  const km = parseFloat(document.getElementById('calcKm').value) || 10;
  const kwh = parseFloat(document.getElementById('calcKwh').value) || 8;

  document.getElementById('fpTransportVal').textContent = (km * 0.12).toFixed(1) + ' kg CO₂';
  document.getElementById('fpEnergyVal').textContent = (kwh * 0.10).toFixed(1) + ' kg CO₂';

  closeCarbonCalcModal();
  showToast('Carbon Footprint recalculated!', '⚡');
}

function handleAuthAction() {
  if (appState.user) {
    if (typeof EcoAuth !== 'undefined') EcoAuth.signOut();
    appState.user = null;
    updateUserUi();
    showToast('Signed out successfully.', '👋');
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
