# Payme Integration - React/Next.js Examples

This folder contains ready-to-use React/Next.js components for Payme payment integration.

## 📁 Files

- **`hooks/usePayme.ts`** - React hook for Payme functionality
- **`components/PaymeButton.tsx`** - Reusable payment button component
- **`pages/checkout-example.tsx`** - Complete checkout page example

## 🚀 Quick Setup

### 1. Install Dependencies

This code works with standard React/Next.js projects. No additional dependencies needed!

### 2. Environment Variables

Create `.env.local` in your Next.js root:

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
```

### 3. Copy Files

Copy the files to your project:

```
your-nextjs-project/
├── src/
│   ├── hooks/
│   │   └── usePayme.ts
│   ├── components/
│   │   └── PaymeButton.tsx
│   └── app/
│       └── checkout/
│           └── page.tsx
```

## 📖 Usage Examples

### Basic Usage - Just the Hook

```tsx
import { usePayme } from '@/hooks/usePayme';

function CheckoutButton() {
  const { createPayment, isLoading } = usePayme();

  const handleCheckout = async () => {
    await createPayment('order_123', 50000);
  };

  return (
    <button onClick={handleCheckout} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Pay with Payme'}
    </button>
  );
}
```

### Using the PaymeButton Component

```tsx
import PaymeButton from '@/components/PaymeButton';

function Checkout({ order }) {
  return (
    <PaymeButton
      orderId={order.id}
      amount={order.total}
      onSuccess={() => console.log('Payment started')}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Complete Checkout Page

```tsx
'use client';

import PaymeButton from '@/components/PaymeButton';

export default function CheckoutPage() {
  const order = {
    id: 'order_123',
    total: 50000 // UZS
  };

  return (
    <div>
      <h1>Checkout</h1>
      <p>Total: {order.total.toLocaleString()} UZS</p>
      
      <PaymeButton
        orderId={order.id}
        amount={order.total}
        returnUrl="/orders/success"
      />
    </div>
  );
}
```

### With Custom Styling

```tsx
<PaymeButton
  orderId="order_123"
  amount={50000}
  className="my-custom-button-class"
>
  <span>💳</span>
  <span>Checkout Now</span>
</PaymeButton>
```

### Handling Success/Error States

```tsx
'use client';

import { useState } from 'react';
import PaymeButton from '@/components/PaymeButton';

export default function CheckoutPage() {
  const [status, setStatus] = useState('');

  return (
    <div>
      <PaymeButton
        orderId="order_123"
        amount={50000}
        onSuccess={() => {
          setStatus('Redirecting to Payme...');
          // Track analytics
          gtag('event', 'begin_checkout', {
            currency: 'UZS',
            value: 50000
          });
        }}
        onError={(error) => {
          setStatus(`Error: ${error}`);
          // Log error to monitoring service
          console.error('Payment error:', error);
        }}
      />
      
      {status && <p>{status}</p>}
    </div>
  );
}
```

## 🎨 Customization

### Styling the Button

The `PaymeButton` component includes built-in styles using CSS-in-JS. To customize:

#### Option 1: Use className prop
```tsx
<PaymeButton 
  className="my-button"
  // ... other props
/>
```

Then in your CSS:
```css
.my-button {
  background: #your-color !important;
  /* your custom styles */
}
```

#### Option 2: Create your own button
```tsx
import { usePayme } from '@/hooks/usePayme';

function CustomButton({ orderId, amount }) {
  const { createPayment, isLoading } = usePayme();

  return (
    <button 
      onClick={() => createPayment(orderId, amount)}
      className="your-custom-class"
    >
      {isLoading ? 'Loading...' : 'Pay'}
    </button>
  );
}
```

## 🧪 Testing

### Test Data

Use these values for testing:

```tsx
const testOrder = {
  id: 'test_order_001',
  amount: 50000 // 50,000 UZS
};
```

### Test Card
- Card: 8600 0000 0000 0000
- Expiry: Any future date
- CVV: Any 3 digits

## 🔧 TypeScript Support

All components are fully typed. The hook returns:

```typescript
interface PaymeHookReturn {
  isEnabled: boolean;        // Is Payme available?
  isLoading: boolean;        // Is payment processing?
  error: string | null;      // Any error message
  createPayment: (          // Create payment function
    orderId: string, 
    amount: number, 
    returnUrl?: string
  ) => Promise<void>;
  checkStatus: () => Promise<void>; // Recheck Payme status
}
```

## 📱 App Router vs Pages Router

### App Router (Next.js 13+)

Use `'use client'` directive:

```tsx
'use client';

import PaymeButton from '@/components/PaymeButton';

export default function Page() {
  return <PaymeButton orderId="123" amount={50000} />;
}
```

### Pages Router (Next.js 12 and earlier)

No changes needed:

```tsx
import PaymeButton from '@/components/PaymeButton';

export default function Page() {
  return <PaymeButton orderId="123" amount={50000} />;
}
```

## ⚠️ Common Issues

### "Publishable key is not configured"
Make sure `.env.local` has:
```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

### "Payme Unavailable" button
- Check backend is running
- Verify `PAYME_ENABLED=true` in backend `.env`
- Check network requests in browser DevTools

### Button not responding
- Make sure you're using `'use client'` directive (App Router)
- Check console for errors
- Verify orderId and amount are valid

## 🔗 Related Files

- Backend implementation: `/src/api/store/custom/route.ts`
- Full documentation: `/PAYME_INTEGRATION.md`
- Quick start guide: `/PAYME_QUICK_START.md`

## 📞 Support

- Check main documentation: [PAYME_INTEGRATION.md](../../PAYME_INTEGRATION.md)
- Payme docs: https://developer.paycom.uz
- Medusa docs: https://docs.medusajs.com

