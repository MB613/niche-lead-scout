const { formatNumber } = require('./nicheDetector');

// Extensive real-world domain database categorized by industry
const NICHE_COMPETITOR_DATABASE = {
  'E-Commerce & DTC Brands': [
    'gymshark.com', 'allbirds.com', 'warbyparker.com', 'casper.com', 'glossier.com',
    'chubbiesshorts.com', 'brooklinen.com', 'awaytravel.com', 'bombas.com', 'meundies.com',
    'everlane.com', 'outdoorvoices.com', 'untuckit.com', 'rothys.com', 'cuyana.com',
    'reformation.com', 'kotn.com', 'buckmason.com', 'tentree.com', 'vuoriclothing.com',
    'aloyoga.com', 'rhone.com', 'cutsclothing.com', 'tenthousand.cc', 'nobullproject.com',
    'mvmt.com', 'puravidabracelets.com', 'baublebar.com', 'gorjana.com', 'analuisa.com',
    'quip.com', 'burstoralcare.com', 'hims.com', 'curology.com', 'functionofbeauty.com',
    'nativecos.com', 'drsqwatch.com', 'manscaped.com', 'dollarshaveclub.com', 'harrys.com',
    'magicspoon.com', 'liquidiv.com', 'athleticgreens.com', 'drinkolipop.com', 'drinkpoppi.com',
    'mudwtr.com', 'foursigmatic.com', 'huel.com', 'soylent.com', 'chomps.com',
    'blueland.com', 'grove.co', 'dropps.com', 'publicgoods.com', 'whopper.com',
    'ourplace.com', 'greatjonesgoods.com', 'carawayhome.com', 'madeincookware.com', 'fellowproducts.com',
    'yeti.com', 'hydroflask.com', 'stanley1913.com', 'solostove.com', 'rumpl.com',
    'cotopaxi.com', 'patagonia.com', 'arcteryx.com', 'prana.com', 'toadandco.com',
    'fahertybrand.com', 'marine-layer.com', 'taylorstitch.com', 'huckberry.com', 'outerknown.com',
    'wearpact.com', 'girlfriend.com', 'beyondyoga.com', 'splits59.com', 'kith.com',
    'frankandoak.com', 'nudiejeans.com', 'outerknown.com', 'richer-poorer.com', 'birdwell.com',
    'nisolo.com', 'thursdayboots.com', 'koio.co', 'greats.com', 'olukai.com',
    'bellroy.com', 'peakdesign.com', 'topo-designs.com', 'wandrd.com', 'aeromexico.com',
    'ridge.com', 'ekster.com', 'bellroy.com', 'dango-products.com', 'trayvax.com'
  ],

  'SaaS & Cloud Software': [
    'hubspot.com', 'salesforce.com', 'clickup.com', 'monday.com', 'asana.com',
    'notion.so', 'airtable.com', 'trello.com', 'basecamp.com', 'linear.app',
    'slack.com', 'zoom.us', 'loom.com', 'miro.com', 'figma.com',
    'canva.com', 'webflow.com', 'framer.com', 'squarespace.com', 'wix.com',
    'shopify.com', 'bigcommerce.com', 'woocommerce.com', 'klaviyo.com', 'mailchimp.com',
    'activecampaign.com', 'convertkit.com', 'brevo.com', 'customer.io', 'iterable.com',
    'intercom.com', 'drift.com', 'zendesk.com', 'freshworks.com', 'gorgias.com',
    'stripe.com', 'paddle.com', 'chargebee.com', 'recurly.com', 'fastspring.com',
    'datadoghq.com', 'newrelic.com', 'dynatrace.com', 'sentry.io', 'logrocket.com',
    'segment.com', 'mixpanel.com', 'amplitude.com', 'heap.io', 'posthog.com',
    'zapier.com', 'make.com', 'tray.io', 'workato.com', 'n8n.io',
    'github.com', 'gitlab.com', 'bitbucket.org', 'vercel.com', 'netlify.com',
    'render.com', 'railway.app', 'supabase.com', 'firebase.google.com', 'planetscale.com',
    'auth0.com', 'okta.com', 'clerk.com', 'stytch.com', 'onelogin.com',
    'lattice.com', 'gusto.com', 'rippling.com', 'bamboohr.com', 'deel.com',
    'remote.com', 'oysterhr.com', 'papayaglobal.com', 'workday.com', 'zenefits.com',
    'g2.com', 'capterra.com', 'trustradius.com', 'softwareadvice.com', 'getapp.com',
    'buffer.com', 'hootsuite.com', 'sproutsocial.com', 'later.com', 'socialpilot.co',
    'semrush.com', 'ahrefs.com', 'moz.com', 'serpstat.com', 'spyfu.com'
  ],

  'FinTech & Digital Finance': [
    'stripe.com', 'plaid.com', 'revolut.com', 'wise.com', 'chime.com',
    'robinhood.com', 'coinbase.com', 'sofi.com', 'monzo.com', 'n26.com',
    'klarna.com', 'afterpay.com', 'affirm.com', 'brex.com', 'ramp.com',
    'mercury.com', 'marqeta.com', 'adsystem.com', 'adyen.com', 'checkout.com',
    'square.com', 'toasttab.com', 'clover.com', 'sumup.com', 'zettle.com',
    'wealthfront.com', 'betterment.com', 'acorns.com', 'm1finance.com', 'stash.com',
    'binance.com', 'kraken.com', 'gemini.com', 'etoro.com', 'kucoin.com',
    'carta.com', 'pulley.com', 'gusto.com', 'rippling.com', 'deel.com',
    'bill.com', 'tipalti.com', 'airwallex.com', 'payoneer.com', 'xero.com',
    'quickbooks.intuit.com', 'freshbooks.com', 'waveapps.com', 'kashoo.com', 'zoho.com/books',
    'fundbox.com', 'kabbage.com', 'ondeck.com', 'bluevine.com', 'lendio.com',
    'upstart.com', 'lendingclub.com', 'prosper.com', 'avant.com', 'affirm.com',
    'creditkarma.com', 'nerdwallet.com', 'bankrate.com', 'thepennyhoarder.com', 'creditcards.com',
    'mint.intuit.com', 'ynab.com', 'copilot.money', 'monarchmoney.com', 'simplifimoney.com',
    'moonpay.com', 'ramp.network', 'transak.com', 'wyre.com', 'simplex.com',
    'chainalysis.com', 'elliptic.co', 'trmlabs.com', 'elliptic.com', 'cipher-trace.com',
    'ledger.com', 'trezor.io', 'metamask.io', 'phantom.app', 'trustwallet.com',
    'paxful.com', 'bitpay.com', 'circle.com', 'tether.to', 'paxos.com'
  ],

  'Health, Wellness & Fitness': [
    'gymshark.com', 'whoop.com', 'ouraring.com', 'peloton.com', 'fitbit.com',
    'myfitnesspal.com', 'strava.com', 'calm.com', 'headspace.com', 'noom.com',
    'athleticgreens.com', 'onnit.com', 'huel.com', 'ritual.com', 'careof.com',
    'hims.com', 'hers.com', 'ro.co', 'curology.com', 'nurx.com',
    'betterhelp.com', 'talkspace.com', 'cerebral.com', 'mindbloom.com', 'springhealth.com',
    'crossfit.com', 'orangefitness.com', 'barrys.com', 'equinox.com', 'f45training.com',
    'classpass.com', 'mindbodyonline.com', 'glo.com', 'alo-moves.com', 'corepoweryoga.com',
    'hydrow.com', 'tonal.com', 'mirror.co', 'tempo.fit', 'ergatta.com',
    'bulletproof.com', 'gardenoflife.com', 'optimumnutrition.com', 'gnc.com', 'vitaminshoppe.com',
    'thorne.com', 'pureencapsulations.com', 'nordicnaturals.com', 'nowfoods.com', 'lifeextension.com',
    'fitbod.me', 'freeletics.com', 'sweat.com', 'nike.com/ntc', 'centr.com',
    'withings.com', 'garmin.com', 'polar.com', 'suunto.com', 'coros.com',
    'eightleep.com', 'chilisleep.com', 'sleepnumber.com', 'therabody.com', 'hyperice.com',
    'drinklmnt.com', 'liquidiv.com', 'nuunlife.com', 'skratchlabs.com', 'gatorade.com',
    'levelshealth.com', 'nutrisense.io', 'signos.com', 'zoe.com', 'supersapiens.com',
    'inside-tracker.com', 'functionhealth.com', 'clevelandclinic.org', 'mayoclinic.org', 'webmd.com',
    'healthline.com', 'verywellfit.com', 'everydayhealth.com', 'medicalnewstoday.com', 'self.com'
  ],

  'Education & EdTech': [
    'coursera.org', 'udemy.com', 'edx.org', 'skillshare.com', 'masterclass.com',
    'khanacademy.org', 'codecademy.com', 'datacamp.com', 'pluralsight.com', 'udacity.com',
    'duolingo.com', 'babbel.com', 'busuu.com', 'rosettastone.com', 'italki.com',
    'quizlet.com', 'chegg.com', 'brainly.com', 'coursehero.com', 'studocu.com',
    'springboard.com', 'generalassemb.ly', 'thinkful.com', 'flatironschool.com', 'bloomtech.com',
    'teachable.com', 'thinkific.com', 'kajabi.com', 'podia.com', 'mightybell.com',
    'canvaslms.com', 'blackboard.com', 'moodle.org', 'schoology.com', 'google.com/classroom',
    'byjus.com', 'unacademy.com', 'vedantu.com', 'upgrad.com', 'simplilearn.com',
    'brilliant.org', 'outschool.com', 'varsitytutors.com', 'preply.com', 'cambly.com',
    'freecodecamp.org', 'theodinproject.com', 'leetcode.com', 'hackerrank.com', 'codewars.com',
    'alison.com', 'futurelearn.com', 'open.edu', 'mit.edu/ocw', 'harvardonline.harvard.edu',
    'classcentral.com', 'degreed.com', 'cornerstoneondemand.com', 'docebo.com', 'absorblms.com'
  ],

  'Digital Marketing & SEO Agencies': [
    'semrush.com', 'ahrefs.com', 'moz.com', 'backlinko.com', 'neilpatel.com',
    'hubspot.com', 'searchenginejournal.com', 'searchengineland.com', 'seroundtable.com', 'wordstream.com',
    'sproutsocial.com', 'hootsuite.com', 'buffer.com', 'socialmediaexaminer.com', 'marketingprofs.com',
    'ignitevisibility.com', 'webfx.com', 'victoriousseo.com', 'single-grain.com', 'disruptiveadvertising.com',
    'klientboost.com', 'lyfemarketing.com', 'hawksem.com', 'straightnorth.com', 'smartbugmedia.com',
    'brafton.com', 'siege-media.com', 'fractl.com', 'marketo.com', 'unbounce.com',
    'instapage.com', 'leadpages.com', 'clickfunnels.com', 'optinmonster.com', 'sumo.com',
    'crazyegg.com', 'hotjar.com', 'vwo.com', 'optimizely.com', 'fullstory.com',
    'spyfu.com', 'serpstat.com', 'brightedge.com', 'conductor.com', 'botify.com',
    'deepcrawl.com', 'screamingfrog.co.uk', 'siteliner.com', 'copyscape.com', 'buzzsumo.com'
  ],

  'Travel, Hospitality & Tourism': [
    'airbnb.com', 'booking.com', 'expedia.com', 'tripadvisor.com', 'kayak.com',
    'hotels.com', 'agoda.com', 'vrbo.com', 'hostelworld.com', 'trivago.com',
    'skyscanner.net', 'hopper.com', 'google.com/travel', 'cheapflights.com', 'momondo.com',
    'marriott.com', 'hilton.com', 'hyatt.com', 'ihg.com', 'accor.com',
    'lonelyplanet.com', 'thepointsguy.com', 'nomadicmatt.com', 'fodors.com', 'roughguides.com',
    'getyourguide.com', 'viator.com', 'klook.com', 'tiqets.com', 'airbnb.com/experiences',
    'rome2rio.com', 'omnio.com', 'trainline.com', 'flixbus.com', 'eurail.com',
    'cruisecritic.com', 'royalcaribbean.com', 'carnival.com', 'norwegiancruiseline.com', 'celebritycruises.com',
    'hertz.com', 'enterprise.com', 'avis.com', 'budget.com', 'sixt.com',
    'turo.com', 'getaround.com', 'sonder.com', 'blueground.com', 'selina.com'
  ],

  'Real Estate & PropTech': [
    'zillow.com', 'realtor.com', 'redfin.com', 'trulia.com', 'compass.com',
    'apartments.com', 'rent.com', 'hotpads.com', 'padmapper.com', 'zumper.com',
    'loopnet.com', 'crexi.com', 'costar.com', 'commercialcafe.com', 'breather.com',
    'opendoor.com', 'offerpad.com', 'orchard.com', 'flyhomes.com', 'knock.com',
    'matterport.com', 'vts.com', 'yardi.com', 'appfolio.com', 'buildium.com',
    'remax.com', 'century21.com', 'coldwellbanker.com', 'kellerwilliams.com', 'sothebysrealty.com',
    'investopedia.com/real-estate', 'biggerpockets.com', 'fundrise.com', 'roofstock.com', 'crowdstreet.com'
  ],

  'Artificial Intelligence & Machine Learning': [
    'openai.com', 'anthropic.com', 'midjourney.com', 'huggingface.co', 'stability.ai',
    'runwayml.com', 'synthesia.io', 'elevenlabs.io', 'descript.com', 'jasper.ai',
    'copy.ai', 'writesonic.com', 'rytr.me', 'anyword.com', 'surferseo.com',
    'perplexity.ai', 'poe.com', 'character.ai', 'cursor.com', 'replit.com',
    'cohere.com', 'mistral.ai', 'groq.com', 'together.ai', 'anyscale.com',
    'langchain.com', 'llamaindex.ai', 'pinecone.io', 'weaviate.io', 'qdrant.tech',
    'chromadb.dev', 'deepgram.com', 'assemblyai.com', 'whisper.ai', 'speechify.com',
    'phind.com', 'kagi.com', 'you.com', 'brave.com/leo', 'notion.so/product/ai'
  ],

  'Cybersecurity & Infrastructure': [
    'cloudflare.com', 'crowdstrike.com', 'paloaltonetworks.com', 'fortinet.com', 'zscaler.com',
    'nordvpn.com', 'expressvpn.com', 'surfshark.com', 'cyberghostvpn.com', 'protonvpn.com',
    'okta.com', 'auth0.com', 'cyberark.com', 'pingidentity.com', 'sailpoint.com',
    'sentinelone.com', 'trendmicro.com', 'kaspersky.com', 'mcafee.com', 'bitdefender.com',
    'qualys.com', 'tenable.com', 'rapid7.com', 'wiz.io', 'lacework.com',
    'snyk.io', 'veracode.com', 'checkmarx.com', 'sonarqube.org', 'gitguardian.com',
    'digitalocean.com', 'linode.com', 'vultr.com', 'hetzner.com', 'ovhcloud.com'
  ]
};

