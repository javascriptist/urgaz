import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { CreditCard } from "@medusajs/icons"

const PaymeTestPage = () => {
  return (
    <Container>
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="text-ui-fg-base" />
        <Heading level="h1">Payme Integration</Heading>
      </div>
      
      <div className="space-y-6">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-blue-900">
            ℹ️ Testing Moved to Storefront
          </h2>
          <p className="text-blue-800 mb-4">
            Payme payment testing should be done in your <strong>storefront</strong> (customer-facing website), 
            not in the admin panel. This is because Medusa requires a publishable API key for security.
          </p>
          
          <div className="bg-white p-4 rounded border border-blue-200">
            <h3 className="font-semibold mb-2">✅ Backend Setup Complete:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Merchant API billing endpoint: <code>/store/payme-merchant</code></li>
              <li>Payment link generator: <code>/store/payme-merchant/generate-link</code></li>
              <li>Ngrok HTTPS tunnel active</li>
              <li>Billing URL registered in Payme dashboard</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            📖 Next Steps
          </h2>
          <ol className="list-decimal list-inside space-y-3">
            <li className="font-medium">
              Read the integration guide:
              <div className="mt-2 p-3 bg-gray-50 rounded font-mono text-sm">
                PAYME_STOREFRONT_INTEGRATION.md
              </div>
            </li>
            
            <li className="font-medium">
              Add payment button to your checkout page:
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto whitespace-pre-wrap">
{`// In your storefront checkout page
const response = await fetch(
  'https://9ed63f6b6a5f.ngrok-free.app/store/payme-merchant/generate-link',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': 'pk_fe768fd98de7445ef718c37c9f15616430e92f90bf71aafb27d249faed5e158b'
    },
    body: JSON.stringify({
      orderId: cart.id,
      amount: cart.total,
      callbackUrl: 'https://yoursite.com/order/confirmed'
    })
  }
)

const { paymentUrl } = await response.json()
window.location.href = paymentUrl // Redirect to Payme`}</pre>
            </li>
            
            <li className="font-medium">
              Or use the simple HTML test file:
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                See <code>test-payment.html</code> example in the guide
              </div>
            </li>
          </ol>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            <strong>💡 Tip:</strong> Your backend is fully configured. You just need to add the payment button 
            to your storefront's checkout flow. Customers will be redirected to Payme's payment page, 
            and Payme will call your backend to confirm the payment.
          </p>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payme Test",
  icon: CreditCard,
})

export default PaymeTestPage
