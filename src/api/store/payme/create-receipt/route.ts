import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paymeRpc } from "../../../../lib/payme"

// Disable publishable key requirement for this endpoint
export const AUTHENTICATE = false

/**
 * POST /store/payme/create-receipt
 * Creates a Payme payment receipt for an order
 * 
 * Body: { orderId: string, amount: number }
 * Returns: { success: boolean, receiptId: string, checkoutUrl: string }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { orderId, amount } = req.body as any

  // Validate inputs
  if (!orderId) {
    return res.status(400).json({ 
      success: false, 
      error: "orderId is required" 
    })
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: "Valid amount is required" 
    })
  }

  try {
    // Convert UZS to Tiyin (Payme's currency unit: 1 UZS = 100 Tiyin)
    const amountInTiyin = Math.round(amount * 100)

    console.log('💳 Creating Payme receipt:', { 
      orderId, 
      amountUZS: amount, 
      amountTiyin: amountInTiyin 
    })

    // Call Payme API to create receipt
    // Note: Virtual Terminal may not require extra params like cashbox_id
    const result = await paymeRpc("receipts.create", {
      amount: amountInTiyin,
      account: {
        order_id: orderId
      }
    })

    console.log('📥 Payme API Response:', {
      ok: result.ok,
      error: result.error,
      result: result.result
    })

    if (result.ok) {
      const receiptId = result.result._id
      const isTestMode = process.env.PAYME_API_URL?.includes('test')
      const checkoutUrl = isTestMode 
        ? `https://checkout.test.paycom.uz/${receiptId}`
        : `https://checkout.paycom.uz/${receiptId}`

      const response = {
        success: true,
        receiptId: receiptId,
        checkoutUrl: checkoutUrl,
        data: result.result
      }

      console.log('✅ Payme receipt created successfully:', response)

      return res.json(response)
    } else {
      console.error('❌ Payme API error:', result.error)
      return res.status(400).json({
        success: false,
        error: result.error?.message || 'Failed to create receipt',
        details: result.error
      })
    }
  } catch (error: any) {
    console.error('❌ Error creating Payme receipt:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
