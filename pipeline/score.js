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
 * Derive overall confidence from criterion confidences.
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
 * Extract the final text block from a response that may contain
 * web_search tool_use / tool_result blocks interleaved with text.
 */
function extractFinalText(response) {
  const textBlocks = response.content.filter((block) => block.type === 'text');
  if (textBlocks.length === 0) {
    throw new Error('No text blocks in response');
  }
  // The last text block should contain the JSON scoring
  return textBlocks[textBlocks.length - 1].text.trim();
}

/**
 * Count how many web searches were performed from the response.
 */
function countSearches(response) {
  return response.content.filter(
    (block) => block.type === 'server_tool_use' && block.name === 'web_search',
  ).length;
}

/**
 * Extract search queries from the response for logging.
 */
function extractSearchQueries(response) {
  return response.content
    .filter((block) => block.type === 'server_tool_use' && block.name === 'web_search')
    .map((block) => block.input?.query || '(unknown)');
}

/**
 * Score a single company using Claude with web search.
 *
 * @param {object} opts
 * @param {string} opts.apiKey — Anthropic API key
 * @param {string} opts.companyName — Company to score
 * @param {object} [opts.meta] — Company metadata { industry, employeeCount, hq, founded }
 * @param {string} [opts.model] — Claude model (default: claude-sonnet-4-20250514)
 * @param {number} [opts.maxSearches] — Max web searches per company (default: 15)
 * @returns {Promise<object>} — Scored company object ready for the frontend
 */
export async function scoreCompany({ apiKey, companyName, meta = {}, model = 'claude-sonnet-4-20250514', maxSearches = 15 }) {
  const client = new Anthropic({ apiKey });

  const userPrompt = buildUserPrompt(companyName, meta);

  console.log(`[Evil Index] Scoring ${companyName} (with web search)...`);

  // Retry with backoff for rate limits
  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await client.messages.create({
        model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: maxSearches,
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      });
      break;
    } catch (err) {
      if (err.status === 429 && attempt < 3) {
        const retryAfter = parseInt(err.headers?.['retry-after'] || '60', 10);
        const waitSecs = Math.min(retryAfter, 120);
        console.log(`[Evil Index] Rate limited. Waiting ${waitSecs}s before retry ${attempt + 1}/3...`);
        await new Promise((r) => setTimeout(r, waitSecs * 1000));
      } else {
        throw err;
      }
    }
  }

  const searchCount = countSearches(response);
  const queries = extractSearchQueries(response);
  console.log(`[Evil Index] ${companyName}: ${searchCount} web searches performed`);
  if (queries.length > 0) {
    for (const q of queries) {
      console.log(`[Evil Index]   -> "${q}"`);
    }
  }

  // Extract the final text (JSON) from the response
  const rawText = extractFinalText(response);

  // Extract JSON from response — handle preamble text, markdown fences, and <cite> tags
  let jsonStr = rawText;

  // Strip markdown fences
  if (jsonStr.includes('```')) {
    const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) jsonStr = fenceMatch[1];
  }

  // If there's text before the JSON, extract just the JSON object
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  // Strip <cite> tags that web search injects into text
  jsonStr = jsonStr.replace(/<cite[^>]*>|<\/cite>/g, '');
  // Strip any other HTML-like tags
  jsonStr = jsonStr.replace(/<[^>]+>/g, '');

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (err) {
    console.error('[Evil Index] Failed to parse LLM response as JSON:');
    console.error(jsonStr.slice(0, 500));
    throw new Error(`LLM returned invalid JSON: ${err.message}`);
  }

  // Calculate evil score from the weighted criteria
  const evilScore = calculateEvilScore(result.scores);
  const verdict = getVerdict(evilScore);
  const overallConfidence = result.overallConfidence || deriveOverallConfidence(result.scores);

  // Estimate source distribution from search queries
  const sourceWeights = estimateSourceWeights(queries);

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
    signals: result.dataQuality?.totalDataPoints || searchCount,
    dataQuality: result.dataQuality || null,
    lastUpdated: new Date().toISOString().split('T')[0],
    _searchQueries: queries,
    _searchCount: searchCount,
    _model: model,
    _tokensUsed: response.usage,
  };

  console.log(`[Evil Index] ${companyName}: Evil Score = ${evilScore} (${verdict}), confidence = ${overallConfidence}`);

  return scored;
}

/**
 * Estimate source weights from the search queries performed.
 */
function estimateSourceWeights(queries) {
  const sources = { news: 0, glassdoor: 0, reddit: 0, linkedin: 0, blind: 0, other: 0 };
  for (const q of queries) {
    const ql = q.toLowerCase();
    if (ql.includes('glassdoor')) sources.glassdoor++;
    else if (ql.includes('reddit')) sources.reddit++;
    else if (ql.includes('linkedin')) sources.linkedin++;
    else if (ql.includes('blind')) sources.blind++;
    else sources.news++;
  }
  const total = queries.length || 1;
  const weights = {};
  for (const [key, count] of Object.entries(sources)) {
    if (count > 0) {
      weights[key] = Math.round((count / total) * 100) / 100;
    }
  }
  return weights;
}

/**
 * Score multiple companies in sequence.
 */
export async function scoreCompanies({ apiKey, companies, model, maxSearches }) {
  const results = [];

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    try {
      const result = await scoreCompany({
        apiKey,
        companyName: company.name,
        meta: company.meta,
        model,
        maxSearches,
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

    // Delay between companies to avoid rate limits (web search is heavier)
    if (i < companies.length - 1) {
      console.log('[Evil Index] Waiting 3s before next company...');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  return results;
}
