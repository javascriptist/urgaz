import { useEffect, useState } from "react"
import { Container, Heading, Table, Badge, Tabs } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"

interface Order {
  id: string
  display_id: number
  email: string
  created_at: string
  status: string
  payment_status: string
  fulfillment_status: string
  total: number
  currency_code: string
}

const formatPriceInUZS = (amount: number, currencyCode: string) => {
  // If amount is in USD, convert to UZS (exchange rate: 12,750)
  if (currencyCode.toLowerCase() === "usd") {
    const amountInUZS = amount * 12750 / 100 // amount is in cents
    return new Intl.NumberFormat("uz-UZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInUZS) + " so'm"
  }
  
  // Otherwise format as-is
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100)
}

const OrdersOnlinePage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOnlineOrders = async () => {
      try {
        const response = await fetch("/admin/orders/online", {
          credentials: "include",
        })
        const data = await response.json()
        setOrders(data.orders || [])
      } catch (error) {
        console.error("Failed to fetch online orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOnlineOrders()
  }, [])

  const handleRowClick = (orderId: string) => {
    navigate(`/orders/${orderId}`)
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <p>Loading online orders...</p>
        </div>
      </Container>
    )
  }

  return (
    <>
      <div className="pb-6">
        <Tabs value="online" onValueChange={(value) => {
          if (value === "all") navigate("/orders")
          else if (value === "online") navigate("/orders-online")
          else if (value === "pos") navigate("/pos-orders")
        }}>
          <Tabs.List>
            <Tabs.Trigger value="all">All Orders</Tabs.Trigger>
            <Tabs.Trigger value="online">Online</Tabs.Trigger>
            <Tabs.Trigger value="pos">POS</Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>
      <Container>
        <div className="flex flex-col gap-y-4">
          <Heading level="h1">Online Orders</Heading>
        
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
            <p className="text-ui-fg-subtle">No online orders found</p>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Payment</Table.HeaderCell>
                <Table.HeaderCell>Fulfillment</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orders.map((order) => (
                <Table.Row
                  key={order.id}
                  className="cursor-pointer hover:bg-ui-bg-subtle"
                  onClick={() => handleRowClick(order.id)}
                >
                  <Table.Cell className="font-medium">
                    #{order.display_id}
                  </Table.Cell>
                  <Table.Cell>{order.email}</Table.Cell>
                  <Table.Cell>
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color="green">
                      {order.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      size="2xsmall" 
                      color={order.payment_status === "captured" ? "green" : "orange"}
                    >
                      {order.payment_status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge 
                      size="2xsmall"
                      color={order.fulfillment_status === "fulfilled" ? "green" : "orange"}
                    >
                      {order.fulfillment_status || "not_fulfilled"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {formatPriceInUZS(order.total, order.currency_code)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
    </>
  )
}

export default OrdersOnlinePage
