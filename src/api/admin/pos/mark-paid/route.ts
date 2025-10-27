import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { markOrderPaidWorkflow } from "../../../../workflows/mark-order-paid"

export const AUTHENTICATE = true

// POST /admin/pos/mark-paid
// Mark a nasiya order as paid
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { order_id } = req.body as { order_id: string }

  if (!order_id) {
    return res.status(400).json({ message: "order_id is required" })
  }

  try {
    await markOrderPaidWorkflow(req.scope).run({
      input: { order_id }
    })

    console.log("Nasiya order marked as paid:", order_id)

    return res.json({
      message: "Order marked as paid successfully",
      order_id
    })
  } catch (e: any) {
    console.error("Error marking order as paid:", e)
    return res.status(500).json({ 
      message: e.message, 
      error: e.toString() 
    })
  }
}
