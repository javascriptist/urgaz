# Roll Carpet Storefront Implementation Guide

## 🎯 **Overview**
Simple roll carpet system where customers can enter custom length and get instant pricing.

---

## 📋 **Admin Setup**

### **Step 1: Configure Roll Carpets**
1. Go to **Products** → Select carpet product
2. In **Carpet Attributes** widget:
   - **Carpet Type**: Select `"Roll"` (enables roll carpet mode)
   - **Width**: Enter available width (e.g., "3m", "4m")  
   - **Length**: Enter stock length available for cutting (e.g., "50m")
   - **Shape, Design Code, Color**: Fill as normal
3. Set **Product Price** as price per running meter (e.g., $45/meter)
4. **Save** - Product is now a roll carpet with inventory tracking

---

## 🎨 **Frontend Implementation**

### **Step 1: Detect Roll Carpets**

```typescript
// utils/carpetHelpers.ts
export const isRollCarpet = (product: any): boolean => {
  return product?.metadata?.attributes?.carpet_type === "roll";
};

export const getStockLength = (product: any): number => {
  return parseFloat(product?.metadata?.attributes?.stock_length || product?.metadata?.attributes?.length || "0");
};

export const getCarpetWidth = (product: any): string => {
  return product?.metadata?.attributes?.width || "3m";
};
```

### **Step 2: Roll Carpet Component**

```tsx
// components/RollCarpetSelector.tsx
import React, { useState, useEffect } from 'react';

interface RollCarpetSelectorProps {
  product: any;
  onPriceChange?: (price: number) => void;
}

export const RollCarpetSelector: React.FC<RollCarpetSelectorProps> = ({ 
  product, 
  onPriceChange 
}) => {
  const [customLength, setCustomLength] = useState<number>(1);
  const stockLength = getStockLength(product);
  const maxLength = Math.min(stockLength, 50); // Respect both stock and system limits
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const productPrice = product.variants?.[0]?.prices?.[0]?.amount || 4500; // cents
  const pricePerMeter = productPrice / 100; // convert to dollars
  const carpetWidth = getCarpetWidth(product);

  const calculatePrice = async () => {
    if (!customLength || customLength <= 0) return;
    
    setIsCalculating(true);
    try {
      const response = await fetch('/store/carpet-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          length: customLength
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTotalPrice(data.data.pricing.total_price);
        onPriceChange?.(data.data.pricing.total_price);
      }
    } catch (error) {
      console.error('Price calculation error:', error);
      // Fallback calculation
      const fallbackPrice = pricePerMeter * customLength;
      setTotalPrice(fallbackPrice);
      onPriceChange?.(fallbackPrice);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculatePrice();
  }, [customLength]);

  return (
    <div className="roll-carpet-selector border rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🎯 Custom Length Carpet</h3>
      
      {/* Carpet Info */}
      <div className="mb-4 p-3 bg-white rounded border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Width:</span>
            <span className="ml-2 font-medium">{carpetWidth}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Price per meter:</span>
            <span className="ml-2 font-medium">${pricePerMeter.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Length Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Enter Length (meters):
        </label>
        <input 
          type="number" 
          min="0.1"
          max={maxLength}
          step="0.1"
          value={customLength}
          onChange={(e) => setCustomLength(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 7.5"
        />
        <small className="text-gray-500">
          Minimum 0.1m, Maximum {maxLength}m (Stock: {stockLength}m available)
        </small>
      </div>

      {/* Area Display */}
      {customLength > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Area:</span>
            <span className="font-semibold">
              {(parseFloat(carpetWidth.replace('m', '')) * customLength).toFixed(1)} m²
            </span>
          </div>
        </div>
      )}

      {/* Price Display */}
      <div className="mb-4 p-4 bg-white border rounded">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold">Total Price:</span>
          <span className="text-2xl font-bold text-green-600">
            {isCalculating ? "Calculating..." : `$${totalPrice.toFixed(2)}`}
          </span>
        </div>
        
        {customLength > 0 && !isCalculating && (
          <div className="text-sm text-gray-600">
            <div>{carpetWidth} × {customLength}m = ${pricePerMeter} × {customLength} = ${totalPrice.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### **Step 3: Add to Cart Component**

```tsx
// components/RollCarpetAddToCart.tsx
import React, { useState } from 'react';

interface RollCarpetAddToCartProps {
  product: any;
  customLength: number;
  totalPrice: number;
  cartId?: string;
}

