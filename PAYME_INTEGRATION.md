# Payme (Paycom) Integration Documentation

## Overview

This Medusa backend includes a complete Payme (Paycom) payment gateway integration for processing online payments in Uzbekistan. The integration uses Payme's JSON-RPC API to create payment receipts and handle payment callbacks.

## Architecture

### Components

1. **Payme Library** (`src/lib/payme.ts`)
   - Core RPC client for Payme API
   - Currency conversion utilities (UZS ↔ Tiyin)
   - Configuration helpers

2. **Store Endpoint** (`src/api/store/custom/route.ts`)
   - Public API for creating payment orders
   - Returns payment receipt data for frontend redirection

3. **Webhook Handler** (`src/api/store/custom/payme-callback.ts`)
   - Receives payment status notifications from Payme
   - Handles success and cancellation callbacks

---

## Backend Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Enable/disable Payme integration
PAYME_ENABLED=true

# Payme API endpoint
# Test environment (default):
PAYME_API_URL=https://checkout.test.paycom.uz/api
# Production environment:
# PAYME_API_URL=https://checkout.paycom.uz/api

# Authentication token from Payme Business dashboard
# Format: "Paycom:<merchant_id>"
PAYME_AUTH=Paycom:your_merchant_id_here

# Optional: Additional receipt parameters (JSON format)
# Example for cashbox_id:
PAYME_RECEIPT_PARAMS={"cashbox_id":"YOUR_CASHBOX_ID"}
# Or with nested account fields:
# PAYME_RECEIPT_PARAMS={"account":{"cashbox":"YOUR_CASHBOX"}}
```

### Getting Payme Credentials

1. Register at [Payme Business](https://business.paycom.uz)
2. Complete merchant verification
3. Get your merchant ID from the dashboard
4. Use format: `Paycom:<merchant_id>` for `PAYME_AUTH`
5. Configure your webhook URL in Payme dashboard:
   - Test: `https://your-domain.com/store/custom/payme-callback`
   - Production: Same URL (ensure it's accessible)

---

## Frontend Integration

### Prerequisites

Your frontend needs:
- **Publishable API Key** from Medusa admin
- Base URL of your Medusa backend

### Step 1: Check if Payme is Enabled

```javascript
// Check Payme availability
const checkPaymeStatus = async () => {
  try {
    const response = await fetch('https://your-backend.com/store/custom', {
      method: 'GET',
      headers: {
        'x-publishable-api-key': 'your_publishable_key_here'
      }
    });
    
    const data = await response.json();
    console.log('Payme enabled:', data.paymeEnabled);
    
    return data.paymeEnabled;
  } catch (error) {
    console.error('Failed to check Payme status:', error);
    return false;
  }
};
```

### Step 2: Create Payment Order

When user clicks "Pay with Payme" button:

```javascript
const createPaymePayment = async (orderId, amountUZS) => {
  try {
    const response = await fetch('https://your-backend.com/store/custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': 'your_publishable_key_here'
      },
      body: JSON.stringify({
        amount: amountUZS,        // Amount in UZS (sum), e.g., 50000
        orderId: orderId,          // Your Medusa order ID
        returnUrl: window.location.origin + '/payment-result' // Optional
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create payment');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data; // Contains receipt data including _id
    } else {
      throw new Error('Payment creation failed');
    }
  } catch (error) {
    console.error('Payme payment error:', error);
    throw error;
  }
};
```

### Step 3: Redirect to Payme Checkout

After creating the payment, redirect user to Payme:

```javascript
const processPaymePayment = async (orderId, totalAmount) => {
  try {
    // Create payment receipt
    const receiptData = await createPaymePayment(orderId, totalAmount);
    
    // Extract receipt ID from response
    const receiptId = receiptData._id;
    
    if (!receiptId) {
      throw new Error('No receipt ID received from Payme');
    }
    
    // Build Payme checkout URL
    const paymeCheckoutUrl = `https://checkout.paycom.uz/${receiptId}`;
    
    // Redirect user to Payme
    window.location.href = paymeCheckoutUrl;
    
  } catch (error) {
    console.error('Payment processing failed:', error);
    // Show error message to user
    alert('Failed to process payment. Please try again.');
  }
};
```

### Complete React/Next.js Example

```jsx
import { useState } from 'react';

