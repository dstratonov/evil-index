import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts.js';

const CRITERIA_WEIGHTS = {
  stability: 0.2,
  compensation: 0.2,
  hiringProcess: 0.1,
  workAtmosphere: 0.3,
  careerGrowth: 0.2,
};

/**
 * Calculate the Evil Index from criterion scores.
 */
function calculateEvilScore(scores) {
  return Math.round(
    Object.entries(CRITERIA_WEIGHTS).reduce((sum, [key, weight]) => {
      return sum + (scores[key]?.score || 50) * weight;
    }, 0),
  );
}

/**
 * Derive overall confidence from criterion confidences and data quality.
 */
function deriveOverallConfidence(scores) {
  const levels = { high: 3, medium: 2, low: 1 };
  const values = Object.values(scores).map((s) => levels[s.confidence] || 1);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg >= 2.5) return 'high';
  if (avg >= 1.5) return 'medium';
  return 'low';
}

/**
 * Determine verdict from evil score.
 */
function getVerdict(score) {
  if (score >= 80) return 'TOXIC';
  if (score >= 60) return 'HARMFUL';
  if (score >= 40) return 'CAUTION';
  return 'MOSTLY OK';
}

/**
 * Score a single company using Claude.
 *
 * @param {object} opts
 * @param {string} opts.apiKey — Anthropic API key
 * @param {string} opts.companyName — Company to score
 * @param {object} opts.data — Gathered data by source { reddit: [...], glassdoor: [...], ... }
 * @param {object} [opts.meta] — Company metadata { industry, employeeCount, hq, founded }
 * @param {string} [opts.model] — Claude model to use (default: claude-sonnet-4-20250514)
 * @returns {Promise<object>} — Scored company object ready for the frontend
 */
export async function scoreCompany({ apiKey, companyName, data, meta = {}, model = 'claude-sonnet-4-20250514' }) {
  const client = new Anthropic({ apiKey });

  const userPrompt = buildUserPrompt(companyName, data, meta);

  console.log(`[Evil Index] Scoring ${companyName}...`);
  console.log(`[Evil Index] Data points: ${Object.values(data).flat().length}`);
  console.log(`[Evil Index] Sources: ${Object.keys(data).filter((k) => data[k]?.length > 0).join(', ')}`);

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawText = response.content[0].text.trim();

  // Parse JSON — strip markdown fences if the model wraps it
  let jsonStr = rawText;
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (err) {
    console.error('[Evil Index] Failed to parse LLM response as JSON:');
    console.error(rawText.slice(0, 500));
    throw new Error(`LLM returned invalid JSON: ${err.message}`);
  }

  // Calculate evil score from the weighted criteria
  const evilScore = calculateEvilScore(result.scores);
  const verdict = getVerdict(evilScore);
  const overallConfidence = result.overallConfidence || deriveOverallConfidence(result.scores);

  // Compute source weights from actual data volume
  const sourceWeights = {};
  const totalItems = Object.values(data).flat().length || 1;
  for (const [source, items] of Object.entries(data)) {
    if (items && items.length > 0) {
      sourceWeights[source] = Math.round((items.length / totalItems) * 100) / 100;
    }
  }

  // Build the frontend-ready company object
  const scored = {
    name: companyName,
    industry: result.industry || meta.industry || 'Technology',
    evilScore,
    verdict,
    confidence: overallConfidence,
    breakdown: {
      stability: result.scores.stability.score,
      compensation: result.scores.compensation.score,
      hiringProcess: result.scores.hiringProcess.score,
      workAtmosphere: result.scores.workAtmosphere.score,
      careerGrowth: result.scores.careerGrowth.score,
    },
    justifications: {
      stability: result.scores.stability.justification,
      compensation: result.scores.compensation.justification,
      hiringProcess: result.scores.hiringProcess.justification,
      workAtmosphere: result.scores.workAtmosphere.justification,
      careerGrowth: result.scores.careerGrowth.justification,
    },
    criterionConfidence: {
      stability: result.scores.stability.confidence,
      compensation: result.scores.compensation.confidence,
      hiringProcess: result.scores.hiringProcess.confidence,
      workAtmosphere: result.scores.workAtmosphere.confidence,
      careerGrowth: result.scores.careerGrowth.confidence,
    },
    intelSummary: result.intelSummary,
    tags: result.tags || [],
    trending: result.trending || 'stable',
    trendingReason: result.trendingReason || '',
    sources: sourceWeights,
    signals: result.dataQuality?.totalDataPoints || Object.values(data).flat().length,
    dataQuality: result.dataQuality || null,
    lastUpdated: new Date().toISOString().split('T')[0],

    // Raw LLM response for debugging
    _raw: result,
    _model: model,
    _tokensUsed: response.usage,
  };

  console.log(`[Evil Index] ${companyName}: Evil Score = ${evilScore} (${verdict}), confidence = ${overallConfidence}`);

  return scored;
}

/**
 * Score multiple companies in sequence.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {Array<{name: string, data: object, meta?: object}>} opts.companies
 * @param {string} [opts.model]
 * @returns {Promise<object[]>}
 */
export async function scoreCompanies({ apiKey, companies, model }) {
  const results = [];

  for (const company of companies) {
    try {
      const result = await scoreCompany({
        apiKey,
        companyName: company.name,
        data: company.data,
        meta: company.meta,
        model,
      });
      results.push(result);
    } catch (err) {
      console.error(`[Evil Index] Failed to score ${company.name}:`, err.message);
      results.push({
        name: company.name,
        error: err.message,
        evilScore: null,
      });
    }

    // Small delay to avoid rate limits
    if (companies.indexOf(company) < companies.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}
