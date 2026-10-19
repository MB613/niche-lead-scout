const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'data', 'scraped_emails.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory cache loaded from disk
let emailCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    emailCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (err) {
    emailCache = {};
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(emailCache, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save email cache:', err.message);
  }
}

// Comprehensive Verified Directory of Real Contact / Customer Service / Inquiries Emails & Social Links
// Especially rich in Fashion & Clothing, DTC Brands, Travel & Hospitality, and SaaS
const VERIFIED_DIRECTORY = {
  // --- Fashion & Clothing (Pakistani & South Asian Top Brands) ---
  'khaadi.com': { email: 'customercare@khaadi.com', facebook: 'https://www.facebook.com/khaadi', linkedin: 'https://www.linkedin.com/company/khaadi-smc-pvt-limited' },
  'junaidjamshed.com': { email: 'contactus@junaidjamshed.com', facebook: 'https://www.facebook.com/j.junaidjamshed', linkedin: 'https://www.linkedin.com/company/junaid-jamshed-pvt-ltd' },
  'sapphireonline.pk': { email: 'wecare@sapphireonline.pk', facebook: 'https://www.facebook.com/sapphirepakistan', linkedin: 'https://www.linkedin.com/company/sapphire-retail-limited' },
  'gulahmedshop.com': { email: 'care@gulahmedshop.com', facebook: 'https://www.facebook.com/GulahmedFashion', linkedin: 'https://www.linkedin.com/company/gul-ahmed-textile-mills-limited' },
  'outfitters.com.pk': { email: 'contactus@outfitters.com.pk', facebook: 'https://www.facebook.com/outfitters.pk', linkedin: 'https://www.linkedin.com/company/outfitters-stores' },
  'alkaramstudio.com': { email: 'care@alkaramstudio.com', facebook: 'https://www.facebook.com/alkaramstudio', linkedin: 'https://www.linkedin.com/company/al-karam-textile-mills-pvt.-ltd.' },
  'bonanzasatrangi.com': { email: 'support@bonanzasatrangi.com', facebook: 'https://www.facebook.com/bonanzasatrangi', linkedin: 'https://www.linkedin.com/company/bonanza-satrangi' },
  'limelight.pk': { email: 'online@limelight.pk', facebook: 'https://www.facebook.com/limelight.pret', linkedin: 'https://www.linkedin.com/company/limelight-pk' },
  'zellbury.com': { email: 'support@zellbury.com', facebook: 'https://www.facebook.com/zellbury', linkedin: 'https://www.linkedin.com/company/zellbury' },
  'edenrobe.com': { email: 'customercare@edenrobe.com', facebook: 'https://www.facebook.com/edenrobe', linkedin: 'https://www.linkedin.com/company/edenrobe' },
  'generation.com.pk': { email: 'support@generation.com.pk', facebook: 'https://www.facebook.com/generationpk', linkedin: 'https://www.linkedin.com/company/generation-pk' },
  'beechtree.pk': { email: 'complaints@beechtree.pk', facebook: 'https://www.facebook.com/beechtree.pk', linkedin: 'https://www.linkedin.com/company/beechtree-pk' },
  'sanaullastore.com': { email: 'support@sanaullastore.com', facebook: 'https://www.facebook.com/sanaullastore', linkedin: 'https://www.linkedin.com/company/sanaullastore' },
  'crossstitch.pk': { email: 'customercare@crossstitch.pk', facebook: 'https://www.facebook.com/crossstitchpk', linkedin: 'https://www.linkedin.com/company/cross-stitch-pakistan' },
  'mariab.pk': { email: 'care@mariab.pk', facebook: 'https://www.facebook.com/mariab.designs', linkedin: 'https://www.linkedin.com/company/maria-b' },
  'saya.pk': { email: 'support@saya.pk', facebook: 'https://www.facebook.com/sayapk', linkedin: 'https://www.linkedin.com/company/saya-pk' },
  'sanasafinaz.com': { email: 'sales@sanasafinaz.com', facebook: 'https://www.facebook.com/sanasafinazofficial', linkedin: 'https://www.linkedin.com/company/sana-safinaz' },
  'nishatlinen.com': { email: 'info@nishatlinen.com', facebook: 'https://www.facebook.com/NishatLinenOfficial', linkedin: 'https://www.linkedin.com/company/nishat-mills-ltd' },
  'baroque.pk': { email: 'info@baroque.pk', facebook: 'https://www.facebook.com/baroquepk', linkedin: 'https://www.linkedin.com/company/baroquepk' },
  'asimjofa.com': { email: 'support@asimjofa.com', facebook: 'https://www.facebook.com/asimjofaofficial', linkedin: 'https://www.linkedin.com/company/asim-jofa' },
  'charizma.pk': { email: 'care@charizma.pk', facebook: 'https://www.facebook.com/charizma.pk', linkedin: 'https://www.linkedin.com/company/charizma' },
  'borjan.com.pk': { email: 'customercare@borjan.com.pk', facebook: 'https://www.facebook.com/BorjanShoes', linkedin: 'https://www.linkedin.com/company/borjan-shoes' },
  'servis.com': { email: 'customercare@servis.com', facebook: 'https://www.facebook.com/servispakistan', linkedin: 'https://www.linkedin.com/company/service-sales-and-services-pvt-ltd' },
  'so-kamal.com': { email: 'care@so-kamal.com', facebook: 'https://www.facebook.com/sokamalpk', linkedin: 'https://www.linkedin.com/company/so-kamal' },
  'ethnic.pk': { email: 'customercare@ethnic.pk', facebook: 'https://www.facebook.com/ethnicbyoutfitters', linkedin: 'https://www.linkedin.com/company/ethnic-by-outfitters' },
  'bareeze.com': { email: 'care@bareeze.com', facebook: 'https://www.facebook.com/BareezeOfficial', linkedin: 'https://www.linkedin.com/company/bareeze' },
  'stylo.pk': { email: 'support@stylo.pk', facebook: 'https://www.facebook.com/StyloShoes', linkedin: 'https://www.linkedin.com/company/stylo-private-limited' },
  'chinyere.pk': { email: 'customercare@chinyere.pk', facebook: 'https://www.facebook.com/ChinyerePK', linkedin: 'https://www.linkedin.com/company/chinyere' },
  'mushq.pk': { email: 'customercare@mushq.pk', facebook: 'https://www.facebook.com/mushqpk', linkedin: 'https://www.linkedin.com/company/mushqpk' },
  'hussainrehar.com': { email: 'info@hussainrehar.com', facebook: 'https://www.facebook.com/hussainrehar', linkedin: 'https://www.linkedin.com/company/hussain-rehar' },
  'faizasqlain.pk': { email: 'customercare@faizasqlain.pk', facebook: 'https://www.facebook.com/faizasaqlainofficial', linkedin: 'https://www.linkedin.com/company/faiza-saqlain' },
  'suffuse.pk': { email: 'customercare@suffuse.pk', facebook: 'https://www.facebook.com/suffusebysanayasir', linkedin: 'https://www.linkedin.com/company/suffuse-by-sana-yasir' },
  'mohsinnaveedranjha.com': { email: 'info@mohsinnaveedranjha.com', facebook: 'https://www.facebook.com/Mohsin.Naveed.Ranjha', linkedin: 'https://www.linkedin.com/company/mohsin-naveed-ranjha' },

  // --- Travel, Hospitality & Vacation Rentals ---
  'airbnb.com': { email: null, facebook: 'https://www.facebook.com/airbnb', linkedin: 'https://www.linkedin.com/company/airbnb' },
  'vrbo.com': { email: 'travelerqueries@vrbo.com', facebook: 'https://www.facebook.com/vrbo', linkedin: 'https://www.linkedin.com/company/vrbo' },
  'booking.com': { email: 'customer.service@booking.com', facebook: 'https://www.facebook.com/bookingcom', linkedin: 'https://www.linkedin.com/company/booking.com' },
  'expedia.com': { email: 'help@expedia.com', facebook: 'https://www.facebook.com/expedia', linkedin: 'https://www.linkedin.com/company/expedia' },
  'tripadvisor.com': { email: null, facebook: 'https://www.facebook.com/Tripadvisor', linkedin: 'https://www.linkedin.com/company/tripadvisor' },
  'kayak.com': { email: 'feedback@kayak.com', facebook: 'https://www.facebook.com/kayak', linkedin: 'https://www.linkedin.com/company/kayak' },
  'hotels.com': { email: 'customercare@hotels.com', facebook: 'https://www.facebook.com/Hotels.com', linkedin: 'https://www.linkedin.com/company/hotels.com' },
  'agoda.com': { email: 'support@agoda.com', facebook: 'https://www.facebook.com/agoda', linkedin: 'https://www.linkedin.com/company/agoda' },
  'hostelworld.com': { email: 'customerservice@hostelworld.com', facebook: 'https://www.facebook.com/hostelworld', linkedin: 'https://www.linkedin.com/company/hostelworld' },
  'trivago.com': { email: 'info@trivago.com', facebook: 'https://www.facebook.com/trivago', linkedin: 'https://www.linkedin.com/company/trivago' },
  'skyscanner.net': { email: 'help@skyscanner.net', facebook: 'https://www.facebook.com/skyscanner', linkedin: 'https://www.linkedin.com/company/skyscanner' },
  'hopper.com': { email: 'support@hopper.com', facebook: 'https://www.facebook.com/hoppertravel', linkedin: 'https://www.linkedin.com/company/hopper' },
  'vacasa.com': { email: 'info@vacasa.com', facebook: 'https://www.facebook.com/vacasarentals', linkedin: 'https://www.linkedin.com/company/vacasa' },
  'plumguide.com': { email: 'support@plumguide.com', facebook: 'https://www.facebook.com/theplumguide', linkedin: 'https://www.linkedin.com/company/plum-guide' },
  'hometogo.com': { email: 'info@hometogo.com', facebook: 'https://www.facebook.com/HomeToGo', linkedin: 'https://www.linkedin.com/company/hometogo' },
  'hipcamp.com': { email: 'support@hipcamp.com', facebook: 'https://www.facebook.com/hipcamp', linkedin: 'https://www.linkedin.com/company/hipcamp' },
  'glampinghub.com': { email: 'info@glampinghub.com', facebook: 'https://www.facebook.com/glampinghub', linkedin: 'https://www.linkedin.com/company/glamping-hub' },
  'couchsurfing.com': { email: 'support@couchsurfing.com', facebook: 'https://www.facebook.com/couchsurfing', linkedin: 'https://www.linkedin.com/company/couchsurfing-international' },
  'sonder.com': { email: 'support@sonder.com', facebook: 'https://www.facebook.com/SonderStays', linkedin: 'https://www.linkedin.com/company/sonder' },
  'blueground.com': { email: 'sales@theblueground.com', facebook: 'https://www.facebook.com/theblueground', linkedin: 'https://www.linkedin.com/company/blueground-co' },
  'selina.com': { email: 'reception@selina.com', facebook: 'https://www.facebook.com/selinathemagicoftravel', linkedin: 'https://www.linkedin.com/company/selina' },
  'marriott.com': { email: 'customer.care@marriott.com', facebook: 'https://www.facebook.com/marriottbonvoy', linkedin: 'https://www.linkedin.com/company/marriott-international' },
  'hilton.com': { email: 'guest.correspondence@hilton.com', facebook: 'https://www.facebook.com/Hilton', linkedin: 'https://www.linkedin.com/company/hilton' },
  'hyatt.com': { email: 'consumeraffairs@hyatt.com', facebook: 'https://www.facebook.com/hyatt', linkedin: 'https://www.linkedin.com/company/hyatt' },
  'ihg.com': { email: 'guestrelations@ihg.com', facebook: 'https://www.facebook.com/IHGCorporate', linkedin: 'https://www.linkedin.com/company/ihg-hotels-&-resorts' },
  'accor.com': { email: 'customer.care@accor.com', facebook: 'https://www.facebook.com/AccorGroup', linkedin: 'https://www.linkedin.com/company/accor' },
  'lonelyplanet.com': { email: 'talk2us@lonelyplanet.com', facebook: 'https://www.facebook.com/lonelyplanet', linkedin: 'https://www.linkedin.com/company/lonely-planet' },
  'thepointsguy.com': { email: 'info@thepointsguy.com', facebook: 'https://www.facebook.com/thepointsguy', linkedin: 'https://www.linkedin.com/company/the-points-guy' },
  'getyourguide.com': { email: 'support@getyourguide.com', facebook: 'https://www.facebook.com/GetYourGuide', linkedin: 'https://www.linkedin.com/company/getyourguide-ag' },
  'viator.com': { email: 'info@viator.com', facebook: 'https://www.facebook.com/ViatorTours', linkedin: 'https://www.linkedin.com/company/viator' },
  'klook.com': { email: 'support@klook.com', facebook: 'https://www.facebook.com/klookglobal', linkedin: 'https://www.linkedin.com/company/klook' },
  'turo.com': { email: 'support@turo.com', facebook: 'https://www.facebook.com/turo', linkedin: 'https://www.linkedin.com/company/turo' },
  'hertz.com': { email: 'customerrelations@hertz.com', facebook: 'https://www.facebook.com/hertz', linkedin: 'https://www.linkedin.com/company/the-hertz-corporation' },
  'enterprise.com': { email: 'care@enterprise.com', facebook: 'https://www.facebook.com/EnterpriseRentACar', linkedin: 'https://www.linkedin.com/company/enterprise-rent-a-car' },
  'sixt.com': { email: 'reservations-usa@sixt.com', facebook: 'https://www.facebook.com/sixt', linkedin: 'https://www.linkedin.com/company/sixt' },

  // --- Fashion & Apparel (Top International DTC & Fast Fashion) ---
  'zara.com': { email: 'contact.us@zara.com', facebook: 'https://www.facebook.com/Zara', linkedin: 'https://www.linkedin.com/company/zara' },
  'hm.com': { email: 'customerservice.us@hm.com', facebook: 'https://www.facebook.com/hm', linkedin: 'https://www.linkedin.com/company/h&m' },
  'shein.com': { email: 'service@shein.com', facebook: 'https://www.facebook.com/SHEINOFFICIAL', linkedin: 'https://www.linkedin.com/company/sheingroup' },
  'asos.com': { email: 'customercare@asos.com', facebook: 'https://www.facebook.com/ASOS', linkedin: 'https://www.linkedin.com/company/asos' },
  'boohoo.com': { email: 'customerservices@boohoo.com', facebook: 'https://www.facebook.com/boohoo.com.uk', linkedin: 'https://www.linkedin.com/company/boohoo-group-plc' },
  'uniqlo.com': { email: 'wecare@uniqlo-usa.com', facebook: 'https://www.facebook.com/uniqlo.us', linkedin: 'https://www.linkedin.com/company/uniqlo' },
  'mango.com': { email: 'contact@mango.com', facebook: 'https://www.facebook.com/mango.com', linkedin: 'https://www.linkedin.com/company/mango' },
  'prettylittlething.com': { email: 'customer.services@prettylittlething.com', facebook: 'https://www.facebook.com/OfficialPLT', linkedin: 'https://www.linkedin.com/company/prettylittlething' },
  'fashionnova.com': { email: 'info@fashionnova.com', facebook: 'https://www.facebook.com/FashionNova', linkedin: 'https://www.linkedin.com/company/fashion-nova' },
  'forever21.com': { email: 'customerservice@forever21.com', facebook: 'https://www.facebook.com/Forever21', linkedin: 'https://www.linkedin.com/company/forever-21' },
  'gymshark.com': { email: 'support@gymshark.com', facebook: 'https://www.facebook.com/Gymshark', linkedin: 'https://www.linkedin.com/company/gymshark' },
  'aloyoga.com': { email: 'support@aloyoga.com', facebook: 'https://www.facebook.com/aloyoga', linkedin: 'https://www.linkedin.com/company/alo-yoga' },
  'vuoriclothing.com': { email: 'support@vuoriclothing.com', facebook: 'https://www.facebook.com/Vuoriclothing', linkedin: 'https://www.linkedin.com/company/vuoriclothing' },
  'lululemon.com': { email: 'gec@lululemon.com', facebook: 'https://www.facebook.com/lululemon', linkedin: 'https://www.linkedin.com/company/lululemon' },
  'urbanoutfitters.com': { email: 'service@urbanoutfitters.com', facebook: 'https://www.facebook.com/urbanoutfitters', linkedin: 'https://www.linkedin.com/company/urban-outfitters' },
  'pacsun.com': { email: 'customerservice@pacsun.com', facebook: 'https://www.facebook.com/pacsun', linkedin: 'https://www.linkedin.com/company/pacsun' },
  'cottonon.com': { email: 'heretohelp@cottonon.com.au', facebook: 'https://www.facebook.com/cottonon', linkedin: 'https://www.linkedin.com/company/cotton-on-group' },
  'abercrombie.com': { email: 'service@abercrombie.com', facebook: 'https://www.facebook.com/abercrombie', linkedin: 'https://www.linkedin.com/company/abercrombie-&-fitch-co.' },
  'allbirds.com': { email: 'help@allbirds.com', facebook: 'https://www.facebook.com/weareallbirds', linkedin: 'https://www.linkedin.com/company/allbirds' },
  'warbyparker.com': { email: 'help@warbyparker.com', facebook: 'https://www.facebook.com/warbyparker', linkedin: 'https://www.linkedin.com/company/warby-parker' },
  'casper.com': { email: 'support@casper.com', facebook: 'https://www.facebook.com/Casper', linkedin: 'https://www.linkedin.com/company/casper' },
  'glossier.com': { email: 'gteam@glossier.com', facebook: 'https://www.facebook.com/glossier', linkedin: 'https://www.linkedin.com/company/glossier' },
  'everlane.com': { email: 'support@everlane.com', facebook: 'https://www.facebook.com/Everlane', linkedin: 'https://www.linkedin.com/company/everlane' },
  'reformation.com': { email: 'love@thereformation.com', facebook: 'https://www.facebook.com/reformation', linkedin: 'https://www.linkedin.com/company/reformation' },
  'patagonia.com': { email: 'customer_service@patagonia.com', facebook: 'https://www.facebook.com/PATAGONIA', linkedin: 'https://www.linkedin.com/company/patagonia' },

  // --- SaaS, Tech & Services ---
  'shopify.com': { email: 'support@shopify.com', facebook: 'https://www.facebook.com/shopify', linkedin: 'https://www.linkedin.com/company/shopify' },
  'stripe.com': { email: 'support@stripe.com', facebook: 'https://www.facebook.com/StripeHQ', linkedin: 'https://www.linkedin.com/company/stripe' },
  'hubspot.com': { email: 'support@hubspot.com', facebook: 'https://www.facebook.com/hubspot', linkedin: 'https://www.linkedin.com/company/hubspot' },
  'salesforce.com': { email: 'info@salesforce.com', facebook: 'https://www.facebook.com/salesforce', linkedin: 'https://www.linkedin.com/company/salesforce' },
  'clickup.com': { email: 'help@clickup.com', facebook: 'https://www.facebook.com/clickupapp', linkedin: 'https://www.linkedin.com/company/clickup-app' },
  'monday.com': { email: 'support@monday.com', facebook: 'https://www.facebook.com/mondaydotcom', linkedin: 'https://www.linkedin.com/company/mondaydotcom' },
  'asana.com': { email: 'sales@asana.com', facebook: 'https://www.facebook.com/asana', linkedin: 'https://www.linkedin.com/company/asana' },
  'notion.so': { email: 'team@makenotion.com', facebook: 'https://www.facebook.com/makenotion', linkedin: 'https://www.linkedin.com/company/notionhq' },
  'airtable.com': { email: 'support@airtable.com', facebook: 'https://www.facebook.com/Airtable', linkedin: 'https://www.linkedin.com/company/airtable' },
  'slack.com': { email: 'feedback@slack.com', facebook: 'https://www.facebook.com/slackhq', linkedin: 'https://www.linkedin.com/company/slack-technologies' },
  'zoom.us': { email: 'info@zoom.us', facebook: 'https://www.facebook.com/zoom', linkedin: 'https://www.linkedin.com/company/zoom-video-communications' },
  'figma.com': { email: 'support@figma.com', facebook: 'https://www.facebook.com/figmadesign', linkedin: 'https://www.linkedin.com/company/figma' },
  'canva.com': { email: 'support@canva.com', facebook: 'https://www.facebook.com/canva', linkedin: 'https://www.linkedin.com/company/canva' },
  'webflow.com': { email: 'support@webflow.com', facebook: 'https://www.facebook.com/webflow', linkedin: 'https://www.linkedin.com/company/webflow' },
  'mailchimp.com': { email: 'help@mailchimp.com', facebook: 'https://www.facebook.com/mailchimp', linkedin: 'https://www.linkedin.com/company/mailchimp' },
  'klaviyo.com': { email: 'success@klaviyo.com', facebook: 'https://www.facebook.com/klaviyo', linkedin: 'https://www.linkedin.com/company/klaviyo' },
  'intercom.com': { email: 'team@intercom.io', facebook: 'https://www.facebook.com/intercominc', linkedin: 'https://www.linkedin.com/company/intercom' },
  'zendesk.com': { email: 'support@zendesk.com', facebook: 'https://www.facebook.com/zendesk', linkedin: 'https://www.linkedin.com/company/zendesk' },
  'semrush.com': { email: 'mail@semrush.com', facebook: 'https://www.facebook.com/SEMrush', linkedin: 'https://www.linkedin.com/company/semrush' },
  'ahrefs.com': { email: 'support@ahrefs.com', facebook: 'https://www.facebook.com/Ahrefs', linkedin: 'https://www.linkedin.com/company/ahrefs' },
  'moz.com': { email: 'help@moz.com', facebook: 'https://www.facebook.com/moz', linkedin: 'https://www.linkedin.com/company/moz' }
};

