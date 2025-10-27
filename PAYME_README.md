# 📚 Payme Integration - Complete Documentation Index

## 🎯 Overview

This folder contains complete documentation for integrating Payme (Paycom) payment gateway with your Medusa e-commerce store. The integration supports both **test mode** (for development) and **production mode** (for real payments).

---

## 📖 Documentation Files

### 1. **[PAYME_FRONTEND_INTEGRATION.md](./PAYME_FRONTEND_INTEGRATION.md)**
**For:** Frontend developers  
**Purpose:** How to integrate Payme checkout in your storefront  
**Contains:**
- Why backend is needed
- Payment flow diagram
- Frontend code examples
- API endpoint usage
- Error handling

**Start here if:** You're building the checkout page

---

### 2. **[PAYME_PRODUCTION_GUIDE.md](./PAYME_PRODUCTION_GUIDE.md)** ⭐ **READ BEFORE PRODUCTION**
**For:** DevOps, Team Leads, Backend developers  
**Purpose:** Critical information about test vs production modes  
**Contains:**
- Authentication header differences (`X-Auth` vs `Authorization`)
- How to switch from test to production
- Security best practices
- Pre-production checklist
- Troubleshooting production issues

**Start here if:** You're deploying to production or getting "Access denied" errors

---

### 3. **[PAYME_SIMPLE_GUIDE.md](./PAYME_SIMPLE_GUIDE.md)**
**For:** Project managers, New developers  
**Purpose:** High-level architecture overview  
**Contains:**
- System components diagram
- How everything connects
- What each file does
- Non-technical explanation

**Start here if:** You want to understand the big picture

---

### 4. **[PAYME_TESTING_GUIDE.md](./PAYME_TESTING_GUIDE.md)**
**For:** QA testers, Developers  
**Purpose:** How to use the admin test interface  
**Contains:**
- Admin test page walkthrough
- Mock payment testing
- Real payment testing
- Common error messages

**Start here if:** You want to test payments

---

### 5. **[PAYME_COMPLETE_TESTING_GUIDE.md](./PAYME_COMPLETE_TESTING_GUIDE.md)**
**For:** QA testers, Integration testers  
**Purpose:** Comprehensive testing scenarios  
**Contains:**
- Complete test flows (mock and real)
- Expected results for each step
- Screenshots references
- Edge case testing

**Start here if:** You need detailed test cases

---

### 6. **[ROLL_CARPET_STOREFRONT_GUIDE.md](./ROLL_CARPET_STOREFRONT_GUIDE.md)**
**For:** Frontend developers  
**Purpose:** Roll carpet feature integration  
**Contains:**
- Roll vs fixed carpet types
- Inventory tracking
- Frontend UI examples
- Stock management

**Start here if:** You're implementing carpet products

---

## 🚦 Quick Navigation by Role

### Frontend Developer
1. Read: [PAYME_FRONTEND_INTEGRATION.md](./PAYME_FRONTEND_INTEGRATION.md)
2. Read: [ROLL_CARPET_STOREFRONT_GUIDE.md](./ROLL_CARPET_STOREFRONT_GUIDE.md)
3. Test with: [PAYME_TESTING_GUIDE.md](./PAYME_TESTING_GUIDE.md)

### Backend Developer
1. Review: [PAYME_SIMPLE_GUIDE.md](./PAYME_SIMPLE_GUIDE.md)
2. **IMPORTANT**: [PAYME_PRODUCTION_GUIDE.md](./PAYME_PRODUCTION_GUIDE.md)
3. Test: [PAYME_TESTING_GUIDE.md](./PAYME_TESTING_GUIDE.md)

### QA Tester
1. Read: [PAYME_TESTING_GUIDE.md](./PAYME_TESTING_GUIDE.md)
2. Execute: [PAYME_COMPLETE_TESTING_GUIDE.md](./PAYME_COMPLETE_TESTING_GUIDE.md)

### Project Manager
1. Overview: [PAYME_SIMPLE_GUIDE.md](./PAYME_SIMPLE_GUIDE.md)
2. Before launch: [PAYME_PRODUCTION_GUIDE.md](./PAYME_PRODUCTION_GUIDE.md)

### DevOps Engineer
1. **START HERE**: [PAYME_PRODUCTION_GUIDE.md](./PAYME_PRODUCTION_GUIDE.md)
2. Architecture: [PAYME_SIMPLE_GUIDE.md](./PAYME_SIMPLE_GUIDE.md)

---

## 🔴 Critical Information: Test vs Production

### The Key Difference

Payme uses **different authentication headers** for test and production:

| Mode | URL | Header | Prefix |
|------|-----|--------|--------|
| **TEST** | `checkout.test.paycom.uz` | `X-Auth` | None |
| **PRODUCTION** | `checkout.paycom.uz` | `Authorization` | `Basic ` |

