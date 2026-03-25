export const criteriaWeights = {
  stability: 0.2,
  compensation: 0.2,
  hiringProcess: 0.1,
  workAtmosphere: 0.3,
  careerGrowth: 0.2,
};

export const breakdownLabels = {
  stability: 'Stability',
  compensation: 'Compensation',
  hiringProcess: 'Hiring Process',
  workAtmosphere: 'Work Atmosphere',
  careerGrowth: 'Career Growth',
};

export const calculateEvilScore = (breakdown) => {
  return Math.round(
    Object.entries(criteriaWeights).reduce((sum, [key, weight]) => sum + (breakdown[key] || 0) * weight, 0),
  );
};

export const getVerdict = (score) => {
  if (score >= 80) return 'TOXIC';
  if (score >= 60) return 'HARMFUL';
  if (score >= 40) return 'CAUTION';
  return 'MOSTLY OK';
};

export const getVerdictColor = (score) => {
  if (score >= 80) return '#ff1744';
  if (score >= 60) return '#ff6d00';
  if (score >= 40) return '#ffc400';
  return '#00e676';
};

export const getScoreColor = (score) => {
  const hue = 140 * (1 - score / 100);
  return `hsl(${hue}, 100%, 50%)`;
};

// Evil Index = stability×0.20 + compensation×0.20 + hiringProcess×0.10 + workAtmosphere×0.30 + careerGrowth×0.20
// Each criterion: 0-100 (higher = worse / more evil)
// Confidence: high (50+ signals, 3+ sources), medium (15-49 signals or 2 sources), low (<15 signals or 1 source)

