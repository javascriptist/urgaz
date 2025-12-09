import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Tabs } from "@medusajs/ui"
import { useNavigate, useLocation } from "react-router-dom"

const OrdersTogglePOSWidget = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if we're on the POS orders page or online orders route
  const isPOSPage = location.pathname.includes("/pos-orders")
  const isOnlinePage = location.pathname.includes("/orders-online")
  
  // Determine active tab
  let activeTab = "all"
  if (isPOSPage) {
    activeTab = "pos"
  } else if (isOnlinePage) {
    activeTab = "online"
  }

  const handleTabChange = (value: string) => {
    if (value === "pos") {
      // Redirect to POS orders page
      navigate("/pos-orders")
    } else if (value === "online") {
      // Redirect to online orders page
      navigate("/orders-online")
    } else {
      // Show all orders
      navigate("/orders")
    }
  }

  return (
    <div className="mb-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Trigger value="all">All Orders</Tabs.Trigger>
          <Tabs.Trigger value="online">Online</Tabs.Trigger>
          <Tabs.Trigger value="pos">POS</Tabs.Trigger>
        </Tabs.List>
      </Tabs>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default OrdersTogglePOSWidget
