import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingCart } from "@medusajs/icons"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Card,
  IconButton,
  OrdersTable,
  Rate,
  Segmented,
  Skeleton,
  StoreOrder,
  StoreShell,
  useApi,
  uzs,
} from "../../lib/store-ui"

type View = "all" | "online" | "in_store" | "unpaid"
type ListResponse = {
  orders: StoreOrder[]
  count: number
  counts: Record<View, number>
  limit: number
  offset: number
  rate: Rate
}

const PAGE = 25

/**
 * Every order in one place — online and in-store — with the filters staff
 * actually use (channel, unpaid) and search by number, name, email or phone.
 * State lives in the URL so a filtered view can be shared or bookmarked.
 */
const SalesPage = () => {
  const [params, setParams] = useSearchParams()
  const view = (params.get("view") as View) || "all"
  const page = Math.max(0, Number(params.get("page") ?? 0))
  const [q, setQ] = useState(params.get("q") ?? "")

  // Debounced search → URL
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(params)
      q ? next.set("q", q) : next.delete("q")
      next.delete("page")
      if (next.toString() !== params.toString()) setParams(next, { replace: true })
    }, 250)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const url = useMemo(() => {
    const s = new URLSearchParams({ view, limit: String(PAGE), offset: String(page * PAGE) })
    const query = params.get("q")
    if (query) s.set("q", query)
    return `/admin/store-orders?${s}`
  }, [view, page, params])

  const { data, loading, error, reload } = useApi<ListResponse>(url)

  const setView = (v: View) => {
    const next = new URLSearchParams(params)
    v === "all" ? next.delete("view") : next.set("view", v)
    next.delete("page")
    setParams(next)
  }
  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    p ? next.set("page", String(p)) : next.delete("page")
    setParams(next)
  }

  const pageTotal = data?.orders.reduce((a, o) => a + (o.state !== "canceled" ? o.total_uzs : 0), 0) ?? 0
  const pages = data ? Math.max(1, Math.ceil(data.count / PAGE)) : 1

  return (
    <StoreShell>
      <Card
        title="Sales"
        right={
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E96]" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order #, name, phone…"
              aria-label="Search orders"
              className="h-9 w-48 rounded-full bg-[#222226] pl-9 pr-3 text-[13px] text-white outline-none placeholder:text-[#6B6B73] focus:ring-2 focus:ring-[#2F7BF6] md:w-64"
            />
          </div>
        }
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "all", label: "All", count: data?.counts.all },
              { value: "online", label: "Online", count: data?.counts.online },
              { value: "in_store", label: "In-store", count: data?.counts.in_store },
              { value: "unpaid", label: "Unpaid", count: data?.counts.unpaid },
            ]}
          />
          {data && (
            <p className="text-[13px] text-[#8E8E96]">
              {data.count} orders · <span className="tabular-nums text-white">{uzs(pageTotal)}</span> on this page
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-[#F472B6]/30 bg-[#F472B6]/10 px-4 py-3 text-[14px] text-[#F9A8D4]">
            Couldn't load orders: {error}
          </div>
        )}

        {!data && loading ? (
          <Skeleton className="h-96" />
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <OrdersTable
              orders={data?.orders ?? []}
              onChanged={reload}
              emptyText={params.get("q") ? "No orders match your search" : view === "unpaid" ? "Nothing awaiting payment 🎉" : "No orders yet"}
            />
          </div>
        )}

        {data && pages > 1 && (
          <div className="mt-5 flex items-center justify-end gap-2 text-[13px] text-[#8E8E96]">
            <span className="mr-2 tabular-nums">
              {page + 1} / {pages}
            </span>
            <IconButton label="Previous page" onClick={() => setPage(page - 1)} disabled={page === 0}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
            </IconButton>
            <IconButton label="Next page" onClick={() => setPage(page + 1)} disabled={page + 1 >= pages}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
            </IconButton>
          </div>
        )}
      </Card>
    </StoreShell>
  )
}

export const config = defineRouteConfig({
  label: "Sales",
  icon: ShoppingCart,
})

export default SalesPage
