import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paymeRpc } from "../../../../lib/payme"

// Disable publishable key requirement for this endpoint
export const AUTHENTICATE = false

/**
 * POST /store/payme/check-receipts
 * Check the status of multiple Payme payment receipts
 * 
 * Body: { receiptIds: string[] }
 * Returns: { success: boolean, results: Array<{receiptId, status, paid}> }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { receiptIds } = req.body as any

  if (!receiptIds || !Array.isArray(receiptIds)) {
    return res.status(400).json({ 
      success: false, 
      error: "receiptIds array is required" 
    })
  }

  if (receiptIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: "receiptIds array cannot be empty" 
    })
  }

  if (receiptIds.length > 50) {
    return res.status(400).json({ 
      success: false, 
      error: "Maximum 50 receipts can be checked at once" 
    })
  }

  console.log(`🔍 Checking ${receiptIds.length} Payme receipt(s)...`)

  try {
    // Check all receipts in parallel
    const checkPromises = receiptIds.map(async (receiptId) => {
      try {
        const result = await paymeRpc("receipts.check", {
          id: receiptId
        })

        if (result.ok) {
          const receipt = result.result
          const state = receipt.state

          const statusMap: Record<number, string> = {
            0: "waiting",
            1: "processing",
            2: "paid",
            [-1]: "cancelled",
            [-2]: "cancelled_after_payment"
          }

          return {
            receiptId: receiptId,
            success: true,
            status: statusMap[state] || "unknown",
            paid: state === 2,
            state: state,
            amount: receipt.amount,
            createTime: receipt.create_time,
            payTime: receipt.pay_time || null
          }
        } else {
          return {
            receiptId: receiptId,
            success: false,
            error: result.error?.message || 'Failed to check receipt',
            details: result.error
          }
        }
      } catch (error: any) {
        return {
          receiptId: receiptId,
          success: false,
          error: error.message || 'Error checking receipt'
        }
      }
    })

    const results = await Promise.all(checkPromises)

    // Calculate summary
    const summary = {
      total: results.length,
      paid: results.filter(r => r.success && r.paid).length,
      waiting: results.filter(r => r.success && r.status === 'waiting').length,
      processing: results.filter(r => r.success && r.status === 'processing').length,
      cancelled: results.filter(r => r.success && (r.status === 'cancelled' || r.status === 'cancelled_after_payment')).length,
      errors: results.filter(r => !r.success).length
    }

    console.log('✅ Receipt check complete:', summary)

    return res.json({
      success: true,
      summary: summary,
      results: results
    })
  } catch (error: any) {
    console.error('❌ Error checking receipts:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
