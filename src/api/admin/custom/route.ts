import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { paymeRpc, uzsToTiyin, isPaymeEnabled } from "../../../lib/payme";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ status: "ok", paymeEnabled: isPaymeEnabled() })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { amount, orderId } = (req.body || {}) as { amount: number; orderId: string }
  if (!amount || !orderId) {
    return res.status(400).json({ message: "amount and orderId are required" })
  }

  if (!isPaymeEnabled()) {
    return res.status(503).json({ message: "Payme is disabled" })
  }

  const { ok, result, error, raw } = await paymeRpc("receipt.create", {
    amount: uzsToTiyin(amount),
    account: { order_id: orderId },
  })

  if (!ok) {
    if ((error as any)?.message === "PAYME_AUTH_MISSING") {
      return res.status(503).json({ message: "Payme auth not configured" })
    }
    return res.status(502).json({ message: "Failed to create Payme receipt", error })
  }

  return res.json({ success: true, data: result, raw })
}
