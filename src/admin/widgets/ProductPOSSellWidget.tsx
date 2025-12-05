import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Heading, Input, Label, Textarea, toast, Container } from "@medusajs/ui"
import { useState } from "react"
import { BuildingStorefront } from "@medusajs/icons"

const ProductPOSSellWidget = () => {
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string>("")
  const [stockLocations, setStockLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")

  // Get product ID from URL
  const productId = window.location.pathname.split("/products/")[1]

  const [productData, setProductData] = useState<any>(null)

  // Fetch stock locations
  const fetchLocations = async () => {
    try {
      const response = await fetch(`/admin/stock-locations`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setStockLocations(data.stock_locations || [])
        // Set default location to first one
        if (data.stock_locations?.length > 0) {
          setSelectedLocationId(data.stock_locations[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  // Fetch product data
  const fetchProduct = async () => {
    try {
      const response = await fetch(`/admin/products/${productId}`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setProductData(data.product)
        // Set default variant to first one
        if (data.product?.variants?.length > 0) {
          setSelectedVariantId(data.product.variants[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    }
  }

  // Fetch on mount
  if (!productData && productId) {
    fetchProduct()
    fetchLocations()
  }

  const handleSubmit = async () => {
    if (!productData) {
      toast.error("Product data not loaded")
      return
    }

    const variant = productData.variants?.find((v: any) => v.id === selectedVariantId)
    if (!variant) {
      toast.error("No variant selected")
      return
    }

    const price = variant.prices?.[0]?.amount || variant.calculated_price?.calculated_amount || 0

    setLoading(true)
    try {
      const response = await fetch("/admin/pos/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: [
            {
              variant_id: variant.id,
              quantity: quantity,
              unit_price: price,
            },
          ],
          payment_method: paymentMethod,
          customer_name: customerName || "Walk-in Customer",
          notes: notes,
          location_id: selectedLocationId,
        }),
      })

      if (response.ok) {
        toast.success("In-store sale recorded successfully!")
        // Reset form
        setQuantity(1)
        setCustomerName("")
        setNotes("")
        setExpanded(false)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to record sale")
      }
    } catch (error) {
      console.error("Error creating in-store order:", error)
      toast.error("Failed to record sale")
    } finally {
      setLoading(false)
    }
  }

  if (!productData) {
    return null
  }

  const selectedVariant = productData.variants?.find((v: any) => v.id === selectedVariantId)
  const price = selectedVariant?.prices?.[0]?.amount || selectedVariant?.calculated_price?.calculated_amount || 0
  const total = price * quantity

  return (
    <Container className="border border-ui-border-base rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BuildingStorefront className="text-ui-fg-muted" />
          <Heading level="h3" className="text-ui-fg-base">Sell In-Store</Heading>
        </div>
        {!expanded && (
          <Button variant="secondary" onClick={() => setExpanded(true)} size="small">
            Quick Sell
          </Button>
        )}
      </div>

      {expanded && (
        <div className="space-y-4">
          <div className="text-sm text-ui-fg-subtle mb-4">
            Record an in-store sale for this product
          </div>

          {stockLocations.length > 1 && (
            <div>
              <Label htmlFor="location">Stock Location</Label>
              <select
                id="location"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-base text-ui-fg-base"
              >
                {stockLocations.map((location: any) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {productData.variants && productData.variants.length > 1 && (
            <div>
              <Label htmlFor="variant">Variant / Option</Label>
              <select
                id="variant"
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-base text-ui-fg-base"
              >
                {productData.variants.map((variant: any) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.title || "Default Variant"}
                    {variant.prices?.[0]?.amount ? ` - $${variant.prices[0].amount.toFixed(2)}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label htmlFor="customer">Customer Name (Optional)</Label>
            <Input
              id="customer"
              type="text"
              placeholder="Walk-in Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="payment">Payment Method</Label>
            <select
              id="payment"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-base text-ui-fg-base"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mixed">Mixed</option>
              <option value="nasiya">Pay Later (Nasiya)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="pt-4 border-t border-ui-border-base">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-ui-fg-subtle">Total:</span>
              <span className="text-lg font-bold text-ui-fg-base">
                ${total.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setExpanded(false)} 
                className="flex-1"
                size="small"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="flex-1"
                size="small"
              >
                {loading ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductPOSSellWidget
