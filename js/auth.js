/**
 * SafeHer Global Authentication Manager & Client-Side Auth Guard
 */
(function(window) {
  'use strict';

  const BACKEND_URL = window.BACKEND_URL || "http://localhost:5000";
  const STORAGE_KEY_USER = "safeher_user";
  const STORAGE_KEY_TOKEN = "safeher_token";

  // Default fallback demo user for instant offline access
  const DEFAULT_DEMO_USER = {
    id: "usr_demo123",
    fullName: "Ananya Sharma",
    email: "demo@safeher.org",
    phone: "+91 7061330201",
    emergencyContactName: "Aarav Sharma (Brother)",
    emergencyContactPhone: "+91 9876543210",
    createdAt: new Date().toISOString()
  };

  const SafeHerAuth = {
    /**
     * Get currently logged-in user profile from localStorage
     */
    getUser: function() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_USER);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn("[SafeHerAuth] Error parsing user session:", e);
      }
      return null;
    },

    /**
     * Get current session token
     */
    getToken: function() {
      return localStorage.getItem(STORAGE_KEY_TOKEN) || "";
    },

    /**
     * Check if user is authenticated
     */
    isLoggedIn: function() {
      return !!(this.getUser() && this.getToken());
    },

    /**
     * Store authentication session
     */
    setSession: function(user, token) {
      if (user) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
    },

    /**
     * Log out current user & clear session
     */
    logout: function(redirectUrl = "login.html") {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },

    /**
     * Authenticate User (Login)
     */
    login: async function(email, password) {
      if (!email || !password) {
        throw new Error("Please fill in both email and password.");
      }

      // Try Backend API
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          this.setSession(data.user, data.token);
          return data;
        } else {
          throw new Error(data.message || "Invalid credentials.");
        }
      } catch (err) {
        // Fallback for demo credentials or offline mode
        if (email.trim().toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase() && password === "password123") {
          const fakeToken = "sh_tok_demo_fallback_" + Date.now();
          this.setSession(DEFAULT_DEMO_USER, fakeToken);
          return { success: true, user: DEFAULT_DEMO_USER, token: fakeToken };
        }
        throw err;
      }
    },

    /**
     * Register New User (Signup)
     */
    register: async function(formData) {
      const { fullName, email, password, phone, emergencyContactName, emergencyContactPhone } = formData;
      if (!fullName || !email || !password) {
        throw new Error("Full name, email, and password are required.");
      }

      // Try Backend API
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
          this.setSession(data.user, data.token);
          return data;
        } else {
          throw new Error(data.message || "Registration failed.");
        }
      } catch (err) {
        // Fallback create local session if backend unreachable
        const newUser = {
          id: `usr_${Date.now().toString(36)}`,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : "+91 7061330201",
          emergencyContactName: emergencyContactName ? emergencyContactName.trim() : "Emergency Guardian",
          emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : "+91 9876543210",
          createdAt: new Date().toISOString()
        };
        const fakeToken = "sh_tok_fallback_" + Date.now();
        this.setSession(newUser, fakeToken);
        return { success: true, user: newUser, token: fakeToken };
      }
    },

    /**
     * Login via Quick Demo Mode (Instant single click login)
     */
    quickDemoLogin: function() {
      const demoToken = "sh_tok_quickdemo_" + Date.now();
      this.setSession(DEFAULT_DEMO_USER, demoToken);
      window.location.href = "home.html";
    },

    /**
     * Auth Guard: Redirect unauthenticated users to login page
     */
    requireAuth: function(redirectUrl = "login.html") {
      if (!this.isLoggedIn()) {
        console.warn("[SafeHerAuth] Unauthenticated access attempt. Redirecting to", redirectUrl);
        window.location.href = redirectUrl;
        return false;
      }
      return true;
    },

    /**
     * Bind Logged In User to UI Navbar & Elements
     */
    bindUserUI: function() {
      const user = this.getUser();
      if (!user) return;

      // Update avatar letter
      const avatars = document.querySelectorAll(".avatar, .user-avatar-initial");
      avatars.forEach(el => {
        el.textContent = user.fullName ? user.fullName.charAt(0).toUpperCase() : "S";
      });

      // Update user names
      const nameElements = document.querySelectorAll("#userNameDisplay, .user-name-target");
      nameElements.forEach(el => {
        el.textContent = user.fullName;
      });

      // Update email display
      const emailElements = document.querySelectorAll("#userEmailDisplay, .user-email-target");
      emailElements.forEach(el => {
        el.textContent = user.email;
      });
    }
  };

  window.SafeHerAuth = SafeHerAuth;
})(window);
