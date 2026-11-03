# Payme API Comparison: Receipts API vs Merchant API

## 🤔 Which Payme API Should You Use?

You saw Payme documentation mentioning `CheckPerformTransaction`, `CreateTransaction`, etc., but we're using `receipts.create`. Here's why:

---

## 📊 Two Different APIs

### 1️⃣ Merchant API (Traditional)
**Also called:** Subscribe API, Server-to-Server API

**Your account type:** Regular merchant account  
**Integration type:** Payme calls YOUR server  
**Complexity:** High (7 methods to implement)

### 2️⃣ Receipts API (Modern) ✅ **You're using this!**
**Also called:** JSON-RPC API, Virtual Terminal API

**Your account type:** Virtual Terminal (виртуальный терминал)  
**Integration type:** YOU call Payme server  
**Complexity:** Low (1-2 methods to call)

---

## 🔄 Flow Comparison

### Merchant API Flow:
```
1. Customer clicks "Pay with Payme" on your site
2. Your backend creates order
3. You redirect customer to Payme checkout
4. ⬅️ Payme calls YOUR endpoint: CheckPerformTransaction
   You respond: { "allow": true }
5. ⬅️ Payme calls YOUR endpoint: CreateTransaction
   You respond: { "transaction": "12345" }
6. Customer pays on Payme
7. ⬅️ Payme calls YOUR endpoint: PerformTransaction
   You respond: { "transaction": "12345" }
8. Your backend marks order as paid
```

**YOU must implement 7 endpoints that Payme will call!**

---

### Receipts API Flow (Your Current Setup):
```
1. Customer clicks "Pay with Payme" on your site
2. Your backend creates order
3. ➡️ You call Payme: receipts.create
4. Payme responds: { "_id": "receipt_12345" }
5. You redirect customer to: checkout.paycom.uz/receipt_12345
6. Customer pays on Payme
7. ⬅️ Payme sends webhook: receipts.pay
   You respond: { "message": "ok" }
8. Your backend marks order as paid
```

**You only call 1 Payme method and handle webhooks!**

---

## 📋 Method Comparison

### Merchant API Methods (7 required)

#### 1. `CheckPerformTransaction`
**When:** Before payment starts  
**Purpose:** Payme asks "Can I charge this order?"  
**You must:**
- Check if order exists
- Verify amount matches
- Respond: `{ "allow": true }` or error

**Example:**
```json
// Payme sends to YOUR endpoint:
{
  "method": "CheckPerformTransaction",
  "params": {
    "account": { "order_id": "order_123" },
    "amount": 5000000
  }
}

// You respond:
{
  "result": {
    "allow": true
  }
}
```

---

#### 2. `CreateTransaction`
**When:** Payment is being created  
**Purpose:** Payme says "I'm creating a transaction"  
**You must:**
- Save transaction ID in database
- Return transaction details
- Create transaction record

**Example:**
```json
// Payme sends:
{
  "method": "CreateTransaction",
  "params": {
    "id": "payme_transaction_12345",
    "account": { "order_id": "order_123" },
    "amount": 5000000,
    "time": 1760544015
  }
}

// You respond:
{
  "result": {
    "transaction": "12345",
    "state": 1,
    "create_time": 1760544015
  }
}
```

---

#### 3. `PerformTransaction`
**When:** Payment completed successfully  
**Purpose:** Payme says "I'm completing the payment"  
**You must:**
- Mark order as paid
- Update transaction state
- Deliver goods/services

**Example:**
```json
// Payme sends:
{
  "method": "PerformTransaction",
  "params": {
    "id": "payme_transaction_12345"
  }
}

// You respond:
{
  "result": {
    "transaction": "12345",
    "perform_time": 1760544020,
    "state": 2
  }
}
```

---

#### 4. `CancelTransaction`
**When:** Payment is being cancelled  
**Purpose:** Payme says "I'm canceling this payment"  
**You must:**
- Cancel order
- Refund if needed
- Update transaction state

---

#### 5. `CheckTransaction`
**When:** Payme needs transaction status  
**Purpose:** Payme asks "What's the status?"  
**You must:**
- Return transaction details from database

---

#### 6. `GetStatement`
**When:** Payme requests transaction report  
**Purpose:** Get list of transactions in date range  
**You must:**
- Query database for transactions
- Return formatted list

---

#### 7. `SetFiscalData`
**When:** Fiscal receipt is ready  
**Purpose:** Payme sends fiscal receipt data  
**You must:**
- Save fiscal receipt information

---

## 📋 Receipts API Methods (Your Current Setup) ✅

### Methods YOU call:

#### 1. `receipts.create` ✅ **You're using this!**
**Purpose:** Create payment receipt  
**Example:**
```typescript
const result = await paymeRpc("receipts.create", {
  amount: 5000000,
  account: { order_id: "order_123" }
})

// Payme responds:
{
  "result": {
    "_id": "receipt_id_12345",
    "create_time": 1760544015,
    "state": 0,
    "amount": 5000000
  }
}
```

