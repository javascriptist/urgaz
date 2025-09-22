import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isCodEnabled } from "../../../lib/cod"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ status: "ok", codEnabled: isCodEnabled() })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { amount, orderId } = (req.body || {}) as { amount?: number; orderId?: string }

  if (!isCodEnabled()) {
    return res.status(503).json({ message: "Cash on delivery is disabled" })
  }

  if (!amount || !orderId) {
    return res.status(400).json({ message: "amount and orderId are required" })
  }

  // No external call; acknowledge COD selection (persist in your DB if needed).
  return res.json({
    success: true,
    method: "cod",
    status: "pending",
    orderId,
    amount,
    instructions: "Pay cash or card to the courier upon delivery.",
  })
}