// Lightweight Payme (Paycom) JSON-RPC helper using global fetch
// Uses env vars:
// - PAYME_API_URL (default: https://checkout.test.paycom.uz/api)
// - PAYME_AUTH (value sent as X-Auth)

type RpcResult<T = any> = {
  ok: boolean
  result?: T
  error?: any
  raw?: any
}

export const isTruthy = (v?: string) => {
  if (!v) return false
  const s = String(v).trim().toLowerCase()
  return s === "1" || s === "true" || s === "yes" || s === "on"
}

export function isPaymeEnabled() {
  return isTruthy(process.env.PAYME_ENABLED)
}

export async function paymeRpc<T = any>(method: string, params: any): Promise<RpcResult<T>> {
  const url = process.env.PAYME_API_URL || "https://checkout.test.paycom.uz/api"
  const auth = process.env.PAYME_AUTH || ""

  if (!isPaymeEnabled()) {
    return { ok: false, error: new Error("PAYME_DISABLED"), raw: null }
  }
  if (!auth) {
    return { ok: false, error: new Error("PAYME_AUTH_MISSING"), raw: null }
  }

  const g: any = globalThis as any
  const fetchFn: (input: any, init?: any) => Promise<any> = g.fetch
  if (!fetchFn) {
    return { ok: false, error: new Error("Global fetch is not available in this runtime."), raw: null }
  }

  const body = JSON.stringify({ method, params })

  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth": auth,
      },
      body,
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: new Error(`HTTP ${res.status}`), raw: json }
    }

    if (json && json.error) {
      return { ok: false, error: json.error, raw: json }
    }

    return { ok: true, result: json?.result as T, raw: json }
  } catch (e: any) {
    return { ok: false, error: e, raw: null }
  }
}

// Utilities to convert currency
export const uzsToTiyin = (amountUzs: number) => Math.round(amountUzs * 100)
export const tiyinToUzs = (amountTiyin: number) => amountTiyin / 100
