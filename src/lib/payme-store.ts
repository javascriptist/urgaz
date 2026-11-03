import { timingSafeEqual } from "crypto"
import { PAYME_MODULE } from "../modules/payme"

/**
 * Database-backed storage for the Payme Merchant API (replaces the
 * in-memory Maps that lost every transaction on restart/deploy).
 */

type Container = { resolve: (key: string) => any }

const service = (container: Container) => container.resolve(PAYME_MODULE)

export type PaymeTx = {
  id: string
  order_key: string
  order_id: string | null
  amount: number
  state: number
  create_time: Date | string
  perform_time: Date | string | null
  cancel_time: Date | string | null
  reason: number | null
}

const ms = (d: Date | string | null | undefined) => (d ? new Date(d).getTime() : 0)

/** Shape Payme expects in responses. */
export const toPayme = (tx: PaymeTx) => ({
  transaction: tx.id,
  state: tx.state,
  create_time: ms(tx.create_time),
  perform_time: ms(tx.perform_time),
  cancel_time: ms(tx.cancel_time),
  reason: tx.reason ?? null,
  receivers: null,
})

export async function findTransaction(container: Container, id: string): Promise<PaymeTx | null> {
  const [tx] = await service(container).listPaymeTransactions({ id }, { take: 1 })
  return tx ?? null
}

/** A created-but-not-performed transaction for this order, other than `exceptId`. */
export async function findPendingForOrder(container: Container, orderKey: string, exceptId?: string) {
  const list: PaymeTx[] = await service(container).listPaymeTransactions({ order_key: orderKey, state: 1 })
  return list.find((t) => t.id !== exceptId) ?? null
}

export async function createTransaction(
  container: Container,
  data: { id: string; order_key: string; order_id: string | null; amount: number; create_time: number }
): Promise<PaymeTx> {
  return service(container).createPaymeTransactions({
    ...data,
    state: 1,
    create_time: new Date(data.create_time),
  })
}

export async function updateTransaction(container: Container, id: string, data: Partial<PaymeTx>): Promise<PaymeTx> {
  return service(container).updatePaymeTransactions({ id, ...data })
}

export async function statement(container: Container, from: number, to: number) {
  const list: PaymeTx[] = await service(container).listPaymeTransactions(
    { create_time: { $gte: new Date(from), $lte: new Date(to) } },
    { order: { create_time: "ASC" } }
  )
  return list.map((tx) => ({
    id: tx.id,
    time: ms(tx.create_time),
    amount: Number(tx.amount),
    account: { order_id: tx.order_key },
    ...toPayme(tx),
  }))
}

// ---------- merchant key ----------

const KEY_ID = "merchant_key"

/** Keys accepted for Basic auth: the key set via ChangePassword (if any), else PAYME_PASSWORD; plus an optional sandbox key. */
export async function acceptedKeys(container: Container): Promise<string[]> {
  let stored: string | null = null
  try {
    const [row] = await service(container).listPaymeSettings({ id: KEY_ID }, { take: 1 })
    stored = row?.value ?? null
  } catch (e) {
    console.error("[payme] reading stored key failed:", e)
  }
  return [stored || process.env.PAYME_PASSWORD || "", process.env.PAYME_TEST_PASSWORD || ""].filter(Boolean)
}

export async function saveKey(container: Container, value: string) {
  const svc = service(container)
  const [row] = await svc.listPaymeSettings({ id: KEY_ID }, { take: 1 })
  if (row) {
    await svc.updatePaymeSettings({ id: KEY_ID, value })
  } else {
    await svc.createPaymeSettings({ id: KEY_ID, value })
  }
}

/** Constant-time string comparison. */
export const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
