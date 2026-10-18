# 🔐 Security & API Keys Migration Guide

## ❌ Vấn Đề Hiện Tại

### API Keys Bị Lộ
```javascript
// ❌ BAD: .env có API keys → bundle chứa keys → ai decompile được
VITE_GEMINI_KEY=AIzaSyDz...
VITE_GROQ_API_KEY=gsk_...
VITE_AGNES_API_KEY=ak_...
```

**Rủi ro:**
- Người dùng decompile JavaScript → lấy API keys
- Attacker dùng keys của bạn → hết quota, bill phát sinh
- Keys leak trên GitHub → tự động bị revoke hoặc abuse

---

## ✅ Giải Pháp: Cloud Function Proxy

### Architecture
```
┌─────────────┐
│   Client    │
│  (Web App)  │
└──────┬──────┘
       │
       │ POST /api/askAI
       │ {provider, model, messages, idToken}
       │
       ▼
┌─────────────────────────────┐
│  Cloud Functions            │
│  (functions/aiProxy.js)     │
│  ✅ Verifies ID Token       │
│  ✅ Checks Credit Balance   │
│  ✅ Calls External APIs     │
│  🔐 Uses Secret API Keys    │
└──────┬──────────────────────┘
       │
       │ GET SECRET (GEMINI_API_KEY)
       │
       ▼
┌─────────────────────────────┐
│  Google Cloud Secret Manager│
│  🔐 Stores API Keys        │
└─────────────────────────────┘

Client NEVER sees API keys ✨
```

---

## 📋 Setup Steps

### Step 1: Lưu API Keys ở Google Cloud Secret Manager

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project YOUR-PROJECT-ID

# 2. Create secrets
echo -n "AIzaSyDz..." | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "gsk_..." | gcloud secrets create GROQ_API_KEY --data-file=-
echo -n "ak_..." | gcloud secrets create AGNES_API_KEY --data-file=-

# 3. Verify
gcloud secrets list
gcloud secrets versions access latest --secret=GEMINI_API_KEY
```

---

### Step 2: Grant Permissions

```bash
# Lấy service account
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant access to Cloud Functions
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member=serviceAccount:${SA_EMAIL} \
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding GROQ_API_KEY \
  --member=serviceAccount:${SA_EMAIL} \
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding AGNES_API_KEY \
  --member=serviceAccount:${SA_EMAIL} \
  --role=roles/secretmanager.secretAccessor
```

---

### Step 3: Deploy Cloud Function

```bash
cd functions

# 1. Update index.js to include aiProxy.js
# Add line: exports.askAI = require('./aiProxy').askAI;

# 2. Update package.json
npm install @google-cloud/secret-manager

# 3. Deploy
firebase deploy --only functions:askAI
```

---

### Step 4: Update .env

```bash
# .env (LOẠI BỎ API keys)
VITE_FUNCTIONS_ENDPOINT=https://us-central1-YOUR-PROJECT.cloudfunctions.net/askAI

# ❌ KHÔNG có VITE_GEMINI_KEY, VITE_GROQ_API_KEY, v.v
```

---

### Step 5: Update Client Code

**Before:**
```javascript
// ❌ BAD: API key in client
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_KEY;
const client = new GoogleGenerativeAI(apiKey);
```

**After:**
```javascript
// ✅ GOOD: Use Cloud Function
import { askAI } from './lib/aiClient.js';

const response = await askAI('gemini', 'gemini-2.5-pro', [
  { role: 'user', content: 'Giải phương trình 2x = 4' }
]);

