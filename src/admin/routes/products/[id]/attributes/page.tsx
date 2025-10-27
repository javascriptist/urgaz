import { Container, Heading } from "@medusajs/ui"
import ProductAttributesWidget from "../../../../widgets/ProductAttributesWidget"

export default function ProductAttributesPage() {
  return (
    <Container>
      <div className="flex flex-col gap-y-2">
        <Heading level="h1">Carpet Attributes</Heading>
        <ProductAttributesWidget />
      </div>
    </Container>
  )
}
