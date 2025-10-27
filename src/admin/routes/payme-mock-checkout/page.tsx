import { Container, Heading, Button, Text } from "@medusajs/ui"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useState } from "react"

const MockPaymeCheckout = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  const receiptId = searchParams.get('receipt_id')
  const orderId = searchParams.get('order_id')
  const amount = searchParams.get('amount')

  const handlePaymentSuccess = async () => {
    setLoading(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In real scenario, webhook would be called here
    alert(`✅ Mock Payment Successful!\n\nReceipt: ${receiptId}\nOrder: ${orderId}\nAmount: ${amount} UZS\n\nIn production, Payme would send webhook to your backend.`)
    
    setLoading(false)
    
    // Return to admin
    navigate('/app/payme-test')
  }

  const handlePaymentCancel = () => {
    alert('❌ Payment Cancelled')
    navigate('/app/payme-test')
  }

  return (
    <Container className="max-w-2xl mx-auto py-8">
      <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-8">
        {/* Mock Payme Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full mb-4">
            <Text className="font-bold text-lg">💳 PAYME (Mock)</Text>
          </div>
          <Heading level="h2" className="mb-2">Complete Payment</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            This is a simulated Payme checkout page
          </Text>
        </div>

        {/* Payment Details */}
        <div className="bg-ui-bg-subtle rounded-lg p-6 mb-6">
          <Heading level="h3" className="mb-4">Payment Details</Heading>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <Text className="text-ui-fg-subtle">Receipt ID:</Text>
              <Text className="font-mono text-sm">{receiptId}</Text>
            </div>
            <div className="flex justify-between">
              <Text className="text-ui-fg-subtle">Order ID:</Text>
              <Text className="font-semibold">{orderId}</Text>
            </div>
            <div className="border-t border-ui-border-base pt-3 mt-3">
              <div className="flex justify-between items-center">
                <Text className="text-lg font-semibold">Total Amount:</Text>
                <Text className="text-2xl font-bold text-blue-600">
                  {parseInt(amount || '0').toLocaleString()} UZS
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Mock Card Input */}
        <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-6 mb-6">
          <Heading level="h3" className="mb-4">Payment Method</Heading>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <Text className="text-sm opacity-75 mb-2">Card Number</Text>
              <Text className="text-xl font-mono tracking-wider mb-4">
                8600 •••• •••• 1234
              </Text>
              <div className="flex justify-between">
                <div>
                  <Text className="text-xs opacity-75">Valid Thru</Text>
                  <Text className="font-mono">12/25</Text>
                </div>
                <div className="text-right">
                  <Text className="text-xs opacity-75">CVV</Text>
                  <Text className="font-mono">•••</Text>
                </div>
              </div>
            </div>

            <Text className="text-xs text-ui-fg-subtle text-center">
              🧪 This is a mock payment card for testing
            </Text>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={handlePaymentCancel}
            variant="secondary"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentSuccess}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Processing..." : "Pay Now"}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Text className="text-sm text-yellow-800">
            <strong>🧪 Mock Payment Mode</strong>
            <br />
            This is a simulated Payme checkout. In production, users would be on the actual Payme website (checkout.paycom.uz).
          </Text>
        </div>

        {/* Payment Flow Info */}
        <div className="mt-6 p-4 bg-ui-bg-subtle rounded-lg">
          <Text className="text-xs text-ui-fg-subtle font-semibold mb-2">
            What happens when you click "Pay Now":
          </Text>
          <ol className="text-xs text-ui-fg-subtle space-y-1 list-decimal list-inside">
            <li>Payment simulated as successful</li>
            <li>In production: Payme sends webhook to your backend</li>
            <li>Your backend marks order as paid</li>
            <li>Customer redirected to confirmation page</li>
          </ol>
        </div>
      </div>
    </Container>
  )
}

export default MockPaymeCheckout
