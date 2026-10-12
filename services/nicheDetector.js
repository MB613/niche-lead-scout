const axios = require('axios');
const cheerio = require('cheerio');

// Industry dictionary with keyword signatures
const NICHE_SIGNATURES = [
  {
    category: 'E-Commerce & DTC Brands',
    subNiches: ['Fashion & Apparel', 'Footwear & Streetwear', 'Beauty & Skincare', 'Home & Living', 'Consumer Electronics', 'Jewelry & Accessories'],
    keywords: ['shop', 'store', 'cart', 'checkout', 'clothing', 'apparel', 'fashion', 'shoes', 'wear', 'beauty', 'skincare', 'cosmetics', 'dresses', 'shipping', 'order', 'discount', 'products', 'boutique', 'collection']
  },
  {
    category: 'SaaS & Cloud Software',
    subNiches: ['CRM & Sales Automation', 'Productivity & Workspaces', 'Project Management', 'Marketing Automation', 'Analytics & BI', 'Developer Tools'],
    keywords: ['software', 'saas', 'platform', 'app', 'pricing', 'api', 'automation', 'crm', 'workflow', 'dashboard', 'integration', 'cloud', 'analytics', 'management', 'collaboration', 'subscription', 'free trial', 'team']
  },
  {
    category: 'FinTech & Digital Finance',
    subNiches: ['Payment Gateways', 'Personal Finance & Budgeting', 'Crypto & Web3', 'Investment Platforms', 'Neobanks', 'Accounting Software'],
    keywords: ['payment', 'finance', 'fintech', 'banking', 'crypto', 'bitcoin', 'wallet', 'invest', 'trading', 'loan', 'credit', 'money', 'transfers', 'payroll', 'stocks', 'portfolio', 'interest rate']
  },
  {
    category: 'Health, Wellness & Fitness',
    subNiches: ['Gym & Fitness Apparel', 'Supplements & Nutrition', 'Mental Health & Meditation', 'Telehealth & Medical', 'Yoga & Mindfulness'],
    keywords: ['fitness', 'workout', 'gym', 'health', 'wellness', 'nutrition', 'supplements', 'protein', 'mental health', 'therapy', 'medical', 'doctor', 'weight loss', 'trainer', 'exercise', 'diet']
  },
  {
    category: 'Education & EdTech',
    subNiches: ['Online Course Platforms', 'Language Learning', 'Coding Bootcamps', 'Academic Tutoring', 'Corporate Training'],
    keywords: ['course', 'learn', 'education', 'academy', 'university', 'student', 'certifications', 'degree', 'training', 'tutor', 'classes', 'skills', 'school', 'curriculum', 'lecture', 'teaching']
  },
  {
    category: 'Travel, Hospitality & Tourism',
    subNiches: ['Flight & Hotel Booking', 'Vacation Rentals', 'Tour Guides & Excursions', 'Travel Planning & Luggage'],
    keywords: ['travel', 'flight', 'hotel', 'booking', 'vacation', 'trip', 'destination', 'resort', 'tickets', 'tourism', 'airlines', 'luggage', 'holiday', 'rental', 'car rental']
  },
  {
    category: 'Digital Marketing & SEO Agencies',
    subNiches: ['SEO & Organic Search', 'PPC & Performance Ads', 'Content Marketing', 'Social Media Management', 'Email Marketing'],
    keywords: ['marketing', 'seo', 'advertising', 'agency', 'growth', 'leads', 'traffic', 'ppc', 'campaigns', 'social media', 'content', 'branding', 'rankings', 'conversion', 'outreach']
  },
  {
    category: 'Real Estate & PropTech',
    subNiches: ['Property Listings', 'Mortgage & Lending', 'Commercial Real Estate', 'Property Management Software'],
    keywords: ['real estate', 'realty', 'property', 'homes', 'apartments', 'rent', 'mortgage', 'buy house', 'condos', 'listings', 'broker', 'tenants']
  },
  {
    category: 'Artificial Intelligence & Machine Learning',
    subNiches: ['Generative AI & LLMs', 'AI Agents & Automation', 'Computer Vision & Media', 'AI Coding Assistants'],
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'llm', 'neural', 'bot', 'gpt', 'model', 'agent', 'automation', 'deep learning', 'generate', 'prompt']
  },
  {
    category: 'Cybersecurity & Infrastructure',
    subNiches: ['Network Security & VPN', 'Cloud Security & Compliance', 'Identity & Access Management', 'DevOps & Hosting'],
    keywords: ['security', 'cybersecurity', 'vpn', 'firewall', 'protection', 'privacy', 'hosting', 'server', 'devops', 'backup', 'threat', 'antivirus', 'encryption', 'compliance']
  }
];

