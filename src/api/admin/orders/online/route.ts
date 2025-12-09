import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  
  // Get limit from query params, default to 15
  const limit = parseInt(req.query.limit as string) || 15
  const offset = parseInt(req.query.offset as string) || 0

  // Fetch more orders than needed so we can filter
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "created_at",
      "updated_at",
      "status",
      "fulfillment_status",
      "payment_status",
      "currency_code",
      "total",
      "metadata",
      "customer.*",
      "items.*",
    ],
    filters: {},
    pagination: {
      skip: 0,
      take: limit * 3, // Fetch more to account for filtering
    },
  })

  // Filter to only include online orders (email contains @ but NOT @store.local)
  const onlineOrders = orders.filter((order: any) => {
    const email = order.email || ""
    // Must have @ (valid email) but NOT @store.local (POS orders)
    return email.includes("@") && !email.includes("@store.local")
  })

  // Apply pagination after filtering
  const paginatedOrders = onlineOrders.slice(offset, offset + limit)
  const total = onlineOrders.length

  res.json({
    orders: paginatedOrders,
    count: paginatedOrders.length,
    offset: offset,
    limit: limit,
    total: total,
  })
}
