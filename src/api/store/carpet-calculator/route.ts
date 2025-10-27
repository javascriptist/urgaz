import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

// Calculate carpet price for roll carpets (width fixed, length customizable)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { productId, length, width } = req.body as {
      productId: string;
      length: number;
      width?: string;
    };

    if (!productId || !length || length <= 0) {
      return res.status(400).json({
        error: "Missing required fields: productId and length (must be > 0)"
      });
    }

    // Get product details (in real implementation, fetch from database)
    // For now, we'll use mock data structure
    const mockProduct = {
      id: productId,
      price: 45.00, // Main product price per meter
      metadata: {
        carpet_type: "roll", // "roll" | "fixed" | "custom"
        min_length: 1,
        max_length: 50,
      }
    };

    // Validate length constraints
    const minLength = mockProduct.metadata.min_length || 1;
    const maxLength = mockProduct.metadata.max_length || 50;
    
    if (length < minLength || length > maxLength) {
      return res.status(400).json({
        error: `Length must be between ${minLength}m and ${maxLength}m`
      });
    }

    // Simple calculation: product price × length
    const pricePerMeter = mockProduct.price || 0;
    const totalPrice = pricePerMeter * length;

    // Generate custom variant data
    const variantData = {
      title: `Custom Carpet - ${length}m Length`,
      sku: `${productId}-${length}m-${Date.now()}`,
      custom_specifications: {
        length: length,
        carpet_type: "roll_custom"
      },
      pricing: {
        price_per_meter: pricePerMeter,
        total_price: totalPrice,
        currency: "USD"
      }
    };

    return res.json({
      success: true,
      data: variantData,
      calculation: {
        formula: `$${pricePerMeter} × ${length}m = $${totalPrice.toFixed(2)}`,
        breakdown: {
          price_per_meter: `$${pricePerMeter}/m`,
          length: `${length}m`,
          total: `$${totalPrice.toFixed(2)}`
        }
      }
    });

  } catch (error) {
    console.error("Carpet calculator error:", error);
    return res.status(500).json({
      error: "Internal server error during carpet calculation"
    });
  }
}

// Get carpet configuration for a product
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { productId } = req.query as { productId?: string };

    if (!productId) {
      return res.status(400).json({
        error: "Missing productId parameter"
      });
    }

    // Mock carpet configuration (in real app, fetch from product metadata)
    const carpetConfig = {
      productId,
      carpet_type: "roll",
      available_widths: [
        { value: "2m", label: "2 meters", price_per_meter: 35.00 },
        { value: "3m", label: "3 meters", price_per_meter: 45.00 },
        { value: "4m", label: "4 meters", price_per_meter: 55.00 },
        { value: "5m", label: "5 meters", price_per_meter: 65.00 }
      ],
      length_constraints: {
        min: 1,
        max: 50,
        step: 0.1,
        unit: "meters"
      },
      pricing: {
        cutting_fee: 10.00,
        currency: "USD",
        preparation_time_days: 3
      },
      display: {
        show_area_calculation: true,
        show_preparation_time: true,
        show_price_breakdown: true
      }
    };

    return res.json({
      success: true,
      config: carpetConfig
    });

  } catch (error) {
    console.error("Get carpet config error:", error);
    return res.status(500).json({
      error: "Internal server error fetching carpet configuration"
    });
  }
}