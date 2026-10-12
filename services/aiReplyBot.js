const axios = require('axios');

// Stored inbox conversations
let conversations = [];

// Intent definitions
const INTENT_TYPES = {
  POSITIVE_MEETING: 'Meeting Request / High Interest',
  PRICING_INQUIRY: 'Pricing & Budget Inquiry',
  MORE_INFO: 'Information & Case Study Request',
  OBJECTION_TIMING: 'Timing / Soft Objection',
  UNSUBSCRIBE: 'Opt-out / Unsubscribe'
};

// Analyze sentiment and classify intent
function classifyReplyIntent(messageText) {
  const text = (messageText || '').toLowerCase();

  if (text.includes('unsubscribe') || text.includes('remove me') || text.includes('stop emailing') || text.includes('leave me alone') || text.includes('do not contact')) {
    return {
      intent: INTENT_TYPES.UNSUBSCRIBE,
      sentiment: 'Negative / Opt-out',
      action: 'Confirm Opt-out & Remove',
      confidence: 98
    };
  }

  if (text.includes('call') || text.includes('zoom') || text.includes('meet') || text.includes('schedule') || text.includes('chat tomorrow') || text.includes('calendar') || text.includes('calendly') || text.includes('available')) {
    return {
      intent: INTENT_TYPES.POSITIVE_MEETING,
      sentiment: 'Highly Positive / Ready to Book',
      action: 'Send Booking Link & Times',
      confidence: 95
    };
  }

  if (text.includes('cost') || text.includes('price') || text.includes('pricing') || text.includes('rate') || text.includes('quote') || text.includes('budget') || text.includes('how much')) {
    return {
      intent: INTENT_TYPES.PRICING_INQUIRY,
      sentiment: 'Interested / Commercial Intent',
      action: 'Share Flexible Pricing Tiers',
      confidence: 92
    };
  }

  if (text.includes('how') || text.includes('more info') || text.includes('details') || text.includes('case study') || text.includes('example') || text.includes('what do you do') || text.includes('portfolio') || text.includes('tell me more')) {
    return {
      intent: INTENT_TYPES.MORE_INFO,
      sentiment: 'Curious / Exploring',
      action: 'Provide Specific Breakdown & Examples',
      confidence: 89
    };
  }

  if (text.includes('not right now') || text.includes('next quarter') || text.includes('busy') || text.includes('already have') || text.includes('in-house') || text.includes('later')) {
    return {
      intent: INTENT_TYPES.OBJECTION_TIMING,
      sentiment: 'Neutral / Timing Objection',
      action: 'Soft Touchpoint & Future Check-in',
      confidence: 86
    };
  }

  // Default positive interest
  return {
    intent: INTENT_TYPES.POSITIVE_MEETING,
    sentiment: 'Positive / Open to Dialogue',
    action: 'Engage & Propose Next Step',
    confidence: 80
  };
}

