// Client-side Application Controller with Full Responsive Support, PDF Export, Pricing Quota, and Live Tunnel
let state = {
  target: null,
  competitors: [],
  currentPage: 1,
  hasMore: true,
  totalAvailable: 250,
  selectedCompetitorIds: new Set(),
  activeTemplate: 'fashion_rates',
  autonomousAutoReply: true,
  currentUser: {
    id: 'usr_free_demo',
    name: 'Free Demo User',
    email: 'demo@nexusrank.io',
    plan: 'free',
    planName: 'Free Starter',
    dailyEmailLimit: 200,
    emailsSentToday: 0,
    remainingEmails: 200
  },
  publicUrl: null,
  activeView: 'table', // 'table' or 'cards'
  settings: {
    smtp: {},
    ai: {},
    autonomousAutoReply: true
  }
};

// Outreach Pitch & Inquiry Templates
const OUTREACH_TEMPLATES = {
  fashion_rates: {
    subject: "Product Rates & Catalog Inquiry — {{company}}",
    body: `Hi {{company}} Team,

I hope this email finds you well.

I came across {{company}} ({{domain}}) and was really impressed by your collection and articles.

Could you please share your latest price list, clothing / product rates, and current catalog? We are looking to inquire about your product pricing, available sizes/articles, and any volume discounts or minimum order requirements.

Also, please let us know the best way to place an inquiry or order, and if you have a wholesale / retail rate sheet available.

Looking forward to your prompt response.

Best regards,
{{sender_name}}
{{sender_email}}
{{sender_phone}}`
  },
  wholesale_rates: {
    subject: "Wholesale Price & Bulk Order Inquiry — {{company}}",
    body: `Dear Sales & Distribution Team at {{company}},

We are interested in purchasing from your current product line and would like to request your wholesale price sheet and rate card for {{domain}}.

Could you please provide:
1. Current product catalog with wholesale rates
2. Minimum Order Quantity (MOQ) and tier discounts
3. Delivery lead times and payment terms

Looking forward to hearing from you.

Thank you,
{{sender_name}}
{{sender_email}}
{{sender_phone}}`
  },
  catalog_info: {
    subject: "Inquiry regarding {{company}} product catalog and pricing",
    body: `Hello {{company}} Team,

I am writing to inquire about your current collections, pricing, and availability on {{domain}}.

Could you please send us your updated product catalog or digital price list? We would like to review your current pricing and explore options for placing an order.

Best regards,
{{sender_name}}
{{sender_email}}`
  },
  custom: {
    subject: "Inquiry for {{company}}",
    body: `Hi {{company}} Team,

I am reaching out regarding {{domain}}.

Please share your latest rates and product information.

Best regards,
{{sender_name}}
{{sender_email}}`
  },
  gap: {
    subject: "Quick question regarding {{company}}'s Google search rankings",
    body: `Hi {{company}} team,

I was analyzing organic search performance across your niche and noticed something significant regarding {{domain}}.

While you have strong traction with {{traffic}} estimated monthly visits, your high-ranking keyword coverage is currently at {{high_rank_percent}}, which leaves a notable commercial gap against top competitors.

Would you be open to a quick 10-minute walkthrough to look at the competitive gap report we generated for {{domain}}?

Best regards,
{{sender_name}}`
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  setupEventListeners();
  loadInitialStats();
  checkCurrentUser();
  checkTunnelStatus();
  loadInitialSettings();

  // Auto-detect mobile screen and switch to Cards view on small screens
  if (window.innerWidth < 768) {
    switchToCardsView();
  }
});

// Setup UI Event Listeners
function setupEventListeners() {
  // Mobile Hamburger Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('hidden');
    });
  }

  // Mobile Drawer Action Buttons
  const bindClick = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', (e) => {
      if (mobileDrawer) mobileDrawer.classList.add('hidden');
      fn(e);
    });
  };

  bindClick('mobile-auth-btn', openAuthModal);
  bindClick('mobile-open-pricing-btn', openPricingModal);
  bindClick('mobile-inbox-btn', openInboxModal);
  bindClick('mobile-share-btn', openShareModal);
  bindClick('mobile-export-pdf-btn', handleExportPDF);
  bindClick('mobile-export-csv-btn', () => {
    if (state.competitors.length === 0) {
      showToast('Please analyze a website first', 'warning');
      return;
    }
    window.location.href = '/api/export-csv';
  });
  bindClick('mobile-settings-btn', openSettingsModal);

  // View Switcher (Table vs Cards)
  const viewTableBtn = document.getElementById('view-table-btn');
  const viewCardsBtn = document.getElementById('view-cards-btn');
  if (viewTableBtn && viewCardsBtn) {
    viewTableBtn.addEventListener('click', switchToTableView);
    viewCardsBtn.addEventListener('click', switchToCardsView);
  }

  // Search Form
  const searchForm = document.getElementById('url-search-form');
  searchForm.addEventListener('submit', handleTargetSearch);

  // Quick Preset Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('data-url');
      document.getElementById('target-url-input').value = url;
      handleTargetSearch(e);
    });
  });

  // Load More Button (Show More Next 50)
  const loadMoreBtn = document.getElementById('load-more-btn');
  loadMoreBtn.addEventListener('click', handleLoadMore);

  // Master Checkbox
  const masterCheckbox = document.getElementById('master-checkbox');
  masterCheckbox.addEventListener('change', handleMasterCheckbox);

  // Select All button
  document.getElementById('select-all-btn').addEventListener('click', () => {
    const allSelected = state.selectedCompetitorIds.size === state.competitors.length;
    if (allSelected) {
      state.selectedCompetitorIds.clear();
      document.getElementById('select-all-btn').textContent = 'Select All';
    } else {
      state.competitors.forEach(c => state.selectedCompetitorIds.add(c.id));
      document.getElementById('select-all-btn').textContent = 'Deselect All';
    }
    renderCompetitorsTable();
    updateSelectedCount();
  });

  // Search filter inside results
  document.getElementById('competitor-search-filter').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    renderCompetitorsTable(query);
  });

  // Sort dropdown
  document.getElementById('sort-select').addEventListener('change', (e) => {
    sortCompetitors(e.target.value);
  });

  // Export CSV
  document.getElementById('export-csv-btn').addEventListener('click', () => {
    if (state.competitors.length === 0) {
      showToast('Please analyze a website first to discover competitors', 'warning');
      return;
    }
    window.location.href = '/api/export-csv';
    showToast('Exporting competitor intelligence to CSV...', 'success');
  });

  // Export PDF
  document.getElementById('export-pdf-btn').addEventListener('click', handleExportPDF);
  const targetPdfBtn = document.getElementById('target-export-pdf-btn');
  if (targetPdfBtn) targetPdfBtn.addEventListener('click', handleExportPDF);

  // Pricing Modal controls
  document.getElementById('open-pricing-btn').addEventListener('click', openPricingModal);
  document.getElementById('close-pricing-modal-btn').addEventListener('click', closePricingModal);
  document.getElementById('user-quota-pill').addEventListener('click', openPricingModal);
  document.getElementById('modal-upgrade-btn').addEventListener('click', () => {
    closeOutreachModal();
    openPricingModal();
  });

  // Select / Upgrade Plan buttons
  document.querySelectorAll('.select-plan-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const planId = e.currentTarget.getAttribute('data-plan');
      handleUpgradePlan(planId);
    });
  });

  // Auth Modal controls
  document.getElementById('auth-btn').addEventListener('click', openAuthModal);
  document.getElementById('close-auth-modal-btn').addEventListener('click', closeAuthModal);
  document.getElementById('tab-login-btn').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('tab-register-btn').addEventListener('click', () => switchAuthTab('register'));
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);

  // Demo Login buttons
  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const email = e.currentTarget.getAttribute('data-email');
      handleDemoLogin(email);
    });
  });

  // Public Share Modal controls
  document.getElementById('open-share-modal-btn').addEventListener('click', openShareModal);
  document.getElementById('close-share-modal-btn').addEventListener('click', closeShareModal);
  document.getElementById('modal-copy-link-btn').addEventListener('click', copyShareLink);
  document.getElementById('copy-tunnel-link-btn').addEventListener('click', copyShareLink);

  // Outreach Modal controls
  document.getElementById('launch-outreach-modal-btn').addEventListener('click', openOutreachModal);
  document.getElementById('close-outreach-modal-btn').addEventListener('click', closeOutreachModal);
  document.getElementById('cancel-outreach-btn').addEventListener('click', closeOutreachModal);
  document.getElementById('confirm-send-outreach-btn').addEventListener('click', handleSendOutreach);

  // Template choice buttons
  document.querySelectorAll('.template-choice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const templateKey = e.currentTarget.getAttribute('data-template');
      selectOutreachTemplate(templateKey);
    });
  });

  // Insert tag buttons
  document.querySelectorAll('.insert-tag-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tag = e.currentTarget.getAttribute('data-tag');
      insertTagIntoBody(tag);
    });
  });

  // Live preview updates
  document.getElementById('outreach-subject-input').addEventListener('input', updateEmailPreview);
  document.getElementById('outreach-body-textarea').addEventListener('input', updateEmailPreview);

  const senderNameInput = document.getElementById('outreach-sender-name');
  if (senderNameInput) senderNameInput.addEventListener('input', updateEmailPreview);

  const senderEmailInput = document.getElementById('outreach-sender-email');
  if (senderEmailInput) senderEmailInput.addEventListener('input', updateEmailPreview);

  const senderPhoneInput = document.getElementById('outreach-sender-phone');
  if (senderPhoneInput) senderPhoneInput.addEventListener('input', updateEmailPreview);

  // Mobile Header Buttons
  const mobileHeaderSettings = document.getElementById('mobile-header-settings-btn');
  if (mobileHeaderSettings) mobileHeaderSettings.addEventListener('click', openSettingsModal);

  const mobileHeaderQuota = document.getElementById('mobile-header-quota-pill');
  if (mobileHeaderQuota) mobileHeaderQuota.addEventListener('click', openPricingModal);

  // 1-Click SMTP Presets
  const btnGmail = document.getElementById('preset-gmail-btn');
  if (btnGmail) {
    btnGmail.addEventListener('click', () => {
      document.getElementById('smtp-host').value = 'smtp.gmail.com';
      document.getElementById('smtp-port').value = '465';
      showToast('Gmail selected (Host: smtp.gmail.com, Port: 465 SSL). Enter your email and App Password!', 'info');
    });
  }

  const btnOutlook = document.getElementById('preset-outlook-btn');
  if (btnOutlook) {
    btnOutlook.addEventListener('click', () => {
      document.getElementById('smtp-host').value = 'smtp.office365.com';
      document.getElementById('smtp-port').value = '587';
      showToast('Outlook selected (Host: smtp.office365.com, Port: 587)', 'info');
    });
  }

  const btnYahoo = document.getElementById('preset-yahoo-btn');
  if (btnYahoo) {
    btnYahoo.addEventListener('click', () => {
      document.getElementById('smtp-host').value = 'smtp.mail.yahoo.com';
      document.getElementById('smtp-port').value = '465';
      showToast('Yahoo selected (Host: smtp.mail.yahoo.com, Port: 465)', 'info');
    });
  }

  // AI Inbox Modal controls
  document.getElementById('open-inbox-btn').addEventListener('click', openInboxModal);
  document.getElementById('close-inbox-modal-btn').addEventListener('click', closeInboxModal);
  document.getElementById('simulate-reply-btn').addEventListener('click', handleSimulateReply);
  document.getElementById('toggle-autonomous-btn').addEventListener('click', handleToggleAutonomousMode);

  // Settings Modal controls
  document.getElementById('open-settings-btn').addEventListener('click', openSettingsModal);
  document.getElementById('close-settings-modal-btn').addEventListener('click', closeSettingsModal);
  document.getElementById('save-settings-btn').addEventListener('click', handleSaveSettings);
  document.getElementById('test-smtp-btn').addEventListener('click', handleTestSmtp);
}

