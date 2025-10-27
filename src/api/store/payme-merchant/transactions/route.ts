import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Disable ALL Medusa authentication - no publishable key required
export const AUTHENTICATE = false
export const config = {
  auth: false
}

/**
 * GET /store/payme-merchant/transactions
 * View all Payme transactions received via Merchant API
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Import the transactions Map from the main route
  // For now, we'll create a simple response
  // In production, you'd query from database
  
  return res.json({
    message: "Transaction tracking endpoint",
    note: "Transactions are currently stored in-memory and will be displayed here when Payme calls your billing endpoint",
    instructions: [
      "1. Generate a payment link from the test page",
      "2. Open the payment link in browser",
      "3. Complete payment on Payme's page",
      "4. Check your server terminal logs to see Payme calling your endpoint",
      "5. Transactions will appear here after implementation"
    ],
    serverLogs: "Watch your terminal for these logs:",
    exampleLogs: [
      "📥 Payme Merchant API Request: { method: 'CheckPerformTransaction', ... }",
      "✅ Authentication successful",
      "✅ Transaction created: { transaction: '...', state: 1, ... }",
      "✅ Transaction performed: { transaction: '...', state: 2, ... }"
    ]
  })
}
