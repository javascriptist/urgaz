import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"
import { getExchangeRate as getSharedRate } from "../../../lib/exchange-rate"
import {
  acceptedKeys,
  createTransaction,
  findPendingForOrder,
  findTransaction,
  safeEqual,
  saveKey,
  statement,
  toPayme,
  updateTransaction,
} from "../../../lib/payme-store"

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

// Transactions and the merchant key are stored in the database (src/modules/payme),
// so they survive restarts and deploys.

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

// Verify Payme authentication: Basic "Paycom:<key>" where <key> is the
// merchant key (set via ChangePassword, else PAYME_PASSWORD) or the optional
// sandbox key PAYME_TEST_PASSWORD. Nothing else is accepted — the
// "test-operation" header can be sent by anyone, so it grants nothing.
async function verifyAuth(req: MedusaRequest): Promise<boolean> {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    console.log('🔒 Payme auth failed: no Basic auth header')
    return false
  }

  const credentials = Buffer.from(authHeader.split(' ')[1] ?? '', 'base64').toString('utf-8')
  if (!credentials.startsWith('Paycom:')) {
    console.log('🔒 Payme auth failed: wrong username')
    return false
  }

  const passwordPart = credentials.substring('Paycom:'.length)
  const keys = await acceptedKeys(req.scope)
  const ok = keys.some((k) => safeEqual(passwordPart, k))
  if (!ok) console.log('🔒 Payme auth failed: key mismatch')
  return ok
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
        select: ["id", "display_id", "total", "currency_code", "summary"],
        relations: ["summary"]
      })
      order = allOrders.find((o: any) => o.display_id === displayId) || null
    } else {
      // It's a string, search by full order ID
      console.log('🔍 Looking for order by ID:', orderIdOrDisplayId)
      const orders = await orderModuleService.listOrders({ id: orderIdOrDisplayId }, {
        select: ["id", "display_id", "total", "currency_code", "summary"],
        relations: ["summary"]
      })
      order = orders && orders.length > 0 ? orders[0] : null
    }
    
    if (!order) {
      console.log('❌ Order not found:', orderIdOrDisplayId)
      return { valid: false, error: 'NOT_FOUND' }
    }
    
    console.log('✅ Order found:', {
      id: order.id,
      display_id: order.display_id,
      total: order.total,
      summary_total: order.summary?.total
    })
    
    // Get exchange rate (USD to UZS)
    const exchangeRate = (await getSharedRate(req.scope)).rate;
    
    // Order total is already in USD dollars (e.g., total: 45 = $45.00)
    // Try order.total first, then order.summary.total as fallback
    // Convert: USD → UZS → Tiyin
    const orderTotalUSD = Number(order.total) || Number(order.summary?.total) || 0
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
  if (!(await verifyAuth(req))) {
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
        const existing = await findTransaction(req.scope, transactionId)
        if (existing) {
          console.log('✅ Returning existing transaction (idempotent):', transactionId)
          if (existing.state === 2) {
            return res.json(createError(id, ERRORS.ALREADY_PAID))
          }
          // Return existing transaction (same result as first call)
          return res.json(createResponse(id, toPayme(existing)))
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
        const existingTx = await findPendingForOrder(req.scope, String(orderId), transactionId)
        {
          // If there's a pending transaction (state 1) with different ID, reject new one
          if (existingTx) {
            console.log('❌ Order already has different pending transaction:', { orderId, existing: existingTx.id, new: transactionId })
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

        // Create new transaction (state 1: created, awaiting payment)
        const created = await createTransaction(req.scope, {
          id: transactionId,
          order_key: String(orderId),
          order_id: validation.order?.id ?? null,
          amount,
          create_time: Number(time) || Date.now(),
        })

        console.log('✅ Transaction created:', transactionId)

        return res.json(createResponse(id, toPayme(created)))
      }

      case 'PerformTransaction': {
        // Perform transaction (complete payment)
        const { id: transactionId } = params

        const found = await findTransaction(req.scope, transactionId)
        if (!found) {
          return res.json(createError(id, ERRORS.TRANSACTION_NOT_FOUND))
        }

        if (found.state === 2) {
          // Already performed
          return res.json(createResponse(id, toPayme(found)))
        }

        if (found.state === -1 || found.state === -2) {
          return res.json(createError(id, ERRORS.TRANSACTION_CANCELLED))
        }

        // Update transaction state to performed
        const transaction = toPayme(
          await updateTransaction(req.scope, transactionId, { state: 2, perform_time: new Date() })
        )

        console.log('✅ Transaction performed:', transactionId)

        // Mark order as paid in your system
        try {
          // Extract order_id from the transaction
          // We need to find which order this transaction belongs to
          const orderId: string | null = found.order_id ?? found.order_key ?? null

          if (orderId) {
            console.log('💳 Marking order as paid:', orderId)
            
            // Get order module to update the order
            const orderModuleService = req.scope.resolve(Modules.ORDER)
            
            // Find the order (by display_id or UUID)
            let order: any = null
            const displayId = parseInt(orderId)
            
            if (!isNaN(displayId)) {
              const allOrders = await orderModuleService.listOrders({}, { 
                select: ["id", "display_id", "metadata"]
              })
              order = allOrders.find((o: any) => o.display_id === displayId) || null
            } else {
              const orders = await orderModuleService.listOrders({ id: orderId }, {
                select: ["id", "display_id", "metadata"]
              })
              order = orders && orders.length > 0 ? orders[0] : null
            }

            if (order) {
              // Update order metadata and payment status
              await orderModuleService.updateOrders(order.id, {
                metadata: {
                  ...(order.metadata || {}),
                  payme_transaction_id: transactionId,
                  payme_paid_at: new Date().toISOString(),
                  payment_method: 'payme',
                  payment_captured: true,
                  payment_status_override: 'paid'
                }
              })
              
              console.log('✅ Order marked as paid:', {
                orderId: order.id,
                display_id: order.display_id,
                transaction: transactionId,
                payment_method: 'payme',
                paid_at: new Date().toISOString()
              })
            } else {
              console.warn('⚠️ Could not find order to mark as paid:', orderId)
            }
          } else {
            console.warn('⚠️ Could not find order for transaction:', transactionId)
          }
        } catch (error) {
          console.error('❌ Error marking order as paid:', error)
          // Don't fail the transaction if marking order fails
        }

        return res.json(createResponse(id, transaction))
      }

      case 'CancelTransaction': {
        // Cancel transaction
        const { id: transactionId, reason } = params

        const found = await findTransaction(req.scope, transactionId)
        if (!found) {
          return res.json(createError(id, ERRORS.TRANSACTION_NOT_FOUND))
        }

        // Already cancelled: return as-is (idempotent)
        if (found.state === -1 || found.state === -2) {
          return res.json(createResponse(id, toPayme(found)))
        }

        const wasPerformed = found.state === 2
        const updated = await updateTransaction(req.scope, transactionId, {
          state: wasPerformed ? -2 : -1, // -2 after perform (refund), -1 before
          cancel_time: new Date(),
          reason: typeof reason === 'number' ? reason : null,
        })

        // A refund of a performed payment: the order is no longer paid
        if (wasPerformed && found.order_id) {
          try {
            const orderModuleService = req.scope.resolve(Modules.ORDER)
            const order = await orderModuleService.retrieveOrder(found.order_id, { select: ['id', 'metadata'] })
            await orderModuleService.updateOrders(found.order_id, {
              metadata: {
                ...(order.metadata || {}),
                payment_captured: false,
                payment_status_override: 'refunded',
                payme_refunded_at: new Date().toISOString(),
              },
            })
          } catch (error) {
            console.error('❌ Error marking order as refunded:', error)
          }
        }

        console.log('✅ Transaction cancelled:', transactionId, wasPerformed ? '(after perform)' : '')

        return res.json(createResponse(id, toPayme(updated)))
      }

      case 'CheckTransaction': {
        // Check transaction status
        const { id: transactionId } = params

        const found = await findTransaction(req.scope, transactionId)
        if (!found) {
          return res.json(createError(id, ERRORS.TRANSACTION_NOT_FOUND))
        }

        return res.json(createResponse(id, toPayme(found)))
      }

      case 'GetStatement': {
        // Get list of transactions for a period
        const { from, to } = params

        const transactionsList = await statement(req.scope, Number(from), Number(to))

        console.log('✅ GetStatement:', { from, to, count: transactionsList.length })

        return res.json(createResponse(id, {
          transactions: transactionsList
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

        // Persist the new key (never log it)
        await saveKey(req.scope, password)

        console.log('✅ Payme merchant key changed')

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
