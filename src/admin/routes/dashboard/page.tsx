import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RevenueChart, WeekBars } from "../../lib/charts"
import {
  Card,
  IconButton,
  OrdersTable,
  Rate,
  Segmented,
  Skeleton,
  StoreOrder,
  StoreShell,
  postJson,
  timeAgo,
  useApi,
  uzs,
} from "../../lib/store-ui"

type Summary = {
  rate: Rate
  totals: {
    month_revenue: number
    last_month_revenue: number
    today_revenue: number
    month_orders: number
    average_order: number
    unpaid_total: number
    unpaid_count: number
  }
  months: { month: string; online: number; in_store: number }[]
  week: { date: string; orders: number; revenue: number; is_today: boolean }[]
  recent: StoreOrder[]
}

/**
 * Store dashboard: revenue, a 12-month online vs in-store chart, this
 * week's orders, the exchange rate (edit or sync in place) and recent
 * orders with one-tap actions. One request feeds the whole page.
 */
const DashboardPage = () => {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApi<Summary>("/admin/dashboard/summary")
  const [range, setRange] = useState<"12m" | "6m">("12m")

  const t = data?.totals
  const change =
    t && t.last_month_revenue > 0
      ? Math.round(((t.month_revenue - t.last_month_revenue) / t.last_month_revenue) * 100)
      : null
  const months = data ? (range === "6m" ? data.months.slice(-6) : data.months) : []
  const weekTotal = data?.week.reduce((a, d) => a + d.orders, 0) ?? 0

  return (
    <StoreShell
      actions={
        <IconButton label="Refresh" onClick={reload} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""} aria-hidden>
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" />
          </svg>
        </IconButton>
      }
    >
      {error && (
        <div className="mb-3 rounded-2xl border border-[#F472B6]/30 bg-[#F472B6]/10 px-4 py-3 text-[14px] text-[#F9A8D4]">
          Couldn't load the dashboard: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-[1fr_1.6fr_1fr]">
        {/* Revenue */}
        <Card title="Revenue">
          {!t ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-[#22C55E] px-2.5 py-0.5 text-[12px] font-medium text-black">This month</span>
                {change !== null && (
                  <span className={`text-[13px] tabular-nums ${change >= 0 ? "text-[#4ADE80]" : "text-[#F9A8D4]"}`}>
                    {change >= 0 ? "+" : ""}
                    {change}% vs last month
                  </span>
                )}
              </div>
              <p className="text-[clamp(2rem,3.4vw,3.25rem)] font-medium leading-none tracking-[-0.03em] tabular-nums">
                {uzs(t.month_revenue).replace(" so'm", "")}
                <span className="ml-2 text-[0.4em] font-normal text-[#8E8E96]">so'm</span>
              </p>
              <dl className="mt-auto space-y-2 pt-8 text-[15px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8E8E96]">Today</dt>
                  <dd className="tabular-nums">{uzs(t.today_revenue)}</dd>
                </div>
                <button
                  onClick={() => navigate("/sales?view=unpaid")}
                  className="flex w-full justify-between gap-4 text-left hover:opacity-80"
                >
                  <dt className="text-[#8E8E96]">
                    Awaiting payment <span className="tabular-nums text-[#F5A524]">· {t.unpaid_count}</span>
                  </dt>
                  <dd className="tabular-nums">{uzs(t.unpaid_total)}</dd>
                </button>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8E8E96]">Average order</dt>
                  <dd className="tabular-nums">{uzs(t.average_order)}</dd>
                </div>
              </dl>
            </div>
          )}
        </Card>

        {/* Statistics */}
        <Card
          title="Sales"
          right={
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: "6m", label: "6 months" },
                { value: "12m", label: "12 months" },
              ]}
            />
          }
        >
          {!data ? (
            <Skeleton className="h-64" />
          ) : (
            <>
              <div className="mb-2 flex gap-4 text-[13px] text-[#8E8E96]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3B82F6]" /> Online
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#F472B6]" /> In-store
                </span>
              </div>
              <RevenueChart months={months} />
            </>
          )}
        </Card>

        {/* This week */}
        <Card title="This week">
          {!data ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="flex flex-1 flex-col">
              <WeekBars week={data.week} />
              <div className="mt-6 flex items-center gap-5 border-t border-white/[0.06] pt-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[32px] font-medium leading-none tabular-nums">{weekTotal}</span>
                  <span className="text-[13px] leading-tight text-[#8E8E96]">orders</span>
                </div>
                <span className="h-8 w-px bg-white/10" />
                <div className="flex items-baseline gap-2">
                  <span className="text-[32px] font-medium leading-none tabular-nums">{t?.month_orders ?? 0}</span>
                  <span className="text-[13px] leading-tight text-[#8E8E96]">this month</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Exchange rate */}
        <RateCard rate={data?.rate ?? null} onSaved={reload} />

        {/* Recent orders */}
        <Card
          title="Recent orders"
          className="xl:col-span-2"
          right={
            <button
              onClick={() => navigate("/sales")}
              className="h-9 rounded-full bg-[#222226] px-4 text-[13px] text-[#E4E4E7] hover:bg-[#2B2B30]"
            >
              View all
            </button>
          }
        >
          {!data ? <Skeleton className="h-64" /> : <OrdersTable orders={data.recent} onChanged={reload} />}
        </Card>
      </div>
    </StoreShell>
  )
}

