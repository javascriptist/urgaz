import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

// POST /admin/pos/capture-payment
// Manually mark an order's payment as captured via metadata
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { order_id } = req.body as { order_id: string }

  if (!order_id) {
    return res.status(400).json({ message: "order_id is required" })
  }

  try {
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    // Get the current order
    const order = await orderModuleService.retrieveOrder(order_id)
    
    // Update metadata to indicate payment is captured
    await orderModuleService.updateOrders(order_id, {
      metadata: {
        ...order.metadata,
        payment_captured: true,
        payment_captured_at: new Date().toISOString(),
        payment_status_override: "paid", // Custom flag
      },
    })

    console.log("Payment marked as captured in metadata for order:", order_id)

    return res.json({
      success: true,
      message: "Payment marked as captured",
      order_id
    })
  } catch (e: any) {
    console.error("Error capturing payment:", e)
    return res.status(500).json({ 
      message: e.message, 
      error: e.toString() 
    })
  }
}
