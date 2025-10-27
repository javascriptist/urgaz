import { useState, useEffect } from "react"
import { Container, Heading, Table, Badge, Button } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { ArrowUturnLeft } from "@medusajs/icons"

interface Order {
  id: string
  created_at: string
  currency_code: string
  summary: {
    total: number
  }
  metadata?: {
    sale_type: string
    payment_method: string
    customer_name: string
    notes?: string
    sold_at: string
    sold_by: string
  }
  items?: Array<{
    id: string
    title: string
    variant_title: string
    quantity: number
    unit_price: number
    total: number
  }>
}

const POSOrdersPage = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch("/admin/pos/orders?limit=100", {
        credentials: "include",
      })
      
      if (response.ok) {
        const data = await response.json()
        // reverse th list to show newest first
        data.orders.reverse()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to fetch in-store orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const calculateOrderTotal = (order: Order) => {
    // Try to get from summary first
    if (order.summary?.total && order.summary.total > 0) {
      return order.summary.total
    }
    // Calculate from items if summary is 0
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + (item.total || item.unit_price * item.quantity), 0)
    }
    return 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="flex justify-end mb-4 px-6">
        <Button 
          variant="secondary" 
          onClick={() => navigate("/orders")}
          size="small"
        >
          <ArrowUturnLeft className="mr-2" />
          Back to All Orders
        </Button>
      </div>
      
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Heading level="h1">In-Store Sales History</Heading>
        </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-ui-border-base overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date & Time</Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Items</Table.HeaderCell>
              <Table.HeaderCell>Payment</Table.HeaderCell>
              <Table.HeaderCell>Total</Table.HeaderCell>
              <Table.HeaderCell>Sold By</Table.HeaderCell>
              <Table.HeaderCell>Notes</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-8 text-ui-fg-subtle">
                  Loading...
                </Table.Cell>
              </Table.Row>
            ) : orders.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-8 text-ui-fg-muted">
                  No in-store sales found
                </Table.Cell>
              </Table.Row>
            ) : (
              orders.map((order) => (
                <Table.Row
                  key={order.id}
                  className="cursor-pointer hover:bg-ui-bg-subtle-hover transition-colors"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <Table.Cell>
                    <div className="text-sm text-ui-fg-base">
                      {formatDate(order.metadata?.sold_at || order.created_at)}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-ui-fg-base">
                      {order.metadata?.customer_name || "Walk-in"}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-ui-fg-subtle text-sm">
                      {order.items?.length || 0} item(s)
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        order.metadata?.payment_method === "cash"
                          ? "green"
                          : order.metadata?.payment_method === "card"
                          ? "blue"
                          : "orange"
                      }
                    >
                      {order.metadata?.payment_method || "cash"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="font-medium text-ui-fg-base">
                    {formatPrice(calculateOrderTotal(order), order.currency_code)}
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle text-sm">
                    {order.metadata?.sold_by || "-"}
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle text-sm max-w-xs truncate">
                    {order.metadata?.notes || "-"}
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      <div className="mt-4 text-sm text-ui-fg-subtle">
        Showing {orders.length} in-store sale{orders.length !== 1 ? "s" : ""}
      </div>
    </Container>
    </>
  )
}

export default POSOrdersPage
