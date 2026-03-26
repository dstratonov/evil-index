#!/usr/bin/env node

/**
 * Evil Index — Company Discovery Pipeline
 *
 * Uses Claude + web search to discover top IT/tech companies to score.
 * Outputs companies.json (names) and company-meta.json (metadata).
 *
 * Usage:
 *   node discover.js
 *   node discover.js --count 100
 *   node discover.js --api-key sk-ant-...
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseArgs } from 'node:util';
import { writeFile, readFile } from 'node:fs/promises';

const { values: args } = parseArgs({
  options: {
    'api-key': { type: 'string', short: 'k' },
    model: { type: 'string', short: 'm', default: 'claude-sonnet-4-20250514' },
    count: { type: 'string', default: '100' },
    out: { type: 'string', short: 'o', default: 'companies.json' },
    'meta-out': { type: 'string', default: 'company-meta.json' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (args.help) {
  console.log(`
Evil Index — Company Discovery

Discovers top IT/tech companies to score using Claude + web search.

Options:
  -k, --api-key <key>       Anthropic API key (or ANTHROPIC_API_KEY env var)
  -m, --model <model>       Claude model (default: claude-sonnet-4-20250514)
      --count <n>            Target number of companies (default: 100)
  -o, --out <file>           Output companies list (default: companies.json)
      --meta-out <file>      Output metadata (default: company-meta.json)
  -h, --help                 Show help
  `);
  process.exit(0);
}

const apiKey = args['api-key'] || process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: No API key. Use --api-key or set ANTHROPIC_API_KEY env var.');
  process.exit(1);
}

const targetCount = parseInt(args.count, 10) || 100;

const SYSTEM_PROMPT = `You are a research assistant for the Anxiety Index platform. Your job is to compile a comprehensive list of IT and technology companies that are relevant for workplace stress analysis.

You have access to web_search. Use it to find current, authoritative lists of top tech employers.

REQUIREMENTS:
- Find exactly ${targetCount} companies (or as close as possible)
- Focus on IT/tech companies where software engineers, data scientists, product managers, and other tech workers are employed
- Do NOT include IT consulting or professional services firms (no Accenture, Deloitte, PwC, EY, KPMG, TCS, Infosys, Wipro, Cognizant, Capgemini, McKinsey, BCG, Bain, DXC, etc.)
- Include a MIX of categories:
  * Big Tech / FAANG (5-10)
  * Enterprise software (15-20)
  * Cloud / SaaS (15-20)
  * Fintech (8-12)
  * Gaming / entertainment tech (5-8)
  * Semiconductor / hardware (5-10)
  * Cybersecurity (5-8)
  * AI / ML companies (8-12)
  * E-commerce / marketplace tech (5-8)
  * E-commerce tech (3-5)
  * High-profile startups & unicorns (10-15)
  * Telecom tech (3-5)
- Only include companies with 500+ employees (enough public data to score)
- Prioritize companies that tech workers actually discuss on Reddit, Glassdoor, Blind, HN
- Use CURRENT names (e.g., "Meta" not "Facebook", "Alphabet/Google" → "Google")
- Do NOT include non-tech companies even if they have IT departments

RESEARCH PROTOCOL:
Search for:
1. "top tech companies to work for 2025 2026"
2. "largest software companies by employees"
3. "most discussed tech employers glassdoor blind reddit"
4. "top fintech companies employers"
5. "top AI companies to work for"
6. "top gaming companies employers"
7. "top cybersecurity companies"
8. "top cloud SaaS companies employers"
9. "top e-commerce technology companies"
10. Any other searches needed to fill categories

OUTPUT FORMAT — STRICT JSON:
Output ONLY a JSON array of objects. No markdown, no preamble.

[
  {
    "name": "Company Name",
    "ticker": "TICK",
    "industry": "Category",
    "logo": "XX",
    "employeeCount": "N,NNN+",
    "founded": YYYY,
    "hq": "City, State/Country"
  },
  ...
]

Rules for fields:
- "name": Official current company name, clean (no Inc., Corp., etc.)
- "ticker": Stock ticker if public, or short 2-4 letter abbreviation if private
- "industry": One of: Big Tech, Enterprise Software, Cloud/SaaS, Fintech, Gaming, Semiconductor, Cybersecurity, AI/ML, E-commerce, Startup/Unicorn, Telecom, Hardware, Other Tech (never IT Consulting)
- "logo": First 1-2 letters of the company name (for display)
- "employeeCount": Approximate with "+" suffix (e.g., "180,000+")
- "founded": Year as integer
- "hq": "City, Country" or "City, State" for US companies`;

const USER_PROMPT = `Search the web and compile a list of the top ${targetCount} IT/tech companies for the Evil Index workplace analysis platform.

Search at least 8 times to cover all categories (big tech, enterprise, consulting, fintech, gaming, AI, cybersecurity, startups).

After researching, output ONLY the JSON array of company objects. No other text.`;

async function discover() {
  const client = new Anthropic({ apiKey });

  console.log(`[Discover] Searching for top ${targetCount} IT companies...`);

  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await client.messages.create({
        model: args.model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 20,
          },
        ],
        messages: [{ role: 'user', content: USER_PROMPT }],
      });
      break;
    } catch (err) {
      if (err.status === 429 && attempt < 3) {
        const wait = Math.min(parseInt(err.headers?.['retry-after'] || '60', 10), 120);
        console.log(`[Discover] Rate limited. Waiting ${wait}s (retry ${attempt + 1}/3)...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
      } else {
        throw err;
      }
    }
  }

  // Count searches
  const searches = response.content
    .filter((b) => b.type === 'server_tool_use' && b.name === 'web_search')
    .map((b) => b.input?.query || '');
  console.log(`[Discover] ${searches.length} web searches performed:`);
  for (const q of searches) console.log(`  -> "${q}"`);

  // Extract JSON from the last text block
  const textBlocks = response.content.filter((b) => b.type === 'text');
  if (textBlocks.length === 0) throw new Error('No text in response');

  let rawText = textBlocks[textBlocks.length - 1].text.trim();

  // Strip markdown fences
  if (rawText.includes('```')) {
    const match = rawText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (match) rawText = match[1];
  }

  // Find the JSON array
  const arrStart = rawText.indexOf('[');
  const arrEnd = rawText.lastIndexOf(']');
  if (arrStart === -1 || arrEnd === -1) throw new Error('No JSON array found in response');
  let jsonStr = rawText.slice(arrStart, arrEnd + 1);

  // Strip <cite> tags
  jsonStr = jsonStr.replace(/<cite[^>]*>|<\/cite>/g, '');
  jsonStr = jsonStr.replace(/<[^>]+>/g, '');

  let companies;
  try {
    companies = JSON.parse(jsonStr);
  } catch (err) {
    console.error('[Discover] JSON parse error:', err.message);
    console.error(jsonStr.slice(0, 500));
    throw err;
  }

  if (!Array.isArray(companies)) throw new Error('Response is not an array');

  // Deduplicate by name
  const seen = new Set();
  companies = companies.filter((c) => {
    const key = c.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Discover] Found ${companies.length} unique companies`);

  return companies;
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  EVIL INDEX — Company Discovery');
  console.log('═══════════════════════════════════════\n');

  const companies = await discover();

  // Write companies.json (just names, for the scoring pipeline)
  const names = companies.map((c) => c.name);
  await writeFile(args.out, JSON.stringify(names, null, 2));
  console.log(`\nWrote ${names.length} company names to ${args.out}`);

  // Write company-meta.json (metadata for the frontend builder)
  const meta = {};
  for (const c of companies) {
    meta[c.name] = {
      ticker: c.ticker || c.name.slice(0, 4).toUpperCase(),
      logo: c.logo || c.name.slice(0, 2).toUpperCase(),
      industry: c.industry || 'Technology',
      employeeCount: c.employeeCount || 'Unknown',
      founded: c.founded || null,
      hq: c.hq || 'Unknown',
    };
  }
  await writeFile(args['meta-out'], JSON.stringify(meta, null, 2));
  console.log(`Wrote metadata for ${Object.keys(meta).length} companies to ${args['meta-out']}`);

  // Print summary by category
  const categories = {};
  for (const c of companies) {
    const cat = c.industry || 'Other';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  console.log('\n── Categories ──');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(25)} ${count}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