export const RollCarpetAddToCart: React.FC<RollCarpetAddToCartProps> = ({
  product,
  customLength,
  totalPrice,
  cartId
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [customerNote, setCustomerNote] = useState("");

  const handleAddToCart = async () => {
    if (!customLength || customLength <= 0) {
      alert("Please enter a valid length");
      return;
    }

    const stockLength = getStockLength(product);
    if (customLength > stockLength) {
      alert(`Not enough stock available. Maximum length: ${stockLength}m`);
      return;
    }

    if (!cartId) {
      alert("Cart not available");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/store/cart/custom-carpet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: cartId,
          productId: product.id,
          length: customLength,
          quantity: 1,
          customerNote: customerNote
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`${data.message}!`);
        // Optionally redirect to cart or show success message
      } else {
        alert('Failed to add carpet to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Failed to add carpet to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="roll-carpet-add-to-cart">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Special Instructions (optional):
        </label>
        <textarea
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          placeholder="Any special requirements or notes..."
          className="w-full p-3 border border-gray-300 rounded"
          rows={3}
        />
      </div>
      
      <button
        onClick={handleAddToCart}
        disabled={isAdding || !customLength || customLength <= 0}
        className={`w-full py-3 px-6 rounded font-semibold transition-colors ${
          isAdding || !customLength || customLength <= 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isAdding ? 'Adding to Cart...' : `Add ${customLength}m Carpet to Cart - $${totalPrice.toFixed(2)}`}
      </button>
    </div>
  );
};
```

### **Step 4: Product Page Integration**

```tsx
// pages/ProductPage.tsx
import React, { useState } from 'react';
import { RollCarpetSelector } from '../components/RollCarpetSelector';
import { RollCarpetAddToCart } from '../components/RollCarpetAddToCart';
import { isRollCarpet } from '../utils/carpetHelpers';

export const ProductPage: React.FC<{ product: any; cartId?: string }> = ({ 
  product, 
  cartId 
}) => {
  const [customLength, setCustomLength] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const isRoll = isRollCarpet(product);

  return (
    <div className="product-page max-w-4xl mx-auto p-6">
      {/* Regular product display */}
      <div className="product-info mb-8">
        <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
        <p className="text-gray-600 mb-6">{product.description}</p>
        {/* Product images, etc. */}
      </div>

      {/* Roll Carpet Configuration or Regular Add to Cart */}
      {isRoll ? (
        <div className="roll-carpet-section">
          <RollCarpetSelector 
            product={product}
            onPriceChange={(price) => {
              setTotalPrice(price);
            }}
          />
          <div className="mt-6">
            <RollCarpetAddToCart
              product={product}
              customLength={customLength}
              totalPrice={totalPrice}
              cartId={cartId}
            />
          </div>
        </div>
      ) : (
        <div className="regular-add-to-cart">
          {/* Regular add to cart button for fixed-size products */}
          <button className="bg-blue-600 text-white py-3 px-6 rounded">
            Add to Cart - ${product.variants?.[0]?.prices?.[0]?.amount / 100}
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🛒 **Cart Display Enhancement**

```tsx
// components/CartItem.tsx
export const CartItem: React.FC<{ item: any }> = ({ item }) => {
  const isCustomCarpet = item.metadata?.carpet_type === "roll_custom";
  
  if (isCustomCarpet) {
    return (
      <div className="cart-item custom-carpet border rounded p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold">{item.title}</h4>
            <div className="custom-specs mt-2">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Custom Length
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Length: {item.metadata.custom_length}m
              </p>
              {item.metadata.customer_specifications && (
                <p className="text-sm text-gray-600">
                  Notes: {item.metadata.customer_specifications}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">${item.total.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
          </div>
        </div>
      </div>
    );
  }

  // Regular cart item
  return (
    <div className="cart-item border rounded p-4">
      {/* Regular cart item display */}
    </div>
  );
};
```

---

## 🧪 **Testing**

### **Test the APIs:**

```bash
# Test carpet calculator
curl -X POST "http://localhost:9000/store/carpet-calculator" \
  -H "Content-Type: application/json" \
  -d '{"productId": "prod_123", "length": 7.5}'

# Test add to cart
curl -X POST "http://localhost:9000/store/cart/custom-carpet" \
  -H "Content-Type: application/json" \
  -d '{"cartId": "cart_123", "productId": "prod_123", "length": 7.5}'
```

---

## ✅ **Summary**

### **Admin Workflow:**
1. **Create product** → Set price per meter
2. **Set length = "roll"** → Enables custom length
3. **Customer sees length input** → Gets instant pricing

### **Customer Experience:**
1. **See roll carpet** → Custom length selector appears
2. **Enter length** → Live price calculation
3. **Add to cart** → Custom specifications saved

### **Key Features:**
- ✅ **Simple**: Just length input + pricing
- ✅ **Live pricing**: Instant calculations
- ✅ **Clean UI**: No unnecessary complexity
- ✅ **Mobile friendly**: Responsive design
- ✅ **Cart integration**: Custom specifications preserved

Perfect for your carpet business! 🎯