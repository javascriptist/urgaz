# Payme Frontend Integration Guide (Merchant API)

## Overview
This guide shows how to integrate Payme Merchant API payments into your **storefront** (customer-facing website), not the admin panel.

Your backend is already set up! Now you just need to add payment buttons to your checkout page.

## Backend Setup ✅ (Already Done)

You have:
- ✅ Merchant API billing endpoint: `/store/payme-merchant`
- ✅ Payment link generator: `/store/payme-merchant/generate-link`
- ✅ Ngrok running for HTTPS
- ✅ Billing URL registered in Payme dashboard

## Frontend Integration (What You Need to Do)

### Option 1: Simple Payment Button (Recommended for Testing)

Add this to your checkout page:

```tsx
// app/checkout/PaymeButton.tsx
'use client'

import { useState } from 'react'

export default function PaymeButton({ orderId, amount }: { orderId: string, amount: number }) {
  const [loading, setLoading] = useState(false)

  const handlePaymePayment = async () => {
    setLoading(true)
    
    try {
      // Call your backend to generate payment link
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payme-merchant/generate-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!
        },
        body: JSON.stringify({
          orderId: orderId,
          amount: amount,
          callbackUrl: `${window.location.origin}/order/confirmed?order_id=${orderId}`
        })
      })

      const data = await response.json()
      
      if (data.success && data.paymentUrl) {
        // Redirect to Payme payment page
        window.location.href = data.paymentUrl
      } else {
        alert('Failed to generate payment link: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to process payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePaymePayment}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Pay with Payme'}
    </button>
  )
}
```

### Option 2: Integrated Checkout Page

```tsx
// app/checkout/page.tsx
'use client'

import { useState } from 'react'
import PaymeButton from './PaymeButton'

export default function CheckoutPage() {
  const [cart, setCart] = useState(/* your cart state */)
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      {/* Cart items */}
      <div className="mb-6">
        {/* Show cart items here */}
      </div>

      {/* Total */}
      <div className="text-xl font-bold mb-6">
        Total: {cart.total} UZS
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Choose Payment Method</h2>
        
        {/* Payme Button */}
        <PaymeButton 
          orderId={cart.id} 
          amount={cart.total}
        />

        {/* Other payment methods */}
        <button className="w-full bg-gray-200 py-3 px-4 rounded-lg">
          Cash on Delivery
        </button>
      </div>
    </div>
  )
}
```

### Option 3: Medusa Checkout Integration

If you're using Medusa's built-in checkout:

```tsx
// storefront/src/modules/checkout/components/payment/index.tsx

import PaymeButton from './PaymeButton'

export default function Payment({ cart }) {
  return (
    <div className="space-y-4">
      <h2>Payment Method</h2>
      
      {/* Add Payme as a payment option */}
      <PaymeButton 
        orderId={cart.id}
        amount={cart.total}
      />
      
      {/* Other payment methods */}
    </div>
  )
}
```

## Environment Variables

Add to your storefront `.env`:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://9ed63f6b6a5f.ngrok-free.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_fe768fd98de7445ef718c37c9f15616430e92f90bf71aafb27d249faed5e158b
```

## Payment Flow

```
1. Customer fills cart → Clicks "Pay with Payme"
   ↓
2. Frontend calls: /store/payme-merchant/generate-link
   ↓
3. Backend generates Payme URL and returns it
   ↓
4. Frontend redirects to Payme payment page
   ↓
5. Customer enters card details on Payme
   ↓
6. Payme calls your billing endpoint (CheckPerformTransaction, CreateTransaction, PerformTransaction)
   ↓
7. Payment confirmed! Payme redirects back to your callback URL
   ↓
8. Customer sees "Order Confirmed" page
```

## Testing Without a Full Storefront

If you don't have a storefront yet, create a simple test page:

```html
<!-- test-payment.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Test Payme Payment</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
  <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-2xl font-bold mb-4">Test Payme Payment</h1>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Order ID</label>
        <input 
          type="text" 
          id="orderId" 
          value="test-order-123" 
          class="w-full border rounded px-3 py-2"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Amount (UZS)</label>
        <input 
          type="number" 
          id="amount" 
          value="50000" 
          class="w-full border rounded px-3 py-2"
        />
      </div>
      
      <button 
        onclick="payWithPayme()" 
        class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
      >
        Pay with Payme
      </button>
    </div>
    
    <div id="result" class="mt-4 p-3 rounded hidden"></div>
  </div>

  <script>
    async function payWithPayme() {
      const orderId = document.getElementById('orderId').value
      const amount = parseInt(document.getElementById('amount').value)
      const resultDiv = document.getElementById('result')
      
      try {
        resultDiv.className = 'mt-4 p-3 rounded bg-blue-100 text-blue-800'
        resultDiv.textContent = 'Generating payment link...'
        resultDiv.classList.remove('hidden')
        
        const response = await fetch('https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/generate-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': 'pk_fe768fd98de7445ef718c37c9f15616430e92f90bf71aafb27d249faed5e158b'
          },
          body: JSON.stringify({
            orderId: orderId,
            amount: amount,
            callbackUrl: window.location.href + '?payment=success'
          })
        })
        
        const data = await response.json()
        
        if (data.success && data.paymentUrl) {
          resultDiv.className = 'mt-4 p-3 rounded bg-green-100 text-green-800'
          resultDiv.textContent = 'Redirecting to Payme...'
          
          // Redirect to Payme
          setTimeout(() => {
            window.location.href = data.paymentUrl
          }, 1000)
        } else {
          throw new Error(data.error || 'Failed to generate payment link')
        }
      } catch (error) {
        resultDiv.className = 'mt-4 p-3 rounded bg-red-100 text-red-800'
        resultDiv.textContent = 'Error: ' + error.message
        resultDiv.classList.remove('hidden')
      }
    }
    
    // Check if payment was successful
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment') === 'success') {
      const resultDiv = document.getElementById('result')
      resultDiv.className = 'mt-4 p-3 rounded bg-green-100 text-green-800'
      resultDiv.textContent = '✅ Payment completed! Check your server logs to see the transaction.'
      resultDiv.classList.remove('hidden')
    }
  </script>
</body>
</html>
```

Save this as `test-payment.html` and open it in your browser!

## What Happens After Payment

1. **Payme calls your backend** at different stages:
   - `CheckPerformTransaction` - Verify order
   - `CreateTransaction` - Reserve payment
   - `PerformTransaction` - Complete payment ✅

2. **Watch your server terminal** to see these calls happening

3. **Customer is redirected** to your callback URL (order confirmation page)

## Production Checklist

Before going live:

1. ✅ Update ngrok URL to your production domain
2. ✅ Update billing URL in Payme dashboard
3. ✅ Store transactions in database (not in-memory)
4. ✅ Update order status when payment completes
5. ✅ Send confirmation emails
6. ✅ Handle inventory updates

## Need Help?

- Backend is working: Check `PAYME_PAYMENT_TRACKING.md`
- Frontend issues: Check browser console for errors
- Payment not completing: Check server terminal logs
- General setup: Check `PAYME_MERCHANT_API_GUIDE.md`

## Quick Test

1. Save `test-payment.html` file
2. Open it in browser
3. Click "Pay with Payme"
4. Complete payment on Payme's page
5. Watch server terminal for transaction logs!

No admin panel needed - this is how customers will actually pay! 🎉