function switchToTableView() {
  state.activeView = 'table';
  document.getElementById('competitors-table-wrapper').classList.remove('hidden');
  document.getElementById('competitors-cards-container').classList.add('hidden');
  document.getElementById('view-table-btn').className = 'px-2 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 transition';
  document.getElementById('view-cards-btn').className = 'px-2 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition';
}

function switchToCardsView() {
  state.activeView = 'cards';
  document.getElementById('competitors-table-wrapper').classList.add('hidden');
  document.getElementById('competitors-cards-container').classList.remove('hidden');
  document.getElementById('view-cards-btn').className = 'px-2 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 transition';
  document.getElementById('view-table-btn').className = 'px-2 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition';
}

// Check and update User Quota UI
async function checkCurrentUser() {
  try {
    const savedUserId = localStorage.getItem('nexus_user_id') || 'usr_free_demo';
    const res = await fetch(`/api/auth/me?userId=${savedUserId}`);
    const data = await res.json();
    if (data.success && data.user) {
      state.currentUser = data.user;
      updateUserUI();
    }
  } catch (err) {
    console.warn('Could not fetch user:', err);
  }
}

function updateUserUI() {
  const u = state.currentUser;
  if (!u) return;

  const planText = document.getElementById('quota-plan-name');
  const counterText = document.getElementById('quota-counter-text');
  const quotaBar = document.getElementById('quota-bar');
  const authBtnText = document.getElementById('auth-btn-text');
  const mobileAuthBtnText = document.getElementById('mobile-auth-btn-text');
  const modalQuotaRemaining = document.getElementById('modal-quota-remaining');

  const mobileQuotaPlan = document.getElementById('mobile-quota-plan');
  const mobileQuotaText = document.getElementById('mobile-quota-text');

  if (planText) planText.textContent = u.planName || 'FREE STARTER';
  if (mobileQuotaPlan) mobileQuotaPlan.textContent = u.planName || 'FREE STARTER';
  
  if (u.dailyEmailLimit > 10000) {
    if (counterText) counterText.textContent = 'Unlimited Daily';
    if (mobileQuotaText) mobileQuotaText.textContent = 'Unlimited Emails Today';
    if (quotaBar) quotaBar.style.width = '100%';
    if (modalQuotaRemaining) modalQuotaRemaining.textContent = 'Unlimited';
  } else {
    if (counterText) counterText.textContent = `${u.remainingEmails} / ${u.dailyEmailLimit} Left`;
    if (mobileQuotaText) mobileQuotaText.textContent = `${u.remainingEmails} / ${u.dailyEmailLimit} Left Today`;
    const percent = Math.min(100, Math.max(0, (u.remainingEmails / u.dailyEmailLimit) * 100));
    if (quotaBar) quotaBar.style.width = `${percent}%`;
    if (modalQuotaRemaining) modalQuotaRemaining.textContent = u.remainingEmails;
  }

  const firstName = u.name.split(' ')[0] || 'My Account';
  if (authBtnText) authBtnText.textContent = firstName;
  if (mobileAuthBtnText) mobileAuthBtnText.textContent = firstName;
}

// Check Public Tunnel Status
async function checkTunnelStatus() {
  try {
    const res = await fetch('/api/tunnel-status');
    const data = await res.json();
    if (data.isLive && data.publicUrl) {
      state.publicUrl = data.publicUrl;
      const banner = document.getElementById('tunnel-banner');
      const link = document.getElementById('tunnel-link');
      const shareInput = document.getElementById('share-link-input');

      if (banner) banner.classList.remove('hidden');
      if (link) {
        link.href = data.publicUrl;
        link.textContent = data.publicUrl;
      }
      if (shareInput) shareInput.value = data.publicUrl;
    }
  } catch (err) {
    // Ignore offline tunnel
  }
}

function copyShareLink() {
  const url = state.publicUrl || window.location.href;
  navigator.clipboard.writeText(url);
  showToast(`Copied public link: ${url}`, 'success');
}

// Pricing Modal Controls
function openPricingModal() {
  document.getElementById('pricing-modal').classList.remove('hidden');
}

function closePricingModal() {
  document.getElementById('pricing-modal').classList.add('hidden');
}

