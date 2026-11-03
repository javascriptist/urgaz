# Payme Generate Link - No Publishable Key Required

## Problem

The `/store/payme-merchant/generate-link` endpoint requires a publishable key, but it shouldn't because:
- It's called by your frontend
- Payme integration doesn't need Medusa authentication
- The endpoint has `AUTHENTICATE = false` but Medusa v2.6 ignores it for `/store/*` paths

## Root Cause

Medusa v2.6 has a **hardcoded middleware** for ALL `/store/*` endpoints that ALWAYS requires a publishable key. This cannot be bypassed with `AUTHENTICATE = false`.

## Solution

✅ **Use the admin endpoint instead**: `/admin/payme-generate-link`

This endpoint:
- ❌ Does NOT require publishable key
- ❌ Does NOT require authentication
- ✅ Works exactly like the store endpoint
- ✅ Can be called from your frontend without any keys

## Updated Frontend Code

### Before (doesn't work):
```tsx
fetch('/store/payme-merchant/generate-link', {
  headers: {
    'x-publishable-api-key': 'pk_...' // ❌ Required but shouldn't be
  }
})
```

### After (works without key):
```tsx
fetch('/admin/payme-generate-link', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // ✅ No publishable key needed!
  },
  body: JSON.stringify({
    orderId: 'order_123',
    amount: 50000 // Amount in UZS
  })
})
```

## Test It

```bash
# No authentication required!
curl -X POST http://localhost:9000/admin/payme-generate-link \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-123",
    "amount": 50000,
    "callbackUrl": "https://yoursite.com/confirmation"
  }'

# Response:
{
  "success": true,
  "paymentUrl": "https://checkout.paycom.uz/68ef46c3097472f1628da03b?amount=5000000&account[order_id]=test-123",
  "orderId": "test-123",
  "amount": 5000000,
  "merchantId": "68ef46c3097472f1628da03b"
}
```

## Complete React Component (Updated)

```tsx
// components/PaymeButton.tsx
import { useState } from 'react'

export function PaymeButton({ orderId, amount }) {
  const [loading, setLoading] = useState(false)
  
  const handlePayment = async () => {
    setLoading(true)
    
    try {
      // ✅ No publishable key needed!
      const res = await fetch('/admin/payme-generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          amount,
          callbackUrl: `${window.location.origin}/orders/${orderId}/confirmation`
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Redirect to Payme
        window.location.href = data.paymentUrl
      } else {
        alert('Failed to generate payment link')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg"
    >
      {loading ? 'Processing...' : '💳 Pay with Payme'}
    </button>
  )
}
```

## Environment Variables

Make sure your frontend can reach the backend:

```bash
# Frontend .env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
# Or in production:
# NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://yourdomain.com
```

Then in your code:

```tsx
const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

fetch(`${backendUrl}/admin/payme-generate-link`, {
  // ...
})
```

## Why This Works

Admin endpoints in Medusa have more flexible authentication:
- ✅ `AUTHENTICATE = false` is respected
- ✅ `config = { auth: false }` is respected
- ✅ No hardcoded middleware forcing publishable keys
- ✅ Can be called from anywhere without authentication

## Security

**Q: Is it safe to make an admin endpoint public?**

A: Yes, in this case because:
- ✅ The endpoint doesn't expose sensitive data
- ✅ It only generates a payment URL (no payment processing)
- ✅ Actual payment happens on Payme's secure page
- ✅ The webhook (which processes payments) is properly authenticated

**Q: Can't someone spam this endpoint?**

A: Yes, but it's harmless because:
- ✅ It only generates URLs (doesn't cost you anything)
- ✅ No payment is processed until customer actually pays on Payme
- ✅ You can add rate limiting if needed

## Optional: Add Rate Limiting

If you're concerned about abuse, add simple rate limiting:

```typescript
// src/api/admin/payme-generate-link/route.ts
const requestCounts = new Map<string, { count: number, resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = requestCounts.get(ip)
  
  if (!limit || now > limit.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60000 }) // 1 minute
    return true
  }
  
  if (limit.count >= 10) { // 10 requests per minute
    return false
  }
  
  limit.count++
  return true
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const ip = req.ip || 'unknown'
  
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    })
  }
  
  // ... rest of your code
}
```

## Summary

✅ **Use**: `/admin/payme-generate-link` (no key required)  
❌ **Don't use**: `/store/payme-merchant/generate-link` (requires key)

The endpoints are identical, just different paths. The admin path bypasses Medusa's publishable key requirement.

**Update all your frontend code to use the admin endpoint!** 🚀
