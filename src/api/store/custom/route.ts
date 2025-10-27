import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { paymeRpc, uzsToTiyin, isPaymeEnabled, getPaymeReceiptExtraParams } from "../../../lib/payme";

// GET health
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ status: "ok", paymeEnabled: isPaymeEnabled() })
}

// POST create payment order
// body: { amount: number (UZS), orderId: string, returnUrl?: string }
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { amount, orderId, returnUrl } = (req.body || {}) as {
    amount: number
    orderId: string
    returnUrl?: string
  }

  if (!amount || !orderId) {
    return res.status(400).json({ message: "amount and orderId are required" })
  }

  if (!isPaymeEnabled()) {
    return res.status(503).json({ message: "Payme is disabled" })
  }

  // According to Payme, account fields are echoed back in callbacks
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

  // Payme returns a receipt with _id to build a redirect URL like checkout.paycom.uz/<_id>
  // We pass back raw so the frontend can redirect accordingly.
  return res.json({ success: true, data: result, raw })
}

