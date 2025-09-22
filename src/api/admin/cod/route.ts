import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isCodEnabled } from "../../../lib/cod"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ status: "ok", codEnabled: isCodEnabled() })
}

// Mark COD order as paid after delivery (admin/staff action)
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { orderId, paid } = (req.body || {}) as { orderId?: string; paid?: boolean }

  if (!isCodEnabled()) {
    return res.status(503).json({ message: "Cash on delivery is disabled" })
  }

  if (!orderId) {
    return res.status(400).json({ message: "orderId is required" })
  }

  const isPaid = paid !== false

  // TODO: Update order/payment status in DB/Medusa modules.
  return res.json({
    success: true,
    method: "cod",
    orderId,
    paid: isPaid,
    processedAt: new Date().toISOString(),
  })
}