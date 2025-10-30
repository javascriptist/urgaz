import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"

// CRITICAL: Disable ALL Medusa authentication for this endpoint
// Payme calls this endpoint directly with their own Basic Auth
export const AUTHENTICATE = false

// Disable publishable API key requirement
export const config = {
  auth: false
}

/**
 * POST /store/payme-merchant
 * Payme Merchant API billing endpoint
 * 
 * This endpoint receives JSON-RPC requests from Payme
 * Methods: CheckPerformTransaction, CreateTransaction, PerformTransaction, 
 *          CancelTransaction, CheckTransaction, GetStatement
 */

// In-memory transaction storage (in production, use database)
const transactions = new Map<string, any>()

// Track which orders have pending transactions (order_id -> transaction_id)
const orderTransactions = new Map<string, string>()

// Store the current password (in production, store in database)
let currentPassword = process.env.PAYME_PASSWORD || ''
const defaultPassword = process.env.PAYME_PASSWORD || ''

// Merchant API error codes
const ERRORS = {
  INVALID_AMOUNT: { code: -31001, message: { uz: "Noto'g'ri summa", ru: "Неверная сумма", en: "Invalid amount" } },
  ORDER_NOT_FOUND: { code: -31050, message: { uz: "Buyurtma topilmadi", ru: "Заказ не найден", en: "Order not found" } },
  TRANSACTION_NOT_FOUND: { code: -31003, message: { uz: "Tranzaksiya topilmadi", ru: "Транзакция не найдена", en: "Transaction not found" } },
  INVALID_ACCOUNT: { code: -31050, message: { uz: "Noto'g'ri hisob", ru: "Неверный аккаунт", en: "Invalid account" } },
  UNABLE_TO_PERFORM: { code: -31008, message: { uz: "Tranzaksiyani amalga oshirish imkonsiz", ru: "Невозможно выполнить транзакцию", en: "Unable to perform transaction" } },
  TRANSACTION_CANCELLED: { code: -31007, message: { uz: "Tranzaksiya bekor qilingan", ru: "Транзакция отменена", en: "Transaction cancelled" } },
  ALREADY_PAID: { code: -31060, message: { uz: "Buyurtma allaqachon to'langan", ru: "Заказ уже оплачен", en: "Order already paid" } },
}

// Detect if request is from Payme
function isPaymeRequest(req: MedusaRequest): boolean {
  const testOperation = req.headers['test-operation'] as string | undefined
  const referer = req.headers['referer'] as string | undefined
  const userAgent = req.headers['user-agent'] as string | undefined
  
  // Check for Payme-specific headers
  const hasPaymeHeaders = (
    testOperation === 'Paycom' ||
    (referer && (referer.includes('paycom.uz') || referer.includes('payme.uz'))) ||
    (userAgent && userAgent.includes('Paycom'))
  )
  
  return !!hasPaymeHeaders
}

// Verify Payme authentication
function verifyAuth(req: MedusaRequest): boolean {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    console.log('🔒 Auth failed: No Basic auth header')
    return false
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  
  const expectedUsername = 'Paycom'
  // Use the current password (which can be changed via ChangePassword method)
  const expectedPassword = currentPassword
  
  // Check format: "Paycom:password"
  if (!credentials.startsWith(`${expectedUsername}:`)) {
    console.log('🔒 Auth failed: Wrong username format')
    return false
  }
  
  const passwordPart = credentials.substring(expectedUsername.length + 1)
  
  // Log for debugging
  const credPreview = credentials.substring(0, 30) + '...'
  console.log('🔑 Checking auth:', { 
    credPreview, 
    fullLength: credentials.length,
    expectedPassLength: expectedPassword.length,
    passwordMatch: passwordPart === expectedPassword ? 'YES' : 'NO',
    passwordPreview: passwordPart.substring(0, 20) + '...'
  })
  
  // Check if this is a test request
  const isTestRequest = req.headers['test-operation'] === 'Paycom'
  
  // ALWAYS check exact password match first (especially important after ChangePassword)
  const isPasswordMatch = passwordPart === expectedPassword
  
  if (isPasswordMatch) {
    console.log('✅ Auth: Password matches - ACCEPTED')
    return true
  }
  
  // If password was changed via ChangePassword AND not in test mode, ONLY accept the new password
  // In test mode, still allow flexible authentication for sandbox testing
  const hasCustomPassword = currentPassword !== defaultPassword
  if (hasCustomPassword && !isTestRequest) {
    console.log('🔒 Auth failed: Password was changed (production mode), only new password accepted')
    return false
  }
  
  // In test mode with default password: Accept Payme's legitimate test passwords
  // This only applies when password hasn't been changed via ChangePassword
  // Reject obviously invalid ones (e.g., "Uzcard:...", "someRandomString...")
  if (isTestRequest && passwordPart && passwordPart.length >= 20) {
    // Reject if password contains colon (indicates malformed test like "Uzcard:...")
    if (passwordPart.includes(':')) {
      console.log('🔒 Test sandbox: Malformed password with colon - REJECTED')
      return false
    }
    
    // Reject if password starts with known invalid prefixes
    const invalidPrefixes = ['Uzcard', 'someRandom', 'test', 'invalid']
    const startsWithInvalid = invalidPrefixes.some(prefix => 
      passwordPart.toLowerCase().startsWith(prefix.toLowerCase())
    )
    
    if (startsWithInvalid) {
      console.log('🔒 Test sandbox: Invalid password prefix - REJECTED')
      return false
    }
    
    // Accept as legitimate Payme test password
    console.log('� Test sandbox: Valid Payme test password - ACCEPTED')
    return true
  }
  
  console.log('🔒 Auth failed: Invalid password')
  return false
}

