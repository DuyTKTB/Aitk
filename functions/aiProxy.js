/**
 * 🔐 AI Proxy Function — Giấu API keys trên server
 * 
 * Cách sử dụng:
 * 1. Lưu secret keys ở Google Cloud Secret Manager (hoặc environment)
 * 2. Client gọi hàm này với user token → server kiểm tra auth
 * 3. Server gọi AI provider (Gemini, Groq, Agnes) → trả response về client
 * 4. API keys KHÔNG bao giờ leak sang client
 * 
 * Thêm vào functions/index.js:
 * exports.askAI = aiProxy.askAI;
 * exports.askAIBatch = aiProxy.askAIBatch;
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize nếu chưa
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Lấy API key từ environment (hoặc Secret Manager)
 * Cách setup:
 * 
 * 1. Lưu secret:
 *    gcloud secrets create gemini-key --data-file=-
 *    echo -n "your-key-here" | gcloud secrets create gemini-key --data-file=-
 * 
 * 2. Grant permission cho service account:
 *    gcloud secrets add-iam-policy-binding gemini-key \
 *      --member=serviceAccount:YOUR-PROJECT@appspot.gserviceaccount.com \
 *      --role=roles/secretmanager.secretAccessor
 * 
 * 3. Import secret manager:
 *    const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
 */
async function getSecretKey(secretName) {
  // Fallback: dùng environment variable (nếu deployed locally hoặc test)
  if (process.env[secretName]) {
    return process.env[secretName];
  }

  // Production: dùng Google Secret Manager
  try {
    const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GCP_PROJECT;
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    const [version] = await client.accessSecretVersion({name});
    return version.payload.data.toString();
  } catch (error) {
    console.error(`[Secret] Không thể lấy ${secretName}:`, error);
    throw new Error(`API key không khả dụng: ${secretName}`);
  }
}

/**
 * ✅ Proxy function — Gọi AI provider (Gemini, Groq, v.v)
 * 
 * Request body:
 * {
 *   provider: 'gemini' | 'groq' | 'agnes',
 *   model: 'gemini-2.5-pro',
 *   messages: [{role: 'user', content: '...'}],
 *   temperature: 0.7,
 *   maxTokens: 2000
 * }
 */
exports.askAI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // 1️⃣ Xác thực user (Firebase token)
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({error: 'Unauthorized: token required'});
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (authError) {
      return res.status(401).json({error: 'Unauthorized: invalid token'});
    }

    const userId = decodedToken.uid;

    // 2️⃣ Lấy user credit từ Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({error: 'User not found'});
    }

    const userData = userDoc.data();
    const credits = userData.credits || 0;

    if (credits <= 0) {
      return res.status(402).json({
        error: 'Insufficient credits',
        credits: 0,
        needTopUp: true
      });
    }

    // 3️⃣ Lấy request
    const {provider, model, messages, temperature, maxTokens} = req.body;

    if (!provider || !model || !messages) {
      return res.status(400).json({error: 'Missing provider, model, or messages'});
    }

    // 4️⃣ Gọi AI provider
    let response;

    if (provider === 'gemini') {
      response = await callGemini(model, messages, temperature, maxTokens);
    } else if (provider === 'groq') {
      response = await callGroq(model, messages, temperature, maxTokens);
    } else if (provider === 'agnes') {
      response = await callAgnes(model, messages, temperature, maxTokens);
    } else {
      return res.status(400).json({error: `Unknown provider: ${provider}`});
    }

    // 5️⃣ Trừ credit
    const tokensUsed = response.tokensUsed || 0;
    const newCredits = credits - tokensUsed;

    await db.collection('users').doc(userId).update({
      credits: newCredits,
      lastAICall: admin.firestore.FieldValue.serverTimestamp(),
      totalTokensUsed: admin.firestore.FieldValue.increment(tokensUsed)
    });

    // 6️⃣ Trả response
    return res.status(200).json({
      ok: true,
      response: response.text,
      tokensUsed,
      creditsRemaining: newCredits,
      model,
      provider
    });
  } catch (error) {
    console.error('[askAI] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      code: error.code
    });
  }
});

/**
 * Gọi Google Gemini
 */