async function handleUpgradePlan(planId) {
  try {
    const userId = state.currentUser?.id || 'usr_free_demo';
    const res = await fetch('/api/auth/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update plan');

    state.currentUser = data.user;
    updateUserUI();
    closePricingModal();
    
    if (window.confetti) {
      window.confetti({ particleCount: 60, spread: 60 });
    }

    showToast(`Upgraded to ${data.user.planName}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Auth Modal Controls
let currentAuthTab = 'login';

function openAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function switchAuthTab(tab) {
  currentAuthTab = tab;
  const nameBox = document.getElementById('auth-name-container');
  const loginTab = document.getElementById('tab-login-btn');
  const regTab = document.getElementById('tab-register-btn');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (tab === 'login') {
    nameBox.classList.add('hidden');
    loginTab.className = 'flex-1 py-2 text-cyan-400 border-b-2 border-cyan-400 transition font-bold';
    regTab.className = 'flex-1 py-2 text-slate-400 hover:text-slate-200 transition';
    submitBtn.textContent = 'Sign In to Account';
  } else {
    nameBox.classList.remove('hidden');
    regTab.className = 'flex-1 py-2 text-cyan-400 border-b-2 border-cyan-400 transition font-bold';
    loginTab.className = 'flex-1 py-2 text-slate-400 hover:text-slate-200 transition';
    submitBtn.textContent = 'Create Free Account (200 Free Emails)';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email-input').value.trim();
  const password = document.getElementById('auth-password-input').value.trim();
  const name = document.getElementById('auth-name-input').value.trim();

  const endpoint = currentAuthTab === 'login' ? '/api/auth/login' : '/api/auth/register';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');

    state.currentUser = data.user;
    localStorage.setItem('nexus_user_id', data.user.id);
    updateUserUI();
    closeAuthModal();
    showToast(data.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDemoLogin(email) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    state.currentUser = data.user;
    localStorage.setItem('nexus_user_id', data.user.id);
    updateUserUI();
    closeAuthModal();
    showToast(`Logged in as ${data.user.name}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Share Modal Controls
function openShareModal() {
  const shareInput = document.getElementById('share-link-input');
  if (shareInput) {
    shareInput.value = state.publicUrl || window.location.href;
  }
  document.getElementById('share-modal').classList.remove('hidden');
}

function closeShareModal() {
  document.getElementById('share-modal').classList.add('hidden');
}

// PDF EXPORT GENERATOR
function handleExportPDF() {
  if (!state.competitors || state.competitors.length === 0) {
    showToast('Please analyze a website first to generate a report!', 'warning');
    return;
  }

  showToast('Generating Executive PDF Report...', 'info');

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const target = state.target || { domain: 'Target Domain', category: 'General' };

    doc.setFillColor(11, 17, 32);
    doc.rect(0, 0, 297, 28, 'F');

    doc.setTextColor(6, 182, 212);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NexusRank AI — SEO & Competitor Intelligence Audit', 14, 12);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Target: ${target.domain}   |   Field: ${target.category} (${target.subNiche || ''})   |   Date: ${new Date().toLocaleDateString()}`, 14, 20);

    doc.setFillColor(15, 23, 42);
    doc.rect(14, 32, 269, 14, 'F');
    doc.setDrawColor(51, 65, 85);
    doc.rect(14, 32, 269, 14, 'D');

    doc.setTextColor(241, 245, 249);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Competitors: ${state.competitors.length}`, 20, 41);
    doc.text(`Target Traffic: ${target.trafficFormatted || 'N/A'}`, 90, 41);
    doc.text(`Achi Ranking (Pos 1-10): ${target.highRankingPercent || 65}%`, 165, 41);
    doc.text(`Low Ranking: ${target.lowRankingPercent || 35}%`, 235, 41);

    const tableColumns = [
      { header: '#', dataKey: 'rank' },
      { header: 'Domain Name', dataKey: 'domain' },
      { header: 'Monthly Traffic', dataKey: 'traffic' },
      { header: 'Trend', dataKey: 'trend' },
      { header: 'Keywords', dataKey: 'keywords' },
      { header: 'Achi Rank % (1-10)', dataKey: 'highRank' },
      { header: 'Low Rank % (11-100)', dataKey: 'lowRank' },
      { header: 'DA', dataKey: 'da' },
      { header: 'Contact Email', dataKey: 'email' }
    ];

    const tableRows = state.competitors.map((c, idx) => ({
      rank: c.rankNumber || (idx + 1),
      domain: c.domain,
      traffic: c.monthlyTrafficFormatted,
      trend: c.trafficTrend,
      keywords: c.totalKeywordsFormatted,
      highRank: `${c.highRankingPercent}%`,
      lowRank: `${c.lowRankingPercent}%`,
      da: c.domainAuthority,
      email: c.contactEmail || 'No email found'
    }));

    doc.autoTable({
      columns: tableColumns,
      body: tableRows,
      startY: 50,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [6, 182, 212],
        textColor: [11, 15, 25],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount} — Generated by NexusRank AI Outreach Suite`,
          14,
          doc.internal.pageSize.height - 6
        );
      }
    });

    const filename = `NexusRank_Competitors_${target.domain.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(filename);
    showToast(`PDF Report downloaded: ${filename}`, 'success');

  } catch (err) {
    console.error('PDF Export Error:', err);
    showToast('Failed to generate PDF: ' + err.message, 'error');
  }
}

// Handle Target Search Submission
async function handleTargetSearch(e) {
  if (e) e.preventDefault();
  const urlInput = document.getElementById('target-url-input');
  const url = urlInput.value.trim();

  if (!url) {
    showToast('Please enter a website URL', 'error');
    return;
  }

  const submitBtn = document.getElementById('analyze-submit-btn');
  const btnText = document.getElementById('analyze-btn-text');
  
  submitBtn.disabled = true;
  btnText.innerHTML = `<span class="inline-block animate-spin mr-1">⟳</span> Analyzing...`;

  try {
    const res = await fetch('/api/analyze-target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to analyze target');

    state.target = data.target;
    state.competitors = data.competitors;
    state.currentPage = data.pagination.page;
    state.totalAvailable = data.pagination.totalAvailable;
    state.hasMore = data.pagination.hasMore;

    state.selectedCompetitorIds.clear();
    state.competitors.forEach(c => state.selectedCompetitorIds.add(c.id));

    renderTargetSummary(data.target);
    renderCompetitorsTable();
    updateShowingCounter();
    updateSelectedCount();
    updateGlobalKpis();

    document.getElementById('welcome-placeholder').classList.add('hidden');
    document.getElementById('target-summary-section').classList.remove('hidden');
    document.getElementById('results-container').classList.remove('hidden');

    if (window.confetti) {
      window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }

    showToast(`Found ${data.competitors.length} authentic competitors in "${data.target.category}"!`, 'success');

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Discover Competitors';
    if (window.lucide) window.lucide.createIcons();
  }
}

// Render Target Summary Card (Similarweb & Semrush Intelligence Suite)
function renderTargetSummary(target) {
  document.getElementById('target-favicon').src = `https://www.google.com/s2/favicons?domain=${target.domain}&sz=64`;
  document.getElementById('target-title').textContent = target.domain;
  document.getElementById('target-external-link').href = target.url;
  document.getElementById('target-niche-tag').innerHTML = `Detected Niche: <strong class="text-cyan-300">${target.category} (${target.subNiche})</strong>`;
  document.getElementById('target-category-badge').textContent = target.category;
  document.getElementById('target-subniche-badge').textContent = target.subNiche;
  
  const tierBadge = document.getElementById('target-tier-badge');
  if (tierBadge) tierBadge.textContent = `Tier: ${target.tier || 'Authority'}`;
  
  const tierDisplay = document.getElementById('target-tier-display');
  if (tierDisplay) tierDisplay.textContent = target.tier || 'Established';

  // 1. Visits & Device Split
  const visitsEl = document.getElementById('target-metric-visits');
  if (visitsEl) visitsEl.textContent = target.visitsFormatted || target.trafficFormatted || '--';
  
  const visitsTrendEl = document.getElementById('target-visits-trend');
  if (visitsTrendEl) {
    visitsTrendEl.textContent = `↑ ${target.visitsTrend || '11.79%'}`;
    visitsTrendEl.className = 'text-[11px] font-bold text-emerald-400 flex items-center';
  }

  const desktopSplitEl = document.getElementById('target-desktop-split');
  if (desktopSplitEl) desktopSplitEl.textContent = `${target.deviceSplit?.desktopPercent || 53.97}%`;
  
  const mobileSplitEl = document.getElementById('target-mobile-split');
  if (mobileSplitEl) mobileSplitEl.textContent = `${target.deviceSplit?.mobilePercent || 46.03}%`;

  // 2. Unique Visitors
  const uniquesEl = document.getElementById('target-metric-uniques');
  if (uniquesEl) uniquesEl.textContent = target.uniqueVisitorsFormatted || '--';

  const uniquesTrendEl = document.getElementById('target-uniques-trend');
  if (uniquesTrendEl) uniquesTrendEl.textContent = `↑ ${target.uniqueVisitorsTrend || '10.19%'}`;

  // 3. Purchase Conversion
  const convEl = document.getElementById('target-metric-conversion');
  if (convEl) convEl.textContent = target.purchaseConversion || '0.67%';

  const convTrendEl = document.getElementById('target-conversion-trend');
  if (convTrendEl) convTrendEl.textContent = `↓ ${target.purchaseConversionTrend || '6.58%'}`;

  // 4. Pages / Visit
  const pagesEl = document.getElementById('target-metric-pages');
  if (pagesEl) pagesEl.textContent = target.pagesPerVisit || '2.8';

  const pagesTrendEl = document.getElementById('target-pages-trend');
  if (pagesTrendEl) pagesTrendEl.textContent = `↓ ${target.pagesPerVisitTrend || '1.72%'}`;

  // 5. Avg. Visit Duration
  const durEl = document.getElementById('target-metric-duration');
  if (durEl) durEl.textContent = target.avgVisitDuration || '08:18';

  const durTrendEl = document.getElementById('target-duration-trend');
  if (durTrendEl) durTrendEl.textContent = `↑ ${target.avgVisitDurationTrend || '0.4%'}`;

  // 6. Bounce Rate
  const bounceEl = document.getElementById('target-metric-bounce');
  if (bounceEl) bounceEl.textContent = target.bounceRate || '61.53%';

  const bounceTrendEl = document.getElementById('target-bounce-trend');
  if (bounceTrendEl) bounceTrendEl.textContent = `↑ ${target.bounceRateTrend || '1.4%'}`;

  // Organic Keywords & Rankings Audit
  const kwTotalEl = document.getElementById('target-total-keywords');
  if (kwTotalEl) kwTotalEl.textContent = (target.totalKeywords || 0).toLocaleString();

  const highRankBadge = document.getElementById('target-high-rank-badge');
  if (highRankBadge) highRankBadge.textContent = `${target.highRankingPercent}%`;

  const lowRankBadge = document.getElementById('target-low-rank-badge');
  if (lowRankBadge) lowRankBadge.textContent = `${target.lowRankingPercent}%`;

  const highRankCount = document.getElementById('target-high-rank-count');
  if (highRankCount) highRankCount.textContent = `${(target.highRankingCount || 0).toLocaleString()} Keywords on Page 1`;

  const lowRankCount = document.getElementById('target-low-rank-count');
  if (lowRankCount) lowRankCount.textContent = `${(target.lowRankingCount || 0).toLocaleString()} Keywords on Pages 2-10`;

  const barHigh = document.getElementById('target-bar-high');
  if (barHigh) barHigh.style.width = `${target.highRankingPercent}%`;

  const barLow = document.getElementById('target-bar-low');
  if (barLow) barLow.style.width = `${target.lowRankingPercent}%`;

  // Positions 1-3, 4-10, 11-50, 51-100
  const top3 = target.rankingTiers?.top3 || { count: 0, percent: 0 };
  const page1 = target.rankingTiers?.page1 || { count: 0, percent: 0 };
  const page2 = target.rankingTiers?.page2_5 || { count: 0, percent: 0 };
  const page6 = target.rankingTiers?.page6_10 || { count: 0, percent: 0 };

  const posTop3El = document.getElementById('target-kw-pos-top3');
  if (posTop3El) posTop3El.textContent = (top3.count || 0).toLocaleString();
  const pctTop3El = document.getElementById('target-kw-pct-top3');
  if (pctTop3El) pctTop3El.textContent = `${top3.percent || 0}% of total`;

  const posPage1El = document.getElementById('target-kw-pos-page1');
  if (posPage1El) posPage1El.textContent = (page1.count || 0).toLocaleString();
  const pctPage1El = document.getElementById('target-kw-pct-page1');
  if (pctPage1El) pctPage1El.textContent = `${page1.percent || 0}% of total`;

  const posPage2El = document.getElementById('target-kw-pos-page2');
  if (posPage2El) posPage2El.textContent = (page2.count || 0).toLocaleString();
  const pctPage2El = document.getElementById('target-kw-pct-page2');
  if (pctPage2El) pctPage2El.textContent = `${page2.percent || 0}% of total`;

  const posPage6El = document.getElementById('target-kw-pos-page6');
  if (posPage6El) posPage6El.textContent = (page6.count || 0).toLocaleString();
  const pctPage6El = document.getElementById('target-kw-pct-page6');
  if (pctPage6El) pctPage6El.textContent = `${page6.percent || 0}% of total`;

  const daScoreEl = document.getElementById('target-da-score');
  if (daScoreEl) daScoreEl.textContent = `DA ${target.daScore || target.domainAuthority || 45}`;

  const trafficValEl = document.getElementById('target-traffic-value');
  if (trafficValEl) trafficValEl.textContent = target.trafficValueFormatted || target.trafficValue || '$50K';

  // SEOquake & Semrush Verified Parameters
  const sqAuditDomain = document.getElementById('sq-audit-domain');
  if (sqAuditDomain) sqAuditDomain.textContent = target.domain;

  const sqGoogleIndex = document.getElementById('sq-google-index');
  if (sqGoogleIndex) sqGoogleIndex.textContent = target.seoquake?.googleIndex || target.googleIndex || '--';

  const sqTraffic = document.getElementById('sq-semrush-traffic');
  if (sqTraffic) sqTraffic.textContent = target.seoquake?.semrushTraffic || target.visitsFormatted || '--';

  const sqKeywords = document.getElementById('sq-se-keywords');
  if (sqKeywords) sqKeywords.textContent = target.seoquake?.semrushKeywords || target.totalKeywordsFormatted || '--';

  const sqPrice = document.getElementById('sq-traffic-price');
  if (sqPrice) sqPrice.textContent = target.seoquake?.semrushTrafficPrice || target.trafficValue || '--';

  const sqBacklinks = document.getElementById('sq-backlinks');
  if (sqBacklinks) sqBacklinks.textContent = target.seoquake?.backlinks || '--';

  const sqRank = document.getElementById('sq-rank');
  if (sqRank) sqRank.textContent = target.seoquake?.semrushRank ? `#${target.seoquake.semrushRank}` : '--';

  if (window.lucide) window.lucide.createIcons();
}

