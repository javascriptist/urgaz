import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Heading, Input, Label, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"
import { BuildingStorefront, XMark } from "@medusajs/icons"

interface POSSellModalProps {
  product: any
  onClose: () => void
}

const POSSellModal = ({ product, onClose }: POSSellModalProps) => {
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Get the first variant and its price
  const variant = product.variants?.[0]
  const price = variant?.prices?.[0]?.amount || 0

  const handleSubmit = async () => {
    if (!variant) {
      toast.error("No variant available for this product")
      return
    }

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
        }),
      })

      if (response.ok) {
        toast.success("In-store sale recorded successfully!")
        onClose()
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

  const total = price * quantity

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-ui-bg-base rounded-lg shadow-elevation-modal max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-ui-border-base">
          <Heading level="h2" className="text-ui-fg-base">Sell In-Store</Heading>
          <button onClick={onClose} className="text-ui-fg-muted hover:text-ui-fg-base">
            <XMark />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="font-medium text-ui-fg-base mb-2">{product.title}</div>
            <div className="text-sm text-ui-fg-subtle">
              {variant?.title || "Default variant"} • {price.toLocaleString()} UZS
            </div>
          </div>

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
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this sale..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="pt-4 border-t border-ui-border-base">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-ui-fg-base">Total:</span>
              <span className="text-xl font-bold text-ui-fg-base">
                {total.toLocaleString()} UZS
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// const POSSellButtonWidget = () => {
//   const [showModal, setShowModal] = useState(false)
//   const [selectedProduct, setSelectedProduct] = useState<any>(null)

//   // This is a placeholder - in reality, you'd need to pass product data
//   // For now, we'll create a link to POS orders page
//   return (
//     <div className="mb-4">
//       <Button
//         variant="secondary"
//         onClick={() => window.location.href = "/app/pos-orders"}
//         className="flex items-center gap-2"
//       >
//         <BuildingStorefront />
//         View In-Store Sales
//       </Button>
//     </div>
//   )
// }

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

// export default POSSellButtonWidget
