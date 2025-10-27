# Custom Product Attributes Widget

## ✅ Setup Complete!

The custom attributes widget has been integrated into the Medusa admin UI using Medusa's native widget system.

### 🎯 How to Use

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open the admin panel**:
   - Navigate to: http://localhost:9000/app
   - Login with your admin credentials

3. **Add attributes to a product**:
   - Go to Products → Select any product
   - Scroll down past the product details
   - You'll see a **"Carpet Attributes"** section
   - Fill in the fields:
     - **Size**: e.g., "4.5x2.5" (width x length in meters)
     - **Shape**: e.g., "rectangular", "round", "oval"
     - **Design Code**: e.g., "ABC123"
     - **Color**: e.g., "red", "blue", "multicolor"
     - **Meter Square**: e.g., 11.25 (total area in m²)
   - Click **"Save Attributes"**
   - Success toast will confirm the save

### 📁 Files Created

**Backend**:
- `src/api/admin/products/attributes/route.ts` - Save attributes endpoint
- `src/api/admin/products/by-attributes/route.ts` - Filter products by attributes

**Admin UI**:
- `src/admin/widgets/ProductAttributesWidget.tsx` - Main widget component with input fields
- `src/admin/widgets/product-attributes-section.tsx` - Widget configuration
- `src/admin/routes/products/[id]/attributes/page.tsx` - Dedicated attributes page (optional)

### 🔍 Filtering Products by Attributes

Use the filter endpoint to find products with specific attributes:

```bash
# Find all 4.5x2.5 round red carpets
curl "http://localhost:9000/admin/products/by-attributes?attr[size]=4.5x2.5&attr[shape]=round&attr[color]=red" \
  -H "x-medusa-access-token: YOUR_TOKEN"

# Search with text and filter
curl "http://localhost:9000/admin/products/by-attributes?q=carpet&attr[shape]=rectangular" \
  -H "x-medusa-access-token: YOUR_TOKEN"
```

### 🧪 Testing with REST API

**Save attributes programmatically**:
```bash
curl -X POST http://localhost:9000/admin/products/attributes \
  -H "Content-Type: application/json" \
  -H "x-medusa-access-token: YOUR_TOKEN" \
  -d '{
    "productId": "prod_01XXXXX",
    "attributes": {
      "size": "4.5x2.5",
      "shape": "rectangular",
      "design_code": "ABC123",
      "color": "red",
      "meter_square": 11.25
    }
  }'
```

### 📝 Attributes Reference

| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `size` | string | "4.5x2.5" | Width x Length in meters |
| `shape` | string | "rectangular" | Shape: rectangular, round, oval |
| `design_code` | string | "ABC123" | Internal design/SKU code |
| `color` | string | "red" | Primary color or color name |
| `meter_square` | number | 11.25 | Total area in square meters |

### 🎨 Widget Location

The widget appears in the **product details page** after the main product information section (`zone: "product.details.after"`).

To change the position, edit the `config` export in:
- `src/admin/widgets/ProductAttributesWidget.tsx`

Available zones:
- `product.details.before` - Before product details
- `product.details.after` - After product details (current)
- `product.details.side.before` - Before sidebar
- `product.details.side.after` - After sidebar

### 🔧 Troubleshooting

**Widget not showing?**
1. Make sure dev server is running: `npm run dev`
2. Clear browser cache and reload admin
3. Check terminal for any build errors
4. Rebuild admin: `npx medusa build --admin-only`

**Attributes not saving?**
1. Check browser console for errors (F12)
2. Verify you're logged in to admin
3. Test the API endpoint directly with curl
4. Check terminal logs for backend errors

### 🚀 Production Deployment

1. Build the admin before deploying:
   ```bash
   npx medusa build
   ```

2. The widget will be included in the built admin at `.medusa/admin/`

3. Deploy as usual - no additional configuration needed
