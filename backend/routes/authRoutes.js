import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory and users file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    // Seed default demo user
    const defaultUsers = [
      {
        id: "usr_demo123",
        fullName: "Ananya Sharma",
        email: "demo@safeher.org",
        password: "password123",
        phone: "+91 7061330201",
        emergencyContactName: "Aarav Sharma (Brother)",
        emergencyContactPhone: "+91 9876543210",
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading users file:", err.message);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing users file:", err.message);
  }
}

// Generate simple secure session token
function generateToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    ts: Date.now()
  })).toString("base64");
  return `sh_tok_${payload}`;
}

// Helper to scrub password from returned user object
function sanitizeUser(user) {
  const { password, ...clean } = user;
  return clean;
}

/**
 * POST /api/auth/register
 * Body: { fullName, email, password, phone, emergencyContactName, emergencyContactPhone }
 */
router.post("/register", (req, res) => {
  try {
    const { fullName, email, password, phone, emergencyContactName, emergencyContactPhone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full Name, Email, and Password are required fields."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = loadUsers();

    // Check if user already exists
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists."
      });
    }

    const newUser = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      password: password, // Simple storage for demo
      phone: phone ? phone.trim() : "+91 7061330201",
      emergencyContactName: emergencyContactName ? emergencyContactName.trim() : "Emergency Guardian",
      emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : "+91 9876543210",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const token = generateToken(newUser);
    const cleanUser = sanitizeUser(newUser);

    return res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to SafeHer.",
      token,
      user: cleanUser
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during registration: " + err.message
    });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both Email and Password."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = loadUsers();

    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please check your credentials."
      });
    }

    const token = generateToken(user);
    const cleanUser = sanitizeUser(user);

    return res.json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      token,
      user: cleanUser
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login: " + err.message
    });
  }
});

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
router.get("/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token || !token.startsWith("sh_tok_")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Missing or invalid token."
      });
    }

    const rawPayload = token.replace(/^sh_tok_/, "");
    const decoded = JSON.parse(Buffer.from(rawPayload, "base64").toString("utf-8"));

    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id || u.email.toLowerCase() === decoded.email.toLowerCase());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User session expired or user not found."
      });
    }

    return res.json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token."
    });
  }
});

export default router;
