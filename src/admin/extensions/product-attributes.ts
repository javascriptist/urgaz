import { defineRouteConfig } from "@medusajs/admin-sdk"
import ProductAttributesWidget from "../widgets/ProductAttributesWidget"

export default defineRouteConfig({
  label: "Carpet Attributes",
  path: "/products/:id/attributes",
  Component: ProductAttributesWidget,
})