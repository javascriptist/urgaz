import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getExchangeRate } from "../../../../lib/exchange-rate"
import { loadOrders, normalizeOrder, StoreOrder } from "../../../../lib/store-orders"

export const AUTHENTICATE = true

// Shop works in Tashkent time (UTC+5, no DST)
const TZ_OFFSET_MS = 5 * 60 * 60 * 1000
const local = (d: string | Date) => new Date(new Date(d).getTime() + TZ_OFFSET_MS)
const dayKey = (d: Date) => d.toISOString().slice(0, 10)
const monthKey = (d: Date) => d.toISOString().slice(0, 7)

/**
 * GET /admin/dashboard/summary
 * Everything the dashboard shows, in one request (amounts in UZS):
 * - totals: this month, today, unpaid (sum + count), orders this month
 * - months: last 12 months revenue split online / in-store
 * - week: orders + revenue per day, Mon–Sun of the current week
 * - recent: latest 8 orders
 * - rate: current USD→UZS rate
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const rate = await getExchangeRate(req.scope)

    const now = local(new Date())
    const start12 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))
    const raw = await loadOrders(req.scope, { since: new Date(start12.getTime() - TZ_OFFSET_MS) })
    const orders: StoreOrder[] = raw.map((o) => normalizeOrder(o, rate.rate))
    const live = orders.filter((o) => o.state !== "canceled")
    const paid = live.filter((o) => o.state === "paid")

    // 12 month buckets
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(start12.getUTCFullYear(), start12.getUTCMonth() + i, 1))
      return { month: monthKey(d), online: 0, in_store: 0 }
    })
    const monthIndex = new Map(months.map((m, i) => [m.month, i]))
    for (const o of paid) {
      const i = monthIndex.get(monthKey(local(o.created_at)))
      if (i !== undefined) months[i][o.channel] += o.total_uzs
    }

    // Current week, Monday first
    const weekday = (now.getUTCDay() + 6) % 7
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - weekday))
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getTime() + i * 86400000)
      return { date: dayKey(d), orders: 0, revenue: 0, is_today: i === weekday }
    })
    const weekIndex = new Map(week.map((w, i) => [w.date, i]))
    for (const o of live) {
      const i = weekIndex.get(dayKey(local(o.created_at)))
      if (i !== undefined) {
        week[i].orders += 1
        if (o.state === "paid") week[i].revenue += o.total_uzs
      }
    }

    const thisMonth = monthKey(now)
    const today = dayKey(now)
    const lastMonth = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)))
    const sum = (list: StoreOrder[]) => list.reduce((a, o) => a + o.total_uzs, 0)
    const inMonth = (o: StoreOrder, key: string) => monthKey(local(o.created_at)) === key
    const unpaid = live.filter((o) => o.state === "unpaid")
    const monthOrders = live.filter((o) => inMonth(o, thisMonth))

    return res.json({
      rate,
      totals: {
        month_revenue: sum(paid.filter((o) => inMonth(o, thisMonth))),
        last_month_revenue: sum(paid.filter((o) => inMonth(o, lastMonth))),
        today_revenue: sum(paid.filter((o) => dayKey(local(o.created_at)) === today)),
        month_orders: monthOrders.length,
        average_order: monthOrders.length ? Math.round(sum(monthOrders) / monthOrders.length) : 0,
        unpaid_total: sum(unpaid),
        unpaid_count: unpaid.length,
      },
      months,
      week,
      recent: orders.slice(0, 8),
    })
  } catch (e: any) {
    console.error("[dashboard] summary failed:", e)
    return res.status(500).json({ message: e.message })
  }
}
