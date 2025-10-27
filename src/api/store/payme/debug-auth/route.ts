import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Disable publishable key requirement for this endpoint
export const AUTHENTICATE = false

/**
 * GET /store/payme/debug-auth
 * Debug endpoint to see what credentials are being used
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const merchantId = process.env.PAYME_MERCHANT_ID || ""
  const password = process.env.PAYME_PASSWORD || ""
  const auth = process.env.PAYME_AUTH || ""
  const url = process.env.PAYME_API_URL || ""
  console.log(merchantId, password ? '***' : '', auth ? '***' : '', url)
  const isTestMode = url.includes('test.paycom.uz')
  
  // Show what will be sent (mask password partially)
  const maskedPassword = password ? password.substring(0, 5) + '***' + password.substring(password.length - 5) : ''
  const xAuthValue = `${merchantId}:${password}`
  const xAuthValueMasked = `${merchantId}:${maskedPassword}`

  return res.json({
    config: {
      PAYME_API_URL: url,
      PAYME_MERCHANT_ID: merchantId,
      PAYME_PASSWORD_MASKED: maskedPassword,
      PAYME_AUTH: auth ? auth.substring(0, 20) + '...' : 'NOT SET',
      mode: isTestMode ? 'TEST' : 'PRODUCTION'
    },
    headers: {
      headerName: isTestMode ? 'X-Auth' : 'Authorization',
      headerValue: isTestMode ? xAuthValueMasked : `Basic ${Buffer.from(auth).toString('base64').substring(0, 20)}...`,
      fullXAuth: isTestMode ? xAuthValue : 'N/A (production uses Authorization header)'
    },
    instructions: {
      testInBrowser: {
        step1: "Open browser console (F12)",
        step2: "Paste this code:",
        code: `
fetch('https://checkout.test.paycom.uz/api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Auth': '${xAuthValue}'
  },
  body: JSON.stringify({
    method: 'receipts.get_all',
    params: { count: 10 }
  })
})
.then(r => r.json())
.then(d => console.log('✅ Response:', d))
.catch(e => console.error('❌ Error:', e))
        `.trim()
      }
    }
  })
}
