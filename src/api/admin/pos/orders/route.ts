import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

// GET /admin/pos/orders?limit=50&offset=0
// Get all in-store orders
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const limit = parseInt((req.query.limit as string) || "50", 10)
  const offset = parseInt((req.query.offset as string) || "0", 10)

  const orderModuleService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)

  try {
    // Get orders with in-store metadata
    const orders = await orderModuleService.listOrders(
      {
        // We'll filter by metadata in-memory since Medusa may not support metadata filters directly
      },
      {
        skip: offset,
        take: limit * 2, // Get more to filter
        relations: ["items"],
        select: ["id", "created_at", "currency_code", "summary", "metadata", "email"],
      }
    )

    // Filter for in-store orders
    const inStoreOrders = orders.filter((order: any) => 
      order.metadata?.sale_type === "in-store"
    ).slice(0, limit)

    console.log(`Found ${inStoreOrders.length} in-store orders`)
    if (inStoreOrders.length > 0) {
      console.log("First order summary:", inStoreOrders[0].summary, "Items:", inStoreOrders[0].items?.length)
    }

    return res.json({
      orders: inStoreOrders,
      count: inStoreOrders.length,
      limit,
      offset,
    })
  } catch (e: any) {
    console.error("Error fetching in-store orders:", e)
    return res.status(500).json({ 
      message: e.message, 
      error: e.toString() 
    })
  }
}
