# 💳 Payme Virtual Terminal - Ultra-Simple Guide

## 🤔 **Do We Need Backend? YES!**

Even with Virtual Terminal, backend is required for:
1. **Security** - Hide secret keys from users
2. **Validation** - Check order before payment
3. **Tracking** - Save payment status to database
4. **Webhooks** - Receive payment confirmation from Payme

---

## 📊 **Simple Flow Diagram**

```
┌──────────────┐
│   Customer   │
│  (Frontend)  │
└──────┬───────┘
       │ 1. Click "Pay with Payme"
       │
       ▼
┌──────────────┐
│ Your Backend │ ◄── Securely stores Payme keys
│  (Medusa)    │
└──────┬───────┘
       │ 2. Create receipt via Payme API
       │
       ▼
┌──────────────┐
│  Payme API   │
└──────┬───────┘
       │ 3. Return checkout URL
       │
       ▼
┌──────────────┐
│   Customer   │ 4. Redirected to Payme payment page
│ pays on Payme│    (Payme hosts the payment form)
└──────┬───────┘
       │ 5. Payment complete
       │
       ▼
┌──────────────┐
│ Your Backend │ 6. Webhook: Payment confirmed
│   Webhook    │    Marks order as paid
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Customer   │ 7. Returns to your site
│   Success!   │    Sees confirmation
└──────────────┘
```

---

## 🎯 **For Frontend Developers**

### **What You Build:**

#### **1. One Button (2 minutes)**
```jsx
<button onClick={payWithPayme}>
  💳 Pay with Payme
</button>
```

#### **2. One Function (5 minutes)**
```javascript
const payWithPayme = async () => {
  // Call YOUR backend (not Payme directly!)
  const response = await fetch('/store/payme/create-receipt', {
    method: 'POST',
    body: JSON.stringify({
      orderId: cart.id,
      amount: cart.total  // in UZS
    })
  })
  
  const { checkoutUrl } = await response.json()
  
  // Redirect to Payme
  window.location.href = checkoutUrl
}
```

#### **3. One Confirmation Page (5 minutes)**
```jsx
const OrderSuccess = () => {
  return <div>✅ Payment Successful!</div>
}
```

**That's it!** No payment forms, no card inputs, no complex logic.

---

## 🔧 **For Backend Developers**

### **What You Build:**

#### **1. One Endpoint (10 minutes)**

```typescript
// src/api/store/payme/create-receipt/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paymeRpc } from "../../../../lib/payme"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { orderId, amount } = req.body as any
  
  // Call Payme API
  const result = await paymeRpc("receipts.create", {
    amount: amount * 100, // Convert UZS to Tiyin
    account: { order_id: orderId }
  })

  if (result.ok) {
    return res.json({
      success: true,
      checkoutUrl: `https://checkout.test.paycom.uz/${result.result._id}`
    })
  }
  
  return res.status(400).json({ success: false })
}
```

#### **2. Webhook Already Done! ✅**
Located at: `src/api/store/custom/payme-callback.ts`

---

## ✅ **What's Already Configured**

You have these ready:
- ✅ Virtual Terminal: "PREMIUM CARPET-1"
- ✅ Test credentials in `.env`
- ✅ Payme library: `src/lib/payme.ts`
- ✅ Webhook endpoint: `/store/custom/payme-callback`
- ✅ Mock endpoint for testing: `/store/payme-mock`

---

## 🧪 **Testing Flow**

### **Step 1: Test with Mock (No Real Money)**
```javascript
// Frontend: Use mock endpoint first
fetch('/store/payme-mock', { ... })
```

### **Step 2: Test with Real Payme (Test Mode)**
```javascript
// Frontend: Switch to real endpoint
fetch('/store/payme/create-receipt', { ... })
```

### **Step 3: Production (Real Money)**
```bash
# Update .env
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_PASSWORD=F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
```

---

## 💰 **Currency Note**

Payme uses **Tiyin** (1 UZS = 100 Tiyin)

```javascript
// Frontend sends UZS
{ amount: 50000 }  // 50,000 UZS

// Backend converts to Tiyin
amount * 100  // 5,000,000 Tiyin

// Payme receives Tiyin
```

---

## 🚨 **Common Mistakes**

❌ **DON'T:** Call Payme API from frontend
```javascript
// WRONG! Security risk!
fetch('https://checkout.paycom.uz/api', {
  headers: { 'Authorization': 'YOUR_SECRET_KEY' } // Exposed!
})
```

✅ **DO:** Call your backend
```javascript
// CORRECT! Secure
fetch('/store/payme/create-receipt', { ... })
```

---

## 📋 **Quick Checklist**

### **Backend:**
- [ ] Create `/store/payme/create-receipt/route.ts`
- [ ] Test with Postman/curl
- [ ] Configure webhook URL in Payme dashboard (production)

### **Frontend:**
- [ ] Add "Pay with Payme" button
- [ ] Call backend endpoint on click
- [ ] Redirect to Payme checkout URL
- [ ] Create confirmation page

### **Testing:**
- [ ] Test with `/store/payme-mock` first
- [ ] Test with real Payme in test mode
- [ ] Verify webhook receives notifications
- [ ] Check order marked as paid

---

## 🎓 **Summary**

### **Why Virtual Terminal Still Needs Backend:**

| What | Where | Why |
|------|-------|-----|
| Secret Keys | Backend | Can't expose to users |
| Receipt Creation | Backend → Payme | Needs authentication |
| Payment Form | Payme Website | Hosted by Payme |
| Webhook | Payme → Backend | Confirms payment |
| Order Update | Backend | Marks order paid |

### **Frontend's Job:**
1. Show button
2. Call backend
3. Redirect to Payme
4. Show confirmation

### **Backend's Job:**
1. Store secrets
2. Create receipt
3. Receive webhook
4. Update order

**Simple, secure, and standard! 🎉**

---

## 📞 **Need Help?**

- Full guide: See `PAYME_FRONTEND_INTEGRATION.md`
- Test your setup: `node test-payme.js`
- Payme dashboard: https://business.paycom.uz/

**You're all set to integrate Payme!** 🚀
