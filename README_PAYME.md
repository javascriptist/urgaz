# Payme Payment Integration - Complete Documentation

## 📚 Documentation Files

This repository contains comprehensive documentation for integrating Payme (Paycom) payment gateway with your Medusa e-commerce backend and frontend applications.

### Main Documentation Files

1. **[PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md)** 📖
   - Complete integration guide
   - Backend configuration
   - Frontend integration examples
   - API reference
   - Security best practices
   - Production deployment checklist

2. **[PAYME_QUICK_START.md](./PAYME_QUICK_START.md)** ⚡
   - 5-minute setup guide
   - Quick reference for API endpoints
   - Common error solutions
   - Test data and URLs

3. **[frontend-examples/](./frontend-examples/)** 💻
   - Ready-to-use code examples
   - Vanilla JavaScript implementation
   - React/Next.js components
   - Complete working demos

---

## 🚀 Quick Links

### For Backend Developers
- Backend configuration → [PAYME_INTEGRATION.md#backend-configuration](./PAYME_INTEGRATION.md#backend-configuration)
- Environment variables → [PAYME_INTEGRATION.md#environment-variables](./PAYME_INTEGRATION.md#environment-variables)
- Webhook handling → [PAYME_INTEGRATION.md#webhook-handling](./PAYME_INTEGRATION.md#webhook-handling)

### For Frontend Developers
- Frontend integration → [PAYME_INTEGRATION.md#frontend-integration](./PAYME_INTEGRATION.md#frontend-integration)
- React examples → [frontend-examples/react-nextjs/](./frontend-examples/react-nextjs/)
- Vanilla JS examples → [frontend-examples/vanilla-js/](./frontend-examples/vanilla-js/)

### For Quick Setup
- 5-minute setup → [PAYME_QUICK_START.md](./PAYME_QUICK_START.md)
- API quick reference → [PAYME_QUICK_START.md#api-endpoints](./PAYME_QUICK_START.md#api-endpoints)

---

## 🎯 What You'll Find

### Backend Implementation
- ✅ Complete Payme JSON-RPC client
- ✅ Store endpoint for payment creation
- ✅ Webhook handler for payment notifications
- ✅ Currency conversion utilities (UZS ↔ Tiyin)
- ✅ Environment-based configuration

### Frontend Examples
- ✅ Vanilla JavaScript implementation
- ✅ React/Next.js hooks and components
- ✅ Complete checkout page examples
- ✅ TypeScript support
- ✅ Error handling and loading states

### Documentation
- ✅ Step-by-step integration guide
- ✅ API reference with examples
- ✅ Testing guidelines
- ✅ Security recommendations
- ✅ Production deployment checklist

---

## 📂 Repository Structure

```
urgaz/
├── PAYME_INTEGRATION.md        # Main documentation
├── PAYME_QUICK_START.md        # Quick reference
├── README_PAYME.md             # This file
│
├── src/
│   ├── lib/
│   │   └── payme.ts            # Payme RPC client
│   │
│   └── api/
│       └── store/
│           └── custom/
│               ├── route.ts           # Payment creation endpoint
│               └── payme-callback.ts  # Webhook handler
│
└── frontend-examples/
    ├── vanilla-js/
    │   ├── PaymeService.js     # JS service class
    │   └── index.html          # Demo page
    │
    └── react-nextjs/
        ├── hooks/
        │   └── usePayme.ts     # React hook
        ├── components/
        │   └── PaymeButton.tsx # Button component
        ├── pages/
        │   └── checkout-example.tsx
        └── README.md
```

---

## 🔧 Backend Setup (Quick)

```bash
# .env file
PAYME_ENABLED=true
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_AUTH=Paycom:your_merchant_id
```

**Files:**
- `/src/lib/payme.ts` - Core RPC client
- `/src/api/store/custom/route.ts` - Payment creation
- `/src/api/store/custom/payme-callback.ts` - Webhooks

---

## 💻 Frontend Setup (Quick)

### Option 1: Vanilla JavaScript

```javascript
// Copy frontend-examples/vanilla-js/PaymeService.js
const payme = new PaymeService({
  backendUrl: 'https://your-backend.com',
  publishableKey: 'pk_...'
});

await payme.createPayment('order_123', 50000);
```

### Option 2: React/Next.js

```tsx
// Copy frontend-examples/react-nextjs/hooks/usePayme.ts
import { usePayme } from '@/hooks/usePayme';

function Checkout() {
  const { createPayment } = usePayme();
  return (
    <button onClick={() => createPayment('order_123', 50000)}>
      Pay with Payme
    </button>
  );
}
```

---

## 🧪 Testing

### Test Environment
- **API URL:** `https://checkout.test.paycom.uz/api`
- **Checkout:** `https://checkout.paycom.uz/{receipt_id}`

### Test Card
```
Card Number: 8600 0000 0000 0000
Expiry: Any future date
CVV: Any 3 digits
```

---

## 📊 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/store/custom` | Check Payme status |
| POST | `/store/custom` | Create payment receipt |
| POST | `/store/custom/payme-callback` | Webhook (internal) |

### Create Payment Request

```bash
curl -X POST https://your-backend.com/store/custom \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_your_key" \
  -d '{
    "amount": 50000,
    "orderId": "order_123"
  }'
```

### Response

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

Then redirect to: `https://checkout.paycom.uz/{receipt_id}`

---

## 🔐 Security Checklist

- ✅ Use HTTPS in production
- ✅ Keep `PAYME_AUTH` secret (server-only)
- ✅ Use publishable key for frontend
- ✅ Validate all inputs
- ✅ Verify webhook signatures (recommended)
- ✅ Implement rate limiting
- ✅ Log all transactions

---

## 🚀 Production Deployment

### Pre-Launch
1. Get production credentials from Payme Business
2. Update `PAYME_API_URL` to production endpoint
3. Configure webhook URL in Payme dashboard
4. Test with real card
5. Implement order status updates
6. Set up monitoring

### Environment Variables
```bash
PAYME_ENABLED=true
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_AUTH=Paycom:prod_merchant_id
```

---

## 📞 Support & Resources

### Documentation
- **This repo:** Complete integration guides
- **Payme Official:** https://developer.paycom.uz
- **Medusa Docs:** https://docs.medusajs.com

### Business
- **Payme Dashboard:** https://business.paycom.uz
- **Support Email:** support@paycom.uz

### Repository Files
- Integration guide: [PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md)
- Quick start: [PAYME_QUICK_START.md](./PAYME_QUICK_START.md)
- React examples: [frontend-examples/react-nextjs/](./frontend-examples/react-nextjs/)
- Vanilla JS: [frontend-examples/vanilla-js/](./frontend-examples/vanilla-js/)

---

## ❓ Common Questions

### Q: Do I need to create payment collections in Medusa?
**A:** No, the Payme integration handles payments externally. When the webhook fires, you can update your Medusa order status.

### Q: What currency does Payme use?
**A:** Payme uses UZS (Uzbekistan Som). Send amounts in UZS from frontend, the backend converts to Tiyin automatically.

### Q: How do I test payments?
**A:** Use test credentials and the test card number: `8600 0000 0000 0000`

### Q: Can I use this with any frontend framework?
**A:** Yes! We provide vanilla JS examples that work anywhere, plus React/Next.js examples.

### Q: Is it secure to use publishable key in frontend?
**A:** Yes, publishable keys are designed for frontend use. Never expose your `PAYME_AUTH` token.

---

## 🎓 Learning Path

1. **Start here:** [PAYME_QUICK_START.md](./PAYME_QUICK_START.md) (5 minutes)
2. **Setup backend:** Check environment variables in main guide
3. **Test locally:** Use vanilla JS example
4. **Integrate frontend:** Use React examples for your app
5. **Go production:** Follow deployment checklist

---

## 📝 Changelog

### Version 1.0
- ✅ Initial Payme integration
- ✅ Payment receipt creation
- ✅ Webhook structure
- ✅ Currency conversion
- ✅ Complete documentation
- ✅ Frontend examples (JS + React)

### Planned
- [ ] Webhook signature verification
- [ ] Automatic order status updates
- [ ] Refund support
- [ ] Payment analytics dashboard

---

## 💡 Need Help?

1. Check [PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md) for detailed guide
2. See [PAYME_QUICK_START.md](./PAYME_QUICK_START.md) for quick fixes
3. Review [frontend-examples/](./frontend-examples/) for code samples
4. Contact Payme support: support@paycom.uz

---

**Happy integrating! 🎉**
