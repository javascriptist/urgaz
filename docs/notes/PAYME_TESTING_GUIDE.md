# 🧪 Testing Payme Integration

## ✅ **Test Page Created!**

I've created a Payme test page in your admin dashboard where you can test payments right now!

---

## 🚀 **How to Access**

1. **Make sure your server is running:**
   ```bash
   npm run dev
   ```

2. **Open your Medusa Admin:**
   ```
   http://localhost:9000/app
   ```

3. **Login to admin** (if not already logged in)

4. **Find "Payme Test" in the sidebar menu**
   - Look for the 💳 credit card icon
   - Should appear in your navigation menu

5. **Click "Payme Test"** to open the testing page

---

## 🎯 **What You Can Test**

### **Option 1: Mock Payment (Safe Testing)**
- Enter any Order ID (e.g., `test-order-123`)
- Enter amount in UZS (e.g., `50000`)
- Click **"🧪 Test Mock Payment"**
- ✅ Returns fake receipt without calling real Payme
- Perfect for testing UI flow

### **Option 2: Real Payme Payment (Test Mode)**
- Enter Order ID
- Enter amount in UZS  
- Click **"💳 Test Real Payme"**
- ✅ Creates actual receipt on Payme test server
- ✅ Opens Payme checkout page in new tab
- ✅ You can complete test payment

---

## 📋 **Test Payment Details**

### **Test Order Examples:**
```
Order ID: test-order-1
Amount: 50000 UZS (50,000 som)

Order ID: carpet-order-456
Amount: 125000 UZS (125,000 som)
```

### **Payme Test Cards:**
When on Payme checkout page, use these test cards:

**For Success:**
```
Card: 8600 xxxx xxxx xxxx
Exp: Any future date
CVV: Any 3 digits
```

**For Failure:**
```
Card: 8600 xxxx xxxx 0000
(Will simulate payment failure)
```

---

## 🔍 **What to Check**

### **After Mock Payment:**
- ✅ Receipt ID generated
- ✅ Amount shown in Tiyin (UZS × 100)
- ✅ Order ID saved correctly
- ✅ Mock indicator shows

### **After Real Payment:**
- ✅ Receipt created on Payme
- ✅ Checkout URL generated
- ✅ New tab opens to Payme
- ✅ Can complete payment
- ✅ Webhook receives notification (check server logs)

---

## 📊 **Server Logs**

Watch your terminal while testing to see:

```bash
# When creating receipt:
Creating Payme receipt for order test-order-123, amount: 50000 UZS (5000000 Tiyin)
✅ Payme receipt created: xxxxx
🔗 Checkout URL: https://checkout.test.paycom.uz/xxxxx

# When webhook receives payment:
Payme webhook: receipts.pay
Payment captured for order: test-order-123
```

---

## 🎨 **Test Page Features**

Your test page includes:
- 📝 **Order ID input** - Test with any order ID
- 💰 **Amount input** - Enter any amount in UZS
- 🧪 **Mock button** - Safe testing without real API calls
- 💳 **Real button** - Test actual Payme integration
- 📊 **Response display** - See full API response
- ⚙️ **Configuration info** - Current Payme setup
- 📖 **Quick guide** - Step-by-step testing instructions

---

## 🛠️ **Troubleshooting**

### **Can't find "Payme Test" page?**
- Refresh admin dashboard (Cmd+R / Ctrl+R)
- Dev server auto-detects new pages
- Check sidebar navigation for 💳 icon

### **Mock payment works but Real doesn't?**
- Endpoint created: `/store/payme/create-receipt` ✅
- Check server logs for errors
- Verify Payme credentials in `.env`

### **"Endpoint not created" error?**
- The endpoint exists at `src/api/store/payme/create-receipt/route.ts`
- Server should auto-detect it
- Try restarting dev server if needed

---

## 🚀 **Next Steps**

1. **Test Mock Payment**
   - Verify UI works correctly
   - Check response format

2. **Test Real Payment**
   - Create actual receipt
   - Complete payment on Payme
   - Verify webhook notification

3. **Integrate to Storefront**
   - Copy button code from test page
   - Add to your checkout flow
   - Use same API endpoint

---

## 📁 **Files Created**

### **Admin Test Page:**
```
src/admin/routes/payme-test/page.tsx
```

### **Backend Endpoint:**
```
src/api/store/payme/create-receipt/route.ts
```

### **Usage Example:**
```typescript
// Frontend code (copy from test page)
const response = await fetch('/store/payme/create-receipt', {
  method: 'POST',
  body: JSON.stringify({ orderId, amount })
})

const { checkoutUrl } = await response.json()
window.location.href = checkoutUrl
```

---

## 🎉 **You're Ready!**

Everything is set up! Just open the admin and click **"Payme Test"** to start testing your payment integration.

**URL:** http://localhost:9000/app

Look for the 💳 icon in the sidebar! 🚀
