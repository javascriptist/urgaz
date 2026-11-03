# How Frontend Calls Payme - Simple Explanation

## 🎯 Quick Answer

Your frontend **NEVER** calls `/admin/payme-webhook` directly. That endpoint is **only for Payme** to call.

Here's the flow:

```
Customer → Your Frontend → Your Backend API → Payme → Customer Pays → Payme calls /admin/payme-webhook → Order marked as paid
```

## 📝 Step-by-Step

### 1. Customer Clicks "Pay with Payme"

```tsx
// In your React/Next.js checkout page
const handlePayment = async () => {
  // Call YOUR backend endpoint (not Payme directly)
  const response = await fetch('/store/payme-merchant/generate-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': 'pk_fe768fd...' // Your Medusa publishable key
    },
    body: JSON.stringify({
      orderId: cart.id,
      amount: 50000  // Amount in UZS
    })
  })
  
  const data = await response.json()
  
  // Redirect customer to Payme's payment page
  window.location.href = data.paymentUrl
}
```

### 2. Your Backend Generates Payment URL

**Endpoint already exists:** `/store/payme-merchant/generate-link/route.ts`

It creates a URL like:
```
https://checkout.paycom.uz/68ef46c3097472f1628da03b?amount=5000000&account[order_id]=order_123
```

### 3. Customer Pays on Payme (External Site)

Customer is redirected to Payme's secure payment page (you don't build this).

### 4. Payme Calls Your Webhook

**This happens automatically - frontend doesn't do anything:**
```
Payme → POST https://yourdomain.com/admin/payme-webhook
```

Your webhook endpoint receives:
- `CheckPerformTransaction` - Verify order exists
- `CreateTransaction` - Reserve payment
- `PerformTransaction` - Complete payment (mark order as paid)

### 5. Customer Returns to Your Site

After payment, Payme redirects customer back to your site:
```
https://yoursite.com/orders/order_123/confirmation?status=success
```

## 🎨 Complete React Example

```tsx
// components/PaymeButton.tsx
import { useState } from 'react'

export function PaymeButton({ orderId, amount }) {
  const [loading, setLoading] = useState(false)
  
  const handlePayment = async () => {
    setLoading(true)
    
    try {
      // Step 1: Generate payment link from YOUR backend
      const res = await fetch('/store/payme-merchant/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          orderId,
          amount,
          returnUrl: `${window.location.origin}/orders/${orderId}/confirmation`
        })
      })
      
      const { paymentUrl } = await res.json()
      
      // Step 2: Redirect to Payme
      if (paymentUrl) {
        window.location.href = paymentUrl
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

## 🔐 Security: Why This Way?

### ✅ Frontend CAN:
- Call `/store/payme-merchant/generate-link` (with publishable key)
- Redirect user to Payme
- Show confirmation page

### ❌ Frontend CANNOT:
- Call `/admin/payme-webhook` (only Payme calls this)
- Access Payme API directly (secret keys must stay on backend)
- Process payments directly

## 📊 Data Flow Diagram

```
┌──────────┐
│ Customer │
│ Frontend │
└────┬─────┘
     │ 1. POST /store/payme-merchant/generate-link
     │    { orderId: "123", amount: 50000 }
     ▼
┌──────────────┐
│ Your Backend │
│ (Medusa)     │
└────┬─────────┘
     │ 2. Returns: { paymentUrl: "https://checkout.paycom.uz/..." }
     ▼
┌──────────┐
│ Customer │
│ Redirects│ → Goes to Payme's payment page
└────┬─────┘
     │ 3. Enters card, pays
     ▼
┌──────────────┐
│ Payme Server │
└────┬─────────┘
     │ 4. POST /admin/payme-webhook
     │    { method: "CreateTransaction", ... }
     ▼
┌──────────────┐
│ Your Backend │ ← Marks order as paid
│ (Webhook)    │
└──────────────┘
     │ 5. Customer redirected back
     ▼
┌──────────┐
│ Customer │
│ Frontend │ → Shows confirmation
└──────────┘
```

## 🎯 Key Points

1. **Frontend only calls:** `/store/payme-merchant/generate-link`
2. **Webhook is called by:** Payme (not your frontend)
3. **Payment happens on:** Payme's website (external)
4. **Frontend's job:** Generate link → Redirect → Show confirmation

## 💡 Already Ready!

You already have:
- ✅ `/store/payme-merchant/generate-link` endpoint (working)
- ✅ `/admin/payme-webhook` endpoint (working)
- ✅ All Payme integration configured

**All you need:** Add the button component to your frontend! 🚀

## 🧪 Quick Test

```bash
# Test the generate-link endpoint
curl -X POST http://localhost:9000/store/payme-merchant/generate-link \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_fe768fd..." \
  -d '{
    "orderId": "test_123",
    "amount": 50000,
    "returnUrl": "http://localhost:3000/confirmation"
  }'

# You'll get back:
# {
#   "paymentUrl": "https://checkout.paycom.uz/68ef46c3097472f1628da03b?amount=5000000&account[order_id]=test_123"
# }
```

That's it! Simple and secure. 🎉
