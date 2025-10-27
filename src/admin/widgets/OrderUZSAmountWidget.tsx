import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

const OrderUZSAmountWidget = () => {
  const { id } = useParams()
  const [exchangeRate, setExchangeRate] = useState<number>(12750)
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch exchange rate
    fetch('/admin/exchange-rate', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.rate) {
          setExchangeRate(data.rate)
        }
      })
      .catch(err => console.error('Failed to fetch exchange rate:', err))

    // Fetch order details
    if (id) {
      fetch(`/admin/orders/${id}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.order) {
            setOrderTotal(data.order.total || 0)
          }
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch order:', err)
          setLoading(false)
        })
    }
  }, [id])

  if (loading) {
    return null
  }

  // Convert USD to UZS
  const amountUSD = orderTotal // Order total is already in dollars
  const amountUZS = amountUSD * exchangeRate

  const formatUZS = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Amount in UZS</Heading>
      </div>
      <div className="px-6 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-ui-fg-subtle">USD Amount:</span>
            <span className="font-medium">{formatUSD(amountUSD)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ui-fg-subtle">Exchange Rate:</span>
            <span className="font-medium">{formatUZS(exchangeRate)} UZS/USD</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-ui-fg-subtle font-semibold">UZS Amount:</span>
            <span className="font-semibold text-lg">{formatUZS(amountUZS)} UZS</span>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderUZSAmountWidget
