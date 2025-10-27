import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { paymeRpc, isPaymeEnabled } from "../../../lib/payme";

// Test endpoint to check Payme connectivity and geo-restrictions
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const results = {
    paymeEnabled: isPaymeEnabled(),
    envVars: {
      PAYME_ENABLED: !!process.env.PAYME_ENABLED,
      PAYME_AUTH: !!process.env.PAYME_AUTH,
      PAYME_API_URL: process.env.PAYME_API_URL || 'default',
    },
    tests: {}
  };

  if (!isPaymeEnabled()) {
    return res.json({
      ...results,
      status: 'disabled',
      message: 'Payme is disabled in environment'
    });
  }

  // Test basic connectivity
  try {
    console.log('Testing Payme connectivity...');
    const testResult = await paymeRpc("receipts.create", {
      amount: 100000, // 1000 UZS in tiyin
      account: { order_id: "test-connectivity-" + Date.now() }
    });

    results.tests = {
      connectivity: testResult.ok ? 'success' : 'failed',
      error: testResult.error?.message || null,
      raw: testResult.raw
    };

    return res.json({
      ...results,
      status: testResult.ok ? 'working' : 'error',
      message: testResult.ok 
        ? 'Payme API is accessible and working' 
        : `Payme API error: ${testResult.error?.message}`
    });

  } catch (error: any) {
    results.tests = {
      connectivity: 'failed',
      error: error.message,
      raw: null
    };

    return res.json({
      ...results,
      status: 'error',
      message: `Network error: ${error.message}`
    });
  }
}