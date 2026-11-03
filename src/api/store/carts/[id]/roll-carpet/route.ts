import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"

/**
 * POST /store/carts/:id/roll-carpet
 * Body: { variant_id, length, note? }
 *
 * Adds a cut-to-length roll carpet as ONE line item priced on the server:
 * unit_price = variant price per metre × length (10 cm steps). Medusa rounds
 * cart quantities to whole numbers, so "quantity = metres" can't express
 * 4.5 m — and the client must never send its own price.
 */
const STEP = 0.1
const MIN = 0.5
const MAX_DEFAULT = 50

const metres = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(",", "."))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  const { variant_id, length, note } = (req.body ?? {}) as {
    variant_id?: string
    length?: number
    note?: string
  }

  if (!variant_id || !(Number(length) > 0)) {
    return res.status(400).json({ message: "variant_id and a positive length are required" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [{ data: carts }, { data: variants }] = await Promise.all([
    query.graph({ entity: "cart", fields: ["id", "currency_code", "completed_at"], filters: { id: cartId } }),
    query.graph({
      entity: "product_variant",
      fields: ["id", "product.metadata", "product.status", "prices.amount", "prices.currency_code"],
      filters: { id: variant_id },
    }),
  ])

  const cart = carts[0] as any
  const variant = variants[0] as any
  if (!cart || cart.completed_at) {
    return res.status(404).json({ message: "Cart not found" })
  }
  if (!variant || variant.product?.status !== "published") {
    return res.status(404).json({ message: "Product not found" })
  }

  const attrs = variant.product?.metadata?.attributes ?? {}
  if (attrs.carpet_type !== "roll") {
    return res.status(400).json({ message: "This product is not sold by length" })
  }

  const price = (variant.prices ?? []).find(
    (p: any) => p.currency_code?.toLowerCase() === cart.currency_code?.toLowerCase()
  )
  const pricePerMeter = Number(price?.amount)
  if (!(pricePerMeter > 0)) {
    return res.status(400).json({ message: `No ${cart.currency_code} price for this product` })
  }

  const stock = metres(attrs.stock_length || attrs.length)
  const max = stock > 0 ? Math.min(stock, MAX_DEFAULT) : MAX_DEFAULT
  const cut = Math.round(Math.min(max, Math.max(MIN, Math.round(Number(length) / STEP) * STEP)) * 10) / 10
  const width = metres(attrs.width) || 3
  const unit_price = Math.round(pricePerMeter * cut * 100) / 100

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id: cartId,
      items: [
        {
          variant_id,
          quantity: 1,
          unit_price,
          metadata: {
            carpet_type: "roll_custom",
            custom_length: cut,
            width,
            area: Math.round(width * cut * 100) / 100,
            price_per_meter: pricePerMeter,
            ...(note?.trim() ? { customer_specifications: note.trim().slice(0, 500) } : {}),
          },
        },
      ],
    },
  })

  const { data: updated } = await query.graph({
    entity: "cart",
    fields: ["id", "total", "subtotal", "currency_code", "items.*"],
    filters: { id: cartId },
  })

  return res.json({ cart: updated[0], length: cut, unit_price })
}