// Render Competitors into Table & Mobile Cards
function renderCompetitorsTable(filterQuery = '') {
  const tbody = document.getElementById('competitors-table-body');
  const cardsContainer = document.getElementById('competitors-cards-container');
  tbody.innerHTML = '';
  cardsContainer.innerHTML = '';

  const displayList = state.competitors.filter(c => {
    if (!filterQuery) return true;
    return c.domain.toLowerCase().includes(filterQuery) ||
           c.name.toLowerCase().includes(filterQuery) ||
           (c.contactEmail && c.contactEmail.toLowerCase().includes(filterQuery));
  });

  if (displayList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-6 text-slate-500">No matching websites found.</td></tr>`;
    cardsContainer.innerHTML = `<div class="col-span-full text-center py-8 text-slate-500 text-xs">No matching websites found.</div>`;
    return;
  }

  // 1. Render Table Rows
  displayList.forEach((comp, idx) => {
    const isSelected = state.selectedCompetitorIds.has(comp.id);
    const tr = document.createElement('tr');
    tr.className = `hover:bg-slate-800/40 transition ${isSelected ? 'bg-cyan-950/10' : ''}`;

    let statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">Ready</span>`;
    if (comp.outreachStatus === 'sent') {
      statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 justify-center"><i data-lucide="check" class="w-3 h-3"></i> Sent</span>`;
    } else if (comp.outreachStatus === 'replied') {
      statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 justify-center"><i data-lucide="message-circle" class="w-3 h-3"></i> Replied</span>`;
    }

    // Construct Email / Social Links Cell per user instruction
    let emailCellHtml = '';
    if (comp.contactEmail) {
      emailCellHtml = `
        <div class="flex items-center gap-1.5">
          <div class="truncate max-w-[130px]">
            <div class="font-mono text-[11px] text-white truncate font-semibold">${comp.contactEmail}</div>
            <span class="inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              ✓ Verified
            </span>
          </div>
          <div class="flex items-center gap-0.5 ml-auto flex-shrink-0">
            <button class="scrape-live-email-btn p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition" data-domain="${comp.domain}" title="Re-scan contact page for email">
              <i data-lucide="scan-search" class="w-3.5 h-3.5"></i>
            </button>
            <button class="copy-email-btn p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition" data-email="${comp.contactEmail}" title="Copy email">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    } else {
      // USER REQUIREMENT: Write in English "No email found" and attach Facebook & LinkedIn links!
      const fbUrl = comp.socialLinks?.facebook || `https://www.facebook.com/${comp.domain.split('.')[0]}`;
      const liUrl = comp.socialLinks?.linkedin || `https://www.linkedin.com/company/${comp.domain.split('.')[0]}`;
      const contactUrl = comp.socialLinks?.contactPage || comp.url;

      emailCellHtml = `
        <div class="space-y-1">
          <div class="flex items-center justify-between gap-1">
            <span class="inline-block text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              No email found
            </span>
            <button class="scrape-live-email-btn p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition" data-domain="${comp.domain}" title="Scan website & contact page for email">
              <i data-lucide="scan-search" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div class="flex items-center gap-1 text-[10px]">
            <a href="${fbUrl}" target="_blank" class="px-1.5 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 font-medium flex items-center gap-1 transition" title="Open Facebook Page">
              <i data-lucide="facebook" class="w-2.5 h-2.5 text-blue-400"></i> FB
            </a>
            <a href="${liUrl}" target="_blank" class="px-1.5 py-0.5 rounded bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 font-medium flex items-center gap-1 transition" title="Open LinkedIn Profile">
              <i data-lucide="linkedin" class="w-2.5 h-2.5 text-sky-400"></i> In
            </a>
            <a href="${contactUrl}" target="_blank" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium flex items-center gap-0.5 transition" title="Open Contact Page">
              <i data-lucide="external-link" class="w-2.5 h-2.5 text-slate-400"></i> Contact
            </a>
          </div>
        </div>
      `;
    }

    tr.innerHTML = `
      <td class="py-2.5 px-3 text-center">
        <input type="checkbox" class="lead-checkbox rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800 cursor-pointer" data-id="${comp.id}" ${isSelected ? 'checked' : ''}>
      </td>
      <td class="py-2.5 px-2 text-slate-500 font-mono text-[11px]">${comp.rankNumber || (idx + 1)}</td>
      <td class="py-2.5 px-3">
        <div class="flex items-center gap-2">
          <img src="${comp.logo}" alt="" class="w-5 h-5 rounded bg-slate-800 p-0.5 flex-shrink-0" onerror="this.src='https://img.icons8.com/fluency/48/globe.png'">
          <div class="truncate max-w-[130px]">
            <div class="font-semibold text-white truncate text-xs">${comp.name}</div>
            <a href="${comp.url}" target="_blank" class="text-[10px] text-slate-400 font-mono truncate hover:text-cyan-300 block">${comp.domain}</a>
          </div>
        </div>
      </td>
      <td class="py-2.5 px-3">
        <div class="font-bold text-white text-xs">${comp.monthlyTrafficFormatted}</div>
        <span class="text-[9px] font-semibold ${comp.trafficTrendPositive ? 'text-emerald-400' : 'text-rose-400'}">${comp.trafficTrend}</span>
      </td>
      <td class="py-2.5 px-3">
        <div class="font-semibold text-slate-200 text-xs">${comp.totalKeywordsFormatted}</div>
      </td>
      <td class="py-2.5 px-3">
        <div class="space-y-1">
          <div class="flex justify-between items-center text-[10px]">
            <span class="text-emerald-400 font-bold">${comp.highRankingPercent}%</span>
            <span class="text-amber-400 font-semibold">${comp.lowRankingPercent}%</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1 flex overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-1" style="width: ${comp.highRankingPercent}%"></div>
            <div class="bg-amber-500/80 h-1" style="width: ${comp.lowRankingPercent}%"></div>
          </div>
        </div>
      </td>
      <td class="py-2.5 px-3">
        ${emailCellHtml}
      </td>
      <td class="py-2.5 px-2 text-center">
        <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
          ${comp.domainAuthority}
        </span>
      </td>
      <td class="py-2.5 px-3 text-center">
        ${statusPill}
      </td>
      <td class="py-2.5 px-3 text-right">
        <button class="single-pitch-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-[10px] font-semibold border border-slate-700 transition" data-id="${comp.id}">
          Pitch
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    // 2. Render Mobile Cards View
    const card = document.createElement('div');
    card.className = `glass-card rounded-xl p-3 border border-slate-800 space-y-2.5 transition ${isSelected ? 'border-cyan-500/40 bg-cyan-950/20' : ''}`;
    
    let cardEmailHtml = '';
    if (comp.contactEmail) {
      cardEmailHtml = `
        <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 gap-2">
          <div class="flex items-center gap-1.5 truncate text-[11px] font-mono text-slate-300">
            <span class="truncate font-semibold text-white">${comp.contactEmail}</span>
            <span class="text-[9px] px-1 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓ Verified</span>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button class="scrape-live-email-btn p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition" data-domain="${comp.domain}" title="Scan contact page">
              <i data-lucide="scan-search" class="w-3.5 h-3.5"></i>
            </button>
            <button class="copy-email-btn text-slate-400 hover:text-cyan-400 p-1" data-email="${comp.contactEmail}" title="Copy email"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>
            <button class="single-pitch-btn px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-[10px] font-bold border border-slate-700 whitespace-nowrap" data-id="${comp.id}">
              Pitch
            </button>
          </div>
        </div>
      `;
    } else {
      const fbUrl = comp.socialLinks?.facebook || `https://www.facebook.com/${comp.domain.split('.')[0]}`;
      const liUrl = comp.socialLinks?.linkedin || `https://www.linkedin.com/company/${comp.domain.split('.')[0]}`;
      const contactUrl = comp.socialLinks?.contactPage || comp.url;

      cardEmailHtml = `
        <div class="pt-1.5 border-t border-slate-800/80 space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              No email found
            </span>
            <div class="flex items-center gap-1">
              <button class="scrape-live-email-btn p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition" data-domain="${comp.domain}" title="Scan website for contact email">
                <i data-lucide="scan-search" class="w-3.5 h-3.5"></i>
              </button>
              <span class="text-[10px] text-slate-500">Reach out via:</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-1 text-[10px]">
            <div class="flex items-center gap-1.5">
              <a href="${fbUrl}" target="_blank" class="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 font-semibold flex items-center gap-1 transition">
                <i data-lucide="facebook" class="w-3 h-3 text-blue-400"></i> FB
              </a>
              <a href="${liUrl}" target="_blank" class="px-2 py-1 rounded bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 font-semibold flex items-center gap-1 transition">
                <i data-lucide="linkedin" class="w-3 h-3 text-sky-400"></i> In
              </a>
              <a href="${contactUrl}" target="_blank" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1 transition">
                <i data-lucide="external-link" class="w-3 h-3 text-slate-400"></i> Contact
              </a>
            </div>
            <button class="single-pitch-btn px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-[10px] font-bold border border-slate-700 whitespace-nowrap" data-id="${comp.id}">
              Pitch
            </button>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 truncate">
          <input type="checkbox" class="lead-checkbox rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800 cursor-pointer" data-id="${comp.id}" ${isSelected ? 'checked' : ''}>
          <img src="${comp.logo}" class="w-6 h-6 rounded bg-slate-800 p-0.5 flex-shrink-0" onerror="this.src='https://img.icons8.com/fluency/48/globe.png'">
          <div class="truncate">
            <div class="font-bold text-white text-xs truncate">${comp.name}</div>
            <a href="${comp.url}" target="_blank" class="text-[10px] text-slate-400 font-mono hover:text-cyan-300 block truncate">${comp.domain}</a>
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          ${statusPill}
          <span class="text-[9px] font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-300">DA ${comp.domainAuthority}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
        <div>
          <span class="text-[9px] text-slate-500 block">Traffic / Mo</span>
          <span class="font-bold text-white text-xs">${comp.monthlyTrafficFormatted}</span>
          <span class="text-[9px] font-semibold ml-1 ${comp.trafficTrendPositive ? 'text-emerald-400' : 'text-rose-400'}">${comp.trafficTrend}</span>
        </div>
        <div>
          <span class="text-[9px] text-slate-500 block">Google Keywords</span>
          <span class="font-bold text-slate-200 text-xs">${comp.totalKeywordsFormatted}</span>
        </div>
      </div>

      <div class="space-y-1">
        <div class="flex justify-between text-[10px]">
          <span class="text-emerald-400 font-bold">Achi: ${comp.highRankingPercent}%</span>
          <span class="text-amber-400 font-semibold">Low: ${comp.lowRankingPercent}%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
          <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5" style="width: ${comp.highRankingPercent}%"></div>
          <div class="bg-amber-500/80 h-1.5" style="width: ${comp.lowRankingPercent}%"></div>
        </div>
      </div>

      ${cardEmailHtml}
    `;
    cardsContainer.appendChild(card);
  });

  attachTableRowListeners();
  if (window.lucide) window.lucide.createIcons();
}

