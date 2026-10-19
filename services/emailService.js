const nodemailer = require('nodemailer');

// In-memory campaign storage
let campaignHistory = [];
let emailLogs = [];

// Helper to replace email template tags
function renderTemplate(templateString, variables) {
  if (!templateString) return '';
  let rendered = templateString;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    rendered = rendered.replace(regex, value || '');
  }
  return rendered;
}

// Create Nodemailer Transporter
function createTransporter(smtpConfig) {
  if (!smtpConfig || !smtpConfig.host || !smtpConfig.user) {
    return null; // Simulation / sandbox mode
  }
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port, 10) || 587,
    secure: smtpConfig.secure === true || smtpConfig.port === 465,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Test SMTP connection
async function verifySmtpConnection(smtpConfig) {
  const transporter = createTransporter(smtpConfig);
  if (!transporter) {
    return { success: false, message: 'Missing host or credentials' };
  }
  try {
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Send batch email outreach
async function sendBatchOutreach({ recipients, subjectTemplate, messageTemplate, senderName, senderEmail, smtpConfig, isSimulation = false }) {
  const campaignId = 'camp_' + Date.now();
  const transporter = !isSimulation ? createTransporter(smtpConfig) : null;
  const results = [];

  const timestamp = new Date().toISOString();

  for (let i = 0; i < recipients.length; i++) {
    const lead = recipients[i];
    const variables = {
      company_name: lead.name || lead.domain,
      company: lead.name || lead.domain,
      website_url: lead.url || `https://${lead.domain}`,
      domain: lead.domain,
      traffic: lead.monthlyTrafficFormatted || 'High volume',
      total_keywords: lead.totalKeywordsFormatted || '10,000+',
      high_rank_percent: `${lead.highRankingPercent || 65}%`,
      low_rank_percent: `${lead.lowRankingPercent || 35}%`,
      da_score: lead.domainAuthority || 70,
      sender_name: senderName || 'Product Inquiries Team',
      sender_email: senderEmail || (smtpConfig ? smtpConfig.user : 'user@example.com'),
      sender_phone: ''
    };

    const personalizedSubject = renderTemplate(subjectTemplate, variables);
    const personalizedBody = renderTemplate(messageTemplate, variables);

    let status = 'sent';
    let errorMessage = null;

    if (!lead.contactEmail || lead.contactEmail === 'No email found') {
      results.push({
        leadId: lead.id,
        domain: lead.domain,
        email: null,
        status: 'skipped',
        error: 'No email found for this website (reachable via social profile)'
      });
      continue;
    }

    if (transporter && !isSimulation) {
      try {
        const fromAddress = senderEmail || smtpConfig.user;
        await transporter.sendMail({
          from: `"${senderName || 'Inquiry Team'}" <${smtpConfig.user}>`,
          replyTo: fromAddress,
          to: lead.contactEmail,
          subject: personalizedSubject,
          text: personalizedBody,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 20px;">
            ${personalizedBody.replace(/\n/g, '<br/>')}
            <br/><br/>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8;">Sent to ${lead.contactEmail}. To opt out, reply with 'unsubscribe'.</p>
          </div>`
        });
      } catch (err) {
        status = 'failed';
        errorMessage = err.message;
      }
    } else {
      // Realistic simulation delay
      status = 'sent';
    }

    const logEntry = {
      campaignId,
      leadId: lead.id,
      domain: lead.domain,
      recipientEmail: lead.contactEmail,
      subject: personalizedSubject,
      body: personalizedBody,
      status: status,
      error: errorMessage,
      sentAt: timestamp,
      isSimulation: isSimulation || !transporter
    };

    emailLogs.unshift(logEntry);
    results.push(logEntry);
  }

  const campaignSummary = {
    id: campaignId,
    createdAt: timestamp,
    totalRecipients: recipients.length,
    sentCount: results.filter(r => r.status === 'sent').length,
    failedCount: results.filter(r => r.status === 'failed').length,
    subjectTemplate,
    senderName,
    isSimulation: isSimulation || !transporter
  };

  campaignHistory.unshift(campaignSummary);

  return {
    success: true,
    campaign: campaignSummary,
    results
  };
}

function getEmailLogs() {
  return emailLogs;
}

function getCampaignHistory() {
  return campaignHistory;
}

module.exports = {
  renderTemplate,
  verifySmtpConnection,
  sendBatchOutreach,
  getEmailLogs,
  getCampaignHistory
};
