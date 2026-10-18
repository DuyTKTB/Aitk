# 🚀 Cloud Function Deployment Guide

## Bước 1: Setup Google Cloud Secret Manager

### 1.1 Cài đặt gcloud CLI
```bash
# Windows
choco install google-cloud-sdk

# Verify
gcloud --version
```

### 1.2 Xác thực với GCP
```bash
gcloud auth login
gcloud config set project YOUR_FIREBASE_PROJECT_ID
```

### 1.3 Tạo Google Cloud Secrets
Lưu trữ API keys an toàn trong Secret Manager:

```bash
# Tạo secret cho Gemini API
echo -n "your-gemini-api-key-here" | gcloud secrets create GEMINI_API_KEY --data-file=-

# Tạo secret cho Groq API
echo -n "your-groq-api-key-here" | gcloud secrets create GROQ_API_KEY --data-file=-

# Tạo secret cho Agnes API
echo -n "your-agnes-api-key-here" | gcloud secrets create AGNES_API_KEY --data-file=-

# Kiểm tra danh sách secrets
gcloud secrets list
```

### 1.4 Grant IAM Permissions
Firebase Cloud Function service account cần quyền đọc secrets:

```bash
# Lấy project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_FIREBASE_PROJECT_ID --format='value(projectNumber)')

# Grant roles/secretmanager.secretAccessor cho service account
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudfunctions.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding GROQ_API_KEY \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudfunctions.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding AGNES_API_KEY \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudfunctions.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Kiểm tra IAM binding
gcloud secrets get-iam-policy GEMINI_API_KEY
```

---

## Bước 2: Test Cloud Function Locally

### 2.1 Cài đặt Firebase Emulator
```bash
cd D:\Tải Xuống\app
npm install -g firebase-tools

# Start emulator
firebase emulators:start --only functions
```

### 2.2 Test API endpoint locally
```bash
# Lấy Firebase ID token (dùng trong test)
# Hoặc sử dụng Firebase Auth emulator để generate token

# Test askAI (local)
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/askAI \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{
    "provider": "groq",
    "model": "mixtral-8x7b-32768",
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.7,
    "maxTokens": 100
  }'
```

---

## Bước 3: Deploy to Firebase

### 3.1 Install dependencies
```bash
cd D:\Tải Xuống\app\functions
npm install
```

### 3.2 Deploy functions
```bash
cd D:\Tải Xuống\app
firebase deploy --only functions

# Hoặc deploy chỉ function cụ thể
firebase deploy --only functions:askAI,functions:askAIBatch
```

### 3.3 Kiểm tra deployment
```bash
# Xem logs
firebase functions:log

# Hoặc trên GCP Console
gcloud functions list
gcloud functions describe askAI --region=us-central1
```

---

## Bước 4: Update Client Environment

### 4.1 Cập nhật `.env.local`
```env
# .env.local
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FUNCTIONS_ENDPOINT=https://us-central1-your-project-id.cloudfunctions.net
```

### 4.2 Sử dụng aiClient.js
```javascript
// src/lib/aiClient.js đã có:
// - askAI(provider, model, messages, options)
// - askAIBatch(requests)
// - Tự động gọi Cloud Function proxy

import { askAI, askAIBatch } from '../lib/aiClient.js';

// Sử dụng trong component
const response = await askAI('groq', 'mixtral-8x7b-32768', messages);
```

---

## Bước 5: Update Components

### 5.1 Migrate AIChat.jsx
```javascript
// ❌ BEFORE
import { askAI as askAIDirect } from '../lib/ai.js';
const response = await askAIDirect('groq', ...);

// ✅ AFTER
import { askAI } from '../lib/aiClient.js';
const response = await askAI('groq', 'mixtral-8x7b-32768', messages);
```

### 5.2 Migrate Quiz.jsx
```javascript
// Tương tự như AIChat.jsx
import { askAI } from '../lib/aiClient.js';
```

---

## Bước 6: Verify Security

### ✅ Checklist
- [ ] Không có API keys trong `.env.example`
- [ ] Không có API keys trong git history
- [ ] Cloud Function kiểm tra Firebase token
- [ ] Cloud Function trừ credit khi gọi AI
- [ ] Test: Client không thể truy cập trực tiếp API keys
- [ ] Test: Invalid token bị từ chối (401)
- [ ] Test: Insufficient credits bị từ chối (402)

### Verify bundle
```bash
npm run build
# Kiểm tra dist/ folder
# Tìm "GEMINI_API_KEY", "GROQ_API_KEY", "AGNES_API_KEY" — không được có

grep -r "GEMINI_API_KEY\|GROQ_API_KEY\|AGNES_API_KEY" dist/
# Output: (nothing found) ✅
```

---

## Troubleshooting

### Issue: Secret không tìm được
```bash
# Kiểm tra:
gcloud secrets list
gcloud secrets describe GEMINI_API_KEY

# Debug: thêm logs vào aiProxy.js
console.log('Fetching secret:', secretName);
```

### Issue: IAM permission denied
```bash
# Kiểm tra service account permissions
gcloud secrets get-iam-policy GEMINI_API_KEY

# Nếu chưa có binding:
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudfunctions.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### Issue: Functions deploy failed
```bash
# Kiểm tra dependencies
cd functions && npm install

# Kiểm tra error log
firebase deploy --only functions --debug

# Hoặc xem chi tiết trên GCP Console
gcloud functions describe askAI --region=us-central1
```

---

## Production Checklist

- [ ] All secrets created in Google Cloud Secret Manager
- [ ] IAM permissions granted to service account
- [ ] Cloud Functions deployed to Firebase
- [ ] `VITE_FUNCTIONS_ENDPOINT` set in `.env.local`
- [ ] aiClient.js integrated into AIChat.jsx, Quiz.jsx
- [ ] Test: API call works end-to-end
- [ ] Test: Credits deducted correctly
- [ ] Test: Error handling (invalid token, insufficient credits)
- [ ] Delete old direct API integration code
- [ ] Update documentation for team

---

**Status**: Ready for deployment  
**Date**: Oct 18, 2026
