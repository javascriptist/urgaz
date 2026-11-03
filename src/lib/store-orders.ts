import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * One normalized view of an order for the admin dashboard and orders list,
 * whichever way it was sold (online checkout or in-store POS) and whichever
 * way it was paid (Payme webhook, POS cash/card, credit marked paid later).
 */

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

type Container = { resolve: (key: string) => any }

const ORDER_FIELDS = [
  "id",
  "display_id",
  "email",
  "created_at",
  "status",
  "payment_status",
  "currency_code",
  "total",
  "metadata",
  "customer.first_name",
  "customer.last_name",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.phone",
  "items.id",
  "items.quantity",
  "items.thumbnail",
  "items.metadata",
]

const isInStore = (o: any) =>
  o.metadata?.sale_type === "in-store" || String(o.email ?? "").endsWith("@store.local")

export const isPaid = (o: any) => {
  const m = o.metadata ?? {}
  return Boolean(
    m.payment_captured ||
      m.payment_status_override === "paid" ||
      (isInStore(o) && m.is_paid !== false) ||
      ["captured", "partially_captured", "partially_refunded"].includes(o.payment_status)
  )
}

export const toUzs = (amount: number, currency: string, rate: number) =>
  currency?.toLowerCase() === "usd" ? Math.round(amount * rate) : Math.round(amount)

export function normalizeOrder(o: any, rate: number): StoreOrder {
  const m = o.metadata ?? {}
  const inStore = isInStore(o)
  const name =
    [o.shipping_address?.first_name, o.shipping_address?.last_name].filter(Boolean).join(" ") ||
    [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" ") ||
    (inStore ? m.customer_name : "") ||
    o.email ||
    "—"
  const total = Number(o.total ?? 0)
  const items = o.items ?? []

  return {
    id: o.id,
    display_id: o.display_id,
    created_at: o.created_at,
    customer: name,
    email: inStore ? null : o.email ?? null,
    phone: o.shipping_address?.phone ?? null,
    channel: inStore ? "in_store" : "online",
    state: o.status === "canceled" ? "canceled" : isPaid(o) ? "paid" : "unpaid",
    payment_method: m.payment_method ?? (inStore ? "cash" : "payme"),
    // a cut-to-length roll is one item even though its quantity is metres
    items_count: items.reduce(
      (acc: number, i: any) => acc + (i.metadata?.carpet_type === "roll_custom" ? 1 : Number(i.quantity ?? 0)),
      0
    ),
    thumbnail: items.find((i: any) => i.thumbnail)?.thumbnail ?? null,
    currency_code: o.currency_code,
    total,
    total_uzs: toUzs(total, o.currency_code, rate),
  }
}

export async function loadOrders(
  container: Container,
  { since, take = 2000 }: { since?: Date; take?: number } = {}
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ORDER_FIELDS,
    filters: since ? { created_at: { $gte: since.toISOString() } } : {},
    pagination: { take, skip: 0, order: { created_at: "DESC" } },
  })
  return data as any[]
}