const PaymeCheckoutButton = ({ order }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePaymeCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create payment receipt
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          amount: order.total,  // Amount in UZS
          orderId: order.id,
          returnUrl: `${window.location.origin}/orders/${order.id}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment failed');
      }

      const data = await response.json();
      
      if (data.success && data.data._id) {
        // Redirect to Payme checkout
        const checkoutUrl = `https://checkout.paycom.uz/${data.data._id}`;
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Invalid response from payment gateway');
      }

    } catch (err) {
      console.error('Payme checkout error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handlePaymeCheckout}
        disabled={loading}
        className="payme-button"
      >
        {loading ? 'Processing...' : 'Pay with Payme'}
      </button>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default PaymeCheckoutButton;
```

### Environment Variables for Frontend

Create a `.env.local` file in your frontend:

```bash
# Next.js / React
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key_here

# Vue / Nuxt
VITE_MEDUSA_BACKEND_URL=https://your-backend.com
VITE_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key_here
```

---

## API Reference

### GET `/store/custom`

**Purpose:** Check if Payme is enabled

**Headers:**
```
x-publishable-api-key: your_publishable_key
```

**Response:**
```json
{
  "status": "ok",
  "paymeEnabled": true
}
```

---

### POST `/store/custom`

**Purpose:** Create a Payme payment receipt

**Headers:**
```
Content-Type: application/json
x-publishable-api-key: your_publishable_key
```

**Request Body:**
```json
{
  "amount": 50000,           // Amount in UZS (sum)
  "orderId": "order_123",    // Your order ID
  "returnUrl": "https://yoursite.com/payment-result"  // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "receipt_id_here",
    "create_time": 1234567890,
    "state": 0
  },
  "raw": {
    "result": { ... }
  }
}
```

**Error Responses:**

400 - Missing required fields:
```json
{
  "message": "amount and orderId are required"
}
```

503 - Payme disabled or not configured:
```json
{
  "message": "Payme is disabled"
}
```

502 - Payme API error:
```json
{
  "message": "Failed to create Payme receipt",
  "error": { ... }
}
```

---

## Currency Conversion

The backend automatically converts UZS to Tiyin (1 UZS = 100 Tiyin):

```javascript
// Frontend sends amount in UZS
const amountUZS = 50000; // 50,000 sum

// Backend converts to Tiyin automatically
// 50,000 UZS = 5,000,000 Tiyin
```

**Important:** Always send amounts in UZS (sum) from the frontend. The backend handles the Tiyin conversion.

---

## Payment Flow Diagram

```
1. User clicks "Pay with Payme"
        ↓
2. Frontend calls POST /store/custom with order details
        ↓
3. Backend creates Payme receipt via RPC
        ↓
4. Backend returns receipt ID to frontend
        ↓
5. Frontend redirects to checkout.paycom.uz/{receipt_id}
        ↓
6. User completes payment on Payme
        ↓
7. Payme sends webhook to /store/custom/payme-callback
        ↓
8. Backend processes webhook (marks order as paid)
        ↓
9. Payme redirects user back to returnUrl
        ↓
10. Frontend shows payment confirmation
```

---

## Webhook Handling

### POST `/store/custom/payme-callback`

This endpoint receives notifications from Payme when:
- Payment is successful (`receipt.pay`)
- Payment is canceled (`receipt.cancel`)

**Current Implementation:**
```typescript
// TODO: Implement order status updates
case "receipt.pay":
  // Mark order as paid using params.account.order_id
  // Update order status in database
  
case "receipt.cancel":
  // Mark order as canceled
  // Update order status in database
```

**Webhook Payload Example:**
```json
{
  "method": "receipt.pay",
  "params": {
    "account": {
      "order_id": "order_123"
    },
    "amount": 5000000,
    "payment_id": "payment_id_here",
    "create_time": 1234567890
  }
}
```

---

## Testing

### Test Environment Setup

1. Use test credentials from Payme Business dashboard
2. Set `PAYME_API_URL=https://checkout.test.paycom.uz/api`
3. Use test cards provided by Payme

### Test Cards (Payme Test Environment)

- **Success:** 8600 0000 0000 0000
- **Insufficient funds:** 8600 0000 0000 0001
- **Card expired:** 8600 0000 0000 0002

### Testing Checklist

- [ ] Payme status check returns `paymeEnabled: true`
- [ ] Payment creation returns valid receipt ID
- [ ] Redirect to Payme checkout works
- [ ] Test card payment succeeds
- [ ] Webhook receives `receipt.pay` notification
- [ ] Order status updates correctly
- [ ] Error handling works (disabled Payme, invalid amounts, etc.)

---

## Error Handling

### Common Errors and Solutions

#### 1. "Publishable API key required"
```javascript
// Solution: Add header to all requests
headers: {
  'x-publishable-api-key': 'your_publishable_key'
}
```

#### 2. "Payme is disabled"
```bash
# Solution: Check .env file
PAYME_ENABLED=true
```

#### 3. "Payme auth not configured"
```bash
# Solution: Set PAYME_AUTH in .env
PAYME_AUTH=Paycom:your_merchant_id
```

#### 4. "Failed to create Payme receipt"
- Verify merchant credentials
- Check if amount is valid (> 0)
- Ensure orderId is unique
- Check Payme API status

---

## Security Considerations

1. **Never expose PAYME_AUTH** - Keep it server-side only
2. **Use HTTPS** - Always use SSL/TLS in production
3. **Validate webhooks** - Verify webhook signatures (if implemented)
4. **Sanitize inputs** - Validate orderId and amount before processing
5. **Rate limiting** - Implement rate limits on payment endpoints

---

## Production Deployment

### Pre-launch Checklist

- [ ] Switch to production Payme credentials
- [ ] Update `PAYME_API_URL` to production endpoint
- [ ] Configure webhook URL in Payme Business dashboard
- [ ] Test with real card in production
- [ ] Implement order status updates in webhook handler
- [ ] Set up monitoring and logging
- [ ] Configure error notifications
- [ ] Test error scenarios
- [ ] Document internal procedures

### Production Environment Variables

```bash
PAYME_ENABLED=true
PAYME_API_URL=https://checkout.paycom.uz/api
PAYME_AUTH=Paycom:prod_merchant_id_here
PAYME_RECEIPT_PARAMS={"cashbox_id":"PROD_CASHBOX_ID"}
```

---

## Support and Resources

- **Payme Documentation:** [https://developer.paycom.uz](https://developer.paycom.uz)
- **Payme Business Dashboard:** [https://business.paycom.uz](https://business.paycom.uz)
- **Payme Support:** support@paycom.uz

---

## Code Examples Repository

Find more examples at:
- React/Next.js: `/examples/payme-nextjs`
- Vue/Nuxt: `/examples/payme-vue`
- Vanilla JS: `/examples/payme-vanilla`

(Create these folders with working examples if needed)

---

## Changelog

### Version 1.0
- Initial Payme integration
- Basic receipt creation
- Webhook handler structure
- Currency conversion utilities

### Future Improvements
- [ ] Webhook signature verification
- [ ] Automatic order status updates
- [ ] Payment history tracking
- [ ] Refund support
- [ ] Multi-currency support
- [ ] Payment analytics