### Why This Matters

According to Payme documentation:
> "Данный ключ используется для приёма реальных платёжей. Его необходимо использовать после завершения всех тестов. Ключ посылается в заголовках "Authorization" в зашифрованном виде "base64""

Translation: The production key is used for accepting real payments and must be sent in the "Authorization" header in base64 format.

### Our Solution

Our code (`src/lib/payme.ts`) **automatically detects** which mode to use:

```typescript
const isTestMode = url.includes('test.paycom.uz')
const authHeader = isTestMode ? 'X-Auth' : 'Authorization'
const authValue = isTestMode ? authEncoded : `Basic ${authEncoded}`
```

✅ **You don't need to change code** - just update the URL in `.env` file!

---

## 🛠️ Current Configuration

### Test Mode (Active)
```bash
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_PASSWORD=%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci
```

### Production Mode (Ready to activate)
```bash
# Uncomment these lines in .env when ready:
# PAYME_API_URL=https://checkout.paycom.uz/api
# PAYME_PASSWORD=F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
```

---

## 📁 Code Structure

```
/src
  /lib
    payme.ts                    # Core Payme API integration (auto-detects mode)
  /api
    /store
      /payme
        /create-receipt
          route.ts              # Real payment endpoint
      /payme-mock
        route.ts                # Mock payment endpoint (for testing)
      /custom
        /payme-callback
          route.ts              # Webhook handler (receives payment confirmations)
  /admin
    /routes
      /payme-test
        page.tsx                # Admin test interface
      /payme-mock-checkout
        page.tsx                # Mock Payme checkout simulation
```

---

## 🧪 Testing Endpoints

### Admin Test Page
- **URL**: `http://localhost:9000/app/payme-test`
- **Features**: Test both mock and real payments
- **Status**: ✅ Working

### Mock Payment
- **Endpoint**: `/store/payme-mock`
- **Purpose**: Safe testing without real API calls
- **Status**: ✅ Working

### Real Payment
- **Endpoint**: `/store/payme/create-receipt`
- **Purpose**: Create actual Payme receipts
- **Status**: ⚠️ Waiting for Virtual Terminal activation

---

## ⚠️ Current Status

### ✅ Completed
- Roll carpet system with inventory tracking
- Payme API integration (test and production modes)
- Mock payment flow (fully functional)
- Real payment endpoint (code ready)
- Admin test interface
- Complete documentation
- Automatic authentication mode detection

### ⏳ Pending
- Virtual Terminal activation by Payme support
  - Error: "Access denied - invalid_id" (code -32504)
  - Action: Contact support@paycom.uz with Cashbox ID
  - Until then: Use Mock payment for development

### 🎯 Next Steps
1. **For Development**: Use Mock payment flow (fully functional)
2. **For Production**: 
   - Wait for Payme to activate Virtual Terminal
   - Read [PAYME_PRODUCTION_GUIDE.md](./PAYME_PRODUCTION_GUIDE.md)
   - Update `.env` to production credentials
   - Test with small amount
   - Deploy!

---

## 🆘 Common Issues

### "Access denied - invalid_id"
**Cause**: Virtual Terminal not activated by Payme  
**Solution**: Contact Payme support  
**Workaround**: Use Mock payment for development

### Authentication not working
**Cause**: Wrong URL or credentials  
**Solution**: Check `.env` file, verify URL matches mode  
**Read**: [PAYME_PRODUCTION_GUIDE.md](./PAYME_PRODUCTION_GUIDE.md)

### Frontend can't reach endpoint
**Cause**: Missing publishable API key  
**Solution**: Add header: `x-publishable-api-key: pk_fe768f...`

---

## 📞 Support

### Payme Support
- **Email**: support@paycom.uz
- **Phone**: +998 78 150 15 00
- **Dashboard**: https://business.paycom.uz

### Your Configuration
- **Virtual Terminal**: "PREMIUM CARPET-1"
- **Cashbox ID**: `68ecf66ee902b2f5efb327ea`
- **Type**: Виртуальный терминал (Virtual Terminal)

---

## 📝 Quick Reference Card

```bash
# Test payment (mock)
curl -X POST http://localhost:9000/store/payme-mock \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_fe768f..." \
  -d '{"orderId":"order_123","amount":50000}'

# Test payment (real)
curl -X POST http://localhost:9000/store/payme/create-receipt \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_fe768f..." \
  -d '{"orderId":"order_123","amount":50000}'

# Switch to production mode
# Edit .env:
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_PASSWORD=F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo

# Restart server
npm run dev
```

---

**Last Updated**: October 15, 2025  
**Version**: 2.0 (Added production mode support)  
**Author**: GitHub Copilot
