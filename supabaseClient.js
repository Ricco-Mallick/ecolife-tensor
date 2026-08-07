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
    if (!_supabaseApp) return { success: false };
    await _supabaseApp.auth.signOut();
    return { success: true };
  },

  // Get Current User (Auth)
  async getCurrentUser() {
    if (!_supabaseApp) return null;
    const { data } = await _supabaseApp.auth.getUser();
    return (data && data.user) ? data.user : null;
  },

  // Get User Profile from `profiles` table
  async getProfile() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await _supabaseApp
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

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
    const profile = await this.getProfile();
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
  }
};

window.EcoAuth = AuthResult;

