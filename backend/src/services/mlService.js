const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call POST /analyze on the ML service with the provided text.
 *
 * @param {string} text - The issue description to analyse.
 * @returns {Promise<{keywords: string[], category: string, severity_score: number}|null>}
 *   Parsed ML response on success, null on any failure.
 */
async function analyzeText(text) {
  try {
    const { data } = await axios.post(
      `${ML_SERVICE_URL}/analyze`,
      { text },
      { timeout: 5000 }
    );
    return data;
  } catch (err) {
    console.error('[mlService] analyzeText failed:', err.message);
    return null;
  }
}

module.exports = { analyzeText };
