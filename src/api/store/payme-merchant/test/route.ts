import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Disable ALL Medusa authentication - no publishable key required
export const AUTHENTICATE = false
export const config = {
  auth: false
}

/**
 * GET /store/payme-merchant/test
 * Test if the billing endpoint is accessible
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({
    status: "ok",
    message: "Billing endpoint is accessible",
    timestamp: new Date().toISOString(),
    url: req.url,
    headers: {
      authorization: req.headers.authorization ? "Present" : "Missing",
      contentType: req.headers['content-type'] || "Not set"
    }
  })
}

/**
 * POST /store/payme-merchant/test
 * Test POST requests to billing endpoint
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log('🧪 Test POST received:', {
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? "Present (hidden)" : "Missing",
      contentType: req.headers['content-type']
    }
  })

  return res.json({
    status: "ok",
    message: "Test POST successful",
    received: req.body,
    timestamp: new Date().toISOString()
  })
}
