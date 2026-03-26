#!/usr/bin/env node

/**
 * Anxiety Index — Scoring Pipeline CLI
 *
 * Usage:
 *   node run.js --company "Google"
 *   node run.js --batch companies.json --out results.json
 *
 * Claude uses web_search to gather live data about each company,
 * then scores across 5 criteria.
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
    'max-searches': { type: 'string', default: '15' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (args.help) {
  console.log(`
Anxiety Index — Scoring Pipeline (with Web Search)

Usage:
  node run.js --company "Google"                  Score a single company
  node run.js --batch companies.json              Score multiple companies
  node run.js --company "Meta" --out meta.json    Score and save to file

Options:
  -c, --company <name>       Company name to score
  -b, --batch <file>         JSON file with array of company names
  -k, --api-key <key>        Anthropic API key (or set ANTHROPIC_API_KEY env var)
  -m, --model <model>        Claude model (default: claude-sonnet-4-20250514)
  -o, --out <file>           Output file (default: results.json)
      --max-searches <n>     Max web searches per company (default: 15)
  -h, --help                 Show help
  `);
  process.exit(0);
}

const apiKey = args['api-key'] || process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: No API key. Use --api-key or set ANTHROPIC_API_KEY env var.');
  process.exit(1);
}

const maxSearches = parseInt(args['max-searches'], 10) || 15;

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  EVIL INDEX — Scoring Pipeline');
  console.log('  Mode: Web Search (live data)');
  console.log('═══════════════════════════════════════\n');

  let results;

  if (args.batch) {
    const raw = await readFile(args.batch, 'utf-8');
    const companyNames = JSON.parse(raw);

    if (!Array.isArray(companyNames)) {
      console.error('Error: Batch file must contain a JSON array of company names.');
      process.exit(1);
    }

    console.log(`Scoring ${companyNames.length} companies with web search...\n`);

    const companies = companyNames.map((name) => ({ name }));
    results = await scoreCompanies({ apiKey, companies, model: args.model, maxSearches });
  } else if (args.company) {
    const result = await scoreCompany({
      apiKey,
      companyName: args.company,
      model: args.model,
      maxSearches,
    });
    results = [result];
  } else {
    console.error('Error: Specify --company or --batch. Use --help for usage.');
    process.exit(1);
  }

  await writeFile(args.out, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${args.out}`);

  console.log('\n═══════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════\n');

  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.name}: ERROR — ${r.error}`);
    } else {
      const bar = '\u2588'.repeat(Math.round(r.evilScore / 5)) + '\u2591'.repeat(20 - Math.round(r.evilScore / 5));
      console.log(`  ${r.name.padEnd(25)} ${bar} ${r.evilScore}/100 (${r.verdict}) [${r.confidence}] (${r._searchCount} searches)`);
    }
  }

  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
