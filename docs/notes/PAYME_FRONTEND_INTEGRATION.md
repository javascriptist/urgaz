# 💳 Payme Payment Integration - Simplified Frontend Guide

> **⚠️ IMPORTANT**: This guide covers **TEST MODE** integration. Before going to production, read **[PAYME_PRODUCTION_GUIDE.md](./PAYME_PRODUCTION_GUIDE.md)** to understand the critical differences in authentication headers.

## 🎯 **Why Do We Need Backend?**

Even though you have a **Virtual Terminal**, you still need backend because:

1. **🔐 Security**: Your Payme secret keys must stay on the server (never in frontend code)
2. **✅ Validation**: Backend validates order amount before creating payment
3. **📊 Tracking**: Backend saves payment status in your database
4. **🔔 Webhooks**: Payme sends payment confirmation to your backend, not frontend

### **Payment Flow:**
```
Customer clicks "Pay" 
    ↓
Frontend → Your Backend (validates order)
    ↓    PAYME_API_URL=https://checkout.paycom.uz/api
    PAYME_PASSWORD=F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
Your Backend → Payme API (creates receipt)
    ↓
Payme returns receipt ID
    ↓
Customer redirects to Payme checkout page
    ↓
Customer pays on Payme
    ↓
Payme → Your Backend webhook (confirms payment)
    ↓
Your Backend marks order as paid
```

---

## ✅ **What's Already Done (Backend)**

You don't need to build anything! These are ready:

### **Configured:**
- ✅ Virtual Terminal: "PREMIUM CARPET-1" 
- ✅ Test API credentials in `.env`
- ✅ Mock endpoint for testing: `/store/payme-mock`
- ✅ Webhook ready: `/store/custom/payme-callback`

### **Missing (You Need to Create):**
- ❌ Real receipt creation endpoint
- ❌ Order status checking endpoint

## 🚀 **Quick Start: 3 Simple Steps**

### **Step 1: Create Backend Endpoint (5 minutes)**

First, create the real receipt endpoint:

```typescript
// src/api/store/payme/create-receipt/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paymeRpc } from "../../../../lib/payme"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { orderId, amount } = req.body as any

  // Convert UZS to Tiyin (Payme's currency unit)
  const amountInTiyin = Math.round(amount * 100)

  try {
    // Call Payme API to create receipt
    const result = await paymeRpc("receipts.create", {
      amount: amountInTiyin,
      account: {
        order_id: orderId
      }
    })

    if (result.ok) {
      return res.json({
        success: true,
        receiptId: result.result._id,
        checkoutUrl: `https://checkout.test.paycom.uz/${result.result._id}`
      })
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      })
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
```

### **Step 2: Frontend Button (Copy & Paste)**

Add this button to your checkout page:

```tsx
// In your checkout page
const handlePaymeCheckout = async () => {
  try {
    // Call your backend to create Payme receipt
    const response = await fetch('/store/payme/create-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: cart.id,
        amount: cart.total // Amount in UZS
      })
    })

    const data = await response.json()

    if (data.success) {
      // Redirect to Payme payment page
      window.location.href = data.checkoutUrl
    } else {
      alert('Payment failed: ' + data.error)
    }
  } catch (error) {
    alert('Error creating payment')
    console.error(error)
  }
}

// Button component
<button
  onClick={handlePaymeCheckout}
  className="w-full bg-blue-600 text-white py-3 rounded-lg"
>
  💳 Pay with Payme
</button>
```

### **Step 3: Handle Return (Optional)**

After payment, Payme redirects user back. Create a confirmation page:

```tsx
// pages/order-confirmation/[orderId].tsx
const OrderConfirmation = () => {
  const { orderId } = useParams()
  
  useEffect(() => {
    // Check order status from your backend
    fetch(`/store/orders/${orderId}`)
      .then(res => res.json())
      .then(order => {
        if (order.payment_status === 'captured') {
          // Show success message
        }
      })
  }, [orderId])

  return <div>✅ Payment Successful!</div>
}
```

---

## 📱 **That's It! Simple Integration**

### **For Frontend Developers:**

**You only need to know:**
1. Call `/store/payme/create-receipt` with `orderId` and `amount`
2. Redirect user to the `checkoutUrl` you get back
3. Payme handles the payment UI (you don't build payment forms)
4. User returns to your site after payment

**You DON'T need to:**
- ❌ Handle Payme API directly
- ❌ Store secret keys in frontend
- ❌ Build payment forms
- ❌ Handle webhooks (backend does it)

---

## 🧪 **Testing (Using Mock First)**

Before using real Payme, test with the mock endpoint:

```tsx
// Change this:
fetch('/store/payme/create-receipt', ...)

