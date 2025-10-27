# Payme Merchant API Integration Guide

## Overview
Your контрольно-кассовая машина (Cash Register Machine) uses **Merchant API**, which works differently from Subscribe API:

- **Payme calls YOUR server** (not you calling Payme)
- You provide a billing endpoint URL
- Payme sends JSON-RPC requests to verify and process payments

## Configuration

### 1. Billing Endpoint
```
URL: https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant
```

**⚠️ Important**: This endpoint must be:
- ✅ Publicly accessible (using ngrok)
- ✅ Accept POST requests
- ✅ Handle Basic Auth with username: "Paycom", password: your merchant password

### 2. Register Billing URL in Payme Dashboard

1. Go to https://merchant.payme.uz
2. Navigate to your контрольно-кассовая машина settings
3. Find "Billing URL" or "Endpoint URL" field
4. Enter: `https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant`
5. Save settings

### 3. Credentials

```env
PAYME_MERCHANT_ID=68ef46c3097472f1628da03b
PAYME_PASSWORD=3a43QfV3saVnsDKAoFZqGVNpyhu32K1PW98#
PAYME_BILLING_URL=https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant
```

## How It Works

### Flow:
1. **Customer initiates payment** on your website
2. **Customer is redirected to Payme** with payment details
3. **Payme calls your billing endpoint** to verify order
4. **Customer completes payment** on Payme's page
5. **Payme calls your billing endpoint again** to confirm payment
6. **Customer is redirected back** to your website

### Merchant API Methods

Your billing endpoint (`/store/payme-merchant`) now handles:

1. **CheckPerformTransaction** - Verify transaction can be performed
2. **CreateTransaction** - Reserve the payment
3. **PerformTransaction** - Complete the payment
4. **CancelTransaction** - Cancel the payment
5. **CheckTransaction** - Check transaction status
6. **GetStatement** - Get list of transactions

## Testing

### Step 1: Test Billing Endpoint

Open your browser console and test the endpoint:

```javascript
fetch('https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa('Paycom:3a43QfV3saVnsDKAoFZqGVNpyhu32K1PW98#')
  },
  body: JSON.stringify({
    id: 1,
    method: 'CheckPerformTransaction',
    params: {
      amount: 5000000, // 50,000 UZS in tiyin
      account: {
        order_id: 'test-order-123'
      }
    }
  })
})
.then(r => r.json())
.then(d => console.log('✅ Response:', d))
.catch(e => console.error('❌ Error:', e))
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "allow": true
  }
}
```

### Step 2: Generate Payment Link

To create a payment, you need to generate a Payme payment link with your merchant details:

```
https://checkout.paycom.uz/
  ?m=68ef46c3097472f1628da03b
  &ac.order_id=TEST-ORDER-123
  &a=5000000
  &c=https://yoursite.com/payment/success
```

Parameters:
- `m` = Merchant ID
- `ac.order_id` = Your order ID
- `a` = Amount in tiyin (50,000 UZS = 5,000,000 tiyin)
- `c` = Callback URL (where to redirect after payment)

### Step 3: Test Payment Flow

1. **Generate payment URL** with test order
2. **Open URL in browser**
3. **Complete payment** on Payme's page
4. **Check server logs** to see Payme calling your billing endpoint

## Server Logs

Watch your server terminal to see Payme's requests:

```
📥 Payme Merchant API Request: { method: 'CheckPerformTransaction', ... }
✅ Authentication successful
✅ CheckPerformTransaction: OK
```

## Important Notes

### ⚠️ Ngrok Requirement
- Keep ngrok running: `ngrok http 9000`
- If ngrok restarts, **update billing URL** in Payme dashboard with new URL

### ⚠️ Authentication
- Payme sends: `Authorization: Basic <base64>`
- Format: `Paycom:<your_password>`
- Your endpoint verifies this automatically

### ⚠️ Transaction States
- `1` = Created (reserved)
- `2` = Performed (paid)
- `-1` = Cancelled before perform
- `-2` = Cancelled after perform

## Production Deployment

For production:

1. **Deploy to production server** with static domain
2. **Update billing URL** in Payme dashboard
3. **Use HTTPS** (required by Payme)
4. **Store transactions in database** (not in-memory)
5. **Integrate with order management system**

## Next Steps

1. ✅ Register billing URL in Payme dashboard
2. ✅ Test CheckPerformTransaction endpoint
3. ✅ Generate test payment link
4. ✅ Complete test payment
5. ✅ Verify payment confirmation in server logs
6. ✅ Integrate with your order system

## Troubleshooting

### Issue: "Access denied"
- Check password in .env matches Payme dashboard
- Verify Authorization header format

### Issue: "Method not found"
- Check method name spelling
- Verify JSON-RPC format

### Issue: Payme can't reach endpoint
- Verify ngrok is running
- Check billing URL is correct in Payme dashboard
- Test endpoint with curl/browser

## Support

If you need help:
- Payme Support: +998 78 150 01 11
- Telegram: @PaycomUzbekistan
- Email: support@paycom.uz
