# Payme Request Detection

## How to Identify Payme Requests

Your billing endpoint now detects Payme requests using these headers:

### Payme Request Headers:

```javascript
{
  "Content-Type": "application/json; charset=UTF-8",
  "Content-Length": 103,
  "Test-Operation": "Paycom",          // ✅ Key identifier
  "Referer": "http://test.paycom.uz",  // ✅ Key identifier  
  "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
  "Authorization": "Basic UGF5Y29tOlV6Y2FyZDpzb21lUmFuZG9tU3RyaW5nMTU0NTM0MzU0MzU0NQ=="
}
```

## Detection Logic

The endpoint checks for:

1. **`Test-Operation: Paycom`** header (most reliable)
2. **`Referer`** containing `paycom.uz` or `payme.uz`
3. **`User-Agent`** containing `Paycom`

## Server Logs

When Payme calls your endpoint, you'll see:

```bash
📥 Incoming Request: {
  fromPayme: '✅ Payme',
  method: 'CheckPerformTransaction',
  params: { amount: 5000000, account: { order_id: 'order-123' } },
  headers: {
    'test-operation': 'Paycom',
    referer: 'http://test.paycom.uz',
    authorization: 'Present',
    contentType: 'application/json; charset=UTF-8'
  }
}
✅ Authentication successful, processing method: CheckPerformTransaction
```

If it's NOT from Payme:

```bash
📥 Incoming Request: {
  fromPayme: '❓ Unknown',
  method: 'CheckPerformTransaction',
  ...
  headers: {
    'test-operation': 'none',
    referer: 'none',
    ...
  }
}
```

## Benefits

- **Security**: Know when requests are from Payme vs other sources
- **Debugging**: Easier to identify Payme test calls
- **Logging**: Better visibility into request origin
- **Testing**: Can simulate Payme requests by adding headers

## Testing

### Simulate a Payme request:

```bash
curl -X POST http://localhost:9000/store/payme-merchant \
  -H "Content-Type: application/json; charset=UTF-8" \
  -H "Test-Operation: Paycom" \
  -H "Referer: http://test.paycom.uz" \
  -H "Authorization: Basic UGF5Y29tOjNhNDNRZlYzc2FWbnNES0FvRlpxR1ZOcHlodTMyS zFQVzk4Iw==" \
  -d '{
    "method": "CheckPerformTransaction",
    "params": {
      "amount": 5000000,
      "account": { "order_id": "test-123" }
    },
    "id": 1
  }'
```

You'll see `fromPayme: '✅ Payme'` in the logs!

### Regular request (without Payme headers):

```bash
curl -X POST http://localhost:9000/store/payme-merchant \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic UGF5Y29tOjNhNDNRZlYzc2FWbnNES0FvRlpxR1ZOcHlodTMyS zFQVzk4Iw==" \
  -d '{
    "method": "CheckPerformTransaction",
    "params": {
      "amount": 5000000,
      "account": { "order_id": "test-123" }
    },
    "id": 1
  }'
```

You'll see `fromPayme: '❓ Unknown'` in the logs.

## Production vs Test

**Test Environment:**
- Referer: `http://test.paycom.uz`
- Test-Operation: `Paycom`

**Production Environment:**
- Referer: `http://checkout.paycom.uz` or `https://checkout.paycom.uz`
- Test-Operation: May not be present
- User-Agent: May vary

The detection logic handles both! ✅

## Updated Files

✅ `/src/api/store/payme-merchant/route.ts`
- Added `isPaymeRequest()` function
- Enhanced logging with Payme detection
- Shows request origin in logs

Your endpoint is now smarter and provides better visibility! 🎉
