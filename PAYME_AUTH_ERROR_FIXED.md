# Payme Authentication Testing - Fixed

## Problem
Payme sandbox was testing your endpoint with **intentionally wrong authentication** to verify you properly reject unauthorized requests with error code **-32504**.

The error messages from Payme:
```
error Вызов метода 'CheckPerformTransaction' c неверными параметрами авторизации
Метод должен вернуть ошибку с кодом -32504
```

This means: "Call to method 'CheckPerformTransaction' with wrong authentication parameters. Method should return error with code -32504"

## Root Causes

### 1. Wrong HTTP Status Code
**Before:** Endpoint returned `401 Unauthorized` status
```typescript
return res.status(401).json(createError(...))
```

**Issue:** Payme expects **200 OK** status with the error in JSON-RPC format

### 2. Accepting All "Uzcard:" Passwords
**Before:** The authentication function accepted ANY password starting with "Uzcard:"
```typescript
if (passwordPart === expectedPassword || passwordPart.startsWith('Uzcard:')) {
  return true
}
```

**Issue:** This was insecure and allowed wrong credentials to pass authentication

## The Fix

### 1. Return 200 Status with Error -32504
```typescript
if (!verifyAuth(req)) {
  console.log('❌ Authentication failed - returning error -32504')
  // IMPORTANT: Return 200 status with error in JSON-RPC format, not 401
  return res.status(200).json(createError(
    id || null,
    { code: -32504, message: { uz: "Ruxsat rad etildi", ru: "Доступ запрещен", en: "Access denied" } },
    "invalid_credentials"
  ))
}
```

### 2. Strict Password Validation
```typescript
function verifyAuth(req: MedusaRequest): boolean {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  
  const expectedUsername = 'Paycom'
  const expectedPassword = process.env.PAYME_PASSWORD || ''
  
  // Check format: "Paycom:password"
  if (!credentials.startsWith(`${expectedUsername}:`)) {
    return false
  }
  
  const passwordPart = credentials.substring(expectedUsername.length + 1)
  
  // CRITICAL: Only accept the exact password from .env
  // The test sandbox sends wrong credentials to verify you reject them
  return passwordPart === expectedPassword
}
```

## How Payme Tests Work

Payme sandbox sends requests in 2 phases:

### Phase 1: Valid Authentication
- Sends requests with correct credentials
- Tests that your endpoint processes transactions correctly
- **Result:** ✅ Your endpoint passed this phase

### Phase 2: Invalid Authentication (Current Test)
- Sends requests with:
  - Missing Authorization header
  - Wrong username/password
  - Intentionally incorrect credentials
- Tests that you **REJECT** these requests with error code **-32504**
- **Before fix:** Your endpoint returned 401 status ❌
- **After fix:** Your endpoint returns 200 with error -32504 ✅

## Expected Behavior Now

When Payme sends request with wrong auth:

**Request:**
```json
{
    "jsonrpc": "2.0",
    "id": 205667,
    "method": "CheckPerformTransaction",
    "params": {
        "amount": 50000,
        "account": {}
    }
}
```
With Authorization: `(missing or wrong credentials)`

**Your Response (CORRECT):**
```json
{
    "jsonrpc": "2.0",
    "id": 205667,
    "error": {
        "code": -32504,
        "message": {
            "uz": "Ruxsat rad etildi",
            "ru": "Доступ запрещен",
            "en": "Access denied"
        },
        "data": "invalid_credentials"
    }
}
```

**HTTP Status:** 200 OK (not 401!)

## Testing

The server is now running with the fix applied. When you check the Payme sandbox dashboard:

✅ All authentication test errors should be **resolved**
✅ You should see green checkmarks for authentication tests
✅ Ready to proceed to next test phase

## Current Configuration

- **Endpoint:** https://57d7158b460f.ngrok-free.app/admin/payme-webhook
- **Password in .env:** `3a43QfV3saVnsDKAoFZqGVNpyhu32K1PW98#`
- **Server Status:** ✅ Running on port 9000
- **Ngrok Status:** ✅ Tunnel active

## Next Steps

1. Check Payme sandbox dashboard
2. Verify authentication tests now show as passed (green checkmarks)
3. Proceed to next test phase (if any)
4. Test actual payment flow end-to-end

---

**Key Insight:** Payme's testing is very thorough - they test both success AND failure scenarios to ensure your integration is secure and handles errors correctly!
