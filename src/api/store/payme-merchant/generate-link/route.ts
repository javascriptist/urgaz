import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Disable ALL Medusa authentication - no publishable key required
export const AUTHENTICATE = false
export const config = {
  auth: false
}

/**
 * POST /store/payme-merchant/generate-link
 * Generate a Payme Merchant API payment link
 * 
 * Body: { orderId: string, amount: number, callbackUrl?: string }
 * Returns: { paymentUrl: string }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { orderId, amount, callbackUrl } = req.body as any

  if (!orderId || !amount) {
    return res.status(400).json({
      success: false,
      error: "orderId and amount are required"
    })
  }

  const merchantId = process.env.PAYME_MERCHANT_ID
  if (!merchantId) {
    return res.status(500).json({
      success: false,
      error: "PAYME_MERCHANT_ID not configured"
    })
  }

  // Convert UZS to Tiyin (1 UZS = 100 Tiyin)
  const amountInTiyin = Math.round(amount * 100)

  // Generate Payme payment URL for Merchant API (Production)
  // Format: https://checkout.paycom.uz/[merchant_id]?amount=AMOUNT&account[order_id]=ORDER_ID&callback=CALLBACK
  // OR alternate format: https://checkout.paycom.uz/?m=MERCHANT_ID&ac.order_id=ORDER_ID&a=AMOUNT&c=CALLBACK_URL
  
  const baseUrl = 'https://checkout.paycom.uz'
  
  // Try the alternate URL format that's more commonly used
  const paymentUrl = `${baseUrl}/${merchantId}?` + 
    `amount=${amountInTiyin}` +
    `&account[order_id]=${encodeURIComponent(orderId)}` +
    (callbackUrl ? `&callback=${encodeURIComponent(callbackUrl)}` : '')

  console.log('🔗 Generated Payme payment link:', {
    orderId,
    amountUZS: amount,
    amountTiyin: amountInTiyin,
    merchantId,
    paymentUrl,
    mode: 'PRODUCTION'
  })

  return res.json({
    success: true,
    paymentUrl,
    orderId,
    amount: amountInTiyin,
    merchantId
  })
}
