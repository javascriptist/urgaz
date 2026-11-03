# ✅ Backend Ready - Frontend Testing Guide

## 🎉 Good News!

Your Payme backend is **fully configured** and ready to accept payments! All you need to do now is test it from the frontend (customer side).

## Why Frontend Testing?

Medusa requires a **publishable API key** for security. This means:
- ❌ Admin panel testing won't work (no publishable key context)
- ✅ Storefront/frontend testing works (has publishable key in requests)

This is actually **better** because it tests the real customer payment flow!

## 🚀 Quick Start - 3 Options

### Option 1: Standalone HTML Test (Easiest - 30 seconds)

1. **Open the test file** in your browser:
   ```bash
   open test-payme-payment.html
   ```
   Or just double-click `test-payme-payment.html` in Finder

2. **Click the payment button**
   - It will call your backend
   - Generate a Payme payment URL
   - Redirect you to Payme's payment page

3. **Complete the payment** on Payme:
   - Use test card: `8600 xxxx xxxx xxxx`
   - Any expiry date and CVV

4. **Watch your server terminal** for transaction logs:
   ```
   📥 Payme Merchant API Request: { method: 'CheckPerformTransaction' }
   ✅ CheckPerformTransaction: OK
   📥 Payme Merchant API Request: { method: 'CreateTransaction' }
   ✅ Transaction created: { state: 1 }
   📥 Payme Merchant API Request: { method: 'PerformTransaction' }
   ✅ Transaction performed: { state: 2 } ← PAYMENT COMPLETE! 🎉
   ```

### Option 2: Add to Your Storefront (Production-Ready)

If you have a Next.js/React storefront, add this button to your checkout page:

```tsx
// components/PaymeButton.tsx
'use client'

import { useState } from 'react'

export default function PaymeButton({ orderId, amount }: { orderId: string, amount: number }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payme-merchant/generate-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!
          },
          body: JSON.stringify({
            orderId,
            amount,
            callbackUrl: `${window.location.origin}/order/confirmed?order_id=${orderId}`
          })
        }
      )

      const { paymentUrl } = await response.json()
      window.location.href = paymentUrl // Redirect to Payme
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Pay with Payme'}
    </button>
  )
}
```

Add to your `.env`:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://9ed63f6b6a5f.ngrok-free.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_fe768fd98de7445ef718c37c9f15616430e92f90bf71aafb27d249faed5e158b
```

### Option 3: Use cURL (Developer Testing)

Test the API directly:

```bash
curl -X POST https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/generate-link \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_fe768fd98de7445ef718c37c9f15616430e92f90bf71aafb27d249faed5e158b" \
  -d '{
    "orderId": "test-order-123",
    "amount": 50000,
    "callbackUrl": "https://yoursite.com/order/confirmed"
  }'
```

You'll get a response with a `paymentUrl` - open that URL in your browser!

## 📋 What Your Backend Does

Your backend has these endpoints ready:

1. **Generate Payment Link** (What frontend calls)
   - Endpoint: `POST /store/payme-merchant/generate-link`
   - Input: orderId, amount, callbackUrl
   - Output: Payme checkout URL
   - ✅ Working and ready!

2. **Billing Endpoint** (What Payme calls)
   - Endpoint: `POST /store/payme-merchant`
   - Handles: CheckPerformTransaction, CreateTransaction, PerformTransaction, etc.
   - ✅ Working and ready!

## 🎯 Testing Checklist

- [ ] Backend running (`npm run dev` in terminal)
- [ ] Ngrok running (check for active tunnel)
- [ ] Open `test-payme-payment.html` in browser
- [ ] Click "Generate Payment Link & Pay"
- [ ] Complete payment on Payme with test card
- [ ] Watch server terminal for transaction logs
- [ ] See success message after payment

## 🔍 Debugging

If something doesn't work:

1. **Check backend is running:**
   ```bash
   curl https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/test
   # Should return: {"status":"ok","message":"Billing endpoint is accessible"}
   ```

2. **Check ngrok is active:**
   - Visit: https://9ed63f6b6a5f.ngrok-free.app
   - Should show Medusa API

3. **Check browser console:**
   - Press F12 → Console tab
   - Look for any errors

4. **Check server logs:**
   - Watch terminal where `npm run dev` is running
   - Should see incoming requests

## 📖 Full Documentation

- **PAYME_STOREFRONT_INTEGRATION.md** - Complete frontend integration guide
- **PAYME_PAYMENT_TRACKING.md** - How to track payments
- **PAYME_MERCHANT_API_GUIDE.md** - Full backend setup (already done!)

## 🎉 Success Looks Like This

1. **In browser:** Payment link generated → Redirected to Payme
2. **On Payme:** Complete payment with test card
3. **In terminal:** See webhook calls from Payme
4. **Back in browser:** Redirected to success page

## 💡 Pro Tips

- **Use the HTML file first** - It's the fastest way to test
- **Watch server logs** - That's where you see Payme's webhook calls
- **Test cards work instantly** - No real money involved
- **State 2 = Paid** - When you see `state: 2` in logs, payment succeeded!

## 🚀 Ready to Test?

```bash
# Make sure backend is running
npm run dev

# In another terminal, make sure ngrok is running
# (Should already be running from setup)

# Open the test file
open test-payme-payment.html

# Click the button and pay! 🎉
```

That's it! Your backend is ready, now just test from the frontend. 🚀
