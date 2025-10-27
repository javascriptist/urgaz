import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService, IProductModuleService, IUserModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

// POST /admin/pos/create-order
// Create an in-store order
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { 
    items, // [{ variant_id, quantity, unit_price }]
    payment_method, // "cash", "card", "mixed", "nasiya"
    customer_name,
    notes 
  } = req.body

  const orderModuleService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
  const productModuleService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
  const userModuleService = req.scope.resolve<IUserModuleService>(Modules.USER)
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  // Get authenticated user info
  const authUserId = req.auth_context?.actor_id || req.user?.id || req.session?.user_id || "unknown"
  
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
    const order = await orderModuleService.createOrders({
      currency_code: "usd",
      email: `pos-${Date.now()}@store.local`,
      items: orderItems,
      sales_channel_id: null,
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
    })

    // Create payment collection and payment if not nasiya
    if (!isNasiya) {
      try {
        const paymentModule = req.scope.resolve(Modules.PAYMENT)
        
        // Create a payment collection
        const paymentCollection = await paymentModule.createPaymentCollections({
          currency_code: "usd",
          amount: subtotal,
        })

        // Link payment collection to order
        await remoteLink.create({
          [Modules.ORDER]: {
            order_id: order.id,
          },
          [Modules.PAYMENT]: {
            payment_collection_id: paymentCollection.id,
          },
        })

        // Create a payment session with manual provider
        const paymentSession = await paymentModule.createPaymentSession(paymentCollection.id, {
          provider_id: "pp_system_default", // Use system default provider
          currency_code: "usd",
          amount: subtotal,
          data: {
            payment_method: payment_method,
          },
        })

        // Authorize the payment
        await paymentModule.authorizePaymentSession(paymentSession.id, {})
        
        // Capture the payment using the payment object
        if (paymentSession.payment) {
          await paymentModule.capturePayment({
            payment_id: paymentSession.payment.id,
          })
          console.log("Payment captured for order:", order.id)
        }
      } catch (paymentError) {
        console.error("Error creating/capturing payment:", paymentError)
        console.error("Payment error details:", JSON.stringify(paymentError, null, 2))
        // Continue - order is created
      }
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
