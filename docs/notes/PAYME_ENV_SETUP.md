# Payme Environment Setup Guide

## Backend Configuration (.env)

Add these variables to your Medusa backend `.env` file:

```bash
# ==========================================
# PAYME PAYMENT GATEWAY CONFIGURATION
# ==========================================

# Enable/Disable Payme (required)
# Values: true, false, 1, 0, yes, no, on, off
PAYME_ENABLED=true

# Payme API URL (required)
# Test environment (for development):
PAYME_API_URL=https://checkout.test.paycom.uz/api
# Production environment (for live site):
# PAYME_API_URL=https://checkout.paycom.uz/api

# Payme Authentication Token (required)
# Get both merchant_id and password from your Payme Business dashboard
# Format: "Paycom:<merchant_id>:<password>"
# Example: Paycom:68c46ba9acdb1e860a342a87:YourSecretPassword123
PAYME_MERCHANT_ID=your_merchant_id_here
PAYME_PASSWORD=your_password_here
PAYME_AUTH=Paycom:your_merchant_id_here:your_password_here

# Optional: Additional receipt parameters (JSON format)
# Used for extra fields required by Payme
# Example with cashbox_id:
PAYME_RECEIPT_PARAMS={"cashbox_id":"YOUR_CASHBOX_ID"}
# Example with nested account fields:
# PAYME_RECEIPT_PARAMS={"account":{"cashbox":"YOUR_CASHBOX"}}

```

---

## Frontend Configuration

### Next.js (.env.local)

```bash
# Medusa Backend URL
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000

# Medusa Publishable API Key
# Get this from: Medusa Admin → Settings → Publishable API Keys
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key_here
```

### React with Vite (.env)

```bash
# Medusa Backend URL
VITE_MEDUSA_BACKEND_URL=http://localhost:9000

# Medusa Publishable API Key
VITE_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key_here
```

### React with Create React App (.env)

```bash
# Medusa Backend URL
REACT_APP_MEDUSA_BACKEND_URL=http://localhost:9000

# Medusa Publishable API Key
REACT_APP_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key_here
```

---

## Getting Your Credentials

### 1. Get Payme Merchant ID

1. Go to [Payme Business Dashboard](https://business.paycom.uz)
2. Log in to your account
3. Navigate to **Settings** or **Integration**
4. Copy your **Merchant ID**
5. Format as: `Paycom:<merchant_id>`

### 2. Get Medusa Publishable Key

1. Open your Medusa Admin panel
2. Go to **Settings** → **API Key Management**
3. Click **Create Publishable API Key**
4. Give it a name (e.g., "Frontend Store")
5. Copy the key (starts with `pk_`)

---

## Environment Examples

### Development Setup

**Backend (.env):**
```bash
PAYME_ENABLED=true
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_AUTH=Paycom:test_merchant_id_123
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_dev_key_here
```

### Production Setup

**Backend (.env):**
```bash
PAYME_ENABLED=true
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_AUTH=Paycom:prod_merchant_id_456
PAYME_RECEIPT_PARAMS={"cashbox_id":"PROD_CASHBOX"}
```

**Frontend (.env.production):**
```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yoursite.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_prod_key_here
```

---

## Verification Checklist

After setting up your environment variables:

### Backend Verification

```bash
# 1. Check if environment file is loaded
cd your-medusa-backend
cat .env | grep PAYME

# 2. Restart your Medusa server
npm run dev

# 3. Check Payme status
curl http://localhost:9000/store/custom
# Should return: {"status":"ok","paymeEnabled":true}
```

### Frontend Verification

```bash
# 1. Check environment variables
cd your-frontend
echo $NEXT_PUBLIC_MEDUSA_BACKEND_URL
echo $NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

# 2. Restart your dev server
npm run dev

# 3. Open browser console and check
console.log(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL)
```

---

## Common Issues

### ❌ "Payme is disabled"

**Problem:** Backend returns `paymeEnabled: false`

**Solutions:**
```bash
# Check if PAYME_ENABLED is set
grep PAYME_ENABLED .env

# Make sure it's one of: true, 1, yes, on
PAYME_ENABLED=true

# Restart server
npm run dev
```

### ❌ "Payme auth not configured"

**Problem:** `PAYME_AUTH` is missing or invalid

**Solutions:**
```bash
# Check if PAYME_AUTH is set
grep PAYME_AUTH .env

# Make sure format is correct (with "Paycom:" prefix)
PAYME_AUTH=Paycom:your_merchant_id

# No spaces, no quotes in the value
# ❌ PAYME_AUTH="Paycom:123"
# ✅ PAYME_AUTH=Paycom:123
```

### ❌ "Publishable API key required"

**Problem:** Frontend requests missing the key

**Solutions:**
```bash
# Make sure key is in .env.local (Next.js)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...

# Make sure variable starts with NEXT_PUBLIC_
# ❌ MEDUSA_PUBLISHABLE_KEY=pk_...
# ✅ NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...

# Restart dev server after adding
npm run dev
```

### ❌ Environment variables not loaded

**Solutions:**

1. **Next.js:** Use `.env.local` not `.env`
2. **Restart your dev server** after changes
3. **Check file location** - should be in project root
4. **No quotes** around simple values
5. **Check .gitignore** - env files should not be committed

---

## Security Best Practices

### ✅ DO

- ✅ Keep `.env` and `.env.local` in `.gitignore`
- ✅ Use different keys for dev and production
- ✅ Use `NEXT_PUBLIC_` prefix only for safe values
- ✅ Store sensitive keys server-side only
- ✅ Rotate keys periodically

### ❌ DON'T

- ❌ Commit `.env` files to git
- ❌ Share `PAYME_AUTH` token publicly
- ❌ Use production keys in development
- ❌ Expose backend URLs in frontend code
- ❌ Use same publishable key across all environments

---

## Example .gitignore

Make sure your `.gitignore` includes:

```gitignore
# Environment files
.env
.env.local
.env.development
.env.production
.env.test
.env*.local

# Keep example files
!.env.example
!.env.template
```

---

## Template Files

### Backend .env.example

Create `.env.example` for your team:

```bash
# Copy this file to .env and fill in your values

# Payme Configuration
PAYME_ENABLED=true
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_AUTH=Paycom:your_merchant_id_here
PAYME_RECEIPT_PARAMS=

# Database
DATABASE_URL=

# Other configurations...
```

### Frontend .env.example

```bash
# Copy this file to .env.local and fill in your values

NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
```

---

## Quick Test

After setup, test with curl:

```bash
# Test Payme status
curl -X GET http://localhost:9000/store/custom \
  -H "x-publishable-api-key: your_pk_here"

# Expected response:
# {"status":"ok","paymeEnabled":true}

# Test payment creation
curl -X POST http://localhost:9000/store/custom \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: your_pk_here" \
  -d '{
    "amount": 50000,
    "orderId": "test_order_001"
  }'

# Expected response:
# {"success":true,"data":{"_id":"...","create_time":...}}
```

---

## Need Help?

- Configuration issues → Check this guide
- Integration guide → [PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md)
- Quick reference → [PAYME_QUICK_START.md](./PAYME_QUICK_START.md)
- Code examples → [frontend-examples/](./frontend-examples/)

---

**Setup complete! 🎉** Now proceed to frontend integration.
