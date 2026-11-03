import { model } from "@medusajs/framework/utils"

/**
 * A Payme Merchant API transaction. The primary key is Payme's own
 * transaction id, so every Payme call (Create/Perform/Cancel/Check) is a
 * direct lookup and retries are naturally idempotent.
 * States follow Payme: 1 created, 2 performed, -1 cancelled before perform,
 * -2 cancelled after perform.
 */
const PaymeTransaction = model.define("payme_transaction", {
  id: model.text().primaryKey(),
  /** account.order_id exactly as Payme sends it (order id or display id) */
  order_key: model.text().index("IDX_payme_transaction_order_key"),
  /** resolved Medusa order id, when found */
  order_id: model.text().nullable(),
  /** amount in tiyin */
  amount: model.bigNumber(),
  state: model.number(),
  create_time: model.dateTime(),
  perform_time: model.dateTime().nullable(),
  cancel_time: model.dateTime().nullable(),
  reason: model.number().nullable(),
})

export default PaymeTransaction