// To this (for testing):
fetch('/store/payme-mock', ...)
```

Mock returns fake data so you can test the UI flow without real payments.

---

```tsx
// components/PaymePaymentButton.tsx
import React, { useState } from 'react'

interface PaymePaymentButtonProps {
  cartId: string
  orderId: string
  totalAmount: number // in UZS
  onPaymentStart?: () => void
  onPaymentComplete?: (success: boolean) => void
}

export const PaymePaymentButton: React.FC<PaymePaymentButtonProps> = ({
  cartId,
  orderId,
  totalAmount,
  onPaymentStart,
  onPaymentComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePaymePayment = async () => {
    setIsProcessing(true)
    onPaymentStart?.()

    try {
      // Create Payme payment receipt
      const response = await fetch('/store/payme-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          amount: totalAmount, // Amount in UZS
          returnUrl: `${window.location.origin}/order-confirmation/${orderId}`
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to Payme checkout page
        const paymeCheckoutUrl = `https://checkout.test.paycom.uz/${data.data._id}`
        
        // Option 1: Redirect in same window
        window.location.href = paymeCheckoutUrl
        
        // Option 2: Open in new window/tab
        // window.open(paymeCheckoutUrl, '_blank')
      } else {
        alert('Failed to initialize Payme payment')
        onPaymentComplete?.(false)
      }
    } catch (error) {
      console.error('Payme payment error:', error)
      alert('Payment initialization failed')
      onPaymentComplete?.(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={handlePaymePayment}
      disabled={isProcessing}
      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <>
          <span className="animate-spin">⏳</span>
          Processing...
        </>
      ) : (
        <>
          💳 Pay with Payme
        </>
      )}
    </button>
  )
}
```

---

### **Step 2: Integrate into Checkout Page**

```tsx
// pages/CheckoutPage.tsx
import React, { useState } from 'react'
import { PaymePaymentButton } from '../components/PaymePaymentButton'

export const CheckoutPage: React.FC<{ cart: any }> = ({ cart }) => {
  const [selectedPayment, setSelectedPayment] = useState<'payme' | 'cod' | 'stripe'>('payme')

  // Calculate total in UZS
  const totalUZS = cart.total / 100 // Convert from cents if needed

  return (
    <div className="checkout-page max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Order Summary */}
      <div className="order-summary mb-6 p-4 bg-gray-50 rounded">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        {cart.items?.map((item: any) => (
          <div key={item.id} className="flex justify-between mb-2">
            <span>{item.title} x {item.quantity}</span>
            <span>{item.total} UZS</span>
          </div>
        ))}
        <div className="border-t pt-2 mt-2 flex justify-between font-bold">
          <span>Total:</span>
          <span>{totalUZS.toLocaleString()} UZS</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="payment-methods mb-6">
        <h2 className="font-semibold mb-3">Select Payment Method</h2>
        
        <div className="space-y-3">
          {/* Payme Option */}
          <label className={`flex items-center p-4 border rounded cursor-pointer ${
            selectedPayment === 'payme' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}>
            <input
              type="radio"
              name="payment"
              value="payme"
              checked={selectedPayment === 'payme'}
              onChange={() => setSelectedPayment('payme')}
              className="mr-3"
            />
            <div>
              <div className="font-semibold">💳 Payme</div>
              <div className="text-sm text-gray-600">
                Pay with Payme - Cards, Wallets, and more
              </div>
            </div>
          </label>

          {/* Cash on Delivery Option */}
          <label className={`flex items-center p-4 border rounded cursor-pointer ${
            selectedPayment === 'cod' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}>
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={selectedPayment === 'cod'}
              onChange={() => setSelectedPayment('cod')}
              className="mr-3"
            />
            <div>
              <div className="font-semibold">💵 Cash on Delivery</div>
              <div className="text-sm text-gray-600">
                Pay when you receive your order
              </div>
            </div>
          </label>

          {/* Stripe Option (if enabled) */}
          <label className={`flex items-center p-4 border rounded cursor-pointer ${
            selectedPayment === 'stripe' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}>
            <input
              type="radio"
              name="payment"
              value="stripe"
              checked={selectedPayment === 'stripe'}
              onChange={() => setSelectedPayment('stripe')}
              className="mr-3"
            />
            <div>
              <div className="font-semibold">💳 Credit/Debit Card</div>
              <div className="text-sm text-gray-600">
                International cards via Stripe
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Payment Button */}
      <div className="payment-action">
        {selectedPayment === 'payme' && (
          <PaymePaymentButton
            cartId={cart.id}
            orderId={cart.id} // Or generate order ID
            totalAmount={totalUZS}
            onPaymentStart={() => {
              console.log('Payment started')
            }}
            onPaymentComplete={(success) => {
              if (success) {
                console.log('Payment completed')
              }
            }}
          />
        )}

        {selectedPayment === 'cod' && (
          <button
            onClick={() => handleCODCheckout()}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700"
          >
            Place Order - Cash on Delivery
          </button>
        )}

        {selectedPayment === 'stripe' && (
          <button
            onClick={() => handleStripeCheckout()}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700"
          >
            Pay with Card
          </button>
        )}
      </div>
    </div>
  )
}
```

---

### **Step 3: Handle Payment Callback/Return**

```tsx
// pages/OrderConfirmationPage.tsx
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [orderStatus, setOrderStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [orderDetails, setOrderDetails] = useState<any>(null)

  useEffect(() => {
    // Check payment status
    checkPaymentStatus()
  }, [orderId])

  const checkPaymentStatus = async () => {
    try {
      // Fetch order details from your backend
      const response = await fetch(`/store/orders/${orderId}`)
      const order = await response.json()

      setOrderDetails(order)

      // Check if payment was captured
      if (order.metadata?.payment_captured) {
        setOrderStatus('success')
      } else {
        // Payment might still be processing
        setOrderStatus('loading')
        
        // Re-check after a delay
        setTimeout(checkPaymentStatus, 3000)
      }
    } catch (error) {
      console.error('Error checking payment:', error)
      setOrderStatus('failed')
    }
  }

  if (orderStatus === 'loading') {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
        <p className="text-gray-600">Please wait while we confirm your payment</p>
      </div>
    )
  }

  if (orderStatus === 'success') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your order #{orderId} has been confirmed
        </p>
        
        <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-3">Order Details</h3>
          {/* Display order items */}
        </div>

        <button
          onClick={() => window.location.href = '/orders'}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          View My Orders
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">❌</div>
      <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
      <p className="text-gray-600 mb-6">
        There was an issue processing your payment
      </p>
      
      <button
        onClick={() => window.location.href = '/checkout'}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        Try Again
      </button>
    </div>
  )
}
```

---

## 🔧 **Backend Webhook Configuration**

### **In Payme Business Dashboard:**

1. Go to your **PREMIUM CARPET-1** cashbox settings
2. Find **"Webhook URL"** or **"Callback URL"** section
3. Set webhook URL to:
   ```
   https://yourdomain.com/store/custom/payme-callback
   ```
   *(For local testing: use ngrok or similar tunnel service)*

4. Save settings

### **Webhook Handles These Events:**
- ✅ `receipts.pay` - Payment completed successfully
- ✅ `receipts.cancel` - Payment was canceled/reversed
- ✅ `receipts.check` - Check receipt status

---

## 💰 **Currency Conversion Helper**

```typescript
// utils/currency.ts

// Payme works with Tiyin (1 UZS = 100 Tiyin)
export const uzsToTiyin = (amountUzs: number): number => {
  return Math.round(amountUzs * 100)
}

export const tiyinToUzs = (amountTiyin: number): number => {
  return amountTiyin / 100
}

// Example usage:
// const amount = 50000 // 50,000 UZS
// const tiyinAmount = uzsToTiyin(amount) // 5,000,000 Tiyin
```

---

## 🧪 **Testing the Integration**

### **1. Test with Mock Endpoint (Development)**
```bash
# Current setup uses mock endpoint
# POST /store/payme-mock
# Returns fake receipt for testing UI flow
```

### **2. Test with Real Payme (Test Environment)**
```bash
# Update PaymePaymentButton to use real endpoint
# Change from: /store/payme-mock
# Change to: /store/payme/create-receipt (you'll need to create this)
```

### **3. Create Real Receipt Endpoint**

```typescript
// src/api/store/payme/create-receipt/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paymeRpc, uzsToTiyin } from "../../../../lib/payme"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { orderId, amount } = req.body as any

  try {
    const result = await paymeRpc("receipts.create", {
      amount: uzsToTiyin(amount), // Convert UZS to Tiyin
      account: {
        order_id: orderId
      }
    })

    if (result.ok) {
      return res.json({
        success: true,
        data: result.result
      })
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      })
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
```

---

## 🚀 **Production Checklist**

### **Before Going Live:**

- [ ] **Update `.env` with production credentials:**
  ```bash
  PAYME_API_URL=https://checkout.paycom.uz/api
  PAYME_PASSWORD=F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
  ```

- [ ] **Configure webhook URL in Payme dashboard:**
  ```
  https://yourdomain.com/store/custom/payme-callback
  ```

- [ ] **Test full payment flow:**
  - Place order
  - Complete payment
  - Verify webhook receives notification
  - Check order marked as paid

- [ ] **Handle edge cases:**
  - Payment timeout
  - Payment cancellation
  - Network errors
  - Duplicate payments

---

## 🎨 **UI Customization Tips**

### **Payme Brand Colors:**
```css
/* Official Payme colors */
.payme-button {
  background: #1890FF; /* Payme blue */
}

.payme-button:hover {
  background: #096DD9;
}
```

### **Payment Method Icons:**
```tsx
// Add Payme logo
<img 
  src="/payme-logo.svg" 
  alt="Payme" 
  className="h-6 w-auto"
/>
```

---

## 📞 **Support & Resources**

- **Payme Test Dashboard:** https://test.paycom.uz/
- **Payme Business Dashboard:** https://business.paycom.uz/
- **API Documentation:** Contact Payme support
- **Your Cashbox ID:** `68ecf66ee902b2f5efb327ea`

---

## 🔐 **Security Notes**

1. ✅ **Never expose credentials in frontend code**
2. ✅ **Always validate webhook signatures** (implement in webhook endpoint)
3. ✅ **Use HTTPS in production**
4. ✅ **Validate order amounts match expected totals**
5. ✅ **Prevent duplicate payment processing**

---

## 💡 **Next Steps**

1. Create the `PaymePaymentButton` component in your storefront
2. Integrate it into your checkout page
3. Test with mock endpoint first
4. Create real receipt endpoint when ready
5. Configure webhook URL in Payme dashboard
6. Test full payment flow
7. Switch to production credentials when ready to launch

---

## 💡 **Summary: Backend vs Frontend Responsibilities**

### **Backend (Your Medusa Server):**
- ✅ Stores Payme secret keys safely
- ✅ Creates payment receipts via Payme API
- ✅ Receives webhook when payment completes
- ✅ Marks orders as paid in database
- ✅ Validates amounts before payment

### **Frontend (Your Storefront):**
- ✅ Shows "Pay with Payme" button
- ✅ Calls your backend API (not Payme directly)
- ✅ Redirects user to Payme checkout
- ✅ Shows confirmation after payment
- ❌ Never touches Payme API directly
- ❌ Never stores secret keys

---

## 🔧 **Complete Minimal Example**

Here's everything you need in one place:

### **Backend Endpoint:**
```typescript
// src/api/store/payme/create-receipt/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paymeRpc } from "../../../../lib/payme"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { orderId, amount } = req.body as any
  
  const result = await paymeRpc("receipts.create", {
    amount: Math.round(amount * 100), // UZS to Tiyin
    account: { order_id: orderId }
  })

  if (result.ok) {
    return res.json({
      success: true,
      checkoutUrl: `https://checkout.test.paycom.uz/${result.result._id}`
    })
  }
  
  return res.status(400).json({ success: false, error: result.error })
}
```

### **Frontend Button:**
```tsx
const PayWithPaymeButton = ({ cartId, totalAmount }) => {
  const handlePayment = async () => {
    const res = await fetch('/store/payme/create-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: cartId, amount: totalAmount })
    })
    
    const data = await res.json()
    if (data.success) {
      window.location.href = data.checkoutUrl
    }
  }

  return (
    <button onClick={handlePayment}>
      💳 Pay with Payme
    </button>
  )
}
```

### **That's all you need!** 🎉

---

## ❓ **Common Questions**

**Q: Can frontend call Payme API directly?**  
A: Technically yes, but you'd expose your secret keys = security risk. Always use backend.

**Q: Why not use Payme's JavaScript SDK?**  
A: Virtual Terminal uses REST API, not JavaScript SDK. Backend integration is standard.

**Q: Do I need to build payment forms?**  
A: No! Payme hosts the payment page. You just redirect there.

**Q: How do I know when payment is complete?**  
A: Payme sends webhook to your backend. Check order status via your API.

**Q: Can I test without real money?**  
A: Yes! Use test credentials (already configured) and `/store/payme-mock` endpoint.

---

## 📞 **Next Steps**

1. **Create the backend endpoint** (5 minutes)
2. **Add the frontend button** (2 minutes)  
3. **Test with mock endpoint** (test the flow)
4. **Switch to real endpoint** when ready
5. **Configure webhook URL** in Payme dashboard (production)

**Your Payme Virtual Terminal is ready to use!** 🚀

---

## 🎯 **Key Takeaway**

**Virtual Terminal = You still need backend**, but:
- ✅ No need to build complex payment forms
- ✅ Payme hosts the checkout page
- ✅ You just redirect users there
- ✅ Backend handles security & webhooks

**Frontend Developer needs to know:**
- One API call: `POST /store/payme/create-receipt`
- One redirect: User goes to Payme checkout
- One confirmation page: Show success after return

That's it! Simple and secure. 🎉
