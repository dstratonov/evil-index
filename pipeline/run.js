#!/usr/bin/env node

/**
 * Evil Index — Scoring Pipeline CLI
 *
 * Usage:
 *   node run.js --company "Google" --api-key sk-ant-...
 *   node run.js --company "Google" (uses ANTHROPIC_API_KEY env var)
 *   node run.js --batch companies.json --out results.json
 *
 * For now, this uses Claude's own knowledge as the data source.
 * In the future, this will be replaced by a real data gathering step
 * (Reddit API, Glassdoor scraping, news APIs, etc.).
 */

import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { scoreCompany, scoreCompanies } from './score.js';

const { values: args } = parseArgs({
  options: {
    company: { type: 'string', short: 'c' },
    'api-key': { type: 'string', short: 'k' },
    model: { type: 'string', short: 'm', default: 'claude-sonnet-4-20250514' },
    batch: { type: 'string', short: 'b' },
    out: { type: 'string', short: 'o', default: 'results.json' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (args.help) {
  console.log(`
Evil Index — Scoring Pipeline

Usage:
  node run.js --company "Google"                  Score a single company
  node run.js --batch companies.json              Score multiple companies from a JSON file
  node run.js --company "Meta" --out meta.json    Score and save to specific file

Options:
  -c, --company <name>    Company name to score
  -b, --batch <file>      JSON file with array of company names to score
  -k, --api-key <key>     Anthropic API key (or set ANTHROPIC_API_KEY env var)
  -m, --model <model>     Claude model to use (default: claude-sonnet-4-20250514)
  -o, --out <file>        Output file path (default: results.json)
  -h, --help              Show this help message
  `);
  process.exit(0);
}

const apiKey = args['api-key'] || process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: No API key provided. Use --api-key or set ANTHROPIC_API_KEY env var.');
  process.exit(1);
}

/**
 * Gather data about a company.
 *
 * CURRENT: Asks Claude to score based on its training knowledge.
 * The user prompt instructs it to use what it knows from public sources.
 *
 * FUTURE: This function will be replaced with real data gathering:
 *   - Reddit API (search r/cscareerquestions, r/ExperiencedDevs, company subreddits)
 *   - Glassdoor API / scraper
 *   - News API (GDELT, NewsAPI, Google News)
 *   - Blind scraper
 *   - LinkedIn public posts
 *   - levels.fyi public data
 *   - HackerNews Algolia API
 */
async function gatherData(companyName) {
  // Phase 1: Use a prompt that tells Claude to use its knowledge of public sources
  // This works because Claude has been trained on Reddit, news, Glassdoor summaries, etc.
  return {
    general: [
      `Analyze the company "${companyName}" based on everything you know from public sources including: Reddit discussions (r/cscareerquestions, r/ExperiencedDevs, r/antiwork, company-specific subreddits), Glassdoor reviews, Blind posts, news articles (TechCrunch, The Verge, Bloomberg, WSJ, Reuters), LinkedIn posts, HackerNews discussions, levels.fyi salary data, and any other publicly available information about working conditions, compensation, hiring practices, culture, and career growth at this company. Focus specifically on the IT/tech workforce. Include specific examples, incidents, and patterns you know about. Reference specific time periods where possible.`,
    ],
  };
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  EVIL INDEX — Scoring Pipeline');
  console.log('═══════════════════════════════════════\n');

  let results;

  if (args.batch) {
    // Batch mode: score multiple companies
    const raw = await readFile(args.batch, 'utf-8');
    const companyNames = JSON.parse(raw);

    if (!Array.isArray(companyNames)) {
      console.error('Error: Batch file must contain a JSON array of company names.');
      process.exit(1);
    }

    console.log(`Scoring ${companyNames.length} companies...\n`);

    const companies = [];
    for (const name of companyNames) {
      const data = await gatherData(name);
      companies.push({ name, data });
    }

    results = await scoreCompanies({ apiKey, companies, model: args.model });
  } else if (args.company) {
    // Single company mode
    const data = await gatherData(args.company);
    const result = await scoreCompany({
      apiKey,
      companyName: args.company,
      data,
      model: args.model,
    });
    results = [result];
  } else {
    console.error('Error: Specify --company or --batch. Use --help for usage.');
    process.exit(1);
  }

  // Write results
  await writeFile(args.out, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${args.out}`);

  // Print summary
  console.log('\n═══════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════\n');

  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.name}: ERROR — ${r.error}`);
    } else {
      const bar = '█'.repeat(Math.round(r.evilScore / 5)) + '░'.repeat(20 - Math.round(r.evilScore / 5));
      console.log(`  ${r.name.padEnd(25)} ${bar} ${r.evilScore}/100 (${r.verdict}) [${r.confidence}]`);
    }
  }

  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
