import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

// Disable publishable key requirement for mock endpoint
export const AUTHENTICATE = false

// Mock Payme endpoint for development when real credentials aren't available
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ 
    status: "ok", 
    paymeEnabled: true,
    mode: "MOCK - for development only"
  })

}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { amount, orderId, returnUrl } = req.body as any;

  console.log('🧪 Mock Payment Request:', { amount, orderId, returnUrl })

  // Mock successful receipt creation
  const mockReceiptId = `mock_receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create mock checkout URL (admin page)
  const mockCheckoutUrl = `/app/payme-mock-checkout?receipt_id=${mockReceiptId}&order_id=${orderId}&amount=${amount}`;
  
  const response = {
    success: true,
    data: {
      _id: mockReceiptId,
      create_time: Math.floor(Date.now() / 1000),
      state: 0,
      amount: amount * 100, // Convert to tiyin
      account: { order_id: orderId }
    },
    checkoutUrl: mockCheckoutUrl,
    mock: true,
    message: "Mock receipt created - will redirect to mock checkout page",
    note: "This is a development mock. Configure real Payme credentials for production."
  }

  console.log('✅ Mock Payment Response:', response)
  
  return res.json(response);
}