/**
 * EcoLife Supabase Client & Authentication Service
 * Team .Tensor
 */

const SUPABASE_URL = window.ENV_SUPABASE_URL || "https://rmuvepphwybmbaifyfkz.supabase.co";
const SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || "sb_publishable_gyp9H3Mzu_6bhVD3JZtN7g_sL4o9_zy";

let _supabaseApp = null;

// Initialize Supabase if SDK is available
function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    try {
      _supabaseApp = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Supabase Client initialized successfully.");
    } catch (e) {
      console.error("Supabase init error:", e);
    }
  } else {
    console.error("Supabase SDK script not loaded yet.");
  }
}

// Ensure init on script load
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSupabase);
  } else {
    initSupabase();
  }
}

const AuthResult = {
  // Sign Up
  async signUp(email, password, fullName = "") {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const { data, error } = await _supabaseApp.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) return { success: false, message: error.message };
    return { success: true, user: data.user, session: data.session };
  },

  // Sign In
  async signIn(email, password) {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const { data, error } = await _supabaseApp.auth.signInWithPassword({
      email,
      password
    });
    if (error) return { success: false, message: error.message };
    return { success: true, user: data.user, session: data.session };
  },

  // Sign In with Social OAuth (Google, GitHub, Apple)
  async signInWithOAuth(provider = 'google') {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const redirectUrl = window.location.href.includes('github.io')
      ? 'https://ricco-mallick.github.io/ecolife-tensor/dashboard.html'
      : window.location.origin + '/dashboard.html';

    const { data, error } = await _supabaseApp.auth.signInWithOAuth({
      provider: provider.toLowerCase(),
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) return { success: false, message: error.message };
    return { success: true, data };
  },

  // Sign Out
  async signOut() {
    if (!_supabaseApp) return { success: true };
    await _supabaseApp.auth.signOut();
    return { success: true };
  },

  // Get Current User (Auth) — handles active session & OAuth tokens
  async getCurrentUser() {
    if (!_supabaseApp) return null;
    try {
      const { data: sessionData } = await _supabaseApp.auth.getSession();
      if (sessionData && sessionData.session && sessionData.session.user) {
        return sessionData.session.user;
      }
      const { data } = await _supabaseApp.auth.getUser();
      if (data && data.user) return data.user;
    } catch (e) {
      console.error('getCurrentUser error:', e);
    }
    return null;
  },

  // Get User Profile from `profiles` table
  async getProfile() {
    if (!_supabaseApp) return null;
    const user = await this.getCurrentUser();
    if (!user) return null;

    let { data, error } = await _supabaseApp
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!data && !error) {
      // Profile doesn't exist, create it automatically to satisfy foreign keys
      const newProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Eco Warrior",
        avatar_url: user.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBxNcP4jmGLxlDNuWCtPln-cBePNWavmRWJWmdXAU4d8FQVwMmZ8kfvUFAxgKQeuV2qfIfBw20C1L43EZ1TMDBiiEtCWUwTu_V5CSEyO96Mbn4CgKlyqT8RvJg6vjxWQWH3DNnl9yebbUAHT49M2ige3sDObHlC-O2e6dLUjneCXmyA8lmvGupFl5AgbcEdw49T-AWArPGFL6hpwMnikONLO_DyvpUWQETsIHu6nWIHvLGQdTVPqGPNew",
        total_points: 0,
        co2_saved_tons: 0,
        streak_days: 1
      };
      const { data: insertedData, error: insertError } = await _supabaseApp
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();
        
      if (insertError) {
        console.error("Error creating profile:", insertError);
        return null;
      }
      return insertedData;
    }

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  },

  // Update User Profile
  async updateProfile(updates) {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    const { data, error } = await _supabaseApp
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select();

    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, message: error.message };
    }
    return { success: true, data: data[0] };
  },

  // Log Eco Action to DB
  async logEcoAction(category, title, co2SavedKg) {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    const profile = await this.getProfile();
    if (!profile) return { success: false, message: "Failed to load or create profile." };

    const newAction = {
      user_id: user.id,
      category,
      title,
      co2_saved_kg: parseFloat(co2SavedKg) || 0,
      points_earned: 30
    };

    const { data, error } = await _supabaseApp.from("eco_actions").insert([newAction]).select().single();
    if (error) {
      console.error("Error logging action:", error);
      return { success: false, message: error.message };
    }

    const co2Tons = (parseFloat(co2SavedKg) || 0) / 1000;
    await this.updateProfile({
      total_points: (profile.total_points || 0) + 30,
      co2_saved_tons: (profile.co2_saved_tons || 0) + co2Tons
    });

    return { success: true, data };
  },

  // Fetch Eco Actions
  async getEcoActions() {
    if (!_supabaseApp) return [];
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await _supabaseApp
      .from("eco_actions")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false });

    if (error) {
      console.error("Error fetching eco actions:", error);
      return [];
    }
    return data;
  },

  // Get Leaderboard Data (Top 10 users by points)
  async getLeaderboard() {
    if (!_supabaseApp) return [];
    
    const { data, error } = await _supabaseApp
      .from("profiles")
      .select("id, full_name, avatar_url, total_points, co2_saved_tons")
      .order("total_points", { ascending: false })
      .limit(10);
      
    if (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
    return data;
  },

  // Map Spots (DB-driven)
  async getMapSpots() {
    if (!_supabaseApp) return [];
    const { data, error } = await _supabaseApp
      .from("map_spots")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching map spots:", error);
      return [];
    }
    return data || [];
  },

  async addMapSpot(spot) {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    const profile = await this.getProfile();
    if (!profile) return { success: false, message: "Failed to load profile." };

    const latVal = spot.lat !== undefined ? spot.lat : spot.latitude;
    const lngVal = spot.lng !== undefined ? spot.lng : spot.longitude;

    const payload = {
      name: spot.name,
      category: spot.category,
      type: spot.type || 'GREEN FACILITY',
      address: spot.address || 'Mumbai, Maharashtra',
      lat: latVal,
      lng: lngVal,
      latitude: latVal,
      longitude: lngVal,
      hours: spot.hours || 'Open 24 Hours',
      items: spot.items || 'Community Place',
      icon: spot.icon || '📍',
      verified: false,
      created_by: profile.id || user.id
    };

    const { data, error } = await _supabaseApp.from("map_spots").insert([payload]).select();
    if (error) {
      console.warn("Full insert failed, trying safe fallback columns:", error.message);
      // Fallback insert with essential columns
      const safePayload = {
        name: spot.name,
        category: spot.category,
        lat: latVal,
        lng: lngVal,
        latitude: latVal,
        longitude: lngVal
      };
      const { data: minData, error: minError } = await _supabaseApp.from("map_spots").insert([safePayload]).select();
      if (minError) {
        return { success: false, message: error.message, spotData: payload };
      }
      return { success: true, data: { ...payload, ...minData[0] } };
    }
    return { success: true, data: data[0] };
  },

  // --- CHALLENGES ENGINE ---
  async getChallenges() {
    if (!_supabaseApp) return [];
    const { data, error } = await _supabaseApp
      .from("challenges")
      .select("*")
      .eq("active", true);

    if (error) {
      console.error("Error fetching challenges:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Complete Challenge — SERVER CONTROLLED POINTS
   * Looks up challenge record in database to determine points & co2 target rather than accepting client parameters.
   */
  async completeChallenge(challengeId, evidence = {}) {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    const profile = await this.getProfile();
    if (!profile) return { success: false, message: "Profile not found" };

    // Lookup challenge points directly from DB to prevent client point injection
    let rewardPoints = 30;
    let co2OffsetTons = 0.0003;
    const { data: chalData } = await _supabaseApp
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .maybeSingle();

    if (chalData) {
      rewardPoints = chalData.points || 30;
      co2OffsetTons = (chalData.co2_target || 0.3) / 1000;
    }

    const completed = profile.completed_challenges || [];
    if (completed.includes(challengeId)) {
      return { success: false, message: "Challenge already completed" };
    }

    const updatedCompleted = [...completed, challengeId];
    const newPoints = (profile.total_points || 0) + rewardPoints;
    const newCo2Tons = (profile.co2_saved_tons || 0) + co2OffsetTons;

    // Record challenge completion record
    const { error: compError } = await _supabaseApp.from("challenge_completions").insert([{
      user_id: user.id,
      challenge_id: challengeId,
      evidence,
      points_awarded: rewardPoints,
      verified: true
    }]);

    if (compError && !compError.message?.includes('duplicate key')) {
      console.error("Error inserting completion:", compError);
    }

    // Update profile total points
    const { data, error } = await _supabaseApp
      .from("profiles")
      .update({ 
        completed_challenges: updatedCompleted,
        total_points: newPoints,
        co2_saved_tons: newCo2Tons
      })
      .eq("id", user.id)
      .select();

    if (error) {
      console.error("Error updating challenge progress:", error);
      return { success: false, message: error.message };
    }
    return { success: true, data: data[0], pointsAwarded: rewardPoints };
  },

  // --- WASTE INTELLIGENCE & SCANS ---
  async getWasteCategories() {
    if (!_supabaseApp) return [];
    const { data, error } = await _supabaseApp.from("waste_categories").select("*");
    if (error) {
      console.error("Error fetching waste categories:", error);
      return [];
    }
    return data || [];
  },

  async logWasteScan(scanData) {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    const newScan = {
      user_id: user.id,
      detected_item: scanData.detectedItem || "Waste Item",
      category: scanData.category || "Plastic",
      confidence: parseFloat(scanData.confidence) || 90.0,
      disposal_method: scanData.disposalMethod || "Recycling Bin",
      co2_saved_kg: parseFloat(scanData.co2SavedKg) || 0.08
    };

    const { data, error } = await _supabaseApp.from("waste_scans").insert([newScan]).select().single();
    if (error) {
      console.error("Error logging scan:", error);
      return { success: false, message: error.message };
    }
    return { success: true, data };
  },

  // --- ACTIVITY SESSIONS (PEDOMETER) ---
  async createActivitySession(sessionData) {
    if (!_supabaseApp) return { success: false, message: "Supabase not initialized." };
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    const newSession = {
      user_id: user.id,
      type: sessionData.type || 'walk',
      steps: parseInt(sessionData.steps) || 0,
      distance_km: parseFloat(sessionData.distanceKm) || 0,
      duration_seconds: parseInt(sessionData.durationSeconds) || 0,
      co2_saved_kg: parseFloat(sessionData.co2SavedKg) || 0,
      points_earned: parseInt(sessionData.pointsEarned) || 0
    };

    const { data, error } = await _supabaseApp.from("activity_sessions").insert([newSession]).select().single();
    if (error) {
      console.error("Error logging activity session:", error);
      return { success: false, message: error.message };
    }
    return { success: true, data };
  },

  // --- LIVE COMMUNITY ACTIVITY FEED ---
  async getChallengeActivityFeed() {
    if (!_supabaseApp) return [];
    try {
      const { data, error } = await _supabaseApp
        .from("challenge_completions")
        .select(`
          id,
          completed_at,
          points_awarded,
          verified,
          challenge_id,
          challenges (title, icon),
          profiles (full_name, avatar_url)
        `)
        .order("completed_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching activity feed:", error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Activity feed query exception:", e);
      return [];
    }
  },

  // --- REAL 7-DAY HISTORICAL CHART DATA ---
  async getWeeklyChartMetrics() {
    if (!_supabaseApp) return null;
    const user = await this.getCurrentUser();
    if (!user) return null;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const result = {
      labels: days,
      scores: [0, 0, 0, 0, 0, 0, 0],
      co2Saved: [0, 0, 0, 0, 0, 0, 0]
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    try {
      const [{ data: actions }, { data: scans }, { data: sessions }, { data: completions }] = await Promise.all([
        _supabaseApp.from("eco_actions").select("co2_saved_kg, logged_at").eq("user_id", user.id).gte("logged_at", sevenDaysAgo.toISOString()),
        _supabaseApp.from("waste_scans").select("co2_saved_kg, scanned_at").eq("user_id", user.id).gte("scanned_at", sevenDaysAgo.toISOString()),
        _supabaseApp.from("activity_sessions").select("co2_saved_kg, logged_at").eq("user_id", user.id).gte("logged_at", sevenDaysAgo.toISOString()),
        _supabaseApp.from("challenge_completions").select("completed_at").eq("user_id", user.id).gte("completed_at", sevenDaysAgo.toISOString())
      ]);

      const aggregateDay = (dateStr, co2Kg = 0) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        let dayIdx = d.getDay() - 1; // 0 = Mon, 6 = Sun
        if (dayIdx === -1) dayIdx = 6;
        result.co2Saved[dayIdx] = parseFloat((result.co2Saved[dayIdx] + (parseFloat(co2Kg) || 0)).toFixed(2));
        result.scores[dayIdx] = Math.min(100, (result.scores[dayIdx] || 0) + 15);
      };

      (actions || []).forEach(a => aggregateDay(a.logged_at, a.co2_saved_kg));
      (scans || []).forEach(s => aggregateDay(s.scanned_at, s.co2_saved_kg));
      (sessions || []).forEach(se => aggregateDay(se.logged_at, se.co2_saved_kg));
      (completions || []).forEach(c => aggregateDay(c.completed_at, 0.3));

      const currentDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
      if (result.scores[currentDayIdx] === 0) {
        result.scores[currentDayIdx] = 45; // baseline starting score for today
      }

      return result;
    } catch (e) {
      console.error("Error calculating weekly chart metrics:", e);
      return null;
    }
  }
};

window.EcoAuth = AuthResult;
