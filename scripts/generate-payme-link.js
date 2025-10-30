#!/usr/bin/env node

/**
 * Payme Payment Link Generator
 * 
 * Usage:
 *   node scripts/generate-payme-link.js <merchant_id> <amount_tiyin> <order_id> [callback_url]
 * 
 * Example:
 *   node scripts/generate-payme-link.js 68f905fd33df8ed4e617e169 57375000 12
 *   node scripts/generate-payme-link.js 68f905fd33df8ed4e617e169 57375000 12 "https://example.com/success"
 */

function generatePaymeLink(merchantId, amountTiyin, orderId, callbackUrl = null) {
  // Validate inputs
  if (!merchantId || !amountTiyin || orderId === undefined) {
    throw new Error('Missing required parameters: merchantId, amountTiyin, orderId')
  }

  // Build payment parameters
  const params = {
    m: merchantId,              // merchant_id
    a: parseInt(amountTiyin),   // amount in tiyin (must be number)
    account: {
      order_id: parseInt(orderId) // order_id as number
    }
  }

  // Add callback URL if provided
  if (callbackUrl) {
    params.c = callbackUrl
  }

  // Method 1: Base64 encoded (RECOMMENDED by Payme)
  const paramsString = JSON.stringify(params)
  const base64Params = Buffer.from(paramsString).toString('base64')
  const paymentUrlBase64 = `https://checkout.paycom.uz/${base64Params}`

  // Method 2: Query string (alternative)
  let paymentUrlQuery = `https://checkout.paycom.uz/?` +
    `m=${merchantId}` +
    `&a=${amountTiyin}` +
    `&account.order_id=${orderId}`
  
  if (callbackUrl) {
    paymentUrlQuery += `&c=${encodeURIComponent(callbackUrl)}`
  }

  return {
    base64: paymentUrlBase64,
    query: paymentUrlQuery,
    params: params,
    paramsJson: paramsString
  }
}

// Helper function to convert USD to Tiyin
function usdToTiyin(usdAmount, exchangeRate = 12750) {
  const uzs = usdAmount * exchangeRate
  const tiyin = Math.round(uzs * 100)
  return tiyin
}

// Helper function to decode a Payme link
function decodePaymeLink(paymentUrl) {
  try {
    // Extract base64 part from URL
    const base64Part = paymentUrl.replace('https://checkout.paycom.uz/', '')
    
    // Decode base64
    const decoded = Buffer.from(base64Part, 'base64').toString('utf-8')
    const params = JSON.parse(decoded)
    
    return {
      merchantId: params.m,
      amountTiyin: params.a,
      orderId: params.account?.order_id,
      callbackUrl: params.c,
      raw: params
    }
  } catch (error) {
    throw new Error(`Failed to decode payment link: ${error.message}`)
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Payme Payment Link Generator
=============================

Usage:
  node generate-payme-link.js <merchant_id> <amount_tiyin> <order_id> [callback_url]
  node generate-payme-link.js --decode <payment_url>
  node generate-payme-link.js --convert <usd_amount> [exchange_rate]

Examples:
  # Generate link with tiyin amount
  node generate-payme-link.js 68f905fd33df8ed4e617e169 57375000 12

  # Generate link with callback URL
  node generate-payme-link.js 68f905fd33df8ed4e617e169 57375000 12 "https://example.com/success"

  # Decode existing payment link
  node generate-payme-link.js --decode "https://checkout.paycom.uz/eyJtIjoiNjhmO..."

  # Convert USD to Tiyin
  node generate-payme-link.js --convert 45.00
  node generate-payme-link.js --convert 45.00 12750

Parameters:
  merchant_id    - Your Payme merchant ID (24 hex characters)
  amount_tiyin   - Payment amount in tiyin (1 UZS = 100 tiyin)
  order_id       - Order ID (numeric, e.g., 12)
  callback_url   - Optional return URL after payment

Notes:
  - Amount must be in tiyin (smallest unit)
  - 1 USD = 12,750 UZS = 1,275,000 tiyin (at default rate)
  - Order ID should be numeric for best compatibility
`)
    process.exit(0)
  }

  // Decode mode
  if (args[0] === '--decode' || args[0] === '-d') {
    if (!args[1]) {
      console.error('❌ Error: Payment URL required')
      process.exit(1)
    }
    
    try {
      const decoded = decodePaymeLink(args[1])
      console.log('\n✅ Decoded Payment Link:')
      console.log('========================')
      console.log(`Merchant ID:    ${decoded.merchantId}`)
      console.log(`Amount (tiyin): ${decoded.amountTiyin.toLocaleString()}`)
      console.log(`Order ID:       ${decoded.orderId}`)
      if (decoded.callbackUrl) {
        console.log(`Callback URL:   ${decoded.callbackUrl}`)
      }
      console.log('\nRaw Parameters:')
      console.log(JSON.stringify(decoded.raw, null, 2))
    } catch (error) {
      console.error(`❌ Error: ${error.message}`)
      process.exit(1)
    }
    process.exit(0)
  }

  // Convert USD to Tiyin mode
  if (args[0] === '--convert' || args[0] === '-c') {
    if (!args[1]) {
      console.error('❌ Error: USD amount required')
      process.exit(1)
    }
    
    const usdAmount = parseFloat(args[1])
    const exchangeRate = args[2] ? parseFloat(args[2]) : 12750
    
    if (isNaN(usdAmount)) {
      console.error('❌ Error: Invalid USD amount')
      process.exit(1)
    }
    
    const tiyin = usdToTiyin(usdAmount, exchangeRate)
    const uzs = usdAmount * exchangeRate
    
    console.log('\n💱 Currency Conversion:')
    console.log('======================')
    console.log(`USD Amount:     $${usdAmount.toFixed(2)}`)
    console.log(`Exchange Rate:  ${exchangeRate.toLocaleString()} UZS/USD`)
    console.log(`UZS Amount:     ${uzs.toLocaleString()} UZS`)
    console.log(`Tiyin Amount:   ${tiyin.toLocaleString()} tiyin`)
    process.exit(0)
  }

  // Generate link mode
  const [merchantId, amountTiyin, orderId, callbackUrl] = args

  if (!merchantId || !amountTiyin || !orderId) {
    console.error('❌ Error: Missing required parameters')
    console.error('Usage: node generate-payme-link.js <merchant_id> <amount_tiyin> <order_id> [callback_url]')
    console.error('Run with --help for more information')
    process.exit(1)
  }

  try {
    const result = generatePaymeLink(merchantId, amountTiyin, orderId, callbackUrl)
    
    console.log('\n✅ Generated Payme Payment Links:')
    console.log('=================================')
    console.log('\n📋 Parameters:')
    console.log(result.paramsJson)
    console.log('\n🔗 Base64 URL (Recommended):')
    console.log(result.base64)
    console.log('\n🔗 Query String URL (Alternative):')
    console.log(result.query)
    console.log('\n💡 Tips:')
    console.log('  - Use the Base64 URL for better reliability')
    console.log('  - Test in sandbox mode first')
    console.log('  - Verify webhook is accessible from internet')
    console.log('')
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

// Export functions for use as module
module.exports = {
  generatePaymeLink,
  decodePaymeLink,
  usdToTiyin
}