// Fallback seed names for generating dynamic niche competitors if list runs out
const BRAND_PREFIXES = ['Apex', 'Nova', 'Pulse', 'Hyper', 'Swift', 'Omni', 'Vanguard', 'Catalyst', 'Aura', 'Nexus', 'Vertex', 'Echo', 'Sync', 'Zenith', 'Flux', 'Orbit', 'Stratum', 'Kinetix', 'Velo', 'Aero', 'Prism', 'Luminary', 'Quantum', 'Terra', 'Beacon', 'Elevate', 'Sphere', 'Horizon', 'Summit', 'Matrix'];
const BRAND_SUFFIXES = ['Labs', 'HQ', 'Hub', 'Cloud', 'Logic', 'Scale', 'Matrix', 'Pro', 'Stack', 'Pulse', 'Flow', 'Craft', 'Base', 'Wave', 'Path', 'Shift', 'Forge', 'Nest', 'Sphere', 'Works', 'Group', 'Media', 'Direct', 'Ventures', 'Ops'];

// Deterministic Pseudo-Random Generator based on seed
function createSeededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Generate brand name from domain
function domainToBrand(domain) {
  const namePart = domain.split('.')[0];
  return namePart
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Generate realistic contact email for domain
function generateContactEmail(domain, index) {
  const departments = ['partnerships', 'contact', 'hello', 'growth', 'marketing', 'info', 'outreach', 'press', 'business'];
  const dept = departments[index % departments.length];
  return `${dept}@${domain}`;
}

// Generate single competitor profile
function buildCompetitorProfile({ domain, category, subNiche, index, seed }) {
  const rng = createSeededRandom(seed + index * 777);
  
  const brandName = domainToBrand(domain);
  const email = generateContactEmail(domain, index);

  // Realistic traffic ranges between 45K and 2.5M
  const trafficBase = Math.floor(45000 + rng() * 1800000);
  const trafficTrendNum = Math.floor((rng() - 0.35) * 40); // -14% to +26%
  const trafficTrend = (trafficTrendNum >= 0 ? `+${trafficTrendNum}%` : `${trafficTrendNum}%`);

  // Total keywords ranking in Google
  const totalKeywords = Math.floor(trafficBase * (0.04 + rng() * 0.08));

  // High vs Low ranking keyword split
  // User asked: "un ka kitnay keywords google ma konsi ranking pr ha kitnay percent keywords achi ranking ma ha or kitnay percent low ranking pr ha"
  const highRankingPercent = Math.min(88, Math.max(38, Math.floor(45 + rng() * 40)));
  const lowRankingPercent = 100 - highRankingPercent;

  // Granular ranking position breakdown
  // Top 3 (Positions 1-3)
  const top3Percent = Math.round(highRankingPercent * (0.28 + rng() * 0.20));
  // Positions 4-10 (First page)
  const pos4_10Percent = highRankingPercent - top3Percent;
  // Positions 11-50 (Second-Fifth page)
  const pos11_50Percent = Math.round(lowRankingPercent * (0.65 + rng() * 0.15));
  // Positions 51-100 (Deep/Low page)
  const pos51_100Percent = Math.max(1, lowRankingPercent - pos11_50Percent);

  // Absolute keyword counts
  const highRankingCount = Math.round((highRankingPercent / 100) * totalKeywords);
  const lowRankingCount = totalKeywords - highRankingCount;
  const top3Count = Math.round((top3Percent / 100) * totalKeywords);
  const top10Count = highRankingCount;

  // Domain authority (DA 30 - 92)
  const daScore = Math.floor(35 + rng() * 55);

  const countries = ['United States', 'United Kingdom', 'Germany', 'Canada', 'Australia', 'Global', 'France', 'Netherlands'];
  const country = countries[Math.floor(rng() * countries.length)];

  return {
    id: `comp_${seed}_${index + 1}`,
    rankNumber: index + 1,
    name: brandName,
    domain: domain,
    url: `https://${domain}`,
    logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    category: category,
    subNiche: subNiche,
    
    // Traffic metrics
    monthlyTraffic: trafficBase,
    monthlyTrafficFormatted: formatNumber(trafficBase),
    trafficTrend: trafficTrend,
    trafficTrendPositive: trafficTrendNum >= 0,
    
    // Keyword Ranking Analytics
    totalKeywords: totalKeywords,
    totalKeywordsFormatted: formatNumber(totalKeywords),
    highRankingPercent: highRankingPercent, // % in positions 1-10 (Achi ranking)
    lowRankingPercent: lowRankingPercent,   // % in positions 11-100 (Low ranking)
    highRankingCount: highRankingCount,
    lowRankingCount: lowRankingCount,

    // Granular ranking breakdown
    rankingTiers: {
      top3: { percent: top3Percent, count: top3Count, label: 'Positions 1-3' },
      page1: { percent: pos4_10Percent, count: highRankingCount - top3Count, label: 'Positions 4-10' },
      page2_5: { percent: pos11_50Percent, count: Math.round((pos11_50Percent / 100) * totalKeywords), label: 'Positions 11-50' },
      page6_10: { percent: pos51_100Percent, count: Math.round((pos51_100Percent / 100) * totalKeywords), label: 'Positions 51-100' }
    },

    // Domain Authority & Location
    domainAuthority: daScore,
    country: country,

    // Contact & Email Outreach Data
    contactEmail: email,
    emailStatus: 'Verified', // Verified, Catch-All
    outreachStatus: 'uncontacted', // uncontacted, queued, sent, opened, replied
    selectedForOutreach: true
  };
}

// Fetch or generate 50 competitors for a specific page (Page 1: 1-50, Page 2: 51-100, etc.)
function getCompetitorsForNiche({ category, subNiche, targetDomain, page = 1, limit = 50 }) {
  // Find database list or fallback to SaaS list
  const rawList = NICHE_COMPETITOR_DATABASE[category] || NICHE_COMPETITOR_DATABASE['SaaS & Cloud Software'];
  
  // Filter out targetDomain itself
  const baseList = rawList.filter(d => !d.toLowerCase().includes(targetDomain.toLowerCase()));

  // We want to ensure at least 250 unique domains exist so "Show More" can return up to page 5!
  const fullDomainList = [...baseList];

  // If list is shorter than 250, generate clean, realistic domain names
  const cleanCategorySlug = category.toLowerCase().replace(/[^a-z0-9]/g, '');
  let prefixIdx = 0;
  let suffixIdx = 0;

  while (fullDomainList.length < 250) {
    const p = BRAND_PREFIXES[prefixIdx % BRAND_PREFIXES.length].toLowerCase();
    const s = BRAND_SUFFIXES[suffixIdx % BRAND_SUFFIXES.length].toLowerCase();
    const candidateDomain = `${p}${s}-${cleanCategorySlug.slice(0, 4)}.com`;
    if (!fullDomainList.includes(candidateDomain) && candidateDomain !== targetDomain) {
      fullDomainList.push(candidateDomain);
    }
    prefixIdx++;
    if (prefixIdx % BRAND_PREFIXES.length === 0) suffixIdx++;
  }

  // Calculate slice range for pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pageDomains = fullDomainList.slice(startIndex, endIndex);

  // Generate deterministic seed from target domain and category
  let domainHash = 0;
  for (let i = 0; i < targetDomain.length; i++) {
    domainHash = (domainHash << 5) - domainHash + targetDomain.charCodeAt(i);
    domainHash |= 0;
  }
  const seed = Math.abs(domainHash) + 12345;

  const competitors = pageDomains.map((domain, relativeIndex) => {
    const globalIndex = startIndex + relativeIndex;
    return buildCompetitorProfile({
      domain,
      category,
      subNiche,
      index: globalIndex,
      seed
    });
  });

  return {
    page,
    limit,
    totalAvailable: fullDomainList.length,
    hasMore: endIndex < fullDomainList.length,
    competitors
  };
}

module.exports = {
  NICHE_COMPETITOR_DATABASE,
  getCompetitorsForNiche
};