async function callGemini(model, messages, temperature = 0.7, maxTokens = 2000) {
  const apiKey = await getSecretKey('GEMINI_API_KEY');
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{text: m.content}]
      })),
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';
  const inputTokens = data.usageMetadata?.promptTokenCount || 0;
  const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;

  return {
    text,
    tokensUsed: inputTokens + outputTokens
  };
}

/**
 * Gọi Groq (nhanh, chi phí thấp)
 */
async function callGroq(model, messages, temperature = 0.7, maxTokens = 2000) {
  const apiKey = await getSecretKey('GROQ_API_KEY');
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  return {
    text,
    tokensUsed: inputTokens + outputTokens
  };
}

/**
 * Gọi Agnes (hoặc API khác)
 */
async function callAgnes(model, messages, temperature = 0.7, maxTokens = 2000) {
  const apiKey = await getSecretKey('AGNES_API_KEY');
  const endpoint = 'https://api.agnes.ai/v1/chat'; // Thay URL đúng

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    throw new Error(`Agnes API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  return {
    text,
    tokensUsed: inputTokens + outputTokens
  };
}

/**
 * Batch processing — gọi nhiều AI requests cùng lúc
 */
exports.askAIBatch = functions
   .region('us-central1')
   .https.onRequest(async (req, res) => {
   res.set('Access-Control-Allow-Origin', '*');
   res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
   res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

   if (req.method === 'OPTIONS') return res.status(204).send('');
   if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

   try {
     // 1️⃣ Xác thực user
     const authHeader = req.headers.authorization || '';
     const token = authHeader.replace('Bearer ', '');

     if (!token) {
       return res.status(401).json({error: 'Unauthorized: token required'});
     }

     let decodedToken;
     try {
       decodedToken = await admin.auth().verifyIdToken(token);
     } catch (authError) {
       return res.status(401).json({error: 'Unauthorized: invalid token'});
     }

     const userId = decodedToken.uid;

     // 2️⃣ Lấy user credit
     const userDoc = await db.collection('users').doc(userId).get();
     if (!userDoc.exists) {
       return res.status(404).json({error: 'User not found'});
     }

     let credits = userDoc.data().credits || 0;

     // 3️⃣ Lấy batch requests
     const {requests} = req.body;
     if (!Array.isArray(requests) || requests.length === 0) {
       return res.status(400).json({error: 'Invalid requests: must be non-empty array'});
     }

     const results = [];
     let totalTokensUsed = 0;

     // 4️⃣ Xử lý từng request
     for (const req_item of requests) {
       try {
         const {provider, model, messages, temperature, maxTokens} = req_item;

         if (!provider || !model || !messages) {
           results.push({ok: false, error: 'Missing fields'});
           continue;
         }

         // Kiểm tra credit trước khi gọi
         if (credits <= 0) {
           results.push({ok: false, error: 'Insufficient credits'});
           continue;
         }

         let response;
         if (provider === 'gemini') {
           response = await callGemini(model, messages, temperature, maxTokens);
         } else if (provider === 'groq') {
           response = await callGroq(model, messages, temperature, maxTokens);
         } else if (provider === 'agnes') {
           response = await callAgnes(model, messages, temperature, maxTokens);
         } else {
           results.push({ok: false, error: `Unknown provider: ${provider}`});
           continue;
         }

         const tokensUsed = response.tokensUsed || 0;
         totalTokensUsed += tokensUsed;
         credits -= tokensUsed;

         results.push({
           ok: true,
           response: response.text,
           tokensUsed,
           model,
           provider
         });
       } catch (err) {
         results.push({ok: false, error: err.message});
       }
     }

     // 5️⃣ Cập nhật total credits
     await db.collection('users').doc(userId).update({
       credits,
       lastAICall: admin.firestore.FieldValue.serverTimestamp(),
       totalTokensUsed: admin.firestore.FieldValue.increment(totalTokensUsed)
     });

     // 6️⃣ Trả batch results
     return res.status(200).json({
       ok: true,
       results,
       creditsRemaining: credits,
       totalTokensUsed
     });
   } catch (error) {
     console.error('[askAIBatch] Error:', error);
     return res.status(500).json({error: error.message || 'Internal server error'});
   }
});

module.exports = {
   askAI: exports.askAI,
   askAIBatch: exports.askAIBatch
};