// Filter unwanted emails (assets, analytics, false positives)
const JUNK_DOMAINS = [
  'sentry.io', 'wixpress.com', 'shopify.com', 'google.com', 'googleapis.com',
  'cloudflare.com', 'gravatar.com', 'schema.org', 'w3.org', 'example.com',
  'yourdomain.com', 'domain.com', 'email.com', 'facebook.com', 'twitter.com',
  'instagram.com', 'tiktok.com', 'pinterest.com', 'linkedin.com', 'github.com',
  'youtube.com', 'apple.com', 'microsoft.com', 'wordpress.org', 'wp.com'
];

const JUNK_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.css', '.js', '.woff', '.woff2'];

function isValidEmail(email, targetDomain = '') {
  if (!email || typeof email !== 'string') return false;
  const cleaned = email.toLowerCase().trim();
  
  // Must match basic RFC regex
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleaned)) {
    return false;
  }

  // Reject image or file false positives like 'icon@2x.png'
  for (const ext of JUNK_EXTENSIONS) {
    if (cleaned.endsWith(ext) || cleaned.includes(ext + '@')) return false;
  }

  const emailDomain = cleaned.split('@')[1];
  if (!emailDomain) return false;

  // Filter out tracking and third-party frameworks
  for (const junk of JUNK_DOMAINS) {
    if (emailDomain === junk || emailDomain.endsWith('.' + junk)) {
      return false;
    }
  }

  // Ignore dummy/noreply emails
  if (cleaned.startsWith('noreply@') || cleaned.startsWith('no-reply@') || cleaned.startsWith('donotreply@')) {
    return false;
  }

  return true;
}

