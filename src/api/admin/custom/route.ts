import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { paymeRpc, uzsToTiyin, isPaymeEnabled, getPaymeReceiptExtraParams } from "../../../lib/payme";

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

  const extra = getPaymeReceiptExtraParams()
  const params = {
    amount: uzsToTiyin(amount),
    account: {
      order_id: orderId,
      ...(typeof extra.account === "object" ? extra.account : {}),
    },
    ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== "account")),
  }

  const { ok, result, error, raw } = await paymeRpc("receipts.create", params)

  if (!ok) {
    if ((error as any)?.message === "PAYME_AUTH_MISSING") {
      return res.status(503).json({ message: "Payme auth not configured" })
    }
    return res.status(502).json({ message: "Failed to create Payme receipt", error })
  }

  return res.json({ success: true, data: result, raw })
}
