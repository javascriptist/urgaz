import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { paymeRpc, isPaymeEnabled } from "../../../lib/payme";

// Webhook endpoint for Payme Receipts API callbacks
// Configure this URL in your Payme Business dashboard:
// https://yourdomain.com/store/custom/payme-callback
//
// This handles Payme's notifications when payment status changes
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isPaymeEnabled()) {
    // Acknowledge to avoid repeated retries when feature is off
    return res.json({ result: { message: "ok" } })
  }
  
  const { method, params } = (req.body || {}) as any

  console.log('🔔 Payme Webhook Received:', { method, params })

  // Route based on Payme's Receipts API callback methods
  switch (method) {
    case "receipts.pay": {
      // ✅ Payment completed successfully!
      // params contains: account, amount, payment_id, receipt_id, etc.
      const orderId = params?.account?.order_id
      const amount = params?.amount
      const receiptId = params?.receipt_id || params?._id
      
      console.log('✅ Payment Success:', { orderId, amount, receiptId })
      
      // TODO: Mark order as paid in your database
      // Example:
      // await orderService.markAsPaid(orderId, {
      //   paymentProvider: 'payme',
      //   transactionId: receiptId,
      //   amount: amount
      // })
      
      return res.json({ 
        result: { 
          message: "ok",
          order_id: orderId 
        } 
      })
    }
    
    case "receipts.cancel": {
      // ❌ Payment was canceled or reversed
      const orderId = params?.account?.order_id
      const receiptId = params?.receipt_id || params?._id
      
      console.log('❌ Payment Cancelled:', { orderId, receiptId })
      
      // TODO: Mark order as canceled in your database
      // Example:
      // await orderService.cancel(orderId, {
      //   reason: 'Payment cancelled by Payme',
      //   transactionId: receiptId
      // })
      
      return res.json({ 
        result: { 
          message: "ok",
          order_id: orderId 
        } 
      })
    }
    
    case "receipts.check": {
      // 🔍 Payme checking receipt status
      const orderId = params?.account?.order_id
      
      console.log('🔍 Payment Check:', { orderId })
      
      // TODO: Check order status in your database and return
      // Example:
      // const order = await orderService.get(orderId)
      // if (!order) {
      //   return res.status(404).json({ 
      //     error: { code: -31050, message: "Order not found" } 
      //   })
      // }
      
      return res.json({ 
        result: { 
          message: "ok",
          order_id: orderId,
          status: "pending"  // or "paid", "cancelled"
        } 
      })
    }
    
    case "receipts.get": {
      // 📋 Payme requesting receipt details
      const receiptId = params?.receipt_id || params?._id
      
      console.log('📋 Get Receipt:', { receiptId })
      
      // TODO: Return receipt details from your database
      return res.json({ 
        result: { 
          message: "ok",
          receipt_id: receiptId 
        } 
      })
    }
    
    default: {
      // Unknown method
      console.warn('⚠️ Unknown webhook method:', method)
      return res.status(400).json({ 
        error: { 
          code: -32601, 
          message: "Method not found",
          data: method 
        } 
      })
    }
  }
}
