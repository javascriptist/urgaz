import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = true

/**
 * POST /admin/store-orders/:id/mark-paid
 * For payments taken outside the site (cash, card terminal, a credit sale
 * settled later). Uses the same metadata flags as the Payme webhook so the
 * order reads as paid everywhere.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const method = String((req.body as any)?.payment_method ?? "")

  try {
    const orderModule = req.scope.resolve(Modules.ORDER)
    const order = await orderModule.retrieveOrder(id, { select: ["id", "metadata"] })
    const actor = (req as any).auth_context?.actor_id ?? null

    await orderModule.updateOrders(id, {
      metadata: {
        ...(order.metadata ?? {}),
        payment_captured: true,
        payment_status_override: "paid",
        is_paid: true,
        ...(method ? { payment_method: method } : {}),
        paid_at: new Date().toISOString(),
        paid_marked_by: actor,
      },
    })

    return res.json({ success: true, id })
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }
}