/** The rate the whole shop uses. Type + Enter to save, or one tap to pull the Central Bank rate. */
function RateCard({ rate, onSaved }: { rate: Rate | null; onSaved: () => void }) {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState<"save" | "sync" | null>(null)

  useEffect(() => {
    if (rate) setValue(String(rate.rate))
  }, [rate?.rate])

  const stale = rate?.updated_at ? Date.now() - new Date(rate.updated_at).getTime() > 36 * 3600 * 1000 : true
  const dirty = rate !== null && Number(value) !== rate.rate && Number(value) > 0

  const save = async () => {
    if (!dirty) return
    setBusy("save")
    try {
      await postJson("/admin/exchange-rate", { rate: Number(value) })
      toast.success("Exchange rate saved")
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  const sync = async () => {
    setBusy("sync")
    try {
      const r = await postJson<Rate>("/admin/exchange-rate/sync")
      setValue(String(r.rate))
      toast.success(`Central Bank rate: ${r.rate.toLocaleString("en-US")} so'm`)
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card title="Exchange rate" className="xl:self-start">
      <div className="flex flex-col rounded-[20px] bg-black p-5">
        <p className="text-[15px] text-[#8E8E96]">1 USD =</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
          className="mt-1 flex items-baseline gap-2"
        >
          <label htmlFor="rate" className="sr-only">
            UZS per USD
          </label>
          <input
            id="rate"
            inputMode="numeric"
            value={value ? Number(value).toLocaleString("en-US") : ""}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
            className="w-full min-w-0 bg-transparent text-[40px] font-medium leading-none tracking-[-0.03em] tabular-nums text-white outline-none"
          />
          <span className="text-[15px] text-[#8E8E96]">so'm</span>
        </form>
        <p className="mt-3 text-[13px] text-[#8E8E96]">
          {rate ? (
            <>
              {rate.source === "cbu" ? "Central Bank" : rate.source === "manual" ? "Set manually" : "Default"} ·{" "}
              <span className={stale ? "text-[#F5A524]" : ""}>updated {timeAgo(rate.updated_at)}</span>
            </>
          ) : (
            "Loading…"
          )}
        </p>
        <div className="mt-auto flex gap-2 pt-6">
          <button
            onClick={sync}
            disabled={busy !== null}
            className="h-10 flex-1 rounded-full bg-[#222226] text-[14px] text-white hover:bg-[#2B2B30] disabled:opacity-50"
          >
            {busy === "sync" ? "Syncing…" : "Use CBU rate"}
          </button>
          <button
            onClick={save}
            disabled={!dirty || busy !== null}
            className="h-10 flex-1 rounded-full bg-[#2F7BF6] text-[14px] font-medium text-white hover:bg-[#2563EB] disabled:bg-[#222226] disabled:text-[#6B6B73]"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-[#6B6B73]">
        Used for shop prices and Payme amounts. Changing it updates the storefront within the hour.
      </p>
    </Card>
  )
}

export const config = defineRouteConfig({
  label: "Dashboard",
  icon: ChartBar,
})

export default DashboardPage
