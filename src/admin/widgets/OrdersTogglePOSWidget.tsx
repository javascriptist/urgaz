import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button } from "@medusajs/ui"
import { BuildingStorefront, ArrowUturnLeft } from "@medusajs/icons"
import { useNavigate, useLocation } from "react-router-dom"

const OrdersTogglePOSWidget = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if we're on the POS orders page
  const isPOSPage = location.pathname.includes("/pos-orders")

  const handleToggle = () => {
    if (isPOSPage) {
      // Go back to regular orders
      navigate("/orders")
    } else {
      // Go to POS orders
      navigate("/pos-orders")
    }
  }

  return (
    <div className="flex justify-end mb-4">
      <Button 
        variant="secondary" 
        onClick={handleToggle}
        size="small"
      >
        {isPOSPage ? (
          <>
            <ArrowUturnLeft className="mr-2" />
            Back to All Orders
          </>
        ) : (
          <>
            <BuildingStorefront className="mr-2" />
            View POS Orders
          </>
        )}
      </Button>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default OrdersTogglePOSWidget
