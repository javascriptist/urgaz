import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getExchangeRate } from "../../../lib/exchange-rate"

// Public: the storefront shows prices in UZS with this rate
export const AUTHENTICATE = false

// GET /store/exchange-rate
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { rate, updated_at } = await getExchangeRate(req.scope)
    return res.json({
      rate,
      currency_from: "USD",
      currency_to: "UZS",
      updated_at: updated_at ?? new Date().toISOString(),
    })
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }
}