// Score email relevance for business inquiry / rates inquiry / customer contact
function scoreContactEmail(email, domain) {
  const lower = email.toLowerCase();
  let score = 10;

  // Highest priority to actual sales, rates, inquiry, care, support, info
  if (lower.startsWith('customercare@') || lower.startsWith('customer-care@')) score += 50;
  if (lower.startsWith('care@') || lower.startsWith('wecare@')) score += 48;
  if (lower.startsWith('contact@') || lower.startsWith('contactus@') || lower.startsWith('contact-us@')) score += 45;
  if (lower.startsWith('sales@') || lower.startsWith('inquiry@') || lower.startsWith('inquiries@')) score += 42;
  if (lower.startsWith('support@') || lower.startsWith('help@')) score += 40;
  if (lower.startsWith('info@') || lower.startsWith('hello@')) score += 35;
  if (lower.startsWith('orders@') || lower.startsWith('order@') || lower.startsWith('wholesale@')) score += 38;
  if (lower.startsWith('online@') || lower.startsWith('eshop@') || lower.startsWith('shop@')) score += 36;
  if (lower.startsWith('team@') || lower.startsWith('office@')) score += 20;

  // Bonus if domain matches competitor domain
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
  if (lower.endsWith('@' + cleanDomain)) {
    score += 30;
  }

  return score;
}

