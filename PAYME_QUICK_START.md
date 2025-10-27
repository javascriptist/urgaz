# Payme Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Backend Setup (1 minute)

Add to `.env`:
```bash
PAYME_ENABLED=true
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_AUTH=Paycom:your_merchant_id
```

### Frontend Setup (2 minutes)

```javascript
// 1. Create payment
const response = await fetch('https://your-backend.com/store/custom', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-publishable-api-key': 'your_pk_here'
  },
  body: JSON.stringify({
    amount: 50000,      // UZS
    orderId: 'order_123'
  })
});

const { data } = await response.json();

// 2. Redirect to Payme
window.location.href = `https://checkout.paycom.uz/${data._id}`;
```

## 📱 React Component Example

```jsx
const PaymeButton = ({ orderId, amount }) => {
  const handlePayment = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      },
      body: JSON.stringify({ amount, orderId })
    });
    
    const { data } = await response.json();
    window.location.href = `https://checkout.paycom.uz/${data._id}`;
  };

  return <button onClick={handlePayment}>Pay with Payme</button>;
};
```

## 🧪 Testing

### Test Card
- **Card number:** 8600 0000 0000 0000
- **Expiry:** Any future date
- **CVV:** Any 3 digits

## 📋 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/store/custom` | Check Payme status |
| POST | `/store/custom` | Create payment |
| POST | `/store/custom/payme-callback` | Webhook (internal) |

## 🔑 Required Headers

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-publishable-api-key': 'your_publishable_key'
}
```

## 📦 Request Body

```json
{
  "amount": 50000,        // Required: Amount in UZS
  "orderId": "order_123", // Required: Your order ID
  "returnUrl": "https://yoursite.com/success" // Optional
}
```

## ✅ Success Response

```json
{
  "success": true,
  "data": {
    "_id": "receipt_id_here",
    "create_time": 1234567890,
    "state": 0
  }
}
```

## ⚠️ Error Responses

| Status | Message | Solution |
|--------|---------|----------|
| 400 | "amount and orderId are required" | Include both fields |
| 503 | "Payme is disabled" | Set PAYME_ENABLED=true |
| 503 | "Payme auth not configured" | Set PAYME_AUTH in .env |
| 502 | "Failed to create Payme receipt" | Check credentials |

## 🔄 Payment Flow

```
User clicks → Create receipt → Get receipt ID → Redirect to Payme
                                                        ↓
Backend webhook ← Payme processes ← User pays on Payme
```

## 🌐 URLs

### Test Environment
- API: `https://checkout.test.paycom.uz/api`
- Checkout: `https://checkout.paycom.uz/{receipt_id}`

### Production
- API: `https://checkout.paycom.uz/api`
- Checkout: `https://checkout.paycom.uz/{receipt_id}`

## 💰 Currency

- Always send amounts in **UZS (sum)**
- Backend converts to Tiyin automatically (1 UZS = 100 Tiyin)
- Example: 50,000 UZS = 5,000,000 Tiyin

## 🔐 Security Checklist

- ✅ Use HTTPS in production
- ✅ Never expose PAYME_AUTH to frontend
- ✅ Validate all inputs
- ✅ Use publishable key for frontend requests
- ✅ Keep backend env variables secure

## 📞 Support

- **Payme Docs:** https://developer.paycom.uz
- **Dashboard:** https://business.paycom.uz
- **Support:** support@paycom.uz

## 📚 Full Documentation

See [PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md) for complete documentation.

---

**Need help?** Check the full integration guide or contact Payme support.
