import { Modules } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"

/**
 * USD → UZS exchange rate, shared by the admin, the storefront API and the
 * Payme endpoints (they must all agree, or Payme amount checks fail).
 *
 * Stored in the default store's metadata so it survives deploys and
 * restarts (the old data/exchange-rate.json file was wiped on most hosts).
 * The JSON file is still read as a fallback so nothing changes until the
 * rate is saved once from the new admin.
 */

export const DEFAULT_RATE = 12750
const META_RATE = "usd_uzs_rate"
const META_UPDATED = "usd_uzs_rate_updated_at"
const META_SOURCE = "usd_uzs_rate_source"
const LEGACY_FILE = path.join(process.cwd(), "data", "exchange-rate.json")

export type ExchangeRate = {
  rate: number
  updated_at: string | null
  source: "manual" | "cbu" | "file" | "default"
}

type Container = { resolve: (key: string) => any }

const readLegacyFile = (): ExchangeRate | null => {
  try {
    if (fs.existsSync(LEGACY_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LEGACY_FILE, "utf-8"))
      const rate = Number(parsed.rate)
      if (rate > 0) {
        return { rate, updated_at: parsed.updated_at ?? null, source: "file" }
      }
    }
  } catch {
    // ignore — fall through to default
  }
  return null
}

const getStore = async (container: Container) => {
  const storeModule = container.resolve(Modules.STORE)
  const [store] = await storeModule.listStores({}, { take: 1, select: ["id", "metadata"] })
  return { storeModule, store }
}

export async function getExchangeRate(container: Container): Promise<ExchangeRate> {
  try {
    const { store } = await getStore(container)
    const rate = Number(store?.metadata?.[META_RATE])
    if (rate > 0) {
      return {
        rate,
        updated_at: (store!.metadata![META_UPDATED] as string) ?? null,
        source: ((store!.metadata![META_SOURCE] as ExchangeRate["source"]) ?? "manual"),
      }
    }
  } catch (e) {
    console.error("[exchange-rate] reading store metadata failed:", e)
  }
  return readLegacyFile() ?? { rate: DEFAULT_RATE, updated_at: null, source: "default" }
}

export async function setExchangeRate(
  container: Container,
  rate: number,
  source: "manual" | "cbu" = "manual"
): Promise<ExchangeRate> {
  if (!(rate > 0) || !Number.isFinite(rate)) {
    throw new Error("Rate must be a positive number")
  }
  const { storeModule, store } = await getStore(container)
  if (!store) {
    throw new Error("No store found")
  }
  const updated_at = new Date().toISOString()
  await storeModule.updateStores(store.id, {
    metadata: {
      ...(store.metadata ?? {}),
      [META_RATE]: rate,
      [META_UPDATED]: updated_at,
      [META_SOURCE]: source,
    },
  })
  return { rate, updated_at, source }
}

/** Official USD rate from the Central Bank of Uzbekistan. */
export async function fetchCbuRate(): Promise<number> {
  const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/")
  if (!res.ok) {
    throw new Error(`cbu.uz responded ${res.status}`)
  }
  const data = (await res.json()) as Array<{ Ccy: string; Rate: string }>
  const usd = Array.isArray(data) ? data.find((r) => r.Ccy === "USD") : undefined
  const rate = Number(usd?.Rate)
  if (!(rate > 0)) {
    throw new Error("cbu.uz returned no USD rate")
  }
  return Math.round(rate)
}

/** Amount Payme expects for an order: USD total → UZS → tiyin (one rounding, at the end). */
export const usdToTiyin = (usd: number, rate: number) => Math.round(usd * rate * 100)