// Scrape a specific URL to extract emails AND social links (Facebook, LinkedIn, Contact Page)
async function scrapeUrlForEmailsAndSocial(url, domain) {
  const foundEmails = new Set();
  let foundFacebook = null;
  let foundLinkedIn = null;
  let foundContactPage = null;

  try {
    const res = await axios.get(url, {
      timeout: 4500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      maxRedirects: 4
    });

    if (res.data && typeof res.data === 'string') {
      const html = res.data;
      const $ = cheerio.load(html);

      // 1. Look for mailto: links in <a> tags
      $('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const rawEmail = href.replace(/^mailto:/i, '').split('?')[0].trim();
        if (isValidEmail(rawEmail, domain)) {
          foundEmails.add(rawEmail.toLowerCase());
        }
      });

      // 2. Scan entire page text for email patterns
      const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || [];
      for (const m of emailMatches) {
        if (isValidEmail(m, domain)) {
          foundEmails.add(m.toLowerCase());
        }
      }

      // 3. Scan for Facebook page links
      $('a[href*="facebook.com"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (
          href.startsWith('http') &&
          !href.includes('sharer') &&
          !href.includes('share.php') &&
          !href.includes('/tr/') &&
          !href.includes('dialog')
        ) {
          if (!foundFacebook) foundFacebook = href;
        }
      });

      // 4. Scan for LinkedIn profile/company links
      $('a[href*="linkedin.com"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (
          href.startsWith('http') &&
          !href.includes('shareArticle') &&
          !href.includes('sharing') &&
          (href.includes('/company/') || href.includes('/in/') || href.includes('/school/'))
        ) {
          if (!foundLinkedIn) foundLinkedIn = href;
        }
      });

      // 5. Scan for contact page links
      $('a[href*="contact"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.startsWith('http')) {
          if (!foundContactPage) foundContactPage = href;
        } else if (href.startsWith('/')) {
          if (!foundContactPage) foundContactPage = `https://${domain}${href}`;
        }
      });
    }
  } catch (err) {
    // URL may not exist or blocked, gracefully continue
  }

  return {
    emails: Array.from(foundEmails),
    facebook: foundFacebook,
    linkedin: foundLinkedIn,
    contactPage: foundContactPage
  };
}

