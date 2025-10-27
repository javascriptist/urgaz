// Lightweight Payme (Paycom) JSON-RPC helper using global fetch
// Uses env vars:
// - PAYME_API_URL (default: https://checkout.test.paycom.uz/api)
// - PAYME_AUTH (format: "Paycom:<merchant_id>:<password>" - will be Base64 encoded automatically)

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

// Optional extra params for receipt.create, configured via env JSON
// PAYME_RECEIPT_PARAMS example:
// {"cashbox_id":"YOUR_CASHBOX_ID"}
// or nested under account: {"account":{"cashbox":"YOUR_CASHBOX"}}
export function getPaymeReceiptExtraParams(): Record<string, any> {
  const raw = (process.env.PAYME_RECEIPT_PARAMS || "").trim()
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") return parsed
  } catch {
    // ignore parse errors
  }
  return {}
}

export async function paymeRpc<T = any>(method: string, params: any): Promise<RpcResult<T>> {
  const url = process.env.PAYME_API_URL || "https://checkout.test.paycom.uz/api"
  const auth = process.env.PAYME_AUTH || ""
  const merchantId = process.env.PAYME_MERCHANT_ID || ""
  const password = process.env.PAYME_PASSWORD+'#' || ""
  console.log(merchantId, password);
  if (!isPaymeEnabled()) {
    return { ok: false, error: new Error("PAYME_DISABLED"), raw: null }
  }
  if (!auth && (!merchantId || !password)) {
    return { ok: false, error: new Error("PAYME_AUTH_MISSING"), raw: null }
  }

  // Payme authentication formats:
  // TEST mode: "X-Auth" header with PLAIN TEXT "merchant_id:password" (NOT Base64!)
  // PRODUCTION mode: "Authorization" header with format: "Basic " + Base64("Paycom:merchant_id:password")
  
  // Determine if we're in test or production mode based on API URL
  const isTestMode = url.includes('test.paycom.uz')
  
  let authHeader: string
  let authValue: string
  
  if (isTestMode) {
    // TEST MODE: X-Auth header uses PLAIN TEXT merchant_id:password (no encoding, no "Paycom:" prefix)
    authHeader = 'X-Auth'
    authValue = `${merchantId}:${password}`
  } else {
    // PRODUCTION MODE: Authorization header uses Base64("Paycom:merchant_id:password")
    const authEncoded = Buffer.from(auth || `Paycom:${merchantId}:${password}`).toString('base64')
    authHeader = 'Authorization'
    authValue = `Basic ${authEncoded}`
  }

  // Debug logging
  console.log('🔍 Payme API Request:', {
    url,
    mode: isTestMode ? 'TEST' : 'PRODUCTION',
    header: authHeader,
    authFormat: isTestMode ? 'merchant_id:password (plain text)' : 'Basic Base64(Paycom:merchant_id:password)',
    valuePrefix: authValue.substring(0, 20) + '...',
    method,
  })

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
        [authHeader]: authValue,
      },
      body,
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      // Handle common geo-restriction errors
      if (res.status === 403 || res.status === 451) {
        return { ok: false, error: new Error(`GEO_RESTRICTED: Payme API blocked (${res.status}). Try using Uzbekistan VPN/proxy.`), raw: json }
      }
      return { ok: false, error: new Error(`HTTP ${res.status}`), raw: json }
    }

    if (json && json.error) {
      return { ok: false, error: json.error, raw: json }
    }

    return { ok: true, result: json?.result as T, raw: json }
  } catch (e: any) {
    // Handle network timeouts/blocks that might be geo-related
    if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT' || e.message?.includes('fetch')) {
      return { ok: false, error: new Error(`NETWORK_ERROR: Cannot reach Payme API. This might be due to geo-restrictions. Try using Uzbekistan VPN/proxy.`), raw: null }
    }
    return { ok: false, error: e, raw: null }
  }
}

// Utilities to convert currency
export const uzsToTiyin = (amountUzs: number) => Math.round(amountUzs * 100)
export const tiyinToUzs = (amountTiyin: number) => amountTiyin / 100
