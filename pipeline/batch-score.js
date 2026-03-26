#!/usr/bin/env node

/**
 * Anxiety Index — Daily Batch Scoring
 *
 * Scores a batch of companies that haven't been scored this week.
 * Merges results into the existing results.json.
 *
 * Usage:
 *   node batch-score.js
 *   node batch-score.js --batch-size 20
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { scoreCompany } from './score.js';

const { values: args } = parseArgs({
  options: {
    'api-key': { type: 'string', short: 'k' },
    model: { type: 'string', short: 'm', default: 'claude-sonnet-4-20250514' },
    'batch-size': { type: 'string', default: '15' },
    'max-searches': { type: 'string', default: '10' },
    companies: { type: 'string', default: 'companies.json' },
    results: { type: 'string', default: 'results.json' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (args.help) {
  console.log(`
Anxiety Index — Daily Batch Scoring

Scores companies not yet scored this week, merging into results.json.

Options:
  -k, --api-key <key>         Anthropic API key (or ANTHROPIC_API_KEY env var)
  -m, --model <model>         Claude model (default: claude-sonnet-4-20250514)
      --batch-size <n>        Companies to score per run (default: 15)
      --max-searches <n>      Web searches per company (default: 10)
      --companies <file>      Companies list (default: companies.json)
      --results <file>        Results file to read/update (default: results.json)
  -h, --help                  Show help
  `);
  process.exit(0);
}

const apiKey = args['api-key'] || process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: No API key. Use --api-key or set ANTHROPIC_API_KEY env var.');
  process.exit(1);
}

const batchSize = parseInt(args['batch-size'], 10) || 15;
const maxSearches = parseInt(args['max-searches'], 10) || 10;

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  EVIL INDEX — Daily Batch Scoring');
  console.log('═══════════════════════════════════════\n');

  // Read company list
  let allCompanies;
  try {
    allCompanies = JSON.parse(await readFile(args.companies, 'utf-8'));
  } catch {
    console.error(`Error: Cannot read ${args.companies}. Run discover.js first.`);
    process.exit(1);
  }

  console.log(`Total companies in list: ${allCompanies.length}`);

  // Read existing results
  let existingResults = [];
  try {
    existingResults = JSON.parse(await readFile(args.results, 'utf-8'));
    if (!Array.isArray(existingResults)) existingResults = [];
  } catch {
    console.log('No existing results.json — starting fresh.');
  }

  // Find companies scored in the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentlyScored = new Set(
    existingResults
      .filter((r) => !r.error && r.lastUpdated && new Date(r.lastUpdated) >= oneWeekAgo)
      .map((r) => r.name),
  );

  console.log(`Already scored this week: ${recentlyScored.size}`);

  // Find unscored companies
  const unscored = allCompanies.filter((name) => !recentlyScored.has(name));
  console.log(`Remaining to score: ${unscored.length}`);

  if (unscored.length === 0) {
    console.log('\nAll companies already scored this week. Nothing to do.');
    return;
  }

  // Take today's batch
  const batch = unscored.slice(0, batchSize);
  console.log(`Today's batch: ${batch.length} companies\n`);

  // Load metadata for enrichment
  let meta = {};
  try {
    meta = JSON.parse(await readFile('company-meta.json', 'utf-8'));
  } catch {}

  // Score each company
  let scored = 0;
  let failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const name = batch[i];
    console.log(`\n[${i + 1}/${batch.length}] ${name}`);

    try {
      const result = await scoreCompany({
        apiKey,
        companyName: name,
        meta: meta[name] || {},
        model: args.model,
        maxSearches,
      });

      // Merge into existing results (replace if exists, append if new)
      const idx = existingResults.findIndex((r) => r.name === name);
      if (idx >= 0) {
        existingResults[idx] = result;
      } else {
        existingResults.push(result);
      }

      scored++;

      // Save after each successful score (crash-safe)
      await writeFile(args.results, JSON.stringify(existingResults, null, 2));
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      failed++;
    }

    // Delay between companies
    if (i < batch.length - 1) {
      console.log('  Waiting 5s...');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // Final save
  await writeFile(args.results, JSON.stringify(existingResults, null, 2));

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('  BATCH COMPLETE');
  console.log('═══════════════════════════════════════\n');
  console.log(`  Scored:  ${scored}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Total in results.json: ${existingResults.filter((r) => !r.error).length}`);
  console.log(`  Remaining this week: ${unscored.length - batch.length}`);

  // Print today's results
  console.log('\n── Today\'s Scores ──');
  for (const name of batch) {
    const r = existingResults.find((x) => x.name === name);
    if (r && !r.error) {
      const bar = '\u2588'.repeat(Math.round(r.evilScore / 5)) + '\u2591'.repeat(20 - Math.round(r.evilScore / 5));
      console.log(`  ${r.name.padEnd(25)} ${bar} ${r.evilScore}/100 (${r.verdict})`);
    } else {
      console.log(`  ${name.padEnd(25)} FAILED`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
