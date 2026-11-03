# Roll Carpet Implementation Guide

## Backend Implementation ✅ Complete

### API Endpoints Created:

1. **`/store/carpet-calculator`** - Calculate carpet pricing
2. **`/store/cart/custom-carpet`** - Add custom carpet to cart

### Database Changes:
- Added "Carpets" and "Roll Carpets" categories to seed script
- Added sample roll carpet products with metadata for pricing

---

## Frontend Storefront Implementation

### 1. **Product Detection Component**

Create a helper to detect if a product is a roll carpet:

```typescript
// utils/carpetHelpers.ts
export const isRollCarpet = (product: any): boolean => {
  return product?.metadata?.carpet_type === "roll";
};

export const getCarpetConfig = (product: any) => {
  if (!isRollCarpet(product)) return null;
  
  return {
    available_widths: product.metadata.available_widths || [],
    width_prices: product.metadata.width_prices || {},
    min_length: product.metadata.min_length || 1,
    max_length: product.metadata.max_length || 50,
    cutting_fee: product.metadata.cutting_fee || 0,
    preparation_time_days: product.metadata.preparation_time_days || 3
  };
};
```

### 2. **Carpet Configurator Component**

```tsx
// components/CarpetConfigurator.tsx
import React, { useState, useEffect } from 'react';

interface CarpetConfiguratorProps {
  product: any;
  onConfigChange?: (config: any) => void;
}

export const CarpetConfigurator: React.FC<CarpetConfiguratorProps> = ({ 
  product, 
  onConfigChange 
}) => {
  const [selectedWidth, setSelectedWidth] = useState<string>("");
  const [customLength, setCustomLength] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const carpetConfig = getCarpetConfig(product);
  
  if (!carpetConfig) return null;

  const calculatePrice = async () => {
    if (!selectedWidth || !customLength) return;
    
    setIsCalculating(true);
    try {
      const response = await fetch('/store/carpet-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          length: customLength,
          width: selectedWidth
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTotalPrice(data.data.pricing.total_price);
        onConfigChange?.(data.data);
      }
    } catch (error) {
      console.error('Price calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculatePrice();
  }, [selectedWidth, customLength]);

  return (
    <div className="carpet-configurator border rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Configure Your Carpet</h3>
      
      {/* Width Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Width:</label>
        <div className="grid grid-cols-2 gap-2">
          {carpetConfig.available_widths.map((width: string) => (
            <button
              key={width}
              onClick={() => setSelectedWidth(width)}
              className={`p-3 border rounded text-center transition-colors $'{
                selectedWidth === width 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white hover:bg-gray-100 border-gray-300'
              }`}
            >
              <div className="font-medium">{width}</div>
              <div className="text-sm opacity-75">
                ${carpetConfig.width_prices[width]}/m
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Length Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Length (meters):
        </label>
        <div className="flex items-center space-x-2">
          <input 
            type="number" 
            min={carpetConfig.min_length}
            max={carpetConfig.max_length}
            step="0.1"
            value={customLength}
            onChange={(e) => setCustomLength(parseFloat(e.target.value) || 1)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">
            ({carpetConfig.min_length}m - {carpetConfig.max_length}m)
          </span>
        </div>
      </div>

      {/* Area Display */}
      {selectedWidth && customLength && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Area:</span>
            <span className="font-semibold">
              {(parseFloat(selectedWidth.replace('m', '')) * customLength).toFixed(1)} m²
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
        
        {selectedWidth && !isCalculating && (
          <div className="text-sm text-gray-600">
            <div>Base: ${carpetConfig.width_prices[selectedWidth]} × {customLength}m</div>
            <div>Cutting fee: ${carpetConfig.cutting_fee}</div>
            <div className="text-xs mt-1 text-blue-600">
              Preparation time: {carpetConfig.preparation_time_days} days
            </div>
          </div>
        )}
      </div>

      {/* Customer Notes */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Special Instructions (optional):
        </label>
        <textarea 
          rows={3}
          placeholder="e.g., Clean edges, no fringe, extra padding..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};
```

### 3. **Enhanced Add to Cart Button**

