# Tracking Payme Merchant API Payments

## How Merchant API Payment Tracking Works

With Merchant API, **Payme calls YOUR server** at different stages of the payment process.

### Payment Flow & Transaction States

```
Customer opens payment link
    ↓
Payme calls: CheckPerformTransaction (verify order exists)
    ↓
Customer enters card details
    ↓
Payme calls: CreateTransaction (reserve payment, state = 1)
    ↓
Payment processing...
    ↓
Payme calls: PerformTransaction (complete payment, state = 2)
    ↓
Payment complete! ✅
```

### Transaction States

- **State 1**: Created/Reserved (waiting for confirmation)
- **State 2**: Performed/Paid (payment completed successfully) ✅
- **State -1**: Cancelled before payment
- **State -2**: Cancelled after payment (refund)

## Tracking Methods

### 1. Server Terminal Logs (Real-time)

Watch your terminal while a payment is being processed. You'll see:

```bash
📥 Payme Merchant API Request: { method: 'CheckPerformTransaction', params: { ... } }
✅ Authentication successful, processing method: CheckPerformTransaction
✅ CheckPerformTransaction: OK

📥 Payme Merchant API Request: { method: 'CreateTransaction', params: { ... } }
✅ Transaction created: {
  transaction: '6507f8517bfbf',
  state: 1,
  create_time: 1760559652663,
  ...
}

📥 Payme Merchant API Request: { method: 'PerformTransaction', params: { ... } }
✅ Transaction performed: {
  transaction: '6507f8517bfbf',
  state: 2,  ← Payment completed!
  perform_time: 1760559665234,
  ...
}
```

### 2. View All Transactions Endpoint

Visit: `https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/transactions`

This shows all transactions received from Payme.

### 3. Check Specific Order

The order ID is sent in the transaction params:
```json
{
  "account": {
    "order_id": "test-order-1760559652663"
  }
}
```

## Important Notes

### ⚠️ Current Limitation: In-Memory Storage

Right now, transactions are stored in memory and will be **lost when server restarts**.

For production, you need to store transactions in your database:

```typescript
// Example: Store transaction in database
await container.resolve("orderService").update(orderId, {
  payment_status: "paid",
  payme_transaction_id: transactionId
})
```

### ⚠️ Webhook Must Be Called

For payment tracking to work, **Payme must successfully call your billing endpoint**.

**Requirements:**
1. ✅ Billing URL registered in Payme dashboard
2. ✅ Endpoint accessible (test: `https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/test`)
3. ✅ Ngrok running (keeps URL active)
4. ✅ Server running (handles requests)

## Testing Payment Tracking

### Step 1: Generate Payment Link
```
1. Go to: https://9ed63f6b6a5f.ngrok-free.app/app/payme-test
2. Click "🏪 Merchant API" button
3. Copy the payment URL
```

### Step 2: Make Test Payment
```
1. Open the payment URL in browser
2. You should see Payme checkout page (not an error!)
3. Enter test card details
4. Complete payment
```

### Step 3: Watch Terminal Logs
```
Look for these logs in your terminal:
- CheckPerformTransaction ← Payme verifying order
- CreateTransaction ← Payment reserved
- PerformTransaction ← Payment completed ✅
```

### Step 4: Verify in Your System
```
Check your order in Medusa admin to see if it's marked as paid
(You'll need to implement database storage for this)
```

## Test Card Details

For testing on Payme test environment, use these test cards:

**Successful Payment:**
- Card: `8600 xxxx xxxx xxxx`
- Expiry: Any future date
- CVV: Any 3 digits

**Failed Payment:**
- Card: `8600 0000 0000 0000`
- This will simulate payment failure

## Production Checklist

Before going live, implement these features:

### 1. Database Storage
```typescript
// src/api/store/payme-merchant/route.ts

// Instead of: transactions.set(transactionId, transaction)
// Do:
await database.transaction.create({
  id: transactionId,
  order_id: account.order_id,
  amount: amount,
  state: 1,
  create_time: time,
  ...
})
```

### 2. Order Status Update
```typescript
// When PerformTransaction is called (state = 2):
const order = await orderService.retrieve(orderId)
await orderService.update(orderId, {
  payment_status: 'paid',
  payme_transaction_id: transactionId
})
```

### 3. Inventory Management
```typescript
// Reserve inventory on CreateTransaction (state = 1)
// Confirm inventory on PerformTransaction (state = 2)
// Release inventory on CancelTransaction
```

### 4. Email Notifications
```typescript
// Send confirmation email when payment is completed
if (transaction.state === 2) {
  await emailService.send({
    to: customerEmail,
    subject: 'Payment Confirmed',
    template: 'order-paid'
  })
}
```

### 5. Error Handling
```typescript
// Log all errors for debugging
try {
  // Process payment
} catch (error) {
  console.error('Payment processing error:', error)
  // Return appropriate error code to Payme
}
```

## Debugging Tips

### Issue: No logs appearing
**Problem:** Payme isn't calling your endpoint
**Solutions:**
1. Verify billing URL in Payme dashboard
2. Test endpoint accessibility: `/store/payme-merchant/test`
3. Check ngrok is running: `ngrok http 9000`
4. Wait 2-3 minutes after saving Payme settings

### Issue: "System error" on Payme page
**Problem:** Your endpoint returned an error
**Solutions:**
1. Check terminal logs for error details
2. Verify password in .env matches Payme dashboard
3. Test authentication with curl:
   ```bash
   curl -X POST https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant \
     -H "Content-Type: application/json" \
     -H "Authorization: Basic $(echo -n 'Paycom:YOUR_PASSWORD' | base64)" \
     -d '{"method":"CheckPerformTransaction","params":{"amount":5000000,"account":{"order_id":"test"}}}' \
     | jq
   ```

### Issue: Payment completes but order not updated
**Problem:** Database not being updated
**Solutions:**
1. Implement database storage (see Production Checklist)
2. Add order status update logic
3. Check for errors in PerformTransaction handler

## API Reference

### CheckPerformTransaction
Called when customer opens payment link
```json
{
  "method": "CheckPerformTransaction",
  "params": {
    "amount": 5000000,
    "account": {
      "order_id": "test-order-123"
    }
  }
}
```
**Response:** `{"result": {"allow": true}}`

### CreateTransaction
Called when payment is initiated
```json
{
  "method": "CreateTransaction",
  "params": {
    "id": "6507f8517bfbf",
    "time": 1760559652663,
    "amount": 5000000,
    "account": {
      "order_id": "test-order-123"
    }
  }
}
```
**Response:** Transaction object with state = 1

### PerformTransaction
Called when payment is completed
```json
{
  "method": "PerformTransaction",
  "params": {
    "id": "6507f8517bfbf"
  }
}
```
**Response:** Transaction object with state = 2 ✅

### CancelTransaction
Called if payment needs to be cancelled/refunded
```json
{
  "method": "CancelTransaction",
  "params": {
    "id": "6507f8517bfbf",
    "reason": 1
  }
}
```
**Response:** Transaction object with state = -1 or -2

## Support

If you're still having issues:
- Check `PAYME_MERCHANT_API_GUIDE.md` for setup instructions
- Review terminal logs for detailed error messages
- Contact Payme support: +998 78 150 01 11 or support@paycom.uz
