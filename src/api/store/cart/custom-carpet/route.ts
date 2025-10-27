import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

// Create a custom cart line item for roll carpets with custom dimensions
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { 
      cartId, 
      productId, 
      length, 
      quantity = 1,
      customerNote 
    } = req.body as {
      cartId: string;
      productId: string;
      length: number;
      quantity?: number;
      customerNote?: string;
    };

    if (!cartId || !productId || !length) {
      return res.status(400).json({
        error: "Missing required fields: cartId, productId, length"
      });
    }

    // Simple calculation: get product price per meter
    const productPrice = 45.00; // In real app: fetch from product data
    const totalPrice = productPrice * length;

    // Create custom line item metadata
    const lineItemMetadata = {
      carpet_type: "roll_custom",
      custom_length: length,
      customer_specifications: customerNote || "",
    };

    // Mock response for now
    const lineItem = {
      id: `li_custom_${Date.now()}`,
      title: `Custom Roll Carpet - ${length}m Length`,
      quantity: quantity,
      unit_price: totalPrice,
      total: totalPrice * quantity,
      metadata: lineItemMetadata,
      variant: {
        id: `${productId}-${length}m-${Date.now()}`,
        title: `Custom Carpet - ${length}m`,
        sku: `${productId}-${length}m`,
        product_id: productId
      }
    };

    return res.json({
      success: true,
      line_item: lineItem,
      cart_id: cartId,
      calculation: {
        price_per_meter: productPrice,
        length: length,
        total: totalPrice
      },
      message: `Added custom ${length}m carpet to cart`
    });

  } catch (error) {
    console.error("Add custom carpet to cart error:", error);
    return res.status(500).json({
      error: "Failed to add custom carpet to cart"
    });
  }
}

// Helper function to calculate carpet price (reused from calculator)
async function calculateCarpetPrice(productId: string, length: number, width: string) {
    // Mock product data (same as calculator endpoint)
    const mockProduct = {
      price: 45.00, // Main product price per meter
      metadata: {
        carpet_type: "roll",
        available_widths: ["2m", "3m", "4m", "5m"],
        width_prices: {
          "2m": 35.00,
          "3m": 45.00,
          "4m": 55.00,
          "5m": 65.00
        },
        min_length: 1,
        max_length: 50,
        cutting_fee: 10.00,
        preparation_time_days: 3
      }
    };  const pricePerMeter = mockProduct.metadata.width_prices[width] || mockProduct.price;
  const cuttingFee = mockProduct.metadata.cutting_fee || 0;
  const basePrice = pricePerMeter * length;
  const totalPrice = basePrice + cuttingFee;

  return {
    success: true,
    data: {
      title: `${width} × ${length}m - Custom Cut`,
      sku: `${productId}-${width.replace('m', '')}-${length}m-${Date.now()}`,
      custom_specifications: {
        width: width,
        length: length,
        total_area: parseFloat(width.replace('m', '')) * length,
        carpet_type: "roll_custom"
      },
      pricing: {
        price_per_meter: pricePerMeter,
        cutting_fee: cuttingFee,
        base_price: basePrice,
        total_price: totalPrice,
        currency: "USD"
      },
      preparation_info: {
        preparation_time_days: mockProduct.metadata.preparation_time_days || 3,
        special_handling: length > 20 ? "Large carpet - special delivery required" : null
      }
    },
    calculation: {
      formula: `(${pricePerMeter} × ${length}m) + ${cuttingFee} cutting fee = $${totalPrice.toFixed(2)}`,
      breakdown: {
        base_calculation: `$${pricePerMeter}/m × ${length}m = $${basePrice.toFixed(2)}`,
        cutting_fee: `$${cuttingFee.toFixed(2)}`,
        total: `$${totalPrice.toFixed(2)}`
      }
    }
  };
}