import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

// POST /admin/products/attributes
// body: { productId: string, attributes: { size?: string, shape?: string, design_code?: string, color?: string, meter_square?: number } }
// Merges into product.metadata.attributes
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { productId, attributes } = (req.body || {}) as { productId?: string; attributes?: Record<string, any> }

  if (!productId) {
    return res.status(400).json({ message: "productId is required" })
  }
  if (!attributes || typeof attributes !== "object") {
    return res.status(400).json({ message: "attributes object is required" })
  }

  try {
    const productModuleService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
    const [product] = await productModuleService.listProducts({ id: [productId] }, { select: ["id", "metadata"] })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const merged = {
      ...(product.metadata || {}),
      attributes: { ...(product.metadata?.attributes || {}), ...attributes },
    }

    await productModuleService.updateProducts(productId, { metadata: merged })
    
    // Fetch the updated product to return
    const [updated] = await productModuleService.listProducts({ id: [productId] })
    return res.json({ success: true, product: updated })
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "Failed to update attributes" })
  }
}