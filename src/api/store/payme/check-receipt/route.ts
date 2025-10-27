import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paymeRpc } from "../../../../lib/payme"

// Disable publishable key requirement for this endpoint
export const AUTHENTICATE = false

/**
 * POST /store/payme/check-receipt
 * Check the status of a Payme payment receipt
 * 
 * Body: { receiptId: string }
 * Returns: { success: boolean, status: string, paid: boolean, details: object }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { receiptId } = req.body as any

  if (!receiptId) {
    return res.status(400).json({ 
      success: false, 
      error: "receiptId is required" 
    })
  }

  console.log('🔍 Checking Payme receipt status:', receiptId)

  try {
    // Call Payme API to check receipt
    const result = await paymeRpc("receipts.check", {
      id: receiptId
    })

    if (result.ok) {
      const receipt = result.result

      // Payme receipt states:
      // 0 = waiting for payment
      // 1 = payment in progress
      // 2 = paid successfully
      // -1 = cancelled while waiting
      // -2 = cancelled after payment
      const state = receipt.state

      const statusMap: Record<number, string> = {
        0: "waiting",
        1: "processing",
        2: "paid",
        [-1]: "cancelled",
        [-2]: "cancelled_after_payment"
      }

      const status = statusMap[state] || "unknown"
      const paid = state === 2

      console.log('✅ Receipt status:', { receiptId, state, status, paid })

      return res.json({
        success: true,
        receiptId: receiptId,
        status: status,
        paid: paid,
        state: state,
        details: receipt
      })
    } else {
      console.error('❌ Payme API error:', result.error)
      return res.status(400).json({
        success: false,
        error: result.error?.message || 'Failed to check receipt',
        details: result.error
      })
    }
  } catch (error: any) {
    console.error('❌ Error checking receipt:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
