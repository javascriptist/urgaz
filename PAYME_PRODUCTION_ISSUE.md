# ⚠️ Production API Error: invalid_authorization_header

## Error Details
```
Access denied.
Code: -32504
Data: invalid_authorization_header
```

## What Happened
When switching to production URL (`https://checkout.paycom.uz/api`) with production credentials, Payme returned `invalid_authorization_header` error.

## Possible Causes

### 1. Virtual Terminal Not Activated for Production ⚠️ (Most Likely)
Your Virtual Terminal `PREMIUM CARPET-1` might only be activated for **test mode**, not production yet.

**Evidence:**
- Test mode works with test credentials
- Production mode rejects production credentials
- Error is `invalid_authorization_header` (suggests credentials not recognized)

**Solution:**
Contact Payme support:
- Email: support@paycom.uz
- Request: "Activate production API access for Cashbox ID: 68ecf66ee902b2f5efb327ea"

### 2. Different Header Format for Production
Some payment providers require different auth formats between test/production.

**What we tried:**
```typescript
// Test mode
Header: X-Auth: <base64>

// Production mode  
Header: Authorization: Basic <base64>
```

**Possible alternatives to try:**
```typescript
// Option 1: Without "Basic" prefix
Header: Authorization: <base64>

// Option 2: Different encoding
Header: Paycom-Auth: Basic <base64>

// Option 3: Lowercase "basic"
Header: Authorization: basic <base64>
```

### 3. Credentials Format Issue
The `PAYME_AUTH` format might need adjustment for production.

**Current format:**
```
Paycom:68ecf66ee902b2f5efb327ea:F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
```

**Possible alternatives:**
```
# Option 1: Merchant ID only
68ecf66ee902b2f5efb327ea:F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo

# Option 2: Different separator
Paycom;68ecf66ee902b2f5efb327ea;F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
```

### 4. Special Characters in Password
Your production password contains special characters: `#`

**Password:** `F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo`

The `#` might need URL encoding or escaping:
```
# URL encoded
F6Y5C9TAJaKoqz3i44beHOibictu8%23ZM1wOo

# Without special char (verify with Payme)
F6Y5C9TAJaKoqz3i44beHOibictu8ZM1wOo
```

## Debugging Steps

### Step 1: Verify Test Mode Still Works
```bash
# Set in .env
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_PASSWORD=%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci

# Test
curl -X POST http://localhost:9000/store/payme/create-receipt \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_fe768f..." \
  -d '{"orderId":"test-order","amount":50000}'
```

**Expected:** Should work (confirms code is fine)

### Step 2: Test Production Credentials in Test Environment
```bash
# Try production key in test URL (to isolate issue)
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_PASSWORD=F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo
```

**If this works:** Issue is with production API activation  
**If this fails:** Issue is with production credentials format

### Step 3: Test Raw API Call
```bash
# Direct curl to production API
AUTH=$(echo -n "Paycom:68ecf66ee902b2f5efb327ea:F6Y5C9TAJaKoqz3i44beHOibictu8#ZM1wOo" | base64)

curl -X POST https://checkout.paycom.uz/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $AUTH" \
  -d '{
    "method": "receipts.get_fiscal_data",
    "params": {}
  }'
```

### Step 4: Try Alternative Header Formats
```bash
# Without "Basic" prefix
curl -X POST https://checkout.paycom.uz/api \
  -H "Authorization: $AUTH" \
  -d '{"method":"receipts.get_fiscal_data","params":{}}'

# With X-Auth (like test mode)
curl -X POST https://checkout.paycom.uz/api \
  -H "X-Auth: $AUTH" \
  -d '{"method":"receipts.get_fiscal_data","params":{}}'
```

## Recommended Action Plan

### Immediate (Now)
1. ✅ **Switch back to test mode** (already done)
2. ✅ **Verify test mode works** (use Mock payment)
3. **Continue development** with test mode

### Short Term (This Week)
1. **Contact Payme Support**
   - Email: support@paycom.uz
   - Subject: "Activate Production API for Virtual Terminal"
   - Include:
     - Cashbox ID: `68ecf66ee902b2f5efb327ea`
     - Virtual Terminal: "PREMIUM CARPET-1"
     - Error: `invalid_authorization_header` when using production API
     - Request: Production API activation and correct header format

2. **Ask Payme:**
   - Is production API activated for this cashbox?
   - What is the correct Authorization header format for production?
   - Are there any special requirements for Virtual Terminal in production?
   - Is the password format correct with `#` character?

### Long Term (After Payme Response)
1. Update code based on Payme's guidance
2. Test production credentials
3. Update documentation with correct format
4. Deploy to production

## Workaround for Now

**Use Test Mode for Development:**
```bash
# .env
PAYME_API_URL=https://checkout.test.paycom.uz/api
PAYME_PASSWORD=%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci
```

**Or Use Mock Payment:**
- Endpoint: `/store/payme-mock`
- No Payme API calls
- Perfect for frontend development

## Similar Issues Found

### Issue 1: Different Auth Headers
Some Payme users report that production requires:
```
Authorization: Basic <base64>
```
But the format of what's being encoded differs.

### Issue 2: Virtual Terminal Activation
Virtual Terminals often require separate activation for:
- Test environment (automatic)
- Production environment (manual, requires Payme approval)

## Next Steps

**For You:**
1. Keep using test mode for development
2. Contact Payme support with the details above
3. Wait for their response about production activation

**For Us:**
1. Monitor server logs when you try again
2. Try alternative header formats if Payme suggests
3. Update code based on Payme's official guidance

## Debug Logs to Check

When server restarts, check terminal for:
```
🔍 Payme API Request: {
  url: 'https://checkout.paycom.uz/api',
  mode: 'PRODUCTION',
  header: 'Authorization',
  valuePrefix: 'Basic UGF5Y29tOjY4...',
  method: 'receipts.create'
}
```

This confirms the header is being sent correctly from our side.

---

**Status:** ⏳ Waiting for Payme support response  
**Workaround:** ✅ Use test mode  
**Impact:** Low (development can continue)  
**Priority:** Medium (needed before production launch)

---

**Last Updated:** October 15, 2025  
**Reported By:** You  
**Investigating:** GitHub Copilot