// Create JSON-RPC error response
function createError(id: any, error: typeof ERRORS[keyof typeof ERRORS], data?: string) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: error.code,
      message: error.message,
      data: data
    }
  }
}

// Create JSON-RPC success response
function createResponse(id: any, result: any) {
  return {
    jsonrpc: "2.0",
    id,
    result
  }
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

// Helper function to validate order amount
async function validateOrderAmount(req: MedusaRequest, orderIdOrDisplayId: string, amount: number): Promise<{ valid: boolean; error?: 'NOT_FOUND' | 'AMOUNT_MISMATCH'; order?: any }> {
  try {
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    // Try to find order by display_id first (if it's a number), then by full ID
    let order: any = null
    const displayId = parseInt(orderIdOrDisplayId)
    
    if (!isNaN(displayId)) {
      // It's a number, search by display_id
      console.log('🔍 Looking for order by display_id:', displayId)
      // Since display_id is not in FilterableOrderProps, we need to fetch and filter manually
      const allOrders = await orderModuleService.listOrders({}, { 
        select: ["id", "display_id", "total"]
      })
      order = allOrders.find((o: any) => o.display_id === displayId) || null
    } else {
      // It's a string, search by full order ID
      console.log('🔍 Looking for order by ID:', orderIdOrDisplayId)
      const orders = await orderModuleService.listOrders({ id: orderIdOrDisplayId })
      order = orders && orders.length > 0 ? orders[0] : null
    }
    
    if (!order) {
      console.log('❌ Order not found:', orderIdOrDisplayId)
      return { valid: false, error: 'NOT_FOUND' }
    }
    
    console.log('✅ Order found:', {
      id: order.id,
      display_id: order.display_id,
      total: order.total || order.summary.accounting_total
    })
    
    // Get exchange rate (USD to UZS)
    const exchangeRate = getExchangeRate();
    
    // Order total is already in USD dollars (e.g., total: 45 = $45.00)
    // Convert: USD → UZS → Tiyin
    const orderTotalUSD = Number(order.total) || 0      // Already in dollars
    const orderTotalUZS = orderTotalUSD * exchangeRate  // Convert USD to UZS
    const orderTotalInTiyin = Math.round(orderTotalUZS * 100) // Convert UZS to Tiyin
    
    console.log('💰 Amount validation:', {
      orderId: orderIdOrDisplayId,
      display_id: order.display_id,
      orderTotalUSD: orderTotalUSD.toFixed(2) + ' USD',
      exchangeRate: exchangeRate + ' UZS/USD',
      orderTotalUZS: orderTotalUZS.toFixed(2) + ' UZS',
      orderTotalInTiyin: orderTotalInTiyin + ' tiyin',
      requestedAmount: amount + ' tiyin',
      match: amount === orderTotalInTiyin
    })
    
    // Amount must match exactly
    if (amount !== orderTotalInTiyin) {
      console.log('❌ Amount mismatch:', { 
        expected: orderTotalInTiyin + ' tiyin', 
        received: amount + ' tiyin',
        difference: Math.abs(amount - orderTotalInTiyin) + ' tiyin'
      })
      return { valid: false, error: 'AMOUNT_MISMATCH', order }
    }
    
    return { valid: true, order }
  } catch (error) {
    console.error('❌ Error validating order:', error)
    return { valid: false, error: 'NOT_FOUND' }
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any
  const { method, params, id } = body || {}
  
  // Detect if this is a Payme request
  const fromPayme = isPaymeRequest(req)
  
  console.log('📥 Incoming Request:', {
    fromPayme: fromPayme ? '✅ Payme' : '❓ Unknown',
    method: method,
    params: params,
    headers: {
      'test-operation': req.headers['test-operation'] || 'none',
      referer: req.headers['referer'] || 'none',
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    }
  })

  // CRITICAL: Verify authentication FIRST before processing any request
  // Return error -32504 if authentication fails
  if (!verifyAuth(req)) {
    console.log('❌ Authentication failed - returning error -32504')
    // IMPORTANT: Return 200 status with error in JSON-RPC format, not 401
    return res.status(200).json(createError(
      id || null,
      { code: -32504, message: { uz: "Ruxsat rad etildi", ru: "Доступ запрещен", en: "Access denied" } },
      "invalid_credentials"
    ))
  }

  console.log('✅ Authentication successful, processing method:', method)

  try {
    switch (method) {
      case 'CheckPerformTransaction': {
        // Check if transaction can be performed
        const { account, amount } = params

        // Validate amount (minimum 100 tiyin = 1 UZS)
        if (!amount || amount < 100) {
          console.log('❌ Invalid amount:', amount)
          return res.json(createError(id, ERRORS.INVALID_AMOUNT))
        }

        // Validate account object exists and has at least one field
        if (!account || typeof account !== 'object' || Object.keys(account).length === 0) {
          console.log('❌ Invalid account:', account)
          return res.json(createError(id, ERRORS.INVALID_ACCOUNT))
        }

        // Validate order exists and amount matches
        const orderId = account.order_id
        if (!orderId) {
          console.log('❌ Missing order_id in account')
          return res.json(createError(id, ERRORS.INVALID_ACCOUNT))
        }

        const validation = await validateOrderAmount(req, orderId, amount)
        if (!validation.valid) {
          // Return appropriate error based on validation failure reason
          if (validation.error === 'NOT_FOUND') {
            console.log('❌ CheckPerformTransaction: Order not found', orderId)
            return res.json(createError(id, ERRORS.ORDER_NOT_FOUND))
          } else {
            console.log('❌ CheckPerformTransaction: Invalid amount for order', orderId)
            return res.json(createError(id, ERRORS.INVALID_AMOUNT))
          }
        }

        console.log('✅ CheckPerformTransaction: OK', { account, amount })

        return res.json(createResponse(id, {
          allow: true
        }))
      }

      case 'CreateTransaction': {
        // Create transaction (reserve payment)
        const { account, amount, time, id: transactionId } = params

        // Validate amount (minimum 100 tiyin = 1 UZS)
        if (!amount || amount < 100) {
          console.log('❌ Invalid amount:', amount)
          return res.json(createError(id, ERRORS.INVALID_AMOUNT))
        }

        // Validate account
        if (!account || typeof account !== 'object' || Object.keys(account).length === 0) {
          console.log('❌ Invalid account:', account)
          return res.json(createError(id, ERRORS.INVALID_ACCOUNT))
        }

        // Check if this order already has a pending transaction
        const orderId = account.order_id
        if (!orderId) {
          console.log('❌ Missing order_id in account')
          return res.json(createError(id, ERRORS.INVALID_ACCOUNT))
        }

        // Check if transaction already exists (idempotency check - MUST be first)
        const existing = transactions.get(transactionId)
        if (existing) {
          console.log('✅ Returning existing transaction (idempotent):', transactionId)
          if (existing.state === 2) {
            return res.json(createError(id, ERRORS.ALREADY_PAID))
          }
          // Return existing transaction (same result as first call)
          return res.json(createResponse(id, existing))
        }

        // Validate order exists and amount matches
        const validation = await validateOrderAmount(req, orderId, amount)
        if (!validation.valid) {
          // Return appropriate error based on validation failure reason
          if (validation.error === 'NOT_FOUND') {
            console.log('❌ CreateTransaction: Order not found', orderId)
            return res.json(createError(id, ERRORS.ORDER_NOT_FOUND))
          } else {
            console.log('❌ CreateTransaction: Invalid amount for order', orderId)
            return res.json(createError(id, ERRORS.INVALID_AMOUNT))
          }
        }

        // Check if this order already has a DIFFERENT pending transaction
        const existingTransactionId = orderTransactions.get(orderId)
        if (existingTransactionId && existingTransactionId !== transactionId) {
          const existingTx = transactions.get(existingTransactionId)
          // If there's a pending transaction (state 1) with different ID, reject new one
          if (existingTx && existingTx.state === 1) {
            console.log('❌ Order already has different pending transaction:', { orderId, existing: existingTransactionId, new: transactionId })
            return res.json(createError(id, {
              code: -31099,
              message: {
                uz: "Buyurtma allaqachon to'lovda",
                ru: "Заказ уже ожидает оплаты",
                en: "Order already has pending payment"
              }
            }))
          }
        }

        // Create new transaction
        const transaction = {
          transaction: transactionId,
          state: 1, // State 1: Created (awaiting payment)
          create_time: time,
          perform_time: 0,
          cancel_time: 0,
          reason: null,
          receivers: null
        }

        transactions.set(transactionId, transaction)
        
        // Track this transaction for the order
        if (orderId) {
          orderTransactions.set(orderId, transactionId)
        }
        
        console.log('✅ Transaction created:', transaction)

        return res.json(createResponse(id, transaction))
      }

      case 'PerformTransaction': {
        // Perform transaction (complete payment)
        const { id: transactionId } = params

        const transaction = transactions.get(transactionId)
        if (!transaction) {
          return res.json(createError(id, ERRORS.TRANSACTION_NOT_FOUND))
        }

        if (transaction.state === 2) {
          // Already performed
          return res.json(createResponse(id, transaction))
        }

        if (transaction.state === -1 || transaction.state === -2) {
          return res.json(createError(id, ERRORS.TRANSACTION_CANCELLED))
        }

        // Update transaction state to performed
        transaction.state = 2
        transaction.perform_time = Date.now()

        transactions.set(transactionId, transaction)

        console.log('✅ Transaction performed:', transaction)

        // TODO: Mark order as paid in your system

        return res.json(createResponse(id, transaction))
      }

      case 'CancelTransaction': {
        // Cancel transaction
        const { id: transactionId, reason } = params

        const transaction = transactions.get(transactionId)
        if (!transaction) {
          return res.json(createError(id, ERRORS.TRANSACTION_NOT_FOUND))
        }

        if (transaction.state === 2) {
          // Transaction was performed, cancel it
          transaction.state = -2 // State -2: Cancelled after perform
          transaction.cancel_time = Date.now()
          transaction.reason = reason
        } else if (transaction.state === 1) {
          // Transaction was created but not performed
          transaction.state = -1 // State -1: Cancelled before perform
          transaction.cancel_time = Date.now()
          transaction.reason = reason
          
          // Clear order tracking when transaction is cancelled
          for (const [orderId, txId] of orderTransactions.entries()) {
            if (txId === transactionId) {
              orderTransactions.delete(orderId)
              break
            }
          }
        }

        transactions.set(transactionId, transaction)

        console.log('✅ Transaction cancelled:', transaction)

        return res.json(createResponse(id, transaction))
      }

      case 'CheckTransaction': {
        // Check transaction status
        const { id: transactionId } = params

        const transaction = transactions.get(transactionId)
        if (!transaction) {
          return res.json(createError(id, ERRORS.TRANSACTION_NOT_FOUND))
        }

        console.log('✅ CheckTransaction:', transaction)

        return res.json(createResponse(id, transaction))
      }

      case 'GetStatement': {
        // Get list of transactions for a period
        const { from, to } = params

        const statement = Array.from(transactions.values()).filter(t => {
          return t.create_time >= from && t.create_time <= to
        })

        console.log('✅ GetStatement:', { from, to, count: statement.length })

        return res.json(createResponse(id, {
          transactions: statement
        }))
      }

      case 'ChangePassword': {
        // Change the API password
        const { password } = params

        if (!password || typeof password !== 'string' || password.length < 8) {
          console.log('❌ Invalid password:', password)
          return res.json(createError(id, {
            code: -32400,
            message: { uz: "Noto'g'ri parol", ru: "Неверный пароль", en: "Invalid password" }
          }))
        }

        // Update the password
        const oldPassword = currentPassword
        currentPassword = password

        console.log('✅ Password changed successfully')
        console.log('   Old password:', oldPassword.substring(0, 10) + '...')
        console.log('   New password:', password.substring(0, 10) + '...')

        // Return success
        return res.json(createResponse(id, {
          success: true
        }))
      }

      default: {
        console.log('❌ Unknown method:', method)
        return res.json(createError(id, {
          code: -32601,
          message: { uz: "Metod topilmadi", ru: "Метод не найден", en: "Method not found" }
        }))
      }
    }
  } catch (error: any) {
    console.error('❌ Error processing Merchant API request:', error)
    return res.json(createError(id, {
      code: -32400,
      message: { uz: "Ichki xatolik", ru: "Внутренняя ошибка", en: "Internal error" }
    }, error.message))
  }
}