console.log(response.text); // "x = 2"
```

---

## 🔄 Migration Checklist

### Phase 1: Setup (1-2 hours)
- [ ] Tạo secrets ở Google Cloud Secret Manager
- [ ] Grant IAM permissions
- [ ] Test secret access
- [ ] Deploy aiProxy.js Cloud Function
- [ ] Verify endpoint hoạt động

### Phase 2: Update Client (2-3 hours)
- [ ] Thay `.env` (loại bỏ API keys)
- [ ] Update imports → dùng `aiClient.js`
- [ ] Update AIChat.jsx → gọi Cloud Function
- [ ] Update Quiz.jsx → gọi Cloud Function
- [ ] Test: kiểm tra request đến Cloud Function

### Phase 3: Testing & Cleanup (1-2 hours)
- [ ] Test end-to-end: client → function → external API
- [ ] Check credit deduction
- [ ] Verify no API keys in bundle
- [ ] Delete old API keys từ `.env`
- [ ] Remove old client code

---

## 🧪 Testing

### 1. Verify no keys in bundle
```bash
npm run build
# Kiểm tra dist/assets/*.js KHÔNG chứa "AIzaSy", "gsk_", hoặc "ak_"
grep -r "AIzaSy" dist/assets/ && echo "❌ KEY FOUND" || echo "✅ No keys"
```

### 2. Test Cloud Function locally
```bash
firebase emulators:start

# Gửi test request
curl -X POST http://localhost:5001/YOUR-PROJECT/us-central1/askAI \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-ID-TOKEN" \
  -d '{
    "provider": "gemini",
    "model": "gemini-2.5-pro",
    "messages": [{"role": "user", "content": "hello"}]
  }'
```

### 3. Monitor production
```bash
# Xem logs
gcloud functions logs read askAI --limit 50

# Xem metrics
gcloud monitoring
```

---

## 📊 Security Benefits

| Aspect | Before | After |
|--------|--------|-------|
| API Keys Location | Client Bundle | Cloud Secret Manager |
| Risk Level | 🔴 HIGH | 🟢 LOW |
| Decompile Risk | 100% | 0% |
| Quota Abuse Risk | 🔴 HIGH | 🟢 LOW (token-verified) |
| Audit Trail | ❌ No | ✅ Yes (GCP Logs) |
| Key Rotation | 🔴 Hard | ✅ Easy (1 command) |
| Rate Limiting | ❌ No | ✅ Yes (per user) |

---

## 💰 Cost Estimation

### Cloud Functions Cost
- Free tier: 2M invocations/month
- Function execution: ~0.40 USD/1M invocations
- Outbound traffic: ~0.12 USD/GB

**Estimate:** ~$5-20/month for ELEC AI

### Alternative: Use Firebase
```javascript
// Nếu không muốn setup Secret Manager, dùng Firestore Rules
// + App Check verification
```

---

## 🚨 Migration Risks & Mitigation

### Risk 1: Breaking Changes
- **Impact:** Existing apps fail
- **Mitigation:** Support both old (client keys) and new (Cloud Function) temporarily
- **Timeline:** Deprecate client keys sau 3 tháng

### Risk 2: Cloud Function Downtime
- **Impact:** No AI responses
- **Mitigation:** Fallback to cached responses hoặc queue requests
- **Timeline:** Implement retry logic với exponential backoff

### Risk 3: Cost Overrun
- **Impact:** Unexpected GCP bill
- **Mitigation:** Set quotas, alert khi vượt budget
- **Timeline:** Monitor daily

---

## ✅ Verification Checklist (Tuần 1)

- [ ] All API keys removed from `.env` ✨
- [ ] Cloud Function deployed & tested
- [ ] Client code updated to use `aiClient.js`
- [ ] No keys in built bundle (verify with grep)
- [ ] End-to-end test: client → function → external API
- [ ] IAM permissions set correctly
- [ ] Monitoring & alerts configured
- [ ] Documentation updated

---

## 📚 References

- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules)
- [API Key Protection Guide](https://cloud.google.com/docs/authentication/api-keys)

---

**Status:** 🔄 Pending Implementation (Tuần 1)  
**Priority:** 🔴 HIGH (bảo mật)  
**Effort:** ~6-8 hours
