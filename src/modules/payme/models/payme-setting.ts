import { model } from "@medusajs/framework/utils"

/** Small key/value store for Payme settings that change at runtime (e.g. the key set via ChangePassword). */
const PaymeSetting = model.define("payme_setting", {
  id: model.text().primaryKey(),
  value: model.text(),
})

export default PaymeSetting
