import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

interface MarkOrderPaidInput {
  order_id: string
}

const markOrderPaidStep = createStep(
  "mark-order-paid-step",
  async ({ order_id }: MarkOrderPaidInput, { container }) => {
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
    
    // Update order metadata to mark as paid
    const order = await orderModuleService.updateOrders(order_id, {
      metadata: {
        payment_captured: true,
        payment_captured_at: new Date().toISOString(),
      },
    })

    return new StepResponse(order)
  }
)

export const markOrderPaidWorkflow = createWorkflow(
  "mark-order-paid",
  (input: MarkOrderPaidInput) => {
    const order = markOrderPaidStep(input)
    return new WorkflowResponse(order)
  }
)
