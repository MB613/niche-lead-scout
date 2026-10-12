const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const localtunnel = require('localtunnel');
const { analyzeTargetWebsite, formatNumber } = require('./services/nicheDetector');
const { getCompetitorsForNiche } = require('./services/competitorEngine');
const { sendBatchOutreach, verifySmtpConnection, getEmailLogs, getCampaignHistory } = require('./services/emailService');
const { generateSmartReply, recordIncomingReply, getConversations, updateConversationStatus, classifyReplyIntent } = require('./services/aiReplyBot');
const {
  PLANS,
  registerUser,
  loginUser,
  getUserById,
  checkAndUpdateQuota,
  upgradePlan
} = require('./services/authService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Public tunnel tracking
let publicTunnelUrl = null;

// Persistent in-memory session cache for current exploration
let currentSession = {
  target: null,
  allCompetitors: [],
  currentPage: 1,
  autonomousAutoReply: true,
  smtpSettings: {
    host: '',
    port: 587,
    user: '',
    pass: '',
    secure: false,
    fromName: 'Nexus SEO Growth',
    fromEmail: 'outreach@growthnexus.io'
  },
  aiSettings: {
    apiKey: '',
    bookingLink: 'https://calendly.com/growth-team/15min-strategy'
  }
};

// ==========================================
// 1. AUTH & PRICING API ROUTES
// ==========================================

// Get Available Pricing Plans
app.get('/api/pricing', (req, res) => {
  res.json({
    success: true,
    plans: PLANS,
    defaultFreeLimit: 200
  });
});

// Register User
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = registerUser({ name, email, password });
    res.json({ success: true, message: 'Account created successfully!', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login User
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = loginUser({ email, password });
    res.json({ success: true, message: 'Logged in successfully!', user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Get Current User Profile & Remaining Quota
app.get('/api/auth/me', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId || 'usr_free_demo';
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user });
});

// Upgrade User Plan
app.post('/api/auth/upgrade', (req, res) => {
  try {
    const { userId = 'usr_free_demo', planId } = req.body;
    const updatedUser = upgradePlan(userId, planId);
    res.json({
      success: true,
      message: `Plan upgraded successfully to ${updatedUser.planName}!`,
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Public Tunnel URL Status
app.get('/api/tunnel-status', (req, res) => {
  res.json({
    isLive: !!publicTunnelUrl,
    publicUrl: publicTunnelUrl,
    localUrl: `http://localhost:${PORT}`
  });
});

// ==========================================
// 2. COMPETITOR & SEO INTELLIGENCE ROUTES
// ==========================================

// Analyze Target Website URL
app.post('/api/analyze-target', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Please provide a valid website URL' });
    }

    const targetInfo = await analyzeTargetWebsite(url);
    currentSession.target = targetInfo;
    currentSession.allCompetitors = [];
    currentSession.currentPage = 1;

    // Immediately fetch first 50 competitors for this niche
    const discovery = getCompetitorsForNiche({
      category: targetInfo.category,
      subNiche: targetInfo.subNiche,
      targetDomain: targetInfo.domain,
      page: 1,
      limit: 50
    });

    currentSession.allCompetitors = discovery.competitors;
    currentSession.currentPage = 1;

    res.json({
      success: true,
      target: targetInfo,
      competitors: discovery.competitors,
      pagination: {
        page: 1,
        limit: 50,
        totalLoaded: discovery.competitors.length,
        totalAvailable: discovery.totalAvailable,
        hasMore: discovery.hasMore
      }
    });
  } catch (error) {
    console.error('Target Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze target website: ' + error.message });
  }
});

// Discover More Competitors (Show More / Next 50)
app.post('/api/discover-competitors', (req, res) => {
  try {
    const { page = 2, limit = 50 } = req.body;
    if (!currentSession.target) {
      return res.status(400).json({ error: 'Please analyze a target website first' });
    }

    const targetInfo = currentSession.target;
    const discovery = getCompetitorsForNiche({
      category: targetInfo.category,
      subNiche: targetInfo.subNiche,
      targetDomain: targetInfo.domain,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    // Append to session cache
    currentSession.allCompetitors.push(...discovery.competitors);
    currentSession.currentPage = parseInt(page, 10);

    res.json({
      success: true,
      newCompetitors: discovery.competitors,
      allCompetitorsCount: currentSession.allCompetitors.length,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalLoaded: currentSession.allCompetitors.length,
        totalAvailable: discovery.totalAvailable,
        hasMore: discovery.hasMore
      }
    });
  } catch (error) {
    console.error('Discover Competitors Error:', error);
    res.status(500).json({ error: 'Failed to discover competitors: ' + error.message });
  }
});

// ==========================================
// 3. COLD OUTREACH & EMAIL ENGINE (WITH DAILY 200 LIMIT)
// ==========================================

app.post('/api/send-outreach', async (req, res) => {
  try {
    const {
      recipients,
      subject,
      message,
      senderName,
      senderEmail,
      userId = 'usr_free_demo',
      isSimulation = false
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'No recipient websites selected for outreach' });
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message body are required' });
    }

    // CHECK DAILY EMAIL QUOTA (200 Free emails limit check)
    const quotaCheck = checkAndUpdateQuota(userId, recipients.length);
    if (!quotaCheck.allowed) {
      return res.status(403).json({
        error: quotaCheck.message,
        quotaExceeded: true,
        remaining: quotaCheck.remaining,
        limit: quotaCheck.limit,
        plan: quotaCheck.plan
      });
    }

    const result = await sendBatchOutreach({
      recipients,
      subjectTemplate: subject,
      messageTemplate: message,
      senderName: senderName || currentSession.smtpSettings.fromName,
      senderEmail: senderEmail || currentSession.smtpSettings.fromEmail,
      smtpConfig: currentSession.smtpSettings,
      isSimulation: isSimulation || (!currentSession.smtpSettings.host)
    });

    // Update status in current competitors list
    const sentIds = new Set(result.results.filter(r => r.status === 'sent').map(r => r.leadId));
    currentSession.allCompetitors.forEach(comp => {
      if (sentIds.has(comp.id)) {
        comp.outreachStatus = 'sent';
      }
    });

    res.json({
      success: true,
      message: `Successfully dispatched outreach campaign to ${result.campaign.sentCount} websites!`,
      campaign: result.campaign,
      results: result.results,
      quota: {
        sentToday: quotaCheck.sentToday,
        remaining: quotaCheck.remaining,
        dailyLimit: quotaCheck.limit,
        plan: quotaCheck.plan
      }
    });
  } catch (error) {
    console.error('Outreach Send Error:', error);
    res.status(500).json({ error: 'Failed to dispatch email campaign: ' + error.message });
  }
});

// ==========================================
// 4. AI AUTO-RESPONDER & INBOX ROUTES
// ==========================================

// Generate AI Reply for incoming message
app.post('/api/ai-reply', async (req, res) => {
  try {
    const { incomingMessage, originalSubject, companyName } = req.body;
    if (!incomingMessage) {
      return res.status(400).json({ error: 'Incoming message is required' });
    }

    const reply = await generateSmartReply({
      incomingMessage,
      originalSubject,
      companyName,
      senderName: currentSession.smtpSettings.fromName,
      bookingLink: currentSession.aiSettings.bookingLink,
      apiKey: currentSession.aiSettings.apiKey
    });

    res.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error('AI Reply Error:', error);
    res.status(500).json({ error: 'Failed to generate AI reply: ' + error.message });
  }
});

// Simulate Incoming Reply from one of the contacted websites
app.post('/api/simulate-reply', async (req, res) => {
  try {
    const { leadDomain, scenario = 'interested' } = req.body;

    const domain = leadDomain || (currentSession.allCompetitors[0]?.domain || 'klaviyo.com');
    const company = domain.split('.')[0].toUpperCase();

    const SCENARIOS = {
      interested: {
        sender: `growth@${domain}`,
        message: `Hi there,\n\nWe saw your note regarding our Google organic search rankings. We've actually been looking to improve our position for commercial buyer terms. Could you share some more specifics or jump on a quick 15-minute Zoom call this week to show us your findings?`,
        subject: `Re: Organic Search Performance & Competitor Benchmark for ${company}`
      },
      pricing: {
        sender: `marketing@${domain}`,
        message: `Hello,\n\nThanks for reaching out with those ranking statistics. What is your pricing structure or monthly retainer for helping us capture these high-intent keyword gaps?`,
        subject: `Re: Strategic Keyword Growth for ${company}`
      },
      more_info: {
        sender: `partnerships@${domain}`,
        message: `Hey team,\n\nInteresting numbers on our keyword visibility. Do you have any case studies or proven examples of other brands in our space you've helped scale?`,
        subject: `Re: Organic Traffic Opportunity for ${company}`
      },
      objection: {
        sender: `hello@${domain}`,
        message: `Thanks for the outreach. We already work with an in-house SEO agency and aren't looking to switch vendors at this moment. Maybe next quarter.`,
        subject: `Re: Benchmark Report for ${company}`
      },
      unsubscribe: {
        sender: `admin@${domain}`,
        message: `Please remove our domain and email from your outreach database. Thank you.`,
        subject: `Re: Outreach Removal Request`
      }
    };

    const chosenScenario = SCENARIOS[scenario] || SCENARIOS.interested;

    // Generate AI Auto-Reply
    const smartReply = await generateSmartReply({
      incomingMessage: chosenScenario.message,
      originalSubject: chosenScenario.subject,
      companyName: company,
      senderName: currentSession.smtpSettings.fromName,
      bookingLink: currentSession.aiSettings.bookingLink,
      apiKey: currentSession.aiSettings.apiKey
    });

    // Record in conversation store
    const conversation = recordIncomingReply({
      senderEmail: chosenScenario.sender,
      senderDomain: domain,
      companyName: company,
      incomingMessage: chosenScenario.message,
      originalSubject: chosenScenario.subject,
      autoReplyDraft: smartReply,
      autonomousMode: currentSession.autonomousAutoReply
    });

    // Update status in competitor table
    const targetComp = currentSession.allCompetitors.find(c => c.domain === domain);
    if (targetComp) {
      targetComp.outreachStatus = 'replied';
    }

    res.json({
      success: true,
      message: 'Simulated reply received and processed by AI bot!',
      conversation
    });
  } catch (error) {
    console.error('Simulate Reply Error:', error);
    res.status(500).json({ error: 'Failed to simulate reply: ' + error.message });
  }
});

// Get all conversations & inbox
app.get('/api/conversations', (req, res) => {
  res.json({
    success: true,
    conversations: getConversations(),
    autonomousAutoReply: currentSession.autonomousAutoReply
  });
});

// Update / Approve conversation reply
app.put('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const { status, modifiedReply } = req.body;
  const updated = updateConversationStatus(id, status, modifiedReply);
  if (!updated) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json({ success: true, conversation: updated });
});

// Toggle Autonomous Bot Mode
app.post('/api/toggle-autonomous-mode', (req, res) => {
  const { enabled } = req.body;
  currentSession.autonomousAutoReply = !!enabled;
  res.json({
    success: true,
    autonomousAutoReply: currentSession.autonomousAutoReply,
    message: currentSession.autonomousAutoReply 
      ? 'Autonomous Auto-Reply Bot is now ACTIVE! Replies will be sent instantly.'
      : 'Manual Review Mode enabled. Bot will draft replies for your 1-click approval.'
  });
});

// ==========================================
// 5. SETTINGS & EXPORTS
// ==========================================

// Update Settings (SMTP & AI)
app.post('/api/settings', (req, res) => {
  const { smtp, ai, autonomousAutoReply } = req.body;
  if (smtp) {
    currentSession.smtpSettings = { ...currentSession.smtpSettings, ...smtp };
  }
  if (ai) {
    currentSession.aiSettings = { ...currentSession.aiSettings, ...ai };
  }
  if (typeof autonomousAutoReply === 'boolean') {
    currentSession.autonomousAutoReply = autonomousAutoReply;
  }
  res.json({
    success: true,
    message: 'Settings updated successfully!',
    settings: {
      smtp: {
        host: currentSession.smtpSettings.host,
        port: currentSession.smtpSettings.port,
        user: currentSession.smtpSettings.user,
        fromName: currentSession.smtpSettings.fromName,
        fromEmail: currentSession.smtpSettings.fromEmail,
        hasPass: !!currentSession.smtpSettings.pass
      },
      ai: {
        hasApiKey: !!currentSession.aiSettings.apiKey,
        bookingLink: currentSession.aiSettings.bookingLink
      },
      autonomousAutoReply: currentSession.autonomousAutoReply
    }
  });
});

// Verify SMTP Connection
app.post('/api/test-smtp', async (req, res) => {
  try {
    const config = req.body;
    const result = await verifySmtpConnection(config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard Overview Stats
app.get('/api/stats', (req, res) => {
  const comps = currentSession.allCompetitors;
  const totalTraffic = comps.reduce((acc, c) => acc + (c.monthlyTraffic || 0), 0);
  const avgHighRank = comps.length > 0 
    ? Math.round(comps.reduce((acc, c) => acc + (c.highRankingPercent || 0), 0) / comps.length) 
    : 0;
  const emailsSent = comps.filter(c => c.outreachStatus === 'sent' || c.outreachStatus === 'replied').length;
  const replies = getConversations().length;

  res.json({
    totalDiscovered: comps.length,
    totalTraffic: totalTraffic,
    totalTrafficFormatted: formatNumber(totalTraffic),
    averageHighRankPercent: avgHighRank,
    averageLowRankPercent: 100 - avgHighRank,
    emailsSent,
    repliesReceived: replies,
    replyRate: emailsSent > 0 ? ((replies / emailsSent) * 100).toFixed(1) + '%' : '0%',
    autonomousMode: currentSession.autonomousAutoReply
  });
});

// Export Discovered Competitors to CSV
app.get('/api/export-csv', (req, res) => {
  const comps = currentSession.allCompetitors;
  if (!comps || comps.length === 0) {
    return res.status(400).send('No competitor data to export. Please analyze a website first.');
  }

  const headers = [
    '#',
    'Domain',
    'Website Name',
    'Category',
    'Sub-Niche',
    'Monthly Traffic',
    'Traffic Trend',
    'Total Keywords',
    'High Ranking % (Pos 1-10)',
    'Low Ranking % (Pos 11-100)',
    'Positions 1-3 Count',
    'Positions 4-10 Count',
    'Positions 11-50 Count',
    'Positions 51-100 Count',
    'Domain Authority (DA)',
    'Country',
    'Contact Email',
    'Outreach Status'
  ];

  const rows = comps.map((c, i) => [
    i + 1,
    `"${c.domain}"`,
    `"${c.name}"`,
    `"${c.category}"`,
    `"${c.subNiche}"`,
    c.monthlyTraffic,
    `"${c.trafficTrend}"`,
    c.totalKeywords,
    `${c.highRankingPercent}%`,
    `${c.lowRankingPercent}%`,
    c.rankingTiers.top3.count,
    c.rankingTiers.page1.count,
    c.rankingTiers.page2_5.count,
    c.rankingTiers.page6_10.count,
    c.domainAuthority,
    `"${c.country}"`,
    `"${c.contactEmail}"`,
    `"${c.outreachStatus}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=competitors_${Date.now()}.csv`);
  res.send(csvContent);
});

// Start Public Tunnel Function
async function startTunnel() {
  try {
    console.log('🌐 Opening public HTTPS tunnel for remote sharing...');
    const tunnel = await localtunnel({ port: PORT });
    publicTunnelUrl = tunnel.url;
    
    // Save to public-url.txt
    fs.writeFileSync(path.join(__dirname, 'public-url.txt'), publicTunnelUrl, 'utf8');

    console.log(`====================================================`);
    console.log(`🌍 PUBLIC SHARING LINK (Send to Client):`);
    console.log(`👉 ${publicTunnelUrl}`);
    console.log(`====================================================`);

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
      publicTunnelUrl = null;
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
    });
  } catch (err) {
    console.warn('⚠️ Could not open public tunnel automatically:', err.message);
  }
}

// Start Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 NexusRank AI Outreach Server running on port ${PORT}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);

  // Auto-launch tunnel if requested via flag or default
  if (process.argv.includes('--tunnel') || process.env.ENABLE_TUNNEL === 'true') {
    await startTunnel();
  }
});
