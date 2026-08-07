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
      console.warn("Supabase init error, running in demo local mode:", e);
    }
  } else {
    console.log("Supabase SDK script not loaded yet. Demo storage fallback active.");
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

// Local Storage Fallback Store
const DEMO_USER_KEY = "ecolife_demo_user";
const DEMO_ACTIONS_KEY = "ecolife_demo_actions";

const AuthResult = {
  // Sign Up
  async signUp(email, password, fullName = "") {
    if (_supabaseApp) {
      const { data, error } = await _supabaseApp.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) return { success: false, message: error.message };
      return { success: true, user: data.user, session: data.session };
    } else {
      // Local fallback
      const user = {
        id: "demo-" + Date.now(),
        email,
        user_metadata: { full_name: fullName || email.split("@")[0] }
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
      return { success: true, user };
    }
  },

  // Sign In
  async signIn(email, password) {
    if (_supabaseApp) {
      const { data, error } = await _supabaseApp.auth.signInWithPassword({
        email,
        password
      });
      if (error) return { success: false, message: error.message };
      return { success: true, user: data.user, session: data.session };
    } else {
      // Local fallback sign in
      const stored = localStorage.getItem(DEMO_USER_KEY);
      let user = stored ? JSON.parse(stored) : null;
      if (!user || user.email !== email) {
        user = {
          id: "demo-" + Date.now(),
          email,
          user_metadata: { full_name: email.split("@")[0] }
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
      }
      return { success: true, user };
    }
  },

  // Sign In with Social OAuth (Google, GitHub, Apple)
  async signInWithOAuth(provider = 'google') {
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
    } else {
      // Demo fallback
      const email = `user_${Math.floor(Math.random() * 1000)}@${provider.toLowerCase()}.com`;
      const user = {
        id: "demo-oauth-" + Date.now(),
        email,
        user_metadata: { full_name: `${provider} User` }
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
      return { success: true, user };
    }
  },

  // Sign Out
  async signOut() {
    if (_supabaseApp) {
      await _supabaseApp.auth.signOut();
    }
    localStorage.removeItem(DEMO_USER_KEY);
    return { success: true };
  },

  // Get Current User
  async getCurrentUser() {
    if (_supabaseApp) {
      const { data } = await _supabaseApp.auth.getUser();
      if (data && data.user) return data.user;
    }
    const stored = localStorage.getItem(DEMO_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Log Eco Action to DB / Local Storage
  async logEcoAction(category, title, co2SavedKg) {
    const user = await this.getCurrentUser();
    const newAction = {
      id: "act-" + Date.now(),
      user_id: user ? user.id : "guest",
      category,
      title,
      co2_saved_kg: parseFloat(co2SavedKg) || 0,
      logged_at: new Date().toISOString()
    };

    if (_supabaseApp && user && !user.id.startsWith("demo-")) {
      const { data, error } = await _supabaseApp.from("eco_actions").insert([newAction]);
      if (!error) return { success: true, data };
    }

    // Local fallback
    const actions = JSON.parse(localStorage.getItem(DEMO_ACTIONS_KEY) || "[]");
    actions.unshift(newAction);
    localStorage.setItem(DEMO_ACTIONS_KEY, JSON.stringify(actions));
    return { success: true, data: newAction };
  },

  // Fetch Eco Actions
  async getEcoActions() {
    const user = await this.getCurrentUser();
    if (_supabaseApp && user && !user.id.startsWith("demo-")) {
      const { data, error } = await _supabaseApp
        .from("eco_actions")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });
      if (!error) return data;
    }
    return JSON.parse(localStorage.getItem(DEMO_ACTIONS_KEY) || "[]");
  }
};

window.EcoAuth = AuthResult;