export const companies = [
  {
    id: 1,
    name: 'DarkMatter Labs',
    ticker: 'DKMT',
    industry: 'Defense & Surveillance',
    logo: 'DM',
    employeeCount: '12,000+',
    founded: 1998,
    hq: 'Arlington, VA',
    breakdown: {
      stability: 82,
      compensation: 68,
      hiringProcess: 78,
      workAtmosphere: 95,
      careerGrowth: 80,
    },
    // EI: 82×0.2 + 68×0.2 + 78×0.1 + 95×0.3 + 80×0.2 = 82
    evilScore: 82,
    confidence: 'high',
    intelSummary:
      'Classified government contracts with near-zero transparency. Whistleblower reports cite mandatory 70-hour weeks during project sprints with no overtime compensation. Three former directors currently under investigation for workplace harassment. Employee NDAs prevent public disclosure of working conditions. Recent Glassdoor purge suspected after negative reviews disappeared overnight.',
    sources: { reddit: 0.15, glassdoor: 0.2, news: 0.45, linkedin: 0.2 },
    signals: 3847,
    lastUpdated: '2024-03-18',
    tags: ['surveillance', 'NDAs', 'whistleblower-retaliation', 'mandatory-overtime', 'harassment-lawsuits'],
    trending: 'up',
  },
  {
    id: 2,
    name: 'IronGrip Financial',
    ticker: 'IRON',
    industry: 'Investment Banking',
    logo: 'IG',
    employeeCount: '45,000+',
    founded: 1952,
    hq: 'New York, NY',
    breakdown: {
      stability: 65,
      compensation: 55,
      hiringProcess: 78,
      workAtmosphere: 92,
      careerGrowth: 58,
    },
    // EI: 65×0.2 + 55×0.2 + 78×0.1 + 92×0.3 + 58×0.2 = 71
    evilScore: 71,
    confidence: 'high',
    intelSummary:
      "Industry-leading compensation masks a brutal work culture. Junior analysts report 100+ hour weeks as standard. Multiple gender discrimination lawsuits settled out of court in 2023. Proprietary 'performance stacking' system forces bottom 15% out quarterly. Mental health claims up 340% since 2021 per leaked insurance data.",
    sources: { reddit: 0.3, glassdoor: 0.25, news: 0.35, linkedin: 0.1 },
    signals: 5231,
    lastUpdated: '2024-03-20',
    tags: ['100-hour-weeks', 'stack-ranking', 'gender-discrimination', 'golden-handcuffs', 'mental-health-crisis'],
    trending: 'up',
  },
  {
    id: 3,
    name: 'CrunchTime Studios',
    ticker: 'CRNCH',
    industry: 'Game Development',
    logo: 'CT',
    employeeCount: '3,200',
    founded: 2010,
    hq: 'Los Angeles, CA',
    breakdown: {
      stability: 78,
      compensation: 80,
      hiringProcess: 45,
      workAtmosphere: 90,
      careerGrowth: 72,
    },
    // EI: 78×0.2 + 80×0.2 + 45×0.1 + 90×0.3 + 72×0.2 = 78
    evilScore: 78,
    confidence: 'high',
    intelSummary:
      "Notorious 'crunch culture' with mandatory 80-hour weeks in the 6 months before every release. Studio promised reforms after viral 2022 expose but anonymous employee surveys show no improvement. Contractors make up 60% of dev team with no benefits. Three mass layoffs in 18 months, each followed by immediate rehiring at lower pay grades.",
    sources: { reddit: 0.4, glassdoor: 0.2, news: 0.3, linkedin: 0.1 },
    signals: 4102,
    lastUpdated: '2024-03-19',
    tags: ['crunch-culture', 'contractor-exploitation', 'mass-layoffs', 'bait-and-switch', 'unpaid-overtime'],
    trending: 'stable',
  },
  {
    id: 4,
    name: 'MegaCorp Industries',
    ticker: 'MEGA',
    industry: 'Big Tech',
    logo: 'MC',
    employeeCount: '180,000+',
    founded: 2004,
    hq: 'San Francisco, CA',
    breakdown: {
      stability: 80,
      compensation: 35,
      hiringProcess: 70,
      workAtmosphere: 72,
      careerGrowth: 65,
    },
    // EI: 80×0.2 + 35×0.2 + 70×0.1 + 72×0.3 + 65×0.2 = 65
    evilScore: 65,
    confidence: 'high',
    intelSummary:
      "Despite generous compensation packages, internal documents reveal a culture of fear around performance reviews. Surprise layoffs of 12,000 employees contradicted CEO's 'no layoffs' pledge from 6 months prior. Aggressive return-to-office mandate caused 23% attrition. Anonymous reports cite middle management creating 'shadow PIPs' to force out senior engineers.",
    sources: { reddit: 0.35, glassdoor: 0.25, news: 0.25, linkedin: 0.15 },
    signals: 8934,
    lastUpdated: '2024-03-21',
    tags: ['mass-layoffs', 'mandatory-rto', 'shadow-PIPs', 'broken-promises', 'surveillance'],
    trending: 'up',
  },
  {
    id: 5,
    name: 'PivotFast Inc',
    ticker: 'PVOT',
    industry: 'SaaS Startup',
    logo: 'PF',
    employeeCount: '450',
    founded: 2019,
    hq: 'Austin, TX',
    breakdown: {
      stability: 82,
      compensation: 72,
      hiringProcess: 40,
      workAtmosphere: 74,
      careerGrowth: 55,
    },
    // EI: 82×0.2 + 72×0.2 + 40×0.1 + 74×0.3 + 55×0.2 = 68
    evilScore: 68,
    confidence: 'medium',
    intelSummary:
      "Classic startup chaos \u2014 pivoted business model 4 times in 2 years. Equity promises are murky with reports of retroactive vesting changes. CEO publicly celebrates 'hustle culture' while employee Blind posts describe unsustainable workloads. Series B funding came with 30% headcount reduction. Engineers report being on-call 24/7 with no compensation.",
    sources: { reddit: 0.25, glassdoor: 0.3, news: 0.15, linkedin: 0.3 },
    signals: 1876,
    lastUpdated: '2024-03-17',
    tags: ['hustle-culture', 'equity-manipulation', 'constant-pivots', 'on-call-abuse', 'startup-chaos'],
    trending: 'stable',
  },
  {
    id: 6,
    name: 'Buzzworthy Media',
    ticker: 'BUZZ',
    industry: 'Digital Media',
    logo: 'BW',
    employeeCount: '2,800',
    founded: 2012,
    hq: 'Brooklyn, NY',
    breakdown: {
      stability: 70,
      compensation: 78,
      hiringProcess: 35,
      workAtmosphere: 65,
      careerGrowth: 62,
    },
    // EI: 70×0.2 + 78×0.2 + 35×0.1 + 65×0.3 + 62×0.2 = 65
    evilScore: 65,
    confidence: 'medium',
    intelSummary:
      "Content creators report earning below industry average while company touts record ad revenue. Unionization effort met with aggressive anti-union campaign including mandatory 'information sessions.' High turnover in editorial with average tenure under 14 months. Recent pivot to AI-generated content eliminated 200 writing positions.",
    sources: { reddit: 0.35, glassdoor: 0.25, news: 0.3, linkedin: 0.1 },
    signals: 2341,
    lastUpdated: '2024-03-16',
    tags: ['union-busting', 'low-pay', 'AI-replacement', 'high-turnover', 'anti-union'],
    trending: 'down',
  },
  {
    id: 7,
    name: 'CloudNine Solutions',
    ticker: 'CLD9',
    industry: 'Cloud Computing',
    logo: 'C9',
    employeeCount: '8,500',
    founded: 2015,
    hq: 'Seattle, WA',
    breakdown: {
      stability: 55,
      compensation: 42,
      hiringProcess: 50,
      workAtmosphere: 55,
      careerGrowth: 48,
    },
    // EI: 55×0.2 + 42×0.2 + 50×0.1 + 55×0.3 + 48×0.2 = 51
    evilScore: 51,
    confidence: 'medium',
    intelSummary:
      'Middle-of-the-road employer with pockets of dysfunction. Engineering teams report good culture, but sales and support divisions describe intense pressure and unrealistic quotas. Benefits package is competitive but PTO usage is discouraged by team leads. Two VP-level departures in Q4 triggered concerns about strategic direction.',
    sources: { reddit: 0.2, glassdoor: 0.35, news: 0.15, linkedin: 0.3 },
    signals: 1543,
    lastUpdated: '2024-03-15',
    tags: ['inconsistent-culture', 'PTO-shaming', 'leadership-churn', 'sales-pressure'],
    trending: 'stable',
  },
  {
    id: 8,
    name: 'TechnoServe Global',
    ticker: 'TSRV',
    industry: 'IT Consulting',
    logo: 'TS',
    employeeCount: '95,000+',
    founded: 1987,
    hq: 'Chicago, IL',
    breakdown: {
      stability: 35,
      compensation: 58,
      hiringProcess: 42,
      workAtmosphere: 48,
      careerGrowth: 55,
    },
    // EI: 35×0.2 + 58×0.2 + 42×0.1 + 48×0.3 + 55×0.2 = 48
    evilScore: 48,
    confidence: 'high',
    intelSummary:
      'Legacy consulting firm with bureaucratic but stable culture. Pay bands are rigid and below market for senior roles. Client-site work creates work-life balance challenges. Internal mobility is limited by politics. Recent DEI initiatives have shown measurable improvement in hiring diversity, though promotion gaps persist.',
    sources: { reddit: 0.15, glassdoor: 0.4, news: 0.1, linkedin: 0.35 },
    signals: 2890,
    lastUpdated: '2024-03-14',
    tags: ['bureaucracy', 'below-market-pay', 'travel-heavy', 'slow-promotion'],
    trending: 'down',
  },
  {
    id: 9,
    name: 'SteadyShip Logistics',
    ticker: 'SHIP',
    industry: 'Supply Chain',
    logo: 'SS',
    employeeCount: '22,000',
    founded: 1975,
    hq: 'Minneapolis, MN',
    breakdown: {
      stability: 20,
      compensation: 42,
      hiringProcess: 30,
      workAtmosphere: 32,
      careerGrowth: 45,
    },
    // EI: 20×0.2 + 42×0.2 + 30×0.1 + 32×0.3 + 45×0.2 = 34
    evilScore: 34,
    confidence: 'medium',
    intelSummary:
      "Old-school company with genuinely stable employment. Benefits are solid and work-life balance is respected in most divisions. Main complaints center on slow innovation and outdated technology stack. Warehouse workers report better conditions than industry average. Pay is fair but not exciting \u2014 'you won't get rich, but you won't get burned.'",
    sources: { reddit: 0.1, glassdoor: 0.45, news: 0.1, linkedin: 0.35 },
    signals: 987,
    lastUpdated: '2024-03-12',
    tags: ['stable', 'outdated-tech', 'fair-benefits', 'slow-growth'],
    trending: 'stable',
  },
  {
    id: 10,
    name: 'GreenLeaf Labs',
    ticker: 'GRNL',
    industry: 'Biotech / B-Corp',
    logo: 'GL',
    employeeCount: '1,200',
    founded: 2016,
    hq: 'Portland, OR',
    breakdown: {
      stability: 30,
      compensation: 35,
      hiringProcess: 20,
      workAtmosphere: 15,
      careerGrowth: 22,
    },
    // EI: 30×0.2 + 35×0.2 + 20×0.1 + 15×0.3 + 22×0.2 = 24
    evilScore: 24,
    confidence: 'medium',
    intelSummary:
      'Certified B-Corp with transparent salary bands and genuine work-life balance policies. 4-day work week pilot reported 95% employee satisfaction. Open-book financials and elected employee representatives on the board. Not perfect \u2014 startup-phase growing pains and below-market pay for some roles \u2014 but consistently rated as a workplace that practices what it preaches.',
    sources: { reddit: 0.2, glassdoor: 0.3, news: 0.2, linkedin: 0.3 },
    signals: 634,
    lastUpdated: '2024-03-10',
    tags: ['B-Corp', '4-day-week', 'transparent-pay', 'employee-board-seats'],
    trending: 'stable',
  },
];
