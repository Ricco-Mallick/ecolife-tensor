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
    try { localStorage.removeItem('ecolife_demo_user'); } catch (e) {}
    if (!_supabaseApp) return { success: true };
    await _supabaseApp.auth.signOut();
    return { success: true };
  },

  // Get Current User (Auth)
  async getCurrentUser() {
    if (_supabaseApp) {
      try {
        const { data } = await _supabaseApp.auth.getUser();
        if (data && data.user) return data.user;
      } catch (e) {}
    }
    try {
      const demoUser = localStorage.getItem('ecolife_demo_user');
      if (demoUser) return JSON.parse(demoUser);
    } catch (e) {}
    return null;
  },

  // Demo Instant Sign In
  async demoSignIn(fullName = 'Eco Warrior', email = 'warrior@ecolife.app') {
    const user = {
      id: 'demo-' + Date.now(),
      email: email,
      user_metadata: { full_name: fullName, avatar_url: '' }
    };
    try {
      localStorage.setItem('ecolife_demo_user', JSON.stringify(user));
    } catch (e) {}
    return { success: true, user };
  },

  // Get User Profile from `profiles` table
  async getProfile() {
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
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    // Ensure profile exists for Foreign Key constraint
    const profile = await this.getProfile();
    if (!profile) return { success: false, message: "Failed to load or create profile." };

    const newAction = {
      id: "act-" + Date.now() + "-" + Math.floor(Math.random()*1000),
      user_id: user.id,
      category,
      title,
      co2_saved_kg: parseFloat(co2SavedKg) || 0
    };

    const { data, error } = await _supabaseApp.from("eco_actions").insert([newAction]);
    if (error) {
      console.error("Error logging action:", error);
      return { success: false, message: error.message };
    }

    // After successfully logging the action, update the user's profile stats
    if (profile) {
      const co2Tons = newAction.co2_saved_kg / 1000;
      await this.updateProfile({
        total_points: (profile.total_points || 0) + 50, // 50 points per action
        co2_saved_tons: (profile.co2_saved_tons || 0) + co2Tons
      });
    }

    return { success: true, data: newAction };
  },

  // Fetch Eco Actions
  async getEcoActions() {
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

  // Map Spots
  async getMapSpots() {
    if (!_supabaseApp) return [];
    const { data, error } = await _supabaseApp
      .from("map_spots")
      .select("*");
    if (error) {
      console.error("Error fetching map spots:", error);
      return [];
    }
    return data;
  },

  async addMapSpot(spot) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    // Ensure profile exists for Foreign Key constraint
    const profile = await this.getProfile();
    if (!profile) return { success: false, message: "Failed to load or create profile." };

    const newSpot = {
      ...spot,
      created_by: user.id
    };

    const { data, error } = await _supabaseApp.from("map_spots").insert([newSpot]).select();
    if (error) {
      console.error("Error adding map spot:", error);
      return { success: false, message: error.message };
    }
    return { success: true, data: data[0] };
  },

  // Complete a Challenge
  async completeChallenge(challengeId, rewardPoints) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: "Not logged in" };

    const profile = await this.getProfile();
    if (!profile) return { success: false, message: "Profile not found" };

    const completed = profile.completed_challenges || [];
    if (completed.includes(challengeId)) {
      return { success: false, message: "Challenge already completed" };
    }

    const updatedCompleted = [...completed, challengeId];
    const newPoints = (profile.total_points || 0) + rewardPoints;

    const { data, error } = await _supabaseApp
      .from("profiles")
      .update({ 
        completed_challenges: updatedCompleted,
        total_points: newPoints 
      })
      .eq("id", user.id)
      .select();

    if (error) {
      console.error("Error updating challenge progress:", error);
      return { success: false, message: error.message };
    }
    return { success: true, data: data[0] };
  }
};

window.EcoAuth = AuthResult;