```tsx
// components/CustomCarpetAddToCart.tsx
import React, { useState } from 'react';

interface CustomCarpetAddToCartProps {
  product: any;
  carpetConfig?: any;
  cartId: string;
}

export const CustomCarpetAddToCart: React.FC<CustomCarpetAddToCartProps> = ({
  product,
  carpetConfig,
  cartId
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [customerNote, setCustomerNote] = useState("");

  const handleAddToCart = async () => {
    if (!carpetConfig) {
      alert("Please configure your carpet first");
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
          length: carpetConfig.custom_specifications.length,
          width: carpetConfig.custom_specifications.width,
          quantity: 1,
          customerNote: customerNote
        })
      });

      const data = await response.json();
      if (data.success) {
        // Show success message or redirect to cart
        alert(`${data.message}!`);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Failed to add carpet to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-6">
      <textarea
        value={customerNote}
        onChange={(e) => setCustomerNote(e.target.value)}
        placeholder="Special instructions for your carpet..."
        className="w-full p-3 border border-gray-300 rounded mb-4"
        rows={3}
      />
      
      <button
        onClick={handleAddToCart}
        disabled={isAdding || !carpetConfig}
        className={`w-full py-3 px-6 rounded font-semibold transition-colors ${
          isAdding || !carpetConfig
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isAdding ? 'Adding to Cart...' : 'Add Custom Carpet to Cart'}
      </button>
    </div>
  );
};
```

### 4. **Product Page Integration**

```tsx
// pages/ProductPage.tsx
import React, { useState } from 'react';
import { CarpetConfigurator } from '../components/CarpetConfigurator';
import { CustomCarpetAddToCart } from '../components/CustomCarpetAddToCart';
import { isRollCarpet } from '../utils/carpetHelpers';

export const ProductPage: React.FC<{ product: any; cartId: string }> = ({ 
  product, 
  cartId 
}) => {
  const [carpetConfig, setCarpetConfig] = useState(null);
  const isRoll = isRollCarpet(product);

  return (
    <div className="product-page">
      {/* Regular product display */}
      <div className="product-info">
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        {/* Product images, etc. */}
      </div>

      {/* Roll Carpet Configuration */}
      {isRoll ? (
        <div className="carpet-configuration">
          <CarpetConfigurator 
            product={product}
            onConfigChange={setCarpetConfig}
          />
          <CustomCarpetAddToCart
            product={product}
            carpetConfig={carpetConfig}
            cartId={cartId}
          />
        </div>
      ) : (
        <div className="regular-add-to-cart">
          {/* Regular add to cart button for fixed-size products */}
        </div>
      )}
    </div>
  );
};
```

### 5. **Cart Display Enhancement**

```tsx
// components/CustomCarpetCartItem.tsx
export const CustomCarpetCartItem: React.FC<{ item: any }> = ({ item }) => {
  const isCustomCarpet = item.metadata?.carpet_type === "roll_custom";
  
  if (!isCustomCarpet) return <RegularCartItem item={item} />;

  const dimensions = item.metadata.custom_dimensions;
  
  return (
    <div className="cart-item custom-carpet">
      <div className="item-info">
        <h4>{item.title}</h4>
        <div className="custom-specs">
          <span className="badge">Custom Size</span>
          <p>Dimensions: {dimensions.width} × {dimensions.length}m</p>
          <p>Total Area: {dimensions.total_area}m²</p>
          {item.metadata.preparation_days && (
            <p className="text-sm text-blue-600">
              Preparation time: {item.metadata.preparation_days} days
            </p>
          )}
        </div>
      </div>
      <div className="item-price">
        ${item.total.toFixed(2)}
      </div>
    </div>
  );
};
```

---

## Testing the Implementation

### 1. **Test API Endpoints:**

```bash
# Test carpet calculator
curl -X POST "http://localhost:9000/store/carpet-calculator" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_persian_blue_roll",
    "length": 5.5,
    "width": "3m"
  }'

# Test get carpet config
curl "http://localhost:9000/store/carpet-calculator?productId=prod_persian_blue_roll"
```

### 2. **Run Seed Script:**
```bash
npm run seed
```

This will create the new carpet categories and sample roll carpet products.

---

## Key Features Implemented:

✅ **Dynamic Pricing** - Price calculated based on width × length + cutting fee  
✅ **Width Options** - Multiple widths with different per-meter pricing  
✅ **Length Constraints** - Min/max length validation  
✅ **Custom Variants** - Generate unique SKUs for custom orders  
✅ **Preparation Time** - Show customer expected preparation days  
✅ **Special Handling** - Large carpet delivery notifications  
✅ **Cart Integration** - Custom line items with full specifications  
✅ **Area Calculation** - Show total square meters  
✅ **Price Breakdown** - Transparent pricing display  

Your roll carpets are now ready for custom length ordering! 🎯