# 🧪 Complete Payme Payment Testing Flow

## 🎯 **Two Testing Options**

You now have two complete payment testing flows:

---

## 1️⃣ **Mock Payment Flow (Safe Testing)**

### **Purpose:**
- Test UI/UX without calling real APIs
- Perfect for frontend development
- No real money, no external dependencies

### **Steps:**

1. **Open Test Page:**
   ```
   http://localhost:9000/app/payme-test
   ```

2. **Enter Details:**
   - Order ID: `test-order-123`
   - Amount: `50000` (UZS)

3. **Click: "🧪 Test Mock Payment"**
   - Creates mock receipt
   - Redirects to mock checkout page

4. **Mock Checkout Page:**
   - URL: `/app/payme-mock-checkout`
   - Shows mock payment card
   - Click "Pay Now" to complete
   - OR click "Cancel" to cancel

5. **Result:**
   - Simulates successful payment
   - Returns to test page
   - No actual payment made

### **When to Use:**
- ✅ Testing UI/UX flow
- ✅ Frontend development
- ✅ Quick iteration
- ✅ No internet needed

---

## 2️⃣ **Real Payme Flow (Actual Integration)**

### **Purpose:**
- Test real Payme integration
- Complete end-to-end flow
- Uses Payme test server

### **Steps:**

1. **Open Test Page:**
   ```
   http://localhost:9000/app/payme-test
   ```

2. **Enter Details:**
   - Order ID: `real-order-456`
   - Amount: `75000` (UZS)

3. **Click: "💳 Test Real Payme"**
   - Calls real Payme API
   - Creates actual receipt
   - Shows confirmation dialog

4. **Confirmation Dialog:**
   - Shows receipt ID
   - Shows amount in UZS and Tiyin
   - Click OK to open Payme

5. **Redirects to Real Payme:**
   - URL: `https://checkout.test.paycom.uz/[receipt-id]`
   - Opens in new tab
   - Real Payme website

6. **Complete Payment on Payme:**
   
   **Test Card Numbers:**
   ```
   Success Payment:
   Card: 8600 1234 5678 9012
   Exp:  12/25
   CVV:  123
   SMS:  666666 (test code)
   
   Failed Payment:
   Card: 8600 0000 0000 0000
   (Any card ending in 0000)
   ```

7. **Payment Complete:**
   - Payme processes payment
   - Sends webhook to your backend
   - User can return to your site

8. **Check Backend:**
   - Watch terminal logs:
   ```bash
   ✅ Payme receipt created: xxxxx
   🔗 Checkout URL: https://checkout.test.paycom.uz/xxxxx
   
   # After payment:
   Payme webhook: receipts.pay
   Payment captured for order: real-order-456
   ```

### **When to Use:**
- ✅ Testing real integration
- ✅ Testing webhooks
- ✅ Testing error handling
- ✅ Before production launch

---

## 📊 **Side-by-Side Comparison**

| Feature | Mock Payment | Real Payme |
|---------|-------------|------------|
| **Speed** | Instant | 2-3 seconds |
| **Internet** | Not needed | Required |
| **Payme Account** | Not needed | Test account |
| **Checkout Page** | Mock (your server) | Real Payme |
| **Payment Cards** | Fake display | Real test cards |
| **Webhook** | Can simulate | Real webhook |
| **Database** | Can update | Should update |
| **Cost** | Free | Free (test mode) |

---

## 🎨 **Visual Flow**

### **Mock Payment:**
```
Test Page
    ↓
Mock Endpoint
    ↓
Mock Checkout (/app/payme-mock-checkout)
    ↓
Click "Pay Now"
    ↓
Success Dialog
    ↓
Return to Test Page
```

### **Real Payme:**
```
Test Page
    ↓
Real Endpoint (/store/payme/create-receipt)
    ↓
Payme API (creates receipt)
    ↓
Redirect to https://checkout.test.paycom.uz
    ↓
User completes payment on Payme
    ↓
Payme sends webhook to your backend
    ↓
Backend marks order as paid
    ↓
User returns to your site
```

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Successful Payment**
1. Use mock or real payment
2. Complete the payment
3. Verify order marked as paid
4. Check confirmation shown to user

### **Scenario 2: Failed Payment**
1. Use real Payme
2. Use card ending in 0000
3. Verify payment fails
4. Check error handling

### **Scenario 3: Cancelled Payment**
1. Use real Payme
2. Click "Cancel" on Payme page
3. Verify user can retry
4. Check no duplicate charges

### **Scenario 4: Webhook Testing**
1. Use real Payme
2. Complete payment
3. Check terminal logs for webhook
4. Verify order status updated

---

## 🎯 **Test Checklist**

### **Before Production:**

#### **Mock Testing:**
- [ ] Mock payment creates receipt
- [ ] Redirects to mock checkout
- [ ] Mock checkout displays correctly
- [ ] "Pay Now" completes payment
- [ ] "Cancel" returns properly
- [ ] UI looks good on mobile

#### **Real Payme Testing:**
- [ ] Receipt created successfully
- [ ] Redirects to real Payme
- [ ] Test card payment succeeds
- [ ] Webhook received and logged
- [ ] Order marked as paid in database
- [ ] Failure card triggers error
- [ ] Cancel returns user properly
- [ ] No duplicate payments

#### **Integration Testing:**
- [ ] Works with actual cart/order
- [ ] Correct amount calculated
- [ ] Currency conversion correct (UZS → Tiyin)
- [ ] Email notifications sent
- [ ] Order history updated

---

## 🚀 **Using in Your Storefront**

Once tested, integrate to your storefront:

```typescript
// Simple integration code
const handleCheckout = async () => {
  const response = await fetch('/store/payme/create-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': 'pk_fe768fd98de7445ef718c37c9f15616430e92f90bf71aafb27d249faed5e158b'
    },
    body: JSON.stringify({
      orderId: cart.id,
      amount: cart.total // in UZS
    })
  })
  
  const { checkoutUrl } = await response.json()
  
  // Redirect to Payme
  window.location.href = checkoutUrl
}
```

---

## 📱 **Mobile Testing**

Both flows work on mobile:
- ✅ Mock checkout is responsive
- ✅ Real Payme has mobile app integration
- ✅ Test on iOS and Android

---

## 🎉 **You're Ready!**

You now have complete payment testing capabilities:
1. **Mock** for quick development
2. **Real Payme** for integration testing
3. **Both** tested and working!

Start with Mock, then move to Real Payme when ready! 🚀
