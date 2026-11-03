# ✅ Payme Merchant API Endpoints - Ready to Use

## All Endpoints Are Now Public (No Keys Required)

All Payme Merchant API endpoints have been configured with:
```typescript
export const AUTHENTICATE = false
export const config = { auth: false }
```

This means **NO Medusa authentication or publishable keys are required**.

## Available Endpoints

### 1. 🔧 Test Endpoint (Check Connectivity)

**Local:**
```bash
curl http://localhost:9000/store/payme-merchant/test
```

**Production (ngrok):**
```bash
curl https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/test
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Billing endpoint is accessible",
  "timestamp": "2025-10-23T...",
  "url": "/store/payme-merchant/test",
  "headers": {
    "authorization": "Missing",
    "contentType": "Not set"
  }
}
```

### 2. 💰 Main Billing Endpoint (For Payme's Callbacks)

**URL:** `POST /store/payme-merchant`

**What Payme Sends:**
```json
{
  "method": "CheckPerformTransaction",
  "params": {
    "amount": 5000000,
    "account": {
      "order_id": "test-order-123"
    }
  },
  "id": 1
}
```

**Authentication:** Basic Auth with "Paycom:{your_password}"

**This is what you register in Payme dashboard:**
- Local: `http://localhost:9000/store/payme-merchant`
- Production: `https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant`

### 3. 🔗 Generate Payment Link (For Your Frontend)

**Local:**
```bash
curl -X POST http://localhost:9000/store/payme-merchant/generate-link \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-123",
    "amount": 50000,
    "callbackUrl": "https://yoursite.com/success"
  }'
```

**Production (ngrok):**
```bash
curl -X POST https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/generate-link \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-123",
    "amount": 50000,
    "callbackUrl": "https://yoursite.com/success"
  }'
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://checkout.paycom.uz/68ef46c3097472f1628da03b?amount=5000000&account[order_id]=test-order-123&callback=...",
  "orderId": "test-order-123",
  "amount": 5000000,
  "merchantId": "68ef46c3097472f1628da03b"
}
```

### 4. 📋 View Transactions

**Local:**
```bash
curl http://localhost:9000/store/payme-merchant/transactions
```

**Production:**
```bash
curl https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/transactions
```

## Quick Test (No Keys Needed!)

### Test from Command Line:

```bash
# 1. Make sure server is running
npm run dev

# 2. Test connectivity (in another terminal)
curl http://localhost:9000/store/payme-merchant/test

# 3. Generate a payment link
curl -X POST http://localhost:9000/store/payme-merchant/generate-link \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test-123","amount":50000}'

# You'll get a payment URL - open it in your browser!
```

### Test from Browser:

1. **Open the HTML test file:**
   ```bash
   open test-payme-payment.html
   ```

2. **Or visit directly in browser:**
   - http://localhost:9000/store/payme-merchant/test

## Production URLs (With Ngrok)

When your ngrok tunnel is running (`ngrok http 9000`):

| Endpoint | URL |
|----------|-----|
| **Test** | https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/test |
| **Billing** (for Payme) | https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant |
| **Generate Link** | https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/generate-link |
| **Transactions** | https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/transactions |

## What This Means

✅ **Anyone can call these endpoints** - No Medusa authentication required
✅ **Payme can call billing endpoint** - Uses their own Basic Auth
✅ **Your frontend can generate payment links** - No publishable key needed
✅ **Public test endpoint** - Check if your server is accessible

## Important Notes

1. **Security:** The main billing endpoint (`/store/payme-merchant`) verifies Payme's Basic Auth credentials, so it's still secure.

2. **Generate Link Endpoint:** While public, it only generates URLs. Actual payments require Payme authentication.

3. **Production:** When deploying, replace ngrok URL with your actual domain.

## Configuration Summary

All these files have been updated:

- ✅ `/src/api/store/payme-merchant/route.ts` - Main billing endpoint
- ✅ `/src/api/store/payme-merchant/generate-link/route.ts` - Payment link generator
- ✅ `/src/api/store/payme-merchant/test/route.ts` - Test endpoint
- ✅ `/src/api/store/payme-merchant/transactions/route.ts` - Transaction viewer

Each has:
```typescript
export const AUTHENTICATE = false
export const config = { auth: false }
```

## Ready to Use! 🚀

1. Start your server: `npm run dev`
2. Test endpoint: `curl http://localhost:9000/store/payme-merchant/test`
3. Generate payment: Use the HTML test file or cURL
4. Complete payment: On Payme's website
5. Watch logs: See Payme calling your billing endpoint!

No keys required! Just run and test! 🎉