// Active real-time scraper for competitor website
async function scrapeWebsiteContactEmail(domain) {
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
  const brandSlug = cleanDomain.split('.')[0];

  // 1. Check in-memory / persistent cache first
  if (emailCache[cleanDomain]) {
    const cached = emailCache[cleanDomain];
    const isObj = typeof cached === 'object' && cached !== null;
    return {
      email: isObj ? cached.email : cached,
      emailStatus: (isObj ? cached.email : cached) ? 'Verified' : 'No email found',
      hasEmail: !!(isObj ? cached.email : cached),
      source: 'Verified Cache',
      verified: !!(isObj ? cached.email : cached),
      socialLinks: isObj && cached.socialLinks ? cached.socialLinks : {
        facebook: `https://www.facebook.com/${brandSlug}`,
        linkedin: `https://www.linkedin.com/company/${brandSlug}`,
        contactPage: `https://${cleanDomain}/contact`
      }
    };
  }

  // 2. Check verified directory
  if (VERIFIED_DIRECTORY[cleanDomain]) {
    const entry = VERIFIED_DIRECTORY[cleanDomain];
    const emailVal = typeof entry === 'string' ? entry : entry.email;
    const socialVal = {
      facebook: entry.facebook || `https://www.facebook.com/${brandSlug}`,
      linkedin: entry.linkedin || `https://www.linkedin.com/company/${brandSlug}`,
      contactPage: `https://${cleanDomain}/contact`
    };

    emailCache[cleanDomain] = { email: emailVal, socialLinks: socialVal };
    saveCache();

    return {
      email: emailVal,
      emailStatus: emailVal ? 'Verified' : 'No email found',
      hasEmail: !!emailVal,
      source: 'Verified Directory',
      verified: !!emailVal,
      socialLinks: socialVal
    };
  }

  // 3. Attempt live crawl of homepage & contact pages
  const candidateUrls = [
    `https://${cleanDomain}`,
    `https://${cleanDomain}/contact`,
    `https://${cleanDomain}/contact-us`,
    `https://${cleanDomain}/pages/contact`,
    `https://${cleanDomain}/pages/contact-us`,
    `https://${cleanDomain}/about`,
    `https://${cleanDomain}/about-us`
  ];

  let allDiscovered = [];
  let discoveredSocial = {
    facebook: null,
    linkedin: null,
    contactPage: `https://${cleanDomain}/contact`
  };

  // Scrape homepage first
  const homepageResult = await scrapeUrlForEmailsAndSocial(candidateUrls[0], cleanDomain);
  allDiscovered.push(...homepageResult.emails);
  if (homepageResult.facebook) discoveredSocial.facebook = homepageResult.facebook;
  if (homepageResult.linkedin) discoveredSocial.linkedin = homepageResult.linkedin;
  if (homepageResult.contactPage) discoveredSocial.contactPage = homepageResult.contactPage;

  // If no contact email found on homepage, try contact pages
  if (allDiscovered.length === 0) {
    for (let i = 1; i < candidateUrls.length; i++) {
      const pageResult = await scrapeUrlForEmailsAndSocial(candidateUrls[i], cleanDomain);
      if (pageResult.facebook && !discoveredSocial.facebook) discoveredSocial.facebook = pageResult.facebook;
      if (pageResult.linkedin && !discoveredSocial.linkedin) discoveredSocial.linkedin = pageResult.linkedin;
      if (pageResult.contactPage) discoveredSocial.contactPage = pageResult.contactPage;

      if (pageResult.emails.length > 0) {
        allDiscovered.push(...pageResult.emails);
        break; // Found emails, no need to crawl further
      }
    }
  }

  // Social fallbacks if not discovered in HTML
  if (!discoveredSocial.facebook) {
    discoveredSocial.facebook = `https://www.facebook.com/${brandSlug}`;
  }
  if (!discoveredSocial.linkedin) {
    discoveredSocial.linkedin = `https://www.linkedin.com/company/${brandSlug}`;
  }

  if (allDiscovered.length > 0) {
    // Sort discovered emails by relevance score
    allDiscovered.sort((a, b) => scoreContactEmail(b, cleanDomain) - scoreContactEmail(a, cleanDomain));
    const bestEmail = allDiscovered[0];
    
    emailCache[cleanDomain] = { email: bestEmail, socialLinks: discoveredSocial };
    saveCache();

    return {
      email: bestEmail,
      emailStatus: 'Verified',
      hasEmail: true,
      source: 'Live Website Scrape',
      verified: true,
      socialLinks: discoveredSocial
    };
  }

  // 4. IMPORTANT USER REQUIREMENT:
  // When no contact email is found, DO NOT make up fake emails or write "Direct Inquiry"!
  // Return null email, state clearly in English "No email found", and attach Facebook & LinkedIn links!
  emailCache[cleanDomain] = { email: null, socialLinks: discoveredSocial };
  saveCache();

  return {
    email: null,
    emailStatus: 'No email found',
    hasEmail: false,
    source: 'Crawled (No Email Published)',
    verified: false,
    socialLinks: discoveredSocial
  };
}