---

#### 2. `receipts.pay`
**Purpose:** Manually mark receipt as paid (rare)  
**Usually:** Payme sends this to YOUR webhook automatically

---

#### 3. `receipts.cancel`
**Purpose:** Cancel unpaid receipt  
**Example:**
```typescript
await paymeRpc("receipts.cancel", {
  receipt_id: "receipt_id_12345"
})
```

---

#### 4. `receipts.check`
**Purpose:** Check receipt status  
**Example:**
```typescript
const status = await paymeRpc("receipts.check", {
  receipt_id: "receipt_id_12345"
})
```

---

#### 5. `receipts.get`
**Purpose:** Get full receipt details  

---

### Webhooks YOU receive:

When customer pays, Payme sends these to **YOUR** webhook URL:

#### `receipts.pay` ✅ **Webhook handler exists!**
**File:** `src/api/store/custom/payme-callback.ts`

```typescript
// Payme sends to: /store/custom/payme-callback
{
  "method": "receipts.pay",
  "params": {
    "account": { "order_id": "order_123" },
    "amount": 5000000,
    "receipt_id": "receipt_id_12345"
  }
}

// You respond:
{
  "result": { "message": "ok" }
}
```

---

## 🎯 Summary: What You're Actually Using

### You Have Virtual Terminal

Your configuration:
```bash
PAYME_MERCHANT_ID=68ecf66ee902b2f5efb327ea
PAYME_PASSWORD=%Vd&P84GpD@n5do?@jJcSfGTeeWFoPdpDaci
```

This is a **Virtual Terminal**, so you use **Receipts API**.

---

### Your Current Implementation:

**Files:**
1. `src/lib/payme.ts` - Core RPC function ✅
2. `src/api/store/payme/create-receipt/route.ts` - Calls `receipts.create` ✅
3. `src/api/store/custom/payme-callback.ts` - Receives webhooks ✅

**Methods used:**
- YOU call: `receipts.create` ✅
- Payme calls: `receipts.pay` (webhook) ✅
- Payme calls: `receipts.cancel` (webhook) ✅
- Payme calls: `receipts.check` (webhook) ✅

---

## ❓ Do You Need Merchant API Methods?

**Short answer: NO!**

You have a Virtual Terminal, so you use Receipts API.

**Long answer:**
- If Payme asks you to implement `CheckPerformTransaction`, etc., it means:
  - Either you need to switch to Merchant API (unlikely)
  - Or they're confused about your integration type
  - Or documentation is showing wrong API

Contact Payme support and say:
> "I have Virtual Terminal (Cashbox ID: 68ecf66ee902b2f5efb327ea). Should I use Receipts API or Merchant API?"

They'll confirm you should use **Receipts API**.

---

## 🔧 What You Should Do Next

### 1. Keep Using Receipts API ✅
Your current implementation is correct!

### 2. Improve Webhook Handler
Update `payme-callback.ts` to actually update orders:

```typescript
case "receipts.pay": {
  const orderId = params?.account?.order_id
  
  // TODO: Mark order as paid
  const orderService = req.scope.resolve("orderService")
  await orderService.markAsPaid(orderId)
  
  return res.json({ result: { message: "ok" } })
}
```

### 3. Configure Webhook URL in Payme Dashboard
- Go to https://business.paycom.uz
- Settings → Your Virtual Terminal
- Set webhook URL: `https://yourdomain.com/store/custom/payme-callback`

### 4. Test Payment Flow
1. Call `receipts.create` ✅ (you're doing this)
2. Redirect to Payme checkout ✅ (you're doing this)
3. Complete payment on Payme
4. Receive `receipts.pay` webhook ✅ (handler exists)
5. Mark order as paid (TODO: implement)

---

## 📚 Resources

### Receipts API Documentation
- Method: `receipts.create`
- Method: `receipts.pay`
- Method: `receipts.cancel`
- Format: JSON-RPC 2.0

### Merchant API Documentation (for reference)
- Method: `CheckPerformTransaction`
- Method: `CreateTransaction`
- Method: `PerformTransaction`
- Method: `CancelTransaction`
- Method: `CheckTransaction`
- Method: `GetStatement`
- Method: `SetFiscalData`

---

## ✅ Conclusion

**You're using the RIGHT API!** 🎉

- ✅ Virtual Terminal = Receipts API
- ✅ Simpler integration
- ✅ Less code to write
- ✅ YOU call Payme (not reverse)

**You DON'T need Merchant API methods** unless Payme explicitly tells you to switch account types.

---

**Last Updated:** October 15, 2025  
**Your Account:** Virtual Terminal (PREMIUM CARPET-1)  
**Cashbox ID:** 68ecf66ee902b2f5efb327ea  
**API Type:** Receipts API ✅
