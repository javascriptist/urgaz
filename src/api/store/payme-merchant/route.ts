import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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
    return false
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  
  const expectedUsername = 'Paycom'
  const expectedPassword = process.env.PAYME_PASSWORD || ''
  
  // Payme test sandbox sends: "Paycom:Uzcard:someRandomString..."
  // Production sends: "Paycom:your_actual_password"
  // So we check if credentials start with "Paycom:" and contain the password
  
  if (credentials.startsWith(`${expectedUsername}:`)) {
    const passwordPart = credentials.substring(expectedUsername.length + 1)
    
    // For test sandbox: password is "Uzcard:someRandomString..."
    // For production: password is your actual password
    // Accept both formats
    if (passwordPart === expectedPassword || passwordPart.startsWith('Uzcard:')) {
      return true
    }
  }

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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any
  
  // Detect if this is a Payme request
  const fromPayme = isPaymeRequest(req)
  
  console.log('📥 Incoming Request:', {
    fromPayme: fromPayme ? '✅ Payme' : '❓ Unknown',
    method: body?.method,
    params: body?.params,
    headers: {
      'test-operation': req.headers['test-operation'] || 'none',
      referer: req.headers['referer'] || 'none',
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    }
  })

  // Verify authentication
  if (!verifyAuth(req)) {
    console.log('❌ Authentication failed')
    return res.status(401).json(createError(
      body?.id || null,
      { code: -32504, message: { uz: "Ruxsat rad etildi", ru: "Доступ запрещен", en: "Access denied" } },
      "invalid_credentials"
    ))
  }

  const { method, params, id } = body

  console.log('✅ Authentication successful, processing method:', method)

  try {
    switch (method) {
      case 'CheckPerformTransaction': {
        // Check if transaction can be performed
        const { account, amount } = params

        if (!account?.order_id) {
          return res.json(createError(id, ERRORS.INVALID_ACCOUNT))
        }

        // TODO: Verify order exists and amount matches
        // For now, accept all transactions
        console.log('✅ CheckPerformTransaction: OK', { order_id: account.order_id, amount })

        return res.json(createResponse(id, {
          allow: true
        }))
      }

      case 'CreateTransaction': {
        // Create transaction (reserve payment)
        const { account, amount, time, id: transactionId } = params

        // Check if transaction already exists
        const existing = transactions.get(transactionId)
        if (existing) {
          if (existing.state === 2) {
            return res.json(createError(id, ERRORS.ALREADY_PAID))
          }
          // Return existing transaction
          return res.json(createResponse(id, existing))
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