function attachTableRowListeners() {
  document.querySelectorAll('.lead-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      if (e.target.checked) {
        state.selectedCompetitorIds.add(id);
      } else {
        state.selectedCompetitorIds.delete(id);
      }
      updateSelectedCount();
    });
  });

  document.querySelectorAll('.copy-email-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const email = e.currentTarget.getAttribute('data-email');
      navigator.clipboard.writeText(email);
      showToast(`Copied ${email}!`, 'info');
    });
  });

  document.querySelectorAll('.scrape-live-email-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const domain = e.currentTarget.getAttribute('data-domain');
      const origHtml = e.currentTarget.innerHTML;
      e.currentTarget.innerHTML = `<span class="animate-spin inline-block text-[10px]">⟳</span>`;
      e.currentTarget.disabled = true;
      try {
        const res = await fetch('/api/extract-live-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })
        });
        const data = await res.json();
        const comp = state.competitors.find(c => c.domain.toLowerCase() === domain.toLowerCase());
        if (comp) {
          comp.contactEmail = data.email;
          comp.emailStatus = data.email ? 'Verified' : 'No email found';
          comp.isVerifiedEmail = !!data.email;
          comp.hasEmail = !!data.email;
          if (data.socialLinks) comp.socialLinks = data.socialLinks;
        }
        renderCompetitorsTable();
        if (data.success && data.email) {
          showToast(`Found email for ${domain}: ${data.email}`, 'success');
        } else {
          showToast(`No email found on ${domain}. Social links attached.`, 'info');
        }
      } catch (err) {
        showToast(`Extraction error: ${err.message}`, 'error');
      } finally {
        e.currentTarget.innerHTML = origHtml;
        e.currentTarget.disabled = false;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  });

  document.querySelectorAll('.single-pitch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      state.selectedCompetitorIds.clear();
      state.selectedCompetitorIds.add(id);
      renderCompetitorsTable();
      updateSelectedCount();
      openOutreachModal();
    });
  });
}

