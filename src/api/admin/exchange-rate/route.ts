import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getExchangeRate, setExchangeRate } from "../../../lib/exchange-rate"

export const AUTHENTICATE = true

// GET /admin/exchange-rate → { rate, updated_at, source }
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    return res.json(await getExchangeRate(req.scope))
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }
}

// POST /admin/exchange-rate { rate } → saves a manual rate
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const rate = Number((req.body as { rate?: number })?.rate)

  if (!(rate > 0)) {
    return res.status(400).json({ message: "Valid rate is required" })
  }

  try {
    const saved = await setExchangeRate(req.scope, Math.round(rate), "manual")
    return res.json({ success: true, ...saved })
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }
}
