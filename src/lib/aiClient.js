/**
 * 🔐 AI Client — Gọi Cloud Function thay vì API trực tiếp
 * 
 * Thay thế src/lib/ai.js:
 * import { askAI } from './aiClient.js';
 * 
 * const response = await askAI('gemini', 'Giải phương trình 2x + 3 = 7');
 */

import { getAuth } from 'firebase/auth';

const FUNCTIONS_ENDPOINT = import.meta.env.VITE_FUNCTIONS_ENDPOINT ||
  'https://us-central1-your-project.cloudfunctions.net/askAI';

/**
 * Gọi AI thông qua Cloud Function (bảo mật)
 * 
 * @param {string} provider - 'gemini' | 'groq' | 'agnes'
 * @param {string} model - Model name
 * @param {Array} messages - Chat messages
 * @param {Object} options - {temperature, maxTokens}
 * @returns {Promise<{text, tokensUsed, creditsRemaining}>}
 */
export async function askAI(provider, model, messages, options = {}) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Lấy ID token
  const idToken = await user.getIdToken(true);

  // Gọi Cloud Function
  const response = await fetch(FUNCTIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    signal: options.signal,
    body: JSON.stringify({
      provider,
      model,
      messages,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 2000
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'AI request failed');
    error.code = data.code;
    error.creditsRemaining = data.creditsRemaining;
    throw error;
  }

  return data;
}

/**
 * Gọi AI batch (multiple requests)
 */
export async function askAIBatch(requests) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const idToken = await user.getIdToken(true);

  const results = [];
  for (const req of requests) {
    try {
      const response = await fetch(FUNCTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(req)
      });

      const data = await response.json();
      results.push({
        success: response.ok,
        ...data
      });
    } catch (error) {
      results.push({
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Lấy credit user (từ Firestore)
 */
export async function getCredits() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return 0;
  }

  // TODO: Gọi Cloud Function để lấy credit
  // const response = await fetch(...);
  // return response.data.credits;

  return 0;
}

/**
 * Top up credit
 */
export async function topUpCredits(amount) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  // TODO: Gọi payment gateway
  return null;
}
