const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Plan definitions
const PLANS = {
  free: {
    id: 'free',
    name: 'Free Starter',
    dailyEmailLimit: 200,
    price: '$0 / mo',
    features: ['200 Cold Emails / Day', '50 Competitors per search', 'AI Auto-Responder Bot', 'CSV & PDF Export']
  },
  growth: {
    id: 'growth',
    name: 'Growth Pro',
    dailyEmailLimit: 2500,
    price: '$49 / mo',
    features: ['2,500 Cold Emails / Day', 'Unlimited Competitor Searches', 'Priority SMTP Relay', 'Custom AI Tone Adjuster']
  },
  agency: {
    id: 'agency',
    name: 'Agency Elite',
    dailyEmailLimit: 999999,
    price: '$99 / mo',
    features: ['Unlimited Cold Outreach', 'White-label PDF Reports', 'Multi-Sender Rotation', 'Dedicated 24/7 AI Engine']
  }
};

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Initial seed users
const DEFAULT_USERS = [
  {
    id: 'usr_free_demo',
    name: 'Free Demo User',
    email: 'demo@nexusrank.io',
    password: 'password123',
    plan: 'free',
    dailyEmailLimit: 200,
    emailsSentToday: 0,
    lastResetDate: getTodayString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_agency_demo',
    name: 'Elite Agency Pro',
    email: 'agency@nexusrank.io',
    password: 'password123',
    plan: 'agency',
    dailyEmailLimit: 999999,
    emailsSentToday: 0,
    lastResetDate: getTodayString(),
    createdAt: new Date().toISOString()
  }
];

let users = [];

function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
      users = DEFAULT_USERS;
      saveUsers();
    }
  } else {
    users = DEFAULT_USERS;
    saveUsers();
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving users file:', e);
  }
}

// Reset daily count if day changed
function checkDailyReset(user) {
  const today = getTodayString();
  if (user.lastResetDate !== today) {
    user.lastResetDate = today;
    user.emailsSentToday = 0;
    saveUsers();
  }
}

loadUsers();

function registerUser({ name, email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Email and password are required');
  }

  const existing = users.find(u => u.email === cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    name: (name || '').trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    password: password,
    plan: 'free',
    dailyEmailLimit: PLANS.free.dailyEmailLimit,
    emailsSentToday: 0,
    lastResetDate: getTodayString(),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers();
  return sanitizeUser(newUser);
}

function loginUser({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const user = users.find(u => u.email === cleanEmail && u.password === password);
  if (!user) {
    throw new Error('Invalid email or password');
  }
  checkDailyReset(user);
  return sanitizeUser(user);
}

function getUserById(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  checkDailyReset(user);
  return sanitizeUser(user);
}

function checkAndUpdateQuota(userId, countToSend) {
  const user = users.find(u => u.id === userId);
  if (!user) {
    // Guest fallback: default 200 emails limit
    return {
      allowed: countToSend <= 200,
      limit: 200,
      sentToday: countToSend,
      remaining: Math.max(0, 200 - countToSend),
      plan: 'free'
    };
  }

  checkDailyReset(user);
  const remaining = Math.max(0, user.dailyEmailLimit - user.emailsSentToday);

  if (countToSend > remaining) {
    return {
      allowed: false,
      limit: user.dailyEmailLimit,
      sentToday: user.emailsSentToday,
      remaining: remaining,
      plan: user.plan,
      message: `Daily quota exceeded! You have ${remaining} emails left out of your daily ${user.dailyEmailLimit} email limit. Please upgrade to Pro for higher volume.`
    };
  }

  // Increment usage
  user.emailsSentToday += countToSend;
  saveUsers();

  return {
    allowed: true,
    limit: user.dailyEmailLimit,
    sentToday: user.emailsSentToday,
    remaining: user.dailyEmailLimit - user.emailsSentToday,
    plan: user.plan
  };
}

function upgradePlan(userId, planId) {
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  const plan = PLANS[planId];
  if (!plan) throw new Error('Invalid plan selected');

  user.plan = planId;
  user.dailyEmailLimit = plan.dailyEmailLimit;
  saveUsers();
  return sanitizeUser(user);
}

function sanitizeUser(user) {
  checkDailyReset(user);
  const planInfo = PLANS[user.plan] || PLANS.free;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    planName: planInfo.name,
    dailyEmailLimit: user.dailyEmailLimit,
    emailsSentToday: user.emailsSentToday,
    remainingEmails: Math.max(0, user.dailyEmailLimit - user.emailsSentToday),
    plans: PLANS
  };
}

module.exports = {
  PLANS,
  registerUser,
  loginUser,
  getUserById,
  checkAndUpdateQuota,
  upgradePlan,
  getTodayString
};