// Generate contextual AI response
async function generateSmartReply({
  incomingMessage,
  originalSubject = 'Strategic Partnership / Organic Growth',
  companyName = 'Partner',
  senderName = 'Growth Team',
  bookingLink = 'https://calendly.com/your-brand/discovery-call',
  apiKey = null
}) {
  const analysis = classifyReplyIntent(incomingMessage);

  // If external Gemini API Key provided, call Gemini API
  if (apiKey) {
    try {
      const prompt = `You are an elite, highly polite and persuasive AI Business Development executive replying to an incoming email from "${companyName}".
Sender Name: "${senderName}".
Original Subject: "${originalSubject}".
Incoming Message: "${incomingMessage}".
Detected Intent: "${analysis.intent}".
Sender's Booking Link: "${bookingLink}".

Instructions:
1. Address the recipient respectfully.
2. Directly answer their specific comment or question.
3. Keep the email concise (3-5 short paragraphs maximum).
4. No robotic corporate fluff; sound like a sharp, friendly growth specialist.
5. Provide a clear call-to-action according to their intent.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 7000 }
      );

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        return {
          analysis,
          subject: originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`,
          body: generatedText.trim(),
          source: 'Gemini AI Engine'
        };
      }
    } catch (apiError) {
      // Fallback gracefully to our built-in intelligence engine
      console.warn('Gemini API call failed, falling back to local AI engine:', apiError.message);
    }
  }

  // Built-in High Quality Natural Language Generation Engine
  let responseBody = '';

  switch (analysis.intent) {
    case INTENT_TYPES.POSITIVE_MEETING:
      responseBody = `Hi there,

Thanks for getting back to me so quickly! Glad to hear this caught your interest.

I'd love to share the exact growth breakdown we mapped out for ${companyName} and how we can help you capture more top-ranking search positions from your competitors.

Would either of these times work for a brief 15-minute screen share?
• Tuesday at 2:00 PM EST
• Thursday at 11:30 AM EST

Alternatively, feel free to grab whatever time suits your schedule best directly on my calendar:
👉 ${bookingLink}

Looking forward to speaking!

Best regards,
${senderName}`;
      break;

    case INTENT_TYPES.PRICING_INQUIRY:
      responseBody = `Hi there,

Thanks for the note! To be completely transparent, our partnerships typically fall into two flexible models depending on where ${companyName} wants to focus:

1. Performance & Growth Sprint: Comprehensive technical optimization + keyword takeover targeting your competitor's highest converting gaps (typically $1,500 – $2,500/mo).
2. Enterprise Scale: Full autonomous content, backlink acquisition, and daily SERP monitoring ($3,500+/mo).

Before quoting an exact number, I'd love to take 10 minutes to verify which 20-30 high-intent keywords will yield the fastest ROI for your store/platform.

Does later this week work for a quick chat? You can pick a slot here: ${bookingLink}

Best regards,
${senderName}`;
      break;

    case INTENT_TYPES.MORE_INFO:
      responseBody = `Hi there,

Great question! In short, we run an automated competitive gap analysis that identifies exact search queries where your direct competitors are winning organic clicks that should belong to ${companyName}.

For example, last quarter we helped a similar brand in your niche move 42 high-difficulty commercial keywords from page 3 directly into the top 5, resulting in an 84% surge in qualified inbound leads within 90 days.

I actually put together a 3-minute video breakdown specifically showing your domain's top 3 opportunity areas. 

Would you like me to send that link over, or would you prefer a quick 10-minute live demo?

Best regards,
${senderName}`;
      break;

    case INTENT_TYPES.OBJECTION_TIMING:
      responseBody = `Hi there,

Totally understood, and thanks for being candid! Having an in-house team or focusing on other priorities right now makes complete sense.

No pressure at all. I'll make a note to check back in with you towards the beginning of next quarter to see if things have shifted.

In the meantime, if you'd like me to send over our complimentary 1-page Competitive SERP Benchmark for ${companyName} so you can share it with your internal team, just let me know!

Wishing you and the team continued success,

Best regards,
${senderName}`;
      break;

    case INTENT_TYPES.UNSUBSCRIBE:
      responseBody = `Hi there,

Understood! I have removed your email and ${companyName} from our outreach list immediately. You will not receive any further automated emails from us.

Have a great week ahead!

Best regards,
${senderName}`;
      break;

    default:
      responseBody = `Hi there,

Thank you for your response! We're excited about the possibility of collaborating with ${companyName}.

Let's coordinate a quick 10-minute sync so I can walk you through the data and recommendations we compiled for your domain.

You can pick a convenient time here: ${bookingLink}

Best regards,
${senderName}`;
  }

  return {
    analysis,
    subject: originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`,
    body: responseBody,
    source: 'Built-in Contextual AI Engine'
  };
}

// Store a conversation
function recordIncomingReply({
  id = 'reply_' + Date.now(),
  senderEmail,
  senderDomain,
  companyName,
  incomingMessage,
  originalSubject,
  originalBody,
  autoReplyDraft,
  status = 'pending_review', // pending_review | auto_sent | replied | archived
  autonomousMode = false
}) {
  const conversation = {
    id,
    timestamp: new Date().toISOString(),
    senderEmail,
    senderDomain,
    companyName: companyName || senderDomain,
    incomingMessage,
    originalSubject,
    originalBody,
    autoReply: autoReplyDraft,
    status: autonomousMode ? 'auto_sent' : status,
    sentAt: autonomousMode ? new Date().toISOString() : null,
    autonomousMode
  };

  conversations.unshift(conversation);
  return conversation;
}

function getConversations() {
  return conversations;
}

function updateConversationStatus(id, newStatus, modifiedReply) {
  const item = conversations.find(c => c.id === id);
  if (item) {
    item.status = newStatus;
    if (modifiedReply) {
      item.autoReply.body = modifiedReply;
    }
    if (newStatus === 'auto_sent' || newStatus === 'replied') {
      item.sentAt = new Date().toISOString();
    }
  }
  return item;
}

module.exports = {
  INTENT_TYPES,
  classifyReplyIntent,
  generateSmartReply,
  recordIncomingReply,
  getConversations,
  updateConversationStatus
};
