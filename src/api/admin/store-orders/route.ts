import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getExchangeRate } from "../../../lib/exchange-rate"
import { loadOrders, normalizeOrder } from "../../../lib/store-orders"

export const AUTHENTICATE = true

/**
 * GET /admin/store-orders?view=all|online|in_store|unpaid&q=&limit=&offset=
 * One list for online and in-store orders, with UZS totals and a simple
 * paid / unpaid / canceled state. Search matches order number, name,
 * email or phone.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const view = String(req.query.view ?? "all")
  const q = String(req.query.q ?? "").trim().toLowerCase().replace(/^#/, "")
  const limit = Math.min(100, parseInt(String(req.query.limit ?? "25"), 10) || 25)
  const offset = parseInt(String(req.query.offset ?? "0"), 10) || 0

  try {
    const rate = await getExchangeRate(req.scope)
    const all = (await loadOrders(req.scope)).map((o) => normalizeOrder(o, rate.rate))

    const counts = {
      all: all.length,
      online: all.filter((o) => o.channel === "online").length,
      in_store: all.filter((o) => o.channel === "in_store").length,
      unpaid: all.filter((o) => o.state === "unpaid").length,
    }

    let list = all
    if (view === "online" || view === "in_store") list = list.filter((o) => o.channel === view)
    if (view === "unpaid") list = list.filter((o) => o.state === "unpaid")
    if (q) {
      list = list.filter((o) =>
        [String(o.display_id), o.customer, o.email, o.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
    }

    return res.json({
      orders: list.slice(offset, offset + limit),
      count: list.length,
      counts,
      limit,
      offset,
      rate,
    })
  } catch (e: any) {
    console.error("[store-orders] list failed:", e)
    return res.status(500).json({ message: e.message })
  }
}
