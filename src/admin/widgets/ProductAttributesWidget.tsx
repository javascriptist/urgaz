import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Container, Heading, Input, Button, toast } from "@medusajs/ui"
import { defineWidgetConfig } from "@medusajs/admin-sdk"

interface ProductAttributesWidgetProps {
  onClose?: () => void
}

const ProductAttributesWidget = ({ onClose }: ProductAttributesWidgetProps) => {
  const { id } = useParams()
  const [attributes, setAttributes] = useState({
    width: "",
    length: "", // Actual length measurement
    shape: "",
    design_code: "",
    color: "",
    meter_square: "",
    carpet_type: "fixed", // Toggle: "fixed" or "roll"
  })

  // Auto-calculate meter square when width and length change
  const calculateMeterSquare = (width: string, length: string, carpetType: string) => {
    if (carpetType === "roll") {
      return "" // Don't calculate for roll carpets (customer chooses length)
    }
    
    // Extract numeric values from width and length
    const widthNum = parseFloat(width.replace(/[^0-9.]/g, ''))
    const lengthNum = parseFloat(length.replace(/[^0-9.]/g, ''))
    
    if (widthNum && lengthNum && !isNaN(widthNum) && !isNaN(lengthNum)) {
      return (widthNum * lengthNum).toFixed(2)
    }
    return ""
  }
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetch(`/admin/products/${id}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          const attrs = data.product?.metadata?.attributes || {}
          setAttributes({
            width: attrs.width || attrs.size?.split('x')?.[0]?.trim() || "",
            length: attrs.length || attrs.size?.split('x')?.[1]?.trim() || "",
            shape: attrs.shape || "",
            design_code: attrs.design_code || "",
            color: attrs.color || "",
            meter_square: attrs.meter_square || "",
            carpet_type: attrs.carpet_type || "fixed",
          })
        })
        .catch((err) => {
          console.error("Failed to fetch product attributes:", err)
          toast.error("Failed to load product attributes")
        })
    }
  }, [id])

  const handleSave = async () => {
    if (!id) {
      toast.error("Product ID is missing")
      return
    }
    setLoading(true)
    try {
      // Process carpet attributes
      const processedAttributes: any = { ...attributes }
      
      if (attributes.carpet_type === "roll") {
        // Add roll carpet defaults for customer length selection
        processedAttributes.min_length = 1
        processedAttributes.max_length = 50
        // Length field represents stock length (how much we have to cut from)
        processedAttributes.stock_length = attributes.length
      } else {
        // For fixed carpets, create legacy size field for backward compatibility
        if (attributes.width && attributes.length) {
          processedAttributes.size = `${attributes.width}x${attributes.length}`
        }
      }

      const response = await fetch(`/admin/products/attributes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ productId: id, attributes: processedAttributes }),
      })
      if (response.ok) {
        toast.success("Attributes saved successfully")
        if (onClose) onClose()
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.message || "Failed to save attributes")
      }
    } catch (error) {
      toast.error("Error saving attributes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Heading level="h2">Carpet Attributes</Heading>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1">Width</label>
          <Input
            placeholder="e.g., 4.5m"
            value={attributes.width}
            onChange={(e) => {
              const newWidth = e.target.value
              const newMeterSquare = calculateMeterSquare(newWidth, attributes.length, attributes.carpet_type)
              setAttributes({ 
                ...attributes, 
                width: newWidth,
                meter_square: newMeterSquare
              })
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Length</label>
          <Input
            placeholder="e.g., 2.5m"
            value={attributes.length}
            onChange={(e) => {
              const newLength = e.target.value
              const newMeterSquare = calculateMeterSquare(attributes.width, newLength, attributes.carpet_type)
              setAttributes({ 
                ...attributes, 
                length: newLength,
                meter_square: newMeterSquare
              })
            }}
          />
          <small className="text-gray-500">Actual length measurement of the carpet</small>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Carpet Type</label>
          <select
            value={attributes.carpet_type}
            onChange={(e) => {
              const newType = e.target.value
              const newMeterSquare = calculateMeterSquare(attributes.width, attributes.length, newType)
              setAttributes({ 
                ...attributes, 
                carpet_type: newType,
                meter_square: newMeterSquare
              })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fixed">Fixed Size (sold as complete carpet)</option>
            <option value="roll">Roll Carpet (customers choose length, cut from stock)</option>
          </select>
          <small className="text-gray-500">Roll carpets allow customers to order custom lengths</small>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Shape</label>
          <Input
            placeholder="e.g., round, oval, rectangular"
            value={attributes.shape}
            onChange={(e) => setAttributes({ ...attributes, shape: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Design Code</label>
          <Input
            placeholder="e.g., ABC123"
            value={attributes.design_code}
            onChange={(e) => setAttributes({ ...attributes, design_code: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <Input
            placeholder="e.g., red"
            value={attributes.color}
            onChange={(e) => setAttributes({ ...attributes, color: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Meter Square 
            {attributes.carpet_type === "fixed" && attributes.meter_square && (
              <span className="text-green-600 text-xs ml-1">✓ Auto-calculated</span>
            )}
          </label>
          <Input
            type="number"
            placeholder={attributes.carpet_type === "roll" ? "N/A for roll carpets" : "Auto-calculated from width × length"}
            value={attributes.meter_square}
            onChange={(e) => setAttributes({ ...attributes, meter_square: e.target.value })}
            disabled={attributes.carpet_type === "fixed" && Boolean(attributes.width && attributes.length)}
            className={attributes.carpet_type === "fixed" && attributes.width && attributes.length ? "bg-green-50" : ""}
          />
          {attributes.carpet_type === "roll" && (
            <small className="text-gray-500">For roll carpets, area depends on customer's chosen length. Stock length: {attributes.length || 'not set'}</small>
          )}
          {attributes.carpet_type === "fixed" && (
            <small className="text-gray-500">Fixed size carpet - complete area calculation</small>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        {onClose && <Button variant="secondary" onClick={onClose}>Cancel</Button>}
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Attributes"}
        </Button>
      </div>
    </Container>
  )
}

// Export the config separately
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

// Export the component as default
export default ProductAttributesWidget