function handleMasterCheckbox(e) {
  const isChecked = e.target.checked;
  if (isChecked) {
    state.competitors.forEach(c => state.selectedCompetitorIds.add(c.id));
  } else {
    state.selectedCompetitorIds.clear();
  }
  renderCompetitorsTable();
  updateSelectedCount();
}

function updateSelectedCount() {
  const count = state.selectedCompetitorIds.size;
  document.getElementById('selected-lead-count').textContent = count;
  document.getElementById('modal-recipient-count').textContent = count;
  
  const masterCb = document.getElementById('master-checkbox');
  masterCb.checked = count === state.competitors.length && count > 0;
}

function updateShowingCounter() {
  const badge = document.getElementById('showing-counter-badge');
  badge.textContent = `${state.competitors.length} Authentic Loaded`;
  
  const loadMoreBtn = document.getElementById('load-more-btn');
  const loadMoreText = document.getElementById('load-more-text');
  
  if (!state.hasMore) {
    loadMoreBtn.classList.add('opacity-50', 'cursor-not-allowed');
    loadMoreBtn.disabled = true;
    loadMoreText.textContent = `All Authentic Competitors Loaded (${state.competitors.length})`;
  } else {
    loadMoreBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    loadMoreBtn.disabled = false;
    const remainingCount = state.totalAvailable - state.competitors.length;
    const nextBatch = Math.min(50, remainingCount);
    const nextStart = state.competitors.length + 1;
    const nextEnd = state.competitors.length + nextBatch;
    loadMoreText.textContent = `Load Next ${nextBatch} Websites (#${nextStart} - #${nextEnd})`;
  }
}

async function handleLoadMore() {
  if (!state.hasMore) {
    showToast('All available competitors loaded!', 'info');
    return;
  }

  const loadMoreBtn = document.getElementById('load-more-btn');
  const loadMoreText = document.getElementById('load-more-text');
  
  loadMoreBtn.disabled = true;
  loadMoreText.innerHTML = `<span class="inline-block animate-spin mr-1">⟳</span> Loading...`;

  try {
    const nextPage = state.currentPage + 1;
    const res = await fetch('/api/discover-competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: nextPage, limit: 50 })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch next 50');

    state.competitors.push(...data.newCompetitors);
    state.currentPage = data.pagination.page;
    state.hasMore = data.pagination.hasMore;
    state.totalAvailable = data.pagination.totalAvailable;

    data.newCompetitors.forEach(c => state.selectedCompetitorIds.add(c.id));

    renderCompetitorsTable();
    updateShowingCounter();
    updateSelectedCount();
    updateGlobalKpis();

    showToast(`Loaded 50 more websites! Total: ${state.competitors.length}`, 'success');

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    loadMoreBtn.disabled = false;
    updateShowingCounter();
    if (window.lucide) window.lucide.createIcons();
  }
}

function sortCompetitors(sortKey) {
  switch (sortKey) {
    case 'traffic-desc':
      state.competitors.sort((a, b) => b.monthlyTraffic - a.monthlyTraffic);
      break;
    case 'high-rank-desc':
      state.competitors.sort((a, b) => b.highRankingPercent - a.highRankingPercent);
      break;
    case 'keywords-desc':
      state.competitors.sort((a, b) => b.totalKeywords - a.totalKeywords);
      break;
    case 'da-desc':
      state.competitors.sort((a, b) => b.domainAuthority - a.domainAuthority);
      break;
  }
  renderCompetitorsTable();
}

function openOutreachModal() {
  if (state.selectedCompetitorIds.size === 0) {
    showToast('Please select at least one website for outreach', 'warning');
    return;
  }

  const remaining = state.currentUser?.remainingEmails ?? 200;
  const modalQuotaRemaining = document.getElementById('modal-quota-remaining');
  if (modalQuotaRemaining) modalQuotaRemaining.textContent = remaining;

  // Pre-fill Sender info (Send from user's email)
  const savedName = localStorage.getItem('nexus_sender_name') || state.settings.smtp?.fromName || state.currentUser?.name || 'Fashion Buyer';
  const savedEmail = localStorage.getItem('nexus_sender_email') || state.settings.smtp?.fromEmail || state.settings.smtp?.user || '';
  const savedPhone = localStorage.getItem('nexus_sender_phone') || '';

  const nameInput = document.getElementById('outreach-sender-name');
  const emailInput = document.getElementById('outreach-sender-email');
  const phoneInput = document.getElementById('outreach-sender-phone');

  if (nameInput && !nameInput.value) nameInput.value = savedName;
  if (emailInput && !emailInput.value) emailInput.value = savedEmail;
  if (phoneInput && !phoneInput.value) phoneInput.value = savedPhone;

  // Update SMTP status badge in outreach modal
  const smtpBadge = document.getElementById('outreach-smtp-badge');
  const smtpStatusText = document.getElementById('outreach-smtp-status-text');
  if (state.settings.smtp?.host && state.settings.smtp?.user) {
    if (smtpBadge) smtpBadge.className = 'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    if (smtpStatusText) smtpStatusText.textContent = `✓ Live Delivery: ${state.settings.smtp.fromEmail || state.settings.smtp.user}`;
  } else {
    if (smtpBadge) {
      smtpBadge.className = 'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 cursor-pointer';
      smtpBadge.onclick = () => { closeOutreachModal(); openSettingsModal(); };
    }
    if (smtpStatusText) smtpStatusText.textContent = '⚙ Connect Gmail / SMTP';
  }

  selectOutreachTemplate(state.activeTemplate);
  updateEmailPreview();
  document.getElementById('outreach-modal').classList.remove('hidden');
}

function closeOutreachModal() {
  document.getElementById('outreach-modal').classList.add('hidden');
}

function selectOutreachTemplate(templateKey) {
  state.activeTemplate = templateKey;
  
  document.querySelectorAll('.template-choice-btn').forEach(btn => {
    const key = btn.getAttribute('data-template');
    if (key === templateKey) {
      btn.className = 'template-choice-btn p-2 rounded-xl text-left border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-medium transition';
    } else {
      btn.className = 'template-choice-btn p-2 rounded-xl text-left border border-slate-800 bg-slate-800/60 text-slate-300 text-xs font-medium hover:border-slate-700 transition';
    }
  });

  const tmpl = OUTREACH_TEMPLATES[templateKey] || OUTREACH_TEMPLATES.fashion_rates || OUTREACH_TEMPLATES.gap;
  document.getElementById('outreach-subject-input').value = tmpl.subject;
  document.getElementById('outreach-body-textarea').value = tmpl.body;
  updateEmailPreview();
}

function insertTagIntoBody(tag) {
  const textarea = document.getElementById('outreach-body-textarea');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  textarea.value = text.substring(0, start) + tag + text.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + tag.length;
  updateEmailPreview();
}

