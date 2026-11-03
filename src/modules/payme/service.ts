import { MedusaService } from "@medusajs/framework/utils"
import PaymeTransaction from "./models/payme-transaction"
import PaymeSetting from "./models/payme-setting"

class PaymeModuleService extends MedusaService({
  PaymeTransaction,
  PaymeSetting,
}) {}

export default PaymeModuleService