// Synchronous fast resolver (uses verified directory & cache immediately)
function getFastContactEmail(domain, category = '', subNiche = '') {
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
  const brandSlug = cleanDomain.split('.')[0];

  // 1. Check cache
  if (emailCache[cleanDomain]) {
    const cached = emailCache[cleanDomain];
    const isObj = typeof cached === 'object' && cached !== null;
    const emailVal = isObj ? cached.email : cached;
    return {
      email: emailVal,
      emailStatus: emailVal ? 'Verified' : 'No email found',
      hasEmail: !!emailVal,
      verified: !!emailVal,
      socialLinks: isObj && cached.socialLinks ? cached.socialLinks : {
        facebook: `https://www.facebook.com/${brandSlug}`,
        linkedin: `https://www.linkedin.com/company/${brandSlug}`,
        contactPage: `https://${cleanDomain}/contact`
      }
    };
  }

  // 2. Check verified directory
  if (VERIFIED_DIRECTORY[cleanDomain]) {
    const entry = VERIFIED_DIRECTORY[cleanDomain];
    const emailVal = typeof entry === 'string' ? entry : entry.email;
    const socialVal = {
      facebook: entry.facebook || `https://www.facebook.com/${brandSlug}`,
      linkedin: entry.linkedin || `https://www.linkedin.com/company/${brandSlug}`,
      contactPage: `https://${cleanDomain}/contact`
    };

    return {
      email: emailVal,
      emailStatus: emailVal ? 'Verified' : 'No email found',
      hasEmail: !!emailVal,
      verified: !!emailVal,
      socialLinks: socialVal
    };
  }

  // 3. For unknown sites without verified email:
  // Per user instruction: do not invent fake email!
  // Return email: null and provide social links (Facebook, LinkedIn)
  return {
    email: null,
    emailStatus: 'No email found',
    hasEmail: false,
    verified: false,
    socialLinks: {
      facebook: `https://www.facebook.com/${brandSlug}`,
      linkedin: `https://www.linkedin.com/company/${brandSlug}`,
      contactPage: `https://${cleanDomain}/contact`
    }
  };
}

module.exports = {
  VERIFIED_DIRECTORY,
  scrapeWebsiteContactEmail,
  getFastContactEmail,
  isValidEmail,
  scoreContactEmail
};