function updateEmailPreview() {
  const selectedComps = state.competitors.filter(c => state.selectedCompetitorIds.has(c.id));
  const sampleLead = selectedComps[0] || state.competitors[0] || {
    name: 'Khaadi Clothing',
    domain: 'khaadi.com',
    monthlyTrafficFormatted: '850K',
    totalKeywordsFormatted: '28,000',
    highRankingPercent: 72,
    lowRankingPercent: 28,
    domainAuthority: 68
  };

  const senderName = document.getElementById('outreach-sender-name')?.value.trim() || 'Fashion Buyer';
  const senderEmail = document.getElementById('outreach-sender-email')?.value.trim() || state.settings.smtp?.fromEmail || state.settings.smtp?.user || 'buyer@example.com';
  const senderPhone = document.getElementById('outreach-sender-phone')?.value.trim() || '';

  const subjectTemplate = document.getElementById('outreach-subject-input').value;
  const bodyTemplate = document.getElementById('outreach-body-textarea').value;

  const replaceTags = (str) => {
    return str
      .replace(/\{\{\s*company\s*\}\}/gi, sampleLead.name)
      .replace(/\{\{\s*company_name\s*\}\}/gi, sampleLead.name)
      .replace(/\{\{\s*domain\s*\}\}/gi, sampleLead.domain)
      .replace(/\{\{\s*traffic\s*\}\}/gi, sampleLead.monthlyTrafficFormatted)
      .replace(/\{\{\s*total_keywords\s*\}\}/gi, sampleLead.totalKeywordsFormatted)
      .replace(/\{\{\s*high_rank_percent\s*\}\}/gi, `${sampleLead.highRankingPercent}%`)
      .replace(/\{\{\s*low_rank_percent\s*\}\}/gi, `${sampleLead.lowRankingPercent}%`)
      .replace(/\{\{\s*da_score\s*\}\}/gi, sampleLead.domainAuthority)
      .replace(/\{\{\s*sender_name\s*\}\}/gi, senderName)
      .replace(/\{\{\s*sender_email\s*\}\}/gi, senderEmail)
      .replace(/\{\{\s*sender_phone\s*\}\}/gi, senderPhone ? `\nPhone / WhatsApp: ${senderPhone}` : '');
  };

  const previewBox = document.getElementById('email-preview-box');
  previewBox.innerHTML = `<strong>Subject:</strong> ${replaceTags(subjectTemplate)}\n\n${replaceTags(bodyTemplate)}`;
}

