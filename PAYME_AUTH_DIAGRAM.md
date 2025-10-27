# 🔐 Payme Authentication - Visual Guide

## Header Difference Between Test and Production

### 🧪 TEST MODE
```
┌─────────────────────────────────────────────────────────┐
│  Your Backend (Node.js)                                 │
│                                                          │
│  const auth = "Paycom:68ecf66e...:test_key"            │
│  const encoded = base64(auth)                           │
│                                                          │
│  fetch("https://checkout.test.paycom.uz/api", {        │
│    headers: {                                           │
│      "X-Auth": encoded         ⬅️ No prefix             │
│    }                                                     │
│  })                                                      │
└─────────────────────────────────────────────────────────┘
                      ↓
        ┌─────────────────────────┐
        │  Payme Test API         │
        │  ✅ Accepts X-Auth      │
        │  Returns: Receipt ID    │
        └─────────────────────────┘
```

### 🚀 PRODUCTION MODE
```
┌─────────────────────────────────────────────────────────┐
│  Your Backend (Node.js)                                 │
│                                                          │
│  const auth = "Paycom:68ecf66e...:prod_key"            │
│  const encoded = base64(auth)                           │
│                                                          │
│  fetch("https://checkout.paycom.uz/api", {             │
│    headers: {                                           │
│      "Authorization": "Basic " + encoded  ⬅️ With prefix│
│    }                                                     │
│  })                                                      │
└─────────────────────────────────────────────────────────┘
                      ↓
        ┌─────────────────────────┐
        │  Payme Production API   │
        │  ✅ Accepts Authorization│
        │  💰 Real money          │
        └─────────────────────────┘
```

---

## 🔍 Example Requests

### Test Mode Request
```http
POST https://checkout.test.paycom.uz/api
Content-Type: application/json
X-Auth: UGF5Y29tOjY4ZWNmNjZlZTkwMmIyZjVlZmIzMjdlYTolVmQmUDg0R3BEQG41ZG8/QGpKY1NmR1RlZVdGb1BkcERhY2k=

{
  "method": "receipts.create",
  "params": {
    "amount": 5000000,
    "account": {
      "order_id": "order_123"
    }
  }
}
```

### Production Mode Request
```http
POST https://checkout.paycom.uz/api
Content-Type: application/json
Authorization: Basic UGF5Y29tOjY4ZWNmNjZlZTkwMmIyZjVlZmIzMjdlYTpGNlk1QzlUQUphS29xejNpNDRiZUhPaWJpY3R1OCNaTTF3T28=

{
  "method": "receipts.create",
  "params": {
    "amount": 5000000,
    "account": {
      "order_id": "order_123"
    }
  }
}
```

---

## 🎯 Key Differences Summary

| Aspect | Test Mode | Production Mode |
|--------|-----------|-----------------|
| **URL** | `checkout.test.paycom.uz/api` | `checkout.paycom.uz/api` |
| **Header Name** | `X-Auth` | `Authorization` |
| **Value Format** | `<base64>` | `Basic <base64>` |
| **Example** | `UGF5Y29t...` | `Basic UGF5Y29t...` |
| **Money** | Fake (test) | Real (production) |

---

## 🤖 Our Auto-Detection Code

In `src/lib/payme.ts`:

```typescript
export async function paymeRpc<T = any>(method: string, params: any) {
  const url = process.env.PAYME_API_URL || "https://checkout.test.paycom.uz/api"
  const auth = process.env.PAYME_AUTH
  
  // Auto-detect mode from URL
  const isTestMode = url.includes('test.paycom.uz')
  
  // Base64 encode credentials
  const authEncoded = Buffer.from(auth).toString('base64')
  
  // Choose correct header and format
  const authHeader = isTestMode ? 'X-Auth' : 'Authorization'
  const authValue = isTestMode ? authEncoded : `Basic ${authEncoded}`
  
  // Make API call
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [authHeader]: authValue,  // ✨ Magic happens here
    },
    body: JSON.stringify({ method, params })
  })
  
  return res.json()
}
```

---

## ✅ What You Need to Do

### To Use Test Mode:
```bash
# In .env file:
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_PASSWORD=%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci
```
✅ Code automatically uses `X-Auth` header

### To Switch to Production:
```bash
# In .env file:
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_PASSWORD=F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
```
✅ Code automatically uses `Authorization: Basic` header

**No code changes needed!** Just restart the server.

---

## 🔴 Common Mistakes

### ❌ Wrong: Manually setting header
```typescript
// DON'T DO THIS
headers: {
  "X-Auth": encoded,  // Will fail in production!
}
```

### ✅ Right: Let the code auto-detect
```typescript
// Our code does this automatically
const authHeader = isTestMode ? 'X-Auth' : 'Authorization'
const authValue = isTestMode ? authEncoded : `Basic ${authEncoded}`
```

### ❌ Wrong: Using test header in production
```bash
# Production URL but test header = ERROR
PAYME_API_URL=https://checkout.paycom.uz/api  # Production URL
# Code will use "Authorization: Basic" ✅
```

### ❌ Wrong: Using production header in test
```bash
# Test URL but production header = ERROR
PAYME_API_URL=https://checkout.test.paycom.uz/api  # Test URL
# Code will use "X-Auth" ✅
```

---

## 🧪 How to Verify

### Test the authentication:
```bash
# Test mode
curl -X POST https://checkout.test.paycom.uz/api \
  -H "Content-Type: application/json" \
  -H "X-Auth: $(echo -n 'Paycom:68ecf66e...:test_key' | base64)" \
  -d '{"method":"receipts.get_fiscal_data","params":{}}'

# Production mode
curl -X POST https://checkout.paycom.uz/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'Paycom:68ecf66e...:prod_key' | base64)" \
  -d '{"method":"receipts.get_fiscal_data","params":{}}'
```

---

## 📚 Official Documentation Reference

From Payme docs:
> **Тестовый ключ** используется заголовок `X-Auth`  
> **Боевой ключ** используется заголовок `Authorization` в формате `Basic <base64>`

Translation:
- **Test key** uses `X-Auth` header
- **Production key** uses `Authorization` header with `Basic` prefix

---

**Created**: October 15, 2025  
**Author**: GitHub Copilot  
**Purpose**: Clarify the critical authentication difference
