import { toast } from "@medusajs/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

/**
 * Shared building blocks for the dark "store" admin pages (Dashboard, Sales).
 * Dark card surfaces, soft dividers, one accent blue, status pills with a dot.
 */

// ---------- data ----------

export type Channel = "online" | "in_store"
export type PayState = "paid" | "unpaid" | "canceled"

export type StoreOrder = {
  id: string
  display_id: number
  created_at: string
  customer: string
  email: string | null
  phone: string | null
  channel: Channel
  state: PayState
  payment_method: string | null
  items_count: number
  thumbnail: string | null
  currency_code: string
  total: number
  total_uzs: number
}

export type Rate = { rate: number; updated_at: string | null; source: string }

/** GET helper with loading / error / reload, and same-origin admin session. */
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url, { credentials: "include" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`)
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}

export async function postJson<T = any>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`)
  return json
}

// ---------- formatting ----------

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
export const uzs = (n: number) => `${nf.format(Math.round(n))} so'm`
export const compactUzs = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`
  if (abs >= 1e3) return `${Math.round(n / 1e3)}K`
  return nf.format(n)
}
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
export const timeAgo = (iso: string | null) => {
  if (!iso) return "never"
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d < 7 ? `${d} d ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

// ---------- layout ----------

/** Full-height dark surface with the store's own top tabs. */
export function StoreShell({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tabs = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/sales", label: "Sales" },
    { to: "/products-inventory", label: "Inventory" },
  ]

  return (
    <div className="-m-2 min-h-[calc(100vh-1rem)] rounded-[28px] bg-[#0B0B0D] p-3 text-white antialiased md:p-4">
      <header className="mb-3 flex flex-wrap items-center gap-3 rounded-[24px] bg-[#17171A] px-4 py-3 md:mb-4 md:px-5">
        <div className="mr-auto flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2F7BF6] text-[15px] font-semibold">P</span>
          <span className="text-[17px] font-medium tracking-[-0.01em]">Premium Carpet</span>
        </div>
        <nav className="order-3 flex w-full gap-1 overflow-x-auto rounded-full bg-[#0F0F12] p-1 md:order-none md:w-auto">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.to)
            return (
              <button
                key={t.to}
                onClick={() => navigate(t.to)}
                className={`h-9 shrink-0 rounded-full px-5 text-[14px] transition-colors ${
                  active ? "bg-[#26262B] text-white" : "text-[#8E8E96] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </nav>
        <div className="flex items-center gap-2">{actions}</div>
      </header>
      {children}
    </div>
  )
}

export function Card({
  title,
  right,
  children,
  className = "",
}: {
  title?: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`flex flex-col rounded-[24px] bg-[#17171A] p-5 md:p-6 ${className}`}>
      {(title || right) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="text-[19px] font-medium tracking-[-0.01em] text-white">{title}</h2>}
          {right && <div className="flex items-center gap-2">{right}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full bg-[#0F0F12] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors ${
            value === o.value ? "bg-[#26262B] text-white" : "text-[#8E8E96] hover:text-white"
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="tabular-nums text-[#6B6B73]">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export const IconButton = ({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    className="grid h-9 w-9 place-items-center rounded-full bg-[#222226] text-[#C9C9CF] transition-colors hover:bg-[#2B2B30] hover:text-white disabled:opacity-40 active:scale-[0.96]"
  >
    {children}
  </button>
)

// ---------- order bits ----------

export function StatePill({ state }: { state: PayState }) {
  const map = {
    paid: { label: "Paid", dot: "bg-[#22C55E]" },
    unpaid: { label: "Unpaid", dot: "bg-[#F5A524]" },
    canceled: { label: "Canceled", dot: "bg-[#F472B6]" },
  }[state]
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 px-2.5 text-[13px] text-[#E4E4E7]">
      <span className={`h-1.5 w-1.5 rounded-full ${map.dot}`} />
      {map.label}
    </span>
  )
}

export function OrderAvatar({ order }: { order: StoreOrder }) {
  if (order.thumbnail) {
    return <img src={order.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
  }
  const initials = order.customer
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#222226] text-[13px] font-medium text-[#C9C9CF]">
      {initials || "#"}
    </span>
  )
}

/** The "•••" menu: open, copy Payme link (online + unpaid), mark as paid (unpaid). */
export function OrderActions({ order, onChanged }: { order: StoreOrder; onChanged?: () => void }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pos, setPos] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Fixed positioning so the menu is never clipped by the scrolling table;
  // opens upward when there isn't room below.
  const toggle = () => {
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect()
      const below = window.innerHeight - r.bottom > 180
      setPos({
        position: "fixed",
        right: window.innerWidth - r.right,
        ...(below ? { top: r.bottom + 6 } : { bottom: window.innerHeight - r.top + 6 }),
      })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const dismiss = () => setOpen(false)
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", esc)
    window.addEventListener("scroll", dismiss, true)
    window.addEventListener("resize", dismiss)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", esc)
      window.removeEventListener("scroll", dismiss, true)
      window.removeEventListener("resize", dismiss)
    }
  }, [open])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const copyLink = () =>
    run(async () => {
      const { paymentUrl } = await postJson<{ paymentUrl: string }>("/admin/payme-generate-link", { orderId: order.id })
      await navigator.clipboard.writeText(paymentUrl)
      toast.success(`Payme link for #${order.display_id} copied`)
    })

  const markPaid = () =>
    run(async () => {
      await postJson(`/admin/store-orders/${order.id}/mark-paid`)
      toast.success(`#${order.display_id} marked as paid`)
      onChanged?.()
    })

  const item = "flex w-full items-center rounded-xl px-3 py-2 text-left text-[14px] text-[#E4E4E7] hover:bg-white/5 disabled:opacity-40"

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={`Actions for order #${order.display_id}`}
        aria-expanded={open}
        ref={buttonRef}
        onClick={toggle}
        className="grid h-9 w-9 place-items-center rounded-full text-[#8E8E96] hover:bg-white/5 hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          style={pos}
          className="z-50 w-52 rounded-2xl border border-white/10 bg-[#1F1F23] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        >
          <button className={item} onClick={() => navigate(`/orders/${order.id}`)}>
            Open order
          </button>
          {order.state === "unpaid" && order.channel === "online" && (
            <button className={item} onClick={copyLink} disabled={busy}>
              Copy Payme link
            </button>
          )}
          {order.state === "unpaid" && (
            <button className={item} onClick={markPaid} disabled={busy}>
              Mark as paid
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Shared table of orders (dashboard "Recent orders" and the Sales page). */
export function OrdersTable({
  orders,
  onChanged,
  emptyText = "No orders yet",
}: {
  orders: StoreOrder[]
  onChanged?: () => void
  emptyText?: string
}) {
  const navigate = useNavigate()

  if (!orders.length) {
    return (
      <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-white/10 text-[14px] text-[#8E8E96]">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[14px]">
        <thead>
          <tr className="text-left text-[12px] text-[#8E8E96]">
            <th className="px-2 pb-3 font-normal">Customer</th>
            <th className="px-2 pb-3 font-normal">Date</th>
            <th className="px-2 pb-3 font-normal">Status</th>
            <th className="px-2 pb-3 font-normal">Channel</th>
            <th className="px-2 pb-3 text-right font-normal">Amount</th>
            <th className="w-12 pb-3" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              onClick={() => navigate(`/orders/${o.id}`)}
              className="cursor-pointer transition-colors hover:bg-white/[0.03] [&>td]:border-t [&>td]:border-white/[0.06]"
            >
              <td className="px-2 py-3.5">
                <div className="flex items-center gap-3">
                  <OrderAvatar order={o} />
                  <div className="min-w-0">
                    <p className="truncate text-white">{o.customer}</p>
                    <p className="text-[12px] tabular-nums text-[#8E8E96]">
                      #{o.display_id} · {o.items_count} {o.items_count === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-2 py-3.5 tabular-nums text-[#E4E4E7]">{shortDate(o.created_at)}</td>
              <td className="px-2 py-3.5">
                <StatePill state={o.state} />
              </td>
              <td className="px-2 py-3.5 text-[#E4E4E7]">
                {o.channel === "online" ? "Online" : "In-store"}
                {o.payment_method && <span className="text-[#6B6B73]"> · {o.payment_method}</span>}
              </td>
              <td className="whitespace-nowrap px-2 py-3.5 text-right tabular-nums text-white">{uzs(o.total_uzs)}</td>
              <td className="py-3.5 pr-1 text-right">
                <OrderActions order={o} onChanged={onChanged} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-white/[0.04] ${className}`} />
)
