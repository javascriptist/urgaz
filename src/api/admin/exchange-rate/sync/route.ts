import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { fetchCbuRate, setExchangeRate } from "../../../../lib/exchange-rate"

export const AUTHENTICATE = true

// POST /admin/exchange-rate/sync → fetches the Central Bank (cbu.uz) USD rate server-side and saves it
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const rate = await fetchCbuRate()
    const saved = await setExchangeRate(req.scope, rate, "cbu")
    return res.json({ success: true, ...saved })
  } catch (e: any) {
    return res.status(502).json({ message: `Couldn't fetch the CBU rate: ${e.message}` })
  }
}