async function handleSendOutreach() {
  const selectedLeads = state.competitors.filter(c => state.selectedCompetitorIds.has(c.id));
  if (selectedLeads.length === 0) {
    showToast('No leads selected', 'warning');
    return;
  }

  const validRecipients = selectedLeads.filter(c => c.contactEmail && c.contactEmail !== 'No email found');
  if (validRecipients.length === 0) {
    showToast('None of the selected websites have a contact email. Please reach out to them via Facebook or LinkedIn links!', 'warning');
    return;
  }

  if (state.currentUser && state.currentUser.dailyEmailLimit <= 1000) {
    if (validRecipients.length > state.currentUser.remainingEmails) {
      showToast(`Daily limit reached! You have ${state.currentUser.remainingEmails} emails left today out of 200. Please upgrade!`, 'error');
      openPricingModal();
      return;
    }
  }

  const subject = document.getElementById('outreach-subject-input').value.trim();
  const message = document.getElementById('outreach-body-textarea').value.trim();
  const senderName = document.getElementById('outreach-sender-name')?.value.trim() || 'Fashion Buyer';
  const senderEmail = document.getElementById('outreach-sender-email')?.value.trim() || state.settings.smtp?.user || '';
  const senderPhone = document.getElementById('outreach-sender-phone')?.value.trim() || '';

  // Persist sender info locally
  localStorage.setItem('nexus_sender_name', senderName);
  localStorage.setItem('nexus_sender_email', senderEmail);
  localStorage.setItem('nexus_sender_phone', senderPhone);

  if (!subject || !message) {
    showToast('Subject and message body cannot be empty', 'error');
    return;
  }

  const sendBtn = document.getElementById('confirm-send-outreach-btn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = `<span class="inline-block animate-spin mr-1">⟳</span> Sending...`;

  try {
    const res = await fetch('/api/send-outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: validRecipients,
        subject,
        message,
        senderName,
        senderEmail,
        userId: state.currentUser?.id || 'usr_free_demo'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.quotaExceeded) {
        openPricingModal();
      }
      throw new Error(data.error || 'Failed to dispatch emails');
    }

    validRecipients.forEach(lead => {
      lead.outreachStatus = 'sent';
    });

    if (data.quota && state.currentUser) {
      state.currentUser.emailsSentToday = data.quota.sentToday;
      state.currentUser.remainingEmails = data.quota.remaining;
      updateUserUI();
    }

    renderCompetitorsTable();
    updateGlobalKpis();
    closeOutreachModal();

    const noEmailCount = selectedLeads.length - validRecipients.length;
    if (noEmailCount > 0) {
      showToast(`Sent ${validRecipients.length} emails! (${noEmailCount} sites with no email can be contacted via Facebook/LinkedIn)`, 'info');
    } else {
      showToast(`Successfully dispatched emails to ${validRecipients.length} websites!`, 'success');
    }

    if (window.confetti) {
      window.confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }

    showToast(`Campaign Dispatched to ${selectedLeads.length} websites! Remaining: ${state.currentUser?.remainingEmails || 0}`, 'success');

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<i data-lucide="send" class="w-3.5 h-3.5"></i><span>Send Campaign</span>`;
    if (window.lucide) window.lucide.createIcons();
  }
}

// AI Inbox & Conversations Management
async function openInboxModal() {
  document.getElementById('inbox-modal').classList.remove('hidden');
  await loadConversations();
}

function closeInboxModal() {
  document.getElementById('inbox-modal').classList.add('hidden');
}

async function loadConversations() {
  try {
    const res = await fetch('/api/conversations');
    const data = await res.json();
    if (data.success) {
      renderConversations(data.conversations);
      updateAutonomousToggleUI(data.autonomousAutoReply);
      const count = data.conversations.length;
      document.getElementById('inbox-badge-count').textContent = count;
      const mobileBadge = document.getElementById('mobile-inbox-badge');
      if (mobileBadge) mobileBadge.textContent = count;
    }
  } catch (err) {
    console.error('Failed to load conversations:', err);
  }
}

function renderConversations(conversations) {
  const container = document.getElementById('conversations-container');
  const emptyNotice = document.getElementById('inbox-empty-notice');

  if (!conversations || conversations.length === 0) {
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }

  container.innerHTML = '';

  conversations.forEach(conv => {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-xl p-4 border border-slate-800 space-y-3';

    const intentAnalysis = conv.autoReply?.analysis || {};
    let sentimentColor = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    if (intentAnalysis.intent?.includes('Meeting')) sentimentColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (intentAnalysis.intent?.includes('Pricing')) sentimentColor = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    if (intentAnalysis.intent?.includes('Objection')) sentimentColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (intentAnalysis.intent?.includes('Opt-out')) sentimentColor = 'bg-rose-500/15 text-rose-300 border-rose-500/30';

    const isAutoSent = conv.status === 'auto_sent';

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800 pb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
            ${conv.companyName.slice(0, 2)}
          </div>
          <div class="truncate">
            <div class="font-bold text-white text-xs truncate">
              <span>${conv.companyName}</span>
              <span class="text-slate-500 font-mono text-[10px] ml-1">&lt;${conv.senderEmail}&gt;</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono truncate block">${conv.originalSubject || 'Re: Partnership'}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 self-start sm:self-auto">
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${sentimentColor}">
            ${intentAnalysis.intent || 'Interest'}
          </span>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-semibold ${isAutoSent ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}">
            ${isAutoSent ? '✓ Auto-Replied' : 'Pending'}
          </span>
        </div>
      </div>

      <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
          <i data-lucide="mail-down" class="w-3 h-3 text-cyan-400"></i> Client Response:
        </span>
        <p class="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">${conv.incomingMessage}</p>
      </div>

      <div class="p-3 rounded-lg bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1">
            <i data-lucide="bot" class="w-3 h-3 text-indigo-400"></i> AI Bot Auto-Reply:
          </span>
          <span class="text-[9px] text-slate-500 font-mono">${conv.autoReply?.source || 'AI Engine'}</span>
        </div>
        <div class="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/80">
${conv.autoReply?.body || ''}
        </div>
        
        ${!isAutoSent ? `
          <div class="flex justify-end pt-1">
            <button class="approve-reply-btn px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs" data-id="${conv.id}">
              Approve & Send
            </button>
          </div>
        ` : `
          <div class="text-right text-[10px] text-emerald-400 font-mono">
            Dispatched via Autonomous Engine at ${new Date(conv.timestamp).toLocaleTimeString()}
          </div>
        `}
      </div>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll('.approve-reply-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      await approveReply(id);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

async function approveReply(conversationId) {
  try {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'auto_sent' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('AI response sent to client!', 'success');
      await loadConversations();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleSimulateReply() {
  const scenarioSelect = document.getElementById('simulate-scenario-select');
  const scenario = scenarioSelect.value;
  const leadDomain = state.competitors[0]?.domain || 'klaviyo.com';

  const simBtn = document.getElementById('simulate-reply-btn');
  simBtn.disabled = true;
  simBtn.textContent = 'Simulating...';

  try {
    const res = await fetch('/api/simulate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadDomain, scenario })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to simulate');

    showToast(`Reply from ${leadDomain} received! Bot auto-responded.`, 'success');
    await loadConversations();
    renderCompetitorsTable();
    updateGlobalKpis();

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    simBtn.disabled = false;
    simBtn.textContent = 'Simulate';
    if (window.lucide) window.lucide.createIcons();
  }
}

async function handleToggleAutonomousMode() {
  state.autonomousAutoReply = !state.autonomousAutoReply;
  updateAutonomousToggleUI(state.autonomousAutoReply);

  try {
    const res = await fetch('/api/toggle-autonomous-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: state.autonomousAutoReply })
    });
    const data = await res.json();
    showToast(data.message, 'info');
    updateGlobalKpis();
  } catch (err) {
    console.error('Failed to toggle:', err);
  }
}

function updateAutonomousToggleUI(isActive) {
  const btn = document.getElementById('toggle-autonomous-btn');
  const knob = document.getElementById('autonomous-knob');
  const kpiText = document.getElementById('kpi-bot-status');

  if (isActive) {
    btn.className = 'w-9 h-4.5 bg-emerald-500 rounded-full relative transition flex items-center px-0.5';
    knob.className = 'w-3.5 h-3.5 rounded-full bg-white shadow transform translate-x-4 transition';
    if (kpiText) kpiText.textContent = 'Active';
  } else {
    btn.className = 'w-9 h-4.5 bg-slate-700 rounded-full relative transition flex items-center px-0.5';
    knob.className = 'w-3.5 h-3.5 rounded-full bg-white shadow transform translate-x-0 transition';
    if (kpiText) kpiText.textContent = 'Review';
  }
}

// Load saved settings from server
async function loadInitialSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      state.settings = data.settings;
      if (data.settings.smtp) {
        const s = data.settings.smtp;
        const hostEl = document.getElementById('smtp-host');
        const portEl = document.getElementById('smtp-port');
        const userEl = document.getElementById('smtp-user');
        const nameEl = document.getElementById('smtp-from-name');
        const emailEl = document.getElementById('smtp-from-email');

        if (hostEl && s.host) hostEl.value = s.host;
        if (portEl && s.port) portEl.value = s.port;
        if (userEl && s.user) userEl.value = s.user;
        if (nameEl && s.fromName) nameEl.value = s.fromName;
        if (emailEl && s.fromEmail) emailEl.value = s.fromEmail;

        const outreachEmail = document.getElementById('outreach-sender-email');
        const outreachName = document.getElementById('outreach-sender-name');
        if (outreachEmail && !outreachEmail.value && (s.fromEmail || s.user)) {
          outreachEmail.value = s.fromEmail || s.user;
        }
        if (outreachName && !outreachName.value && s.fromName) {
          outreachName.value = s.fromName;
        }
      }
      if (data.settings.ai) {
        const geminiEl = document.getElementById('gemini-api-key');
        const bookingEl = document.getElementById('ai-booking-link');
        if (geminiEl && data.settings.ai.apiKey) geminiEl.value = data.settings.ai.apiKey;
        if (bookingEl && data.settings.ai.bookingLink) bookingEl.value = data.settings.ai.bookingLink;
      }
    }
  } catch (e) {
    console.warn('Could not load settings:', e);
  }
}

// Settings Modal Management
function openSettingsModal() {
  if (state.settings?.smtp) {
    const s = state.settings.smtp;
    const hostEl = document.getElementById('smtp-host');
    const portEl = document.getElementById('smtp-port');
    const userEl = document.getElementById('smtp-user');
    const nameEl = document.getElementById('smtp-from-name');
    const emailEl = document.getElementById('smtp-from-email');

    if (hostEl && s.host) hostEl.value = s.host;
    if (portEl && s.port) portEl.value = s.port;
    if (userEl && s.user) userEl.value = s.user;
    if (nameEl && s.fromName) nameEl.value = s.fromName;
    if (emailEl && s.fromEmail) emailEl.value = s.fromEmail;
  }
  if (state.settings?.ai) {
    const geminiEl = document.getElementById('gemini-api-key');
    const bookingEl = document.getElementById('ai-booking-link');
    if (geminiEl && state.settings.ai.apiKey) geminiEl.value = state.settings.ai.apiKey;
    if (bookingEl && state.settings.ai.bookingLink) bookingEl.value = state.settings.ai.bookingLink;
  }
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

async function handleSaveSettings() {
  const fromName = document.getElementById('smtp-from-name')?.value.trim() || '';
  const fromEmail = document.getElementById('smtp-from-email')?.value.trim() || '';
  const host = document.getElementById('smtp-host')?.value.trim() || '';
  const port = parseInt(document.getElementById('smtp-port')?.value, 10) || 587;
  const user = document.getElementById('smtp-user')?.value.trim() || '';
  const pass = document.getElementById('smtp-pass')?.value.trim() || '';

  const smtp = { host, port, user, pass, fromName, fromEmail };
  const ai = {
    apiKey: document.getElementById('gemini-api-key')?.value.trim() || '',
    bookingLink: document.getElementById('ai-booking-link')?.value.trim() || 'https://calendly.com/growth-team/15min-strategy'
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtp, ai })
    });
    const data = await res.json();
    if (data.success) {
      state.settings.smtp = { ...state.settings.smtp, ...smtp };
      state.settings.ai = { ...state.settings.ai, ...ai };

      // Update outreach modal fields as well
      const outreachName = document.getElementById('outreach-sender-name');
      const outreachEmail = document.getElementById('outreach-sender-email');
      if (outreachName && fromName) outreachName.value = fromName;
      if (outreachEmail && (fromEmail || user)) outreachEmail.value = fromEmail || user;

      showToast('Settings & SMTP saved! Outgoing emails will send from your email.', 'success');
      closeSettingsModal();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleTestSmtp() {
  const smtp = {
    host: document.getElementById('smtp-host').value.trim(),
    port: parseInt(document.getElementById('smtp-port').value, 10) || 587,
    user: document.getElementById('smtp-user').value.trim(),
    pass: document.getElementById('smtp-pass').value.trim()
  };

  if (!smtp.host || !smtp.user) {
    showToast('Please enter SMTP host and user first', 'warning');
    return;
  }

  const btn = document.getElementById('test-smtp-btn');
  btn.disabled = true;
  btn.textContent = 'Testing...';

  try {
    const res = await fetch('/api/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtp)
    });
    const data = await res.json();
    if (data.success) {
      showToast('SMTP connected & verified!', 'success');
    } else {
      showToast('SMTP Error: ' + data.message, 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Test Connection';
  }
}

// Global Stats & KPIs
async function loadInitialStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    updateGlobalKpis(data);
  } catch (e) {
    // initial load ignore
  }
}

function updateGlobalKpis(statsData) {
  const discoveredEl = document.getElementById('kpi-discovered-count');
  const avgHighEl = document.getElementById('kpi-avg-high-rank');

  if (statsData) {
    discoveredEl.textContent = `${statsData.totalDiscovered} Loaded`;
    avgHighEl.textContent = `${statsData.averageHighRankPercent}%`;
  } else if (state.competitors.length > 0) {
    discoveredEl.textContent = `${state.competitors.length} Loaded`;
    const avg = Math.round(state.competitors.reduce((acc, c) => acc + c.highRankingPercent, 0) / state.competitors.length);
    avgHighEl.textContent = `${avg}%`;
  }
}

// Toast Notification Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  let bg = 'bg-slate-900 border-cyan-500/40 text-cyan-200';
  let icon = 'info';
  if (type === 'success') {
    bg = 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200';
    icon = 'check-circle';
  } else if (type === 'error') {
    bg = 'bg-rose-950/95 border-rose-500/40 text-rose-200';
    icon = 'alert-triangle';
  } else if (type === 'warning') {
    bg = 'bg-amber-950/95 border-amber-500/40 text-amber-200';
    icon = 'alert-circle';
  }

  toast.className = `flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium pointer-events-auto transition transform translate-y-2 opacity-0 duration-200 ${bg}`;
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0"></i><span class="truncate">${message}</span>`;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 250);
  }, 4500);
}
