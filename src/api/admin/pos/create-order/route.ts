import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService, IProductModuleService, IUserModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

// POST /admin/pos/create-order
// Create an in-store order
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as {
    items: Array<{ variant_id: string; quantity: number; unit_price: number }>
    payment_method?: string
    customer_name?: string
    notes?: string
    location_id?: string
  }
  
  const { 
    items,
    payment_method,
    customer_name,
    notes,
    location_id 
  } = body

  const orderModuleService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
  const productModuleService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const userModuleService = req.scope.resolve<IUserModuleService>(Modules.USER)
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  // Get authenticated user info - use type assertion for auth fields
  const authUserId = (req as any).auth_context?.actor_id || (req as any).user?.id || (req as any).session?.user_id || "unknown"
  
  // Fetch user details from User module
  let userName = "Unknown"
  let userEmail = ""
  
  try {
    if (authUserId !== "unknown") {
      const users = await userModuleService.listUsers({ id: authUserId })
      if (users && users.length > 0) {
        const user = users[0]
        userName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`.trim()
          : user.first_name || user.last_name || user.email || "Unknown"
        userEmail = user.email || ""
      }
    }
  } catch (userError) {
    console.error("Could not fetch user details:", userError)
  }
  
  console.log("Authenticated as:", userName, userEmail)

  try {
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" })
    }

    // Get variant details to calculate total
    const variantIds = items.map((item: any) => item.variant_id)
    const variants = await productModuleService.listProductVariants(
      { id: variantIds },
      { relations: ["product"] }
    )

    const variantMap = new Map(variants.map((v: any) => [v.id, v]))

    // Calculate order details
    let subtotal = 0
    const orderItems = items.map((item: any) => {
      const variant = variantMap.get(item.variant_id)
      if (!variant) {
        throw new Error(`Variant ${item.variant_id} not found`)
      }
      
      const itemTotal = item.unit_price * item.quantity
      subtotal += itemTotal

      return {
        variant_id: item.variant_id,
        product_id: variant.product_id,
        title: variant.product?.title || "Product",
        variant_title: variant.title || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: itemTotal,
        total: itemTotal,
      }
    })

    // Determine payment status - mark as paid unless it's nasiya
    const isNasiya = payment_method === "nasiya"

    // Create the order
    const orderResult = await orderModuleService.createOrders({
      currency_code: "usd",
      email: `pos-${Date.now()}@store.local`,
      items: orderItems,
      metadata: {
        sale_type: "in-store",
        payment_method: payment_method || "cash",
        customer_name: customer_name || "Walk-in Customer",
        notes: notes || "",
        sold_at: new Date().toISOString(),
        sold_by: userName,
        sold_by_email: userEmail,
        is_nasiya: isNasiya,
        is_paid: !isNasiya,
      },
      summary: {
        total: subtotal,
        subtotal: subtotal,
      }
    } as any)
    
    const order = Array.isArray(orderResult) ? orderResult[0] : orderResult

    // Decrement inventory for all items (sold in-store, payment already taken)
    try {
      const inventoryModule = req.scope.resolve(Modules.INVENTORY)
      const query = req.scope.resolve("query")
      const stockLocationModule = req.scope.resolve(Modules.STOCK_LOCATION)
      
      // Get the specified or default stock location
      let stockLocation
      if (location_id) {
        const locations = await stockLocationModule.listStockLocations({ id: location_id })
        stockLocation = locations[0]
        if (!stockLocation) {
          throw new Error(`Stock location ${location_id} not found`)
        }
      } else {
        const stockLocations = await stockLocationModule.listStockLocations({})
        stockLocation = stockLocations[0]
        if (!stockLocation) {
          throw new Error("No stock location found")
        }
      }
      
      if (stockLocation) {
        console.log(`Using stock location: ${stockLocation.name} (${stockLocation.id})`)
        for (const item of items) {
          // Get inventory item for this variant
          const { data: variantData } = await query.graph({
            entity: "variants",
            fields: [
              "id",
              "inventory_items.inventory_item_id",
            ],
            filters: { id: item.variant_id },
          })
          
          const variant = variantData?.[0]
          if (variant?.inventory_items?.[0]?.inventory_item_id) {
            const inventoryItemId = variant.inventory_items[0].inventory_item_id
            
            console.log(`Attempting to adjust inventory: item=${inventoryItemId}, location=${stockLocation.id}, adjustment=${-item.quantity}`)
            
            // Create inventory adjustment (negative to decrease stock)
            // Pass empty context object for the 4th parameter
            const result = await inventoryModule.adjustInventory(
              inventoryItemId,
              stockLocation.id,
              -item.quantity,
              {}
            )
            
            console.log(`✓ Decremented inventory: ${inventoryItemId} by ${item.quantity} at location ${stockLocation.name}`)
            console.log(`New stocked quantity: ${result.stocked_quantity}, available: ${result.available_quantity}`)
          } else {
            console.warn(`⚠️ No inventory item found for variant ${item.variant_id}`)
          }
        }
      }
    } catch (inventoryError) {
      console.error("Error updating inventory:", inventoryError)
      console.error("Stack:", inventoryError.stack)
      // Don't fail the order, just log the error
    }

    // Create payment collection and payment if not nasiya
    if (!isNasiya) {
      try {
        const paymentModule = req.scope.resolve(Modules.PAYMENT)
        
        // Create a payment collection
        const paymentCollection = await paymentModule.createPaymentCollections({
          currency_code: "usd",
          amount: subtotal,
        })
        
        console.log("✓ Payment collection created:", paymentCollection.id)

        // Link payment collection to order
        await remoteLink.create({
          [Modules.ORDER]: {
            order_id: order.id,
          },
          [Modules.PAYMENT]: {
            payment_collection_id: paymentCollection.id,
          },
        })
        
        console.log("✓ Payment collection linked to order")

        // Create a payment session with manual provider
        const paymentSession = await paymentModule.createPaymentSession(paymentCollection.id, {
          provider_id: "pp_system_default",
          currency_code: "usd",
          amount: subtotal,
          data: {
            payment_method: payment_method || "cash",
          },
        })
        
        console.log("✓ Payment session created:", paymentSession.id)

        // Authorize the payment
        const authorizedSession = await paymentModule.authorizePaymentSession(paymentSession.id, {})
        console.log("✓ Payment authorized:", authorizedSession.id)
        
        // Capture the payment using the authorized session
        if (authorizedSession?.id) {
          await paymentModule.capturePayment({
            payment_id: authorizedSession.id,
          })
          console.log("✓ Payment captured for order:", order.id, "Amount:", subtotal, "USD")
        } else {
          console.warn("⚠️ Could not capture payment - no authorized session ID")
        }
      } catch (paymentError) {
        console.error("❌ Error creating/capturing payment:", paymentError)
        console.error("Payment error stack:", paymentError.stack)
        // Continue - order is created
      }
    }

    // Mark order as fulfilled in metadata (skip complex fulfillment module)
    try {
      await orderModuleService.updateOrders(order.id, {
        metadata: {
          ...order.metadata,
          fulfilled_at: new Date().toISOString(),
          fulfillment_type: "in-store-pickup",
        },
      })
      
      console.log("✓ Order marked as fulfilled:", order.id)
    } catch (fulfillmentError) {
      console.error("Error marking fulfillment:", fulfillmentError)
      // Continue - order and payment are created
    }

    console.log("In-store order created:", order.id, "by:", userName, `(${userEmail})`, "Payment:", isNasiya ? "Nasiya (unpaid)" : "Paid")
    console.log("Order total:", subtotal, "Summary:", order.summary)

    return res.json({
      order,
      message: "In-store order created successfully"
    })
  } catch (e: any) {
    console.error("Error creating in-store order:", e)
    return res.status(500).json({ 
      message: e.message, 
      error: e.toString() 
    })
  }
}
