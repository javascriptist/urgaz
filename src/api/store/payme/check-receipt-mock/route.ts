import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Disable publishable key requirement for this endpoint
export const AUTHENTICATE = false

/**
 * POST /store/payme/check-receipt-mock
 * Mock version - Check receipt status without calling Payme API
 * Perfect for testing UI while waiting for Payme activation
 * 
 * Body: { receiptId: string }
 * Returns: { success: boolean, status: string, paid: boolean, mock: true }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { receiptId } = req.body as any

  if (!receiptId) {
    return res.status(400).json({ 
      success: false, 
      error: "receiptId is required" 
    })
  }

  console.log('🧪 Mock: Checking receipt status:', receiptId)

  // Simulate different states based on receipt ID pattern
  let status = "waiting"
  let state = 0
  let paid = false

  if (receiptId.includes('paid') || receiptId.includes('success')) {
    status = "paid"
    state = 2
    paid = true
  } else if (receiptId.includes('cancel')) {
    status = "cancelled"
    state = -1
    paid = false
  } else if (receiptId.includes('process')) {
    status = "processing"
    state = 1
    paid = false
  } else {
    // Default: waiting
    status = "waiting"
    state = 0
    paid = false
  }

  const mockResult = {
    success: true,
    receiptId: receiptId,
    status: status,
    paid: paid,
    state: state,
    mock: true,
    details: {
      _id: receiptId,
      create_time: Math.floor(Date.now() / 1000) - 3600,
      pay_time: paid ? Math.floor(Date.now() / 1000) : null,
      cancel_time: status === "cancelled" ? Math.floor(Date.now() / 1000) : null,
      state: state,
      amount: 5000000,
      account: {
        order_id: "mock_order_" + Math.random().toString(36).substr(2, 9)
      }
    },
    note: "This is a mock response for testing. Receipt IDs with 'paid' or 'success' show as paid, 'cancel' shows cancelled, 'process' shows processing, otherwise waiting."
  }

  console.log('✅ Mock receipt check:', mockResult)

  return res.json(mockResult)
}