// Clean and standardize URLs
function cleanUrl(inputUrl) {
  let url = inputUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, '').toLowerCase();
    return {
      normalizedUrl: parsed.origin,
      domain: domain,
      pathname: parsed.pathname
    };
  } catch (err) {
    let domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    return {
      normalizedUrl: `https://${domain}`,
      domain: domain,
      pathname: '/'
    };
  }
}

// Extract domain brand name
function extractBrandName(domain) {
  const parts = domain.split('.');
  const name = parts[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Scrape and analyze target website
async function analyzeTargetWebsite(inputUrl) {
  const { normalizedUrl, domain } = cleanUrl(inputUrl);
  let pageTitle = '';
  let metaDescription = '';
  let metaKeywords = '';
  let headings = [];
  let scrapedSuccessfully = false;

  try {
    const response = await axios.get(normalizedUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (response.data && typeof response.data === 'string') {
      const $ = cheerio.load(response.data);
      pageTitle = $('title').text().trim() || '';
      metaDescription = $('meta[name="description"]').attr('content') ||
                        $('meta[property="og:description"]').attr('content') || '';
      metaKeywords = $('meta[name="keywords"]').attr('content') || '';

      $('h1, h2').slice(0, 5).each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length < 100) headings.push(text);
      });

      scrapedSuccessfully = true;
    }
  } catch (err) {
    // If blocked or offline, use heuristic based on domain tokens
    scrapedSuccessfully = false;
  }

  // Combine collected text for classification
  const fullTextCorpus = [
    domain,
    pageTitle,
    metaDescription,
    metaKeywords,
    headings.join(' ')
  ].join(' ').toLowerCase();

  // Score against niches
  let bestNiche = NICHE_SIGNATURES[1]; // default SaaS
  let highestScore = -1;

  for (const item of NICHE_SIGNATURES) {
    let score = 0;
    for (const kw of item.keywords) {
      if (domain.includes(kw)) score += 5; // domain match has highest weight
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = fullTextCorpus.match(regex);
      if (matches) {
        score += matches.length * 1.5;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestNiche = item;
    }
  }

  // Pick sub-niche
  const subNiche = bestNiche.subNiches[Math.floor(Math.random() * bestNiche.subNiches.length)];
  const brandName = pageTitle ? pageTitle.split(/[-|:]/)[0].trim() : extractBrandName(domain);

  // Generate realistic analytics for target site
  // Deterministic seed based on domain name
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const estimatedTraffic = 150000 + (absHash % 850000);
  const totalKeywords = 8000 + (absHash % 45000);
  const highRankingPercent = 45 + (absHash % 35); // 45% - 80%
  const lowRankingPercent = 100 - highRankingPercent;

  return {
    domain,
    brandName,
    url: normalizedUrl,
    title: pageTitle || `${brandName} Official Website`,
    description: metaDescription || `Leading platform in ${bestNiche.category} offering specialized services and digital solutions.`,
    category: bestNiche.category,
    subNiche: subNiche,
    scrapedSuccessfully,
    traffic: estimatedTraffic,
    trafficFormatted: formatNumber(estimatedTraffic),
    totalKeywords: totalKeywords,
    highRankingPercent: highRankingPercent,
    lowRankingPercent: lowRankingPercent,
    top3Percent: Math.round(highRankingPercent * 0.35),
    top10Percent: Math.round(highRankingPercent * 0.65),
    pos11_50Percent: Math.round(lowRankingPercent * 0.70),
    pos51_100Percent: Math.round(lowRankingPercent * 0.30),
    daScore: 50 + (absHash % 42)
  };
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

module.exports = {
  cleanUrl,
  analyzeTargetWebsite,
  NICHE_SIGNATURES,
  formatNumber
};
