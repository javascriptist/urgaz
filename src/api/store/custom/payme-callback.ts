import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { paymeRpc, isPaymeEnabled } from "../../../lib/payme";

// Webhook endpoint for Payme callbacks
// Configure this URL in your Payme Business dashboard
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isPaymeEnabled()) {
    // Acknowledge to avoid repeated retries when feature is off
    return res.json({ result: { message: "ok" } })
  }
  const { method, params } = (req.body || {}) as any

  // Basic router by Payme's JSON-RPC method names
  switch (method) {
    case "receipt.pay": {
      // Payment success notification
      // params.account.order_id, params.amount, params.payment_id, etc.
      // TODO: mark your order as paid in DB
      return res.json({ result: { message: "ok" } })
    }
    case "receipt.cancel": {
      // Payment was canceled / reversed
      // TODO: mark your order as canceled in DB using params.account.order_id
      return res.json({ result: { message: "ok" } })
    }
    default: {
      // Unknown method
      return res.status(400).json({ error: { code: -32601, message: "Method not found" } })
    }
  }
}
