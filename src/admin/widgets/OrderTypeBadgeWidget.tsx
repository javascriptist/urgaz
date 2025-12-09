import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge } from "@medusajs/ui"
import { DetailedHTMLProps, HTMLAttributes } from "react"

// This widget adds a badge to show if an order is from POS or Online
const OrderTypeBadgeWidget = ({ data }: { data: any }) => {
  const order = data
  
  // Check if this is a POS order
  const isPOSOrder = order?.metadata?.sale_type === "in-store"
  
  if (!isPOSOrder) {
    return (
      <Badge size="2xsmall" color="blue">
        Online
      </Badge>
    )
  }
  
  return (
    <Badge size="2xsmall" color="orange">
      POS
    </Badge>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.after",
})

export default OrderTypeBadgeWidget
