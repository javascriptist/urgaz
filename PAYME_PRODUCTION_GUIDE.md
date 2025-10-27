# Payme Production Deployment Guide

## 🔴 Important: Test vs Production Modes

Payme (Paycom) uses **different authentication methods** for test and production environments:

### Test Mode (Current Setup)
- **URL**: `https://checkout.test.paycom.uz/api`
- **Header**: `X-Auth: <base64_credentials>`
- **Key**: `%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci` (test key)
- **Purpose**: Development and testing

### Production Mode (For Real Payments)
- **URL**: `https://checkout.paycom.uz/api`
- **Header**: `Authorization: Basic <base64_credentials>`
- **Key**: `F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo` (production key)
- **Purpose**: Accepting real customer payments

> **Note**: Our code automatically detects the mode based on the API URL and uses the correct authentication header.

---

## ✅ Pre-Production Checklist

Before switching to production mode, ensure:

1. **Virtual Terminal Activated**
   - Contact Payme support to activate your Virtual Terminal for production
   - Error `-32504 (invalid_id)` should be resolved
   - Test with production credentials in test mode first if possible

2. **All Tests Passed**
   - Mock payments work correctly
   - Test payment flow is verified
   - Frontend integration is complete
   - Error handling is tested

3. **Legal & Compliance**
   - Business agreement with Payme is signed
   - Fiscal receipt requirements are met
   - Terms of service are displayed to customers

4. **Server Configuration**
   - SSL/TLS certificate is valid
   - Server is running in production mode
   - Environment variables are secured

---

## 🚀 Switching to Production

### Step 1: Update `.env` File

Open `/Users/test/Desktop/medusatest/urgaztest/.env` and make these changes:

```bash
# ============================================
# PRODUCTION MODE (ACTIVE)
# ============================================
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_MERCHANT_ID=68ecf66ee902b2f5efb327ea
PAYME_PASSWORD=F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
PAYME_AUTH=Paycom:68ecf66ee902b2f5efb327ea:F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo

# ============================================
# TEST MODE (DISABLED - keep for reference)
# ============================================
# PAYME_API_URL=https://checkout.test.paycom.uz/api
# PAYME_MERCHANT_ID=68ecf66ee902b2f5efb327ea
# PAYME_PASSWORD=%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci
# PAYME_AUTH=Paycom:68ecf66ee902b2f5efb327ea:%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci
```

### Step 2: Restart Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 3: Verify Production Mode

Check the logs when server starts:
```
✅ Payme enabled (production mode)
URL: https://checkout.paycom.uz/api
```

### Step 4: Test with Small Amount

Create a test order with a small amount (e.g., 1000 UZS) to verify:
- Receipt creation works
- Payment page loads correctly
- Payment confirmation is received
- Order status updates properly

---

## 🔍 How Authentication Works

### Our Implementation (`src/lib/payme.ts`)

```typescript
// Automatic mode detection
const isTestMode = url.includes('test.paycom.uz')
const authHeader = isTestMode ? 'X-Auth' : 'Authorization'
const authValue = isTestMode ? authEncoded : `Basic ${authEncoded}`

// Headers sent to Payme
headers: {
  "Content-Type": "application/json",
  [authHeader]: authValue,  // X-Auth OR Authorization
}
```

### What Gets Sent

**Test Mode:**
```
POST https://checkout.test.paycom.uz/api
Headers:
  Content-Type: application/json
  X-Auth: UGF5Y29tOjY4ZWNmNjZlZT...
```

**Production Mode:**
```
POST https://checkout.paycom.uz/api
Headers:
  Content-Type: application/json
  Authorization: Basic UGF5Y29tOjY4ZWNmNjZlZT...
```

---

## 🛡️ Security Best Practices

### 1. Protect Production Credentials

```bash
# On production server, use environment variables (not .env file)
export PAYME_PASSWORD="F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo"
export PAYME_API_URL="https://checkout.paycom.uz/api"
```

### 2. Never Commit Credentials

Ensure `.env` is in `.gitignore`:
```bash
# .gitignore
.env
.env.local
.env.production
```

### 3. Use Different Keys for Different Environments

- **Development**: Test credentials
- **Staging**: Test credentials (separate cashbox if possible)
- **Production**: Production credentials

### 4. Rotate Keys Regularly

Contact Payme support to generate new keys periodically.

---

## 🔄 Switching Back to Test Mode

If you need to test something, simply:

1. Update `.env`:
   ```bash
   PAYME_API_URL=https://checkout.test.paycom.uz/api
   PAYME_PASSWORD=%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci
   PAYME_AUTH=Paycom:68ecf66ee902b2f5efb327ea:%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci
   ```

2. Restart server

3. System automatically uses test mode authentication

---

## 📊 Monitoring Production Payments

### Payme Business Dashboard
- URL: https://business.paycom.uz
- Login with your credentials
- Monitor transactions in real-time
- Download fiscal reports

### Your Admin Panel
- Test page: `http://localhost:9000/app/payme-test`
- Can test both modes (just updates URL)
- Shows detailed error messages

### Server Logs
Check for payment events:
```bash
# Search for Payme-related logs
grep -i "payme" logs/app.log
```

---

## ❌ Common Production Issues

### Issue 1: "Access denied" in Production

**Cause**: Production Virtual Terminal not activated

**Solution**: 
- Contact Payme support: support@paycom.uz
- Provide: Cashbox ID `68ecf66ee902b2f5efb327ea`
- Request: Activate production API access

### Issue 2: Wrong Authentication Header

**Cause**: Manually set wrong header

**Solution**: 
- Our code auto-detects based on URL
- Just ensure `PAYME_API_URL` is correct
- Delete any manual header overrides

### Issue 3: Base64 Encoding Issues

**Cause**: Credentials not properly encoded

**Solution**:
- We use `Buffer.from(auth).toString('base64')`
- Format: `Paycom:68ecf66ee902b2f5efb327ea:YOUR_PASSWORD`
- No manual encoding needed

---

## 📞 Support Contacts

### Payme Support
- **Email**: support@paycom.uz
- **Phone**: +998 78 150 15 00
- **Business Dashboard**: https://business.paycom.uz

### Your Cashbox Details
- **Virtual Terminal**: "PREMIUM CARPET-1"
- **Cashbox ID**: `68ecf66ee902b2f5efb327ea`
- **Type**: Виртуальный терминал (Virtual Terminal)

---

## 📝 Quick Reference

| Aspect | Test Mode | Production Mode |
|--------|-----------|-----------------|
| URL | `checkout.test.paycom.uz/api` | `checkout.paycom.uz/api` |
| Header | `X-Auth` | `Authorization` |
| Prefix | None | `Basic ` |
| Test Key | `%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci` | - |
| Production Key | - | `F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo` |
| Real Money | ❌ No | ✅ Yes |
| Activation | Automatic | Requires Payme approval |

---

## ✅ You're Ready for Production When:

- [ ] Virtual Terminal is activated by Payme support
- [ ] Test payments work successfully
- [ ] Frontend integration is complete
- [ ] Error handling is tested
- [ ] Production credentials are configured
- [ ] SSL certificate is valid
- [ ] Server is secured
- [ ] You've read this entire guide! 😊

---

**Last Updated**: October 15, 2025
**Author**: GitHub Copilot
**Version**: 1.0
