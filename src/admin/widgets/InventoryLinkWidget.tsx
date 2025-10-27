import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container } from "@medusajs/ui"
import { SquaresPlus } from "@medusajs/icons"
import { useNavigate } from "react-router-dom"

const InventoryLinkWidget = () => {
  const navigate = useNavigate()

  return (
    <Container className="p-0">
      <button
        onClick={() => navigate("/products-inventory")}
        className="w-full flex items-center gap-3 px-4 py-3 text-ui-fg-subtle hover:bg-ui-bg-subtle-hover transition-colors cursor-pointer border-b border-ui-border-base"
      >
        <SquaresPlus className="text-ui-fg-muted" />
        <div className="flex flex-col items-start">
          <span className="text-ui-fg-base font-medium text-sm">Search and filter the products </span>
          <span className="text-ui-fg-subtle text-xs">Manage product attributes and filters</span>
        </div>
      </button>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default InventoryLinkWidget
