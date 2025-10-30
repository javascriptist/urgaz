import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"

// Disable ALL Medusa authentication - no publishable key required
export const AUTHENTICATE = false
export const config = {
  auth: false
}

// Helper function to get exchange rate
function getExchangeRate(): number {
  try {
    const STORAGE_PATH = path.join(process.cwd(), "data", "exchange-rate.json")
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, "utf-8")
      const parsed = JSON.parse(data)
      return parsed.rate || 12750
    }
  } catch (e) {
    console.error('Error reading exchange rate:', e)
  }
  return 12750 // Default: 1 USD = 12,750 UZS
}

/**
 * POST /admin/payme-generate-link
 * Generate a Payme Merchant API payment link (Admin endpoint)
 * 
 * Body: { 
 *   orderId: string,        // Order ID or display_id
 *   callbackUrl?: string    // Optional return URL
 * }
 * Returns: { paymentUrl: string }
 * 
 * Note: Amount is calculated automatically from the order total and exchange rate
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { orderId, callbackUrl } = req.body as any

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: "orderId is required"
    })
  }

  const merchantId = process.env.PAYME_MERCHANT_ID
  if (!merchantId) {
    return res.status(500).json({
      success: false,
      error: "PAYME_MERCHANT_ID not configured"
    })
  }

  try {
    // Fetch the order from database
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    // Try to find order by display_id first (if it's a number), then by full ID
    let order: any = null
    const displayId = parseInt(orderId)
    
    if (!isNaN(displayId)) {
      // It's a number, search by display_id
      const allOrders = await orderModuleService.listOrders({}, { 
        select: ["id", "display_id", "total", "currency_code", "summary"],
        relations: ["summary"]
      })
      order = allOrders.find((o: any) => o.display_id === displayId) || null
    } else {
      // It's a string, search by full order ID
      const orders = await orderModuleService.listOrders({ id: orderId }, {
        select: ["id", "display_id", "total", "currency_code", "summary"],
        relations: ["summary"]
      })
      order = orders && orders.length > 0 ? orders[0] : null
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
        orderId
      })
    }

    // Get exchange rate
    const exchangeRate = getExchangeRate()

    // Convert: USD → UZS → Tiyin
    // Try order.total first, then order.summary.total
    const orderTotalUSD = Number(order.total) || Number(order.summary?.total) || 0
    
    if (orderTotalUSD === 0) {
      console.warn('⚠️ Order has zero total:', {
        orderId,
        display_id: order.display_id,
        total: order.total,
        summary: order.summary
      })
    }
    
    const orderTotalUZS = orderTotalUSD * exchangeRate
    const amountInTiyin = Math.round(orderTotalUZS * 100)

    // Use display_id for Payme (easier to work with than long UUID)
    const paymeOrderId = String(order.display_id)

    // Build payment parameters
    const params: any = {
      m: merchantId,              // merchant_id
      a: amountInTiyin,           // amount in tiyin
      ac: {
        order_id: paymeOrderId    // Use display_id (e.g., "11" instead of "order_01K8...")
      }
    }

    if (callbackUrl) {
      params.c = callbackUrl      // callback URL
    }

    // Method 1: Base64 encoded (RECOMMENDED - most reliable)
    const paramsString = JSON.stringify(params)
    const base64Params = Buffer.from(paramsString).toString('base64')
    const paymentUrlBase64 = `https://checkout.paycom.uz/${base64Params}`

    // Method 2: Query string (simpler, alternative)
    const paymentUrlQuery = `https://checkout.paycom.uz/?` +
      `m=${merchantId}` +
      `&a=${amountInTiyin}` +
      `&ac.order_id=${encodeURIComponent(paymeOrderId)}` +
      (callbackUrl ? `&c=${encodeURIComponent(callbackUrl)}` : '')

    // Use base64 method (more reliable)
    const paymentUrl = paymentUrlBase64

    console.log('🔗 Generated Payme payment link (Admin):', {
      orderId,
      display_id: order.display_id,
      paymeOrderId: paymeOrderId,  // Show what ID is sent to Payme
      orderTotalUSD: orderTotalUSD.toFixed(2) + ' USD',
      exchangeRate: exchangeRate + ' UZS/USD',
      orderTotalUZS: orderTotalUZS.toFixed(2) + ' UZS',
      amountTiyin: amountInTiyin + ' tiyin',
      merchantId,
      method: 'base64',
      paymentUrl
    })

    return res.json({
      success: true,
      paymentUrl,
      paymentUrlAlternative: paymentUrlQuery,
      orderId,
      orderDisplayId: order.display_id,
      paymeOrderId: paymeOrderId,
      amount: amountInTiyin,
      amountUSD: orderTotalUSD,
      amountUZS: orderTotalUZS,
      exchangeRate,
      merchantId
    })
  } catch (error: any) {
    console.error('❌ Error generating Payme link:', error)
    return res.status(500).json({
      success: false,
      error: "Failed to generate payment link",
      message: error.message
    })
  }
}
