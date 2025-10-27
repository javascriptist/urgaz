import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IProductModuleService, IInventoryService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

// GET /admin/products/by-attributes?attr[size]=4.5x2.5&attr[shape]=round&attr[design_code]=ABC&attr[color]=red&attr[meter_square]=11.25&q=carpet&limit=20&offset=0
// Filters by ALL provided attributes (logical AND) and optional text query.
// Attributes: size (string, e.g. "4.5x2.5"), shape (string, e.g. "round"), design_code (string), color (string), meter_square (number)
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query.q as string | undefined)?.trim() || ""
  const sku = (req.query.sku as string | undefined)?.trim() || ""
  const collection_id = (req.query.collection_id as string | undefined)?.trim() || ""
  const attr = (req.query.attr || {}) as Record<string, string>
  const limit = Math.min(parseInt((req.query.limit as string) || "100", 10), 1000)
  const offset = parseInt((req.query.offset as string) || "0", 10)

  const productModuleService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const inventoryService = req.scope.resolve<IInventoryService>(Modules.INVENTORY)
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  try {
    // Build filter object for listProducts
    const filters: any = {}
    if (q) {
      filters.title = { $ilike: `%${q}%` }
    }
    if (collection_id) {
      filters.collection_id = collection_id
    }

    // Get all products with variants
    let allProducts = await productModuleService.listProducts(
      filters,
      { 
        skip: offset, 
        take: limit, 
        select: ["id", "title", "handle", "status", "metadata"],
        relations: ["collection", "variants"]
      }
    )

    console.log(`Found ${allProducts.length} products`)

    // Filter by SKU if provided
    if (sku) {
      allProducts = allProducts.filter((p: any) => 
        p.variants?.some((v: any) => 
          v.sku?.toLowerCase().includes(sku.toLowerCase())
        )
      )
      console.log(`After SKU filter: ${allProducts.length} products`)
    }

    // Filter by attributes in-memory (AND logic)
    const pairs = Object.entries(attr).filter(([_, v]) => `${v}`.length > 0)
    const filtered = pairs.length
      ? allProducts.filter((p: any) => {
          const a = (p.metadata?.attributes || {}) as Record<string, any>
          return pairs.every(([k, v]) => {
            if (k === "meter_square") {
              // Numeric comparison for meter_square
              return parseFloat(`${a[k]}`) === parseFloat(v)
            }
            return `${a[k]}` === `${v}`
          })
        })
      : allProducts

    // Fetch inventory for all variants using remoteQuery
    const variantIds = filtered.flatMap((p: any) => p.variants?.map((v: any) => v.id) || [])
    
    if (variantIds.length > 0) {
      try {
        // Query inventory items linked to variants
        const { data: inventoryData } = await remoteQuery({
          entryPoint: "variants",
          fields: [
            "id",
            "inventory_items.inventory_item_id",
            "inventory_items.inventory.id",
            "inventory_items.inventory.location_levels.id",
            "inventory_items.inventory.location_levels.stocked_quantity",
            "inventory_items.inventory.location_levels.available_quantity",
          ],
          variables: {
            filters: {
              id: variantIds
            }
          }
        })
        
        console.log(`Fetched inventory for ${inventoryData?.length || 0} variants`)
        
        // Map inventory levels to variants
        const variantInventoryMap = new Map()
        
        if (inventoryData && Array.isArray(inventoryData)) {
          inventoryData.forEach((variant: any) => {
            const levels: any[] = []
            if (variant.inventory_items) {
              variant.inventory_items.forEach((invItem: any) => {
                if (invItem.inventory?.location_levels) {
                  levels.push(...invItem.inventory.location_levels)
                }
              })
            }
            variantInventoryMap.set(variant.id, levels)
          })
        }
        
        console.log(`Mapped inventory for ${variantInventoryMap.size} variants`)
        
        // Attach inventory levels to variants
        filtered.forEach((product: any) => {
          if (product.variants) {
            product.variants.forEach((variant: any) => {
              variant.inventory_levels = variantInventoryMap.get(variant.id) || []
            })
          }
        })
      } catch (invError: any) {
        console.error("Error fetching inventory:", invError.message, invError)
      }
    }

    return res.json({
      count: filtered.length,
      limit,
      offset,
      q: q || undefined,
      sku: sku || undefined,
      filters: Object.fromEntries(pairs),
      products: filtered,
    })
  } catch (e: any) {
    console.error("Error fetching products:", e)
    return res.status(500).json({ message: e.message, error: e.toString() })
  }
